from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db, Projeto, Cenario, LogSistema
from src.auth import token_required, admin_required

projetos_bp = Blueprint('projetos', __name__)

@projetos_bp.route('/projetos', methods=['GET'])
@token_required
def listar_projetos(current_user):
    """Lista projetos do usuário atual ou todos (se admin)"""
    try:
        if current_user.role == 'admin':
            projetos = Projeto.query.all()
        else:
            projetos = Projeto.query.filter_by(usuario_id=current_user.id).all()
        
        return jsonify({
            'projetos': [projeto.to_dict() for projeto in projetos]
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@projetos_bp.route('/projetos', methods=['POST'])
@token_required
def criar_projeto(current_user):
    """Cria um novo projeto"""
    try:
        data = request.get_json()
        
        if not data or not data.get('nome_cliente') or not data.get('data_base_estudo'):
            return jsonify({'message': 'Nome do cliente e data base são obrigatórios'}), 400
        
        # Criar projeto
        projeto = Projeto(
            usuario_id=current_user.id,
            nome_cliente=data.get('nome_cliente'),
            data_base_estudo=datetime.strptime(data.get('data_base_estudo'), '%Y-%m-%d').date(),
            saldo_inicial_caixa=data.get('saldo_inicial_caixa', 0)
        )
        
        db.session.add(projeto)
        db.session.flush()  # Para obter o ID do projeto
        
        # Criar cenário padrão "Realista"
        cenario_padrao = Cenario(
            projeto_id=projeto.id,
            nome='Realista',
            descricao='Cenário padrão baseado em projeções realistas',
            is_active=True
        )
        
        db.session.add(cenario_padrao)
        db.session.commit()
        
        # Log da criação
        log = LogSistema(
            usuario_id=current_user.id,
            acao='PROJECT_CREATED',
            detalhes={
                'projeto_id': projeto.id,
                'nome_cliente': projeto.nome_cliente
            }
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Projeto criado com sucesso',
            'projeto': projeto.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@projetos_bp.route('/projetos/<int:projeto_id>', methods=['GET'])
@token_required
def obter_projeto(current_user, projeto_id):
    """Obtém detalhes de um projeto específico"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        
        # Verificar permissão
        if current_user.role != 'admin' and projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403
        
        # Incluir cenários do projeto
        projeto_dict = projeto.to_dict()
        projeto_dict['cenarios'] = [cenario.to_dict() for cenario in projeto.cenarios]
        
        return jsonify({'projeto': projeto_dict})
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@projetos_bp.route('/projetos/<int:projeto_id>', methods=['PUT'])
@token_required
def atualizar_projeto(current_user, projeto_id):
    """Atualiza um projeto"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        
        # Verificar permissão
        if current_user.role != 'admin' and projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        # Atualizar campos
        if data.get('nome_cliente'):
            projeto.nome_cliente = data.get('nome_cliente')
        if data.get('data_base_estudo'):
            projeto.data_base_estudo = datetime.strptime(data.get('data_base_estudo'), '%Y-%m-%d').date()
        if data.get('saldo_inicial_caixa') is not None:
            projeto.saldo_inicial_caixa = data.get('saldo_inicial_caixa')
        
        projeto.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log da atualização
        log = LogSistema(
            usuario_id=current_user.id,
            acao='PROJECT_UPDATED',
            detalhes={
                'projeto_id': projeto.id,
                'nome_cliente': projeto.nome_cliente
            }
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Projeto atualizado com sucesso',
            'projeto': projeto.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@projetos_bp.route('/projetos/<int:projeto_id>', methods=['DELETE'])
@token_required
def deletar_projeto(current_user, projeto_id):
    """Deleta um projeto"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        
        # Verificar permissão
        if current_user.role != 'admin' and projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403
        
        nome_cliente = projeto.nome_cliente
        
        # Log antes de deletar
        log = LogSistema(
            usuario_id=current_user.id,
            acao='PROJECT_DELETED',
            detalhes={
                'projeto_id': projeto.id,
                'nome_cliente': nome_cliente
            }
        )
        db.session.add(log)
        
        db.session.delete(projeto)
        db.session.commit()
        
        return jsonify({'message': 'Projeto deletado com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@projetos_bp.route('/projetos/<int:projeto_id>/cenarios', methods=['POST'])
@token_required
def criar_cenario(current_user, projeto_id):
    """Cria um novo cenário para um projeto"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        
        # Verificar permissão
        if current_user.role != 'admin' and projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        if not data or not data.get('nome'):
            return jsonify({'message': 'Nome do cenário é obrigatório'}), 400
        
        # Criar cenário
        cenario = Cenario(
            projeto_id=projeto_id,
            nome=data.get('nome'),
            descricao=data.get('descricao', ''),
            is_active=data.get('is_active', False)
        )
        
        db.session.add(cenario)
        db.session.commit()
        
        # Log da criação
        log = LogSistema(
            usuario_id=current_user.id,
            acao='SCENARIO_CREATED',
            detalhes={
                'projeto_id': projeto_id,
                'cenario_id': cenario.id,
                'nome_cenario': cenario.nome
            }
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Cenário criado com sucesso',
            'cenario': cenario.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500
