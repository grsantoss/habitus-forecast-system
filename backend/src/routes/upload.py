from flask import Blueprint, request, jsonify
import os
import tempfile
from werkzeug.utils import secure_filename
from src.models.user import db, LogSistema
from src.auth import token_required
from src.services.planilha_processor import ProcessadorPlanilhaProfecia

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    """Verifica se o arquivo tem extensão permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload-planilha', methods=['POST'])
@token_required
def upload_planilha(current_user):
    """Endpoint para upload e processamento de planilhas Excel"""
    
    try:
        # Verificar se arquivo foi enviado
        if 'file' not in request.files:
            return jsonify({'message': 'Nenhum arquivo foi enviado'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'message': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'message': 'Apenas arquivos Excel (.xlsx, .xls) são aceitos'}), 400
        
        # Salvar arquivo temporariamente
        filename = secure_filename(file.filename)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Processar planilha
            processador = ProcessadorPlanilhaProfecia()
            resultado = processador.processar_planilha_completa(temp_path, current_user.id)
            
            # Log do upload
            log = LogSistema(
                usuario_id=current_user.id,
                acao='PLANILHA_UPLOADED',
                detalhes={
                    'filename': filename,
                    'projeto_id': resultado.get('projeto_id'),
                    'status': resultado.get('status'),
                    'lancamentos_criados': resultado.get('lancamentos_criados', 0)
                }
            )
            db.session.add(log)
            db.session.commit()
            
            if resultado['status'] == 'arquivo_ja_processado':
                return jsonify({
                    'message': 'Este arquivo já foi processado anteriormente',
                    'projeto_id': resultado['projeto_id']
                }), 200
            
            return jsonify({
                'message': 'Planilha processada com sucesso',
                'projeto_id': resultado['projeto_id'],
                'lancamentos_criados': resultado['lancamentos_criados'],
                'parametros': resultado['parametros']
            }), 201
            
        except Exception as e:
            # Log de erro
            log = LogSistema(
                usuario_id=current_user.id,
                acao='PLANILHA_UPLOAD_ERROR',
                detalhes={
                    'filename': filename,
                    'erro': str(e)
                }
            )
            db.session.add(log)
            db.session.commit()
            
            return jsonify({'message': f'Erro ao processar planilha: {str(e)}'}), 400
        
        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@upload_bp.route('/validar-planilha', methods=['POST'])
@token_required
def validar_planilha(current_user):
    """Endpoint para apenas validar uma planilha sem processar"""
    
    try:
        if 'file' not in request.files:
            return jsonify({'message': 'Nenhum arquivo foi enviado'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'message': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'message': 'Apenas arquivos Excel (.xlsx, .xls) são aceitos'}), 400
        
        # Salvar arquivo temporariamente
        filename = secure_filename(file.filename)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Apenas validar
            processador = ProcessadorPlanilhaProfecia()
            validacao = processador.validar_planilha(temp_path)
            
            if validacao['valido']:
                # Tentar extrair parâmetros para preview
                try:
                    parametros = processador.extrair_parametros_gerais(temp_path)
                    validacao['preview_parametros'] = parametros
                except:
                    pass
            
            return jsonify({
                'validacao': validacao,
                'filename': filename
            })
            
        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500
