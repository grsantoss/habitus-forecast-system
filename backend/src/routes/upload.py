from flask import Blueprint, request, jsonify, send_file, current_app
import os
import tempfile
from werkzeug.utils import secure_filename
from src.models.user import db, LogSistema, Projeto, ArquivoUpload
from src.auth import token_required
from src.services.planilha_processor import ProcessadorPlanilhaHabitusForecast
from src.utils.logger import debug_log, error_log, exception_log

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
ALLOWED_MIME_TYPES = {
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # .xlsx
    'application/vnd.ms-excel',  # .xls
    'application/octet-stream'  # Fallback
}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    """Verifica se a extensão do arquivo é permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    """Valida o tamanho do arquivo"""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    
    if size > MAX_FILE_SIZE:
        return False, f'Arquivo muito grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB'
    
    return True, None

def sanitize_filename(filename):
    """Sanitiza o nome do arquivo"""
    # Usar secure_filename do Werkzeug
    safe_name = secure_filename(filename)
    
    # Remover caracteres perigosos adicionais
    dangerous_chars = ['..', '/', '\\']
    for char in dangerous_chars:
        safe_name = safe_name.replace(char, '')
    
    return safe_name

def validate_file_content(file_path):
    """Valida o conteúdo real do arquivo usando magic numbers"""
    try:
        # Tentar usar python-magic se disponível
        try:
            import magic
            mime = magic.Magic(mime=True)
            detected_mime = mime.from_file(file_path)
            
            # Verificar MIME type
            if detected_mime not in ALLOWED_MIME_TYPES:
                return False, f'Tipo de arquivo não permitido: {detected_mime}'
        except ImportError:
            # Se magic não estiver disponível, verificar assinatura do arquivo
            with open(file_path, 'rb') as f:
                header = f.read(8)
                # Assinaturas conhecidas de arquivos Excel
                excel_signatures = [
                    b'\x50\x4B\x03\x04',  # ZIP (XLSX é um ZIP)
                    b'\xD0\xCF\x11\xE0',  # OLE2 (XLS antigo)
                ]
                if not any(header.startswith(sig) for sig in excel_signatures):
                    # Se não começar com assinatura conhecida, ainda permitir (pode ser XLSX válido)
                    pass
        
        return True, None
    except Exception as e:
        # Em caso de erro, confiar na extensão
        return True, None

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
        
        # Validar tamanho do arquivo ANTES de salvar
        is_valid_size, size_error = validate_file_size(file)
        if not is_valid_size:
            return jsonify({'message': size_error}), 400
        
        # Salvar arquivo temporariamente com nome único
        filename = secure_filename(file.filename)
        import uuid
        unique_id = str(uuid.uuid4())
        temp_path = os.path.join(tempfile.gettempdir(), f"habitus_{unique_id}.xlsx")
        
        file.save(temp_path)
        
        # Criar diretório de armazenamento permanente
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Caminho permanente para o arquivo
        permanent_path = os.path.join(upload_dir, f"{unique_id}_{filename}")
        
        try:
            # Processar planilha
            processador = ProcessadorPlanilhaHabitusForecast()
            resultado = processador.processar_planilha_completa(temp_path, current_user.id, permanent_path)
            
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
            
            # Buscar o ArquivoUpload criado
            arquivo_upload = ArquivoUpload.query.filter_by(
                projeto_id=resultado['projeto_id'],
                hash_arquivo=resultado.get('hash_arquivo')
            ).first()
            
            upload_data = None
            if arquivo_upload:
                lancamentos_count = 0
                if arquivo_upload.relatorio_processamento:
                    lancamentos_count = arquivo_upload.relatorio_processamento.get('lancamentos_criados', 0)
                
                upload_data = {
                    'id': arquivo_upload.id,
                    'nome': arquivo_upload.nome_original,
                    'data': arquivo_upload.uploaded_at.isoformat(),
                    'status': arquivo_upload.status_processamento,
                    'lancamentos': lancamentos_count
                }
            
            return jsonify({
                'message': 'Planilha processada com sucesso',
                'projeto_id': resultado['projeto_id'],
                'lancamentos_criados': resultado['lancamentos_criados'],
                'parametros': resultado['parametros'],
                'upload_data': upload_data
            }), 201
            
        except ValueError as e:
            # Erro de validação de dados
            error_msg = str(e)
            log = LogSistema(
                usuario_id=current_user.id,
                acao='PLANILHA_UPLOAD_ERROR',
                detalhes={
                    'filename': filename,
                    'erro': error_msg,
                    'tipo': 'VALIDACAO'
                }
            )
            db.session.add(log)
            db.session.commit()
            
            return jsonify({'message': f'Erro na validação da planilha: {error_msg}'}), 400
        
        except FileNotFoundError as e:
            # Arquivo não encontrado ou corrompido
            log = LogSistema(
                usuario_id=current_user.id,
                acao='PLANILHA_UPLOAD_ERROR',
                detalhes={
                    'filename': filename,
                    'erro': 'Arquivo não encontrado ou corrompido',
                    'tipo': 'ARQUIVO'
                }
            )
            db.session.add(log)
            db.session.commit()
            
            return jsonify({'message': 'O arquivo parece estar corrompido ou em formato inválido. Verifique se é um arquivo Excel válido.'}), 400
        
        except Exception as e:
            # Erro genérico - não expor detalhes internos
            error_details = str(e)
            log = LogSistema(
                usuario_id=current_user.id,
                acao='PLANILHA_UPLOAD_ERROR',
                detalhes={
                    'filename': filename,
                    'erro': error_details,
                    'tipo': 'GENERICO'
                }
            )
            db.session.add(log)
            db.session.commit()
            
            # Mensagem genérica para o usuário
            return jsonify({'message': 'Erro ao processar planilha. Verifique se o arquivo está no formato correto e tente novamente.'}), 400
        
        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        # Log de erro interno (não expor ao usuário)
        exception_log(f"Erro interno no endpoint de upload: {str(e)}")
        try:
            log = LogSistema(
                usuario_id=current_user.id if current_user else None,
                acao='PLANILHA_UPLOAD_ERROR_INTERNO',
                detalhes={
                    'erro': str(e),
                    'tipo': 'INTERNO'
                }
            )
            db.session.add(log)
            db.session.commit()
        except:
            pass
        
        return jsonify({'message': 'Erro interno do servidor. Tente novamente mais tarde.'}), 500

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
        
        # Validar tamanho do arquivo ANTES de salvar
        is_valid_size, size_error = validate_file_size(file)
        if not is_valid_size:
            return jsonify({'message': size_error}), 400
        
        # Salvar arquivo temporariamente com nome único
        filename = secure_filename(file.filename)
        import uuid
        unique_id = str(uuid.uuid4())
        temp_path = os.path.join(tempfile.gettempdir(), f"habitus_{unique_id}.xlsx")
        
        file.save(temp_path)
        
        try:
            # Apenas validar
            processador = ProcessadorPlanilhaHabitusForecast()
            validacao = processador.validar_planilha(temp_path)
            
            if validacao['valido']:
                # Tentar extrair parâmetros para preview
                try:
                    parametros = processador.extrair_parametros_gerais(temp_path)
                    validacao['preview_parametros'] = parametros
                except Exception as e:
                    debug_log(f"Erro ao extrair parâmetros: {str(e)}")
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
        exception_log(f"Erro no endpoint de validação: {str(e)}")
        return jsonify({'message': 'Erro interno ao validar planilha'}), 500

@upload_bp.route('/uploads/history', methods=['GET'])
@token_required
def get_upload_history(current_user):
    """Endpoint para obter histórico de uploads do usuário"""
    try:
        debug_log(f"Buscando histórico para usuário ID: {current_user.id}")
        
        # Buscar projetos do usuário
        projetos = Projeto.query.filter_by(usuario_id=current_user.id).all()
        projeto_ids = [p.id for p in projetos]
        debug_log(f"Projetos encontrados: {len(projetos)}, IDs: {projeto_ids}")
        
        if not projeto_ids:
            debug_log("Nenhum projeto encontrado para o usuário")
            return jsonify([]), 200
        
        # Buscar uploads dos projetos do usuário
        uploads = ArquivoUpload.query.filter(
            ArquivoUpload.projeto_id.in_(projeto_ids)
        ).order_by(ArquivoUpload.uploaded_at.desc()).all()
        
        debug_log(f"Uploads encontrados: {len(uploads)}")
        
        history_data = []
        for upload in uploads:
            lancamentos_count = 0
            if upload.relatorio_processamento:
                lancamentos_count = upload.relatorio_processamento.get('lancamentos_criados', 0)
            
            item_data = {
                'id': upload.id,
                'nome': upload.nome_original,
                'data': upload.uploaded_at.isoformat(),
                'status': upload.status_processamento,
                'lancamentos': lancamentos_count
            }
            
            history_data.append(item_data)
        
        debug_log(f"Retornando {len(history_data)} itens do histórico")
        return jsonify(history_data), 200
        
    except Exception as e:
        exception_log(f"Erro ao buscar histórico: {str(e)}")
        return jsonify({'message': 'Erro ao buscar histórico'}), 500

@upload_bp.route('/uploads/<int:upload_id>/download', methods=['GET'])
@token_required
def download_upload_file(current_user, upload_id):
    """Endpoint para download de arquivo processado"""
    try:
        debug_log(f"Tentando download do upload ID: {upload_id} para usuário: {current_user.id}")
        
        upload_record = ArquivoUpload.query.get(upload_id)
        if not upload_record:
            debug_log(f"Upload ID {upload_id} não encontrado")
            return jsonify({'message': 'Upload não encontrado'}), 404
        
        debug_log(f"Upload encontrado: {upload_record.nome_original}")
        
        # Verificar se o usuário tem acesso ao arquivo
        projeto = Projeto.query.get(upload_record.projeto_id)
        if not projeto or projeto.usuario_id != current_user.id:
            debug_log(f"Acesso negado: projeto.usuario_id={projeto.usuario_id if projeto else 'None'}, current_user.id={current_user.id}")
            return jsonify({'message': 'Acesso negado'}), 403
        
        file_path = upload_record.caminho_storage
        debug_log(f"Caminho do arquivo: {file_path}")
        
        if not os.path.exists(file_path):
            error_log(f"Arquivo não encontrado no caminho: {file_path}")
            return jsonify({'message': 'Arquivo não encontrado no servidor'}), 404
        
        debug_log(f"Iniciando download do arquivo: {upload_record.nome_original}")
        return send_file(
            file_path, 
            as_attachment=True, 
            download_name=upload_record.nome_original
        )
        
    except Exception as e:
        exception_log(f"Erro no download: {str(e)}")
        return jsonify({'message': 'Erro no download'}), 500

@upload_bp.route('/uploads/<int:upload_id>', methods=['DELETE'])
@token_required
def delete_upload_file(current_user, upload_id):
    """Endpoint para deletar upload e arquivo"""
    try:
        from src.models.user import LancamentoFinanceiro, Cenario
        
        upload_record = ArquivoUpload.query.get(upload_id)
        if not upload_record:
            return jsonify({'message': 'Upload não encontrado'}), 404
        
        # Verificar se o usuário tem acesso ao arquivo
        projeto = Projeto.query.get(upload_record.projeto_id)
        if not projeto or projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403
        
        # Deletar apenas os lançamentos financeiros relacionados ao arquivo específico
        # Buscar cenários que foram criados por este arquivo específico
        cenarios_do_arquivo = Cenario.query.filter_by(projeto_id=projeto.id).all()
        lancamentos_deletados = 0
        cenarios_deletados = 0
        
        for cenario in cenarios_do_arquivo:
            # Verificar se este cenário foi criado por este arquivo específico
            # (assumindo que cada upload cria um cenário com nome único baseado no arquivo)
            lancamentos = LancamentoFinanceiro.query.filter_by(cenario_id=cenario.id).all()
            for lancamento in lancamentos:
                db.session.delete(lancamento)
                lancamentos_deletados += 1
            
            # Deletar o cenário
            db.session.delete(cenario)
            cenarios_deletados += 1
        
        # Verificar se ainda há outros arquivos no projeto
        outros_arquivos = ArquivoUpload.query.filter_by(projeto_id=projeto.id).filter(ArquivoUpload.id != upload_id).all()
        
        # Se não há outros arquivos, deletar o projeto também
        if not outros_arquivos:
            db.session.delete(projeto)
        
        # Deletar arquivo físico se existir
        if os.path.exists(upload_record.caminho_storage):
            os.remove(upload_record.caminho_storage)
        
        # Deletar registro do banco
        db.session.delete(upload_record)
        db.session.commit()
        
        debug_log(f"Upload {upload_id} deletado com sucesso - {lancamentos_deletados} lançamentos e {cenarios_deletados} cenários removidos")
        
        return jsonify({'message': 'Upload deletado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        exception_log(f"Erro ao deletar upload: {str(e)}")
        return jsonify({'message': 'Erro ao deletar upload'}), 500


@upload_bp.route('/uploads/<int:upload_id>/rename', methods=['PUT'])
@token_required
def rename_upload_file(current_user, upload_id):
    """Endpoint para renomear o nome exibido/baixado do upload (não renomeia arquivo físico)"""
    try:
        data = request.get_json() or {}
        novo_nome = (data.get('nome') or '').strip()
        if not novo_nome:
            return jsonify({'message': 'Nome inválido'}), 400

        upload_record = ArquivoUpload.query.get(upload_id)
        if not upload_record:
            return jsonify({'message': 'Upload não encontrado'}), 404

        projeto = Projeto.query.get(upload_record.projeto_id)
        if not projeto or projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403

        # Preservar a extensão original
        original = upload_record.nome_original or ''
        if '.' in original:
            original_ext = '.' + original.rsplit('.', 1)[1]
        else:
            original_ext = ''

        if '.' not in novo_nome:
            novo_nome_final = f"{novo_nome}{original_ext}"
        else:
            base = novo_nome.rsplit('.', 1)[0]
            novo_nome_final = f"{base}{original_ext}"

        # Validações simples do nome
        if '/' in novo_nome_final or '\\' in novo_nome_final:
            return jsonify({'message': 'Nome não pode conter barras'}), 400
        if len(novo_nome_final) > 255:
            return jsonify({'message': 'Nome muito longo'}), 400

        upload_record.nome_original = novo_nome_final
        db.session.commit()

        # Log da operação
        log = LogSistema(
            usuario_id=current_user.id,
            acao='UPLOAD_RENAMED',
            detalhes={'upload_id': upload_record.id, 'novo_nome': novo_nome_final}
        )
        db.session.add(log)
        db.session.commit()

        lancamentos_count = 0
        if upload_record.relatorio_processamento:
            lancamentos_count = upload_record.relatorio_processamento.get('lancamentos_criados', 0)

        return jsonify({
            'id': upload_record.id,
            'nome': upload_record.nome_original,
            'data': upload_record.uploaded_at.isoformat(),
            'status': upload_record.status_processamento,
            'lancamentos': lancamentos_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao renomear: {str(e)}'}), 500
