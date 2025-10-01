from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from src.models.user import db, User, Projeto, LogSistema, ArquivoUpload
from src.auth import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/usuarios', methods=['GET'])
@admin_required
def listar_usuarios(current_user):
    """Lista todos os usuários do sistema"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        query = User.query
        
        if search:
            query = query.filter(
                (User.nome.contains(search)) | 
                (User.email.contains(search))
            )
        
        usuarios_paginados = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        usuarios_data = []
        for usuario in usuarios_paginados.items:
            usuario_dict = usuario.to_dict()
            # Adicionar estatísticas do usuário
            usuario_dict['total_projetos'] = Projeto.query.filter_by(usuario_id=usuario.id).count()
            
            # Última atividade
            ultimo_log = LogSistema.query.filter_by(usuario_id=usuario.id).order_by(desc(LogSistema.timestamp)).first()
            usuario_dict['ultima_atividade'] = ultimo_log.timestamp.isoformat() if ultimo_log else None
            
            usuarios_data.append(usuario_dict)
        
        return jsonify({
            'usuarios': usuarios_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': usuarios_paginados.total,
                'pages': usuarios_paginados.pages,
                'has_next': usuarios_paginados.has_next,
                'has_prev': usuarios_paginados.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/admin/usuarios', methods=['POST'])
@admin_required
def criar_usuario(current_user):
    """Cria um novo usuário (apenas admin)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('nome') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Nome, email e senha são obrigatórios'}), 400
        
        # Verificar se usuário já existe
        existing_user = User.query.filter_by(email=data.get('email')).first()
        if existing_user:
            return jsonify({'message': 'Email já está em uso'}), 400
        
        # Criar novo usuário
        user = User(
            nome=data.get('nome'),
            email=data.get('email'),
            role=data.get('role', 'usuario')
        )
        user.set_password(data.get('password'))
        
        db.session.add(user)
        db.session.commit()
        
        # Log da criação
        log = LogSistema(
            usuario_id=current_user.id,
            acao='ADMIN_USER_CREATED',
            detalhes={
                'novo_usuario_id': user.id,
                'email': user.email,
                'role': user.role
            }
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'usuario': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/admin/usuarios/<int:usuario_id>', methods=['PUT'])
@admin_required
def atualizar_usuario(current_user, usuario_id):
    """Atualiza um usuário"""
    try:
        usuario = User.query.get_or_404(usuario_id)
        data = request.get_json()
        
        # Atualizar campos
        if data.get('nome'):
            usuario.nome = data.get('nome')
        if data.get('email'):
            # Verificar se email já está em uso por outro usuário
            existing_user = User.query.filter(User.email == data.get('email'), User.id != usuario_id).first()
            if existing_user:
                return jsonify({'message': 'Email já está em uso'}), 400
            usuario.email = data.get('email')
        if data.get('role'):
            usuario.role = data.get('role')
        if data.get('password'):
            usuario.set_password(data.get('password'))
        
        usuario.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log da atualização
        log = LogSistema(
            usuario_id=current_user.id,
            acao='ADMIN_USER_UPDATED',
            detalhes={
                'usuario_atualizado_id': usuario.id,
                'email': usuario.email
            }
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário atualizado com sucesso',
            'usuario': usuario.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/admin/usuarios/<int:usuario_id>', methods=['DELETE'])
@admin_required
def deletar_usuario(current_user, usuario_id):
    """Deleta um usuário"""
    try:
        if usuario_id == current_user.id:
            return jsonify({'message': 'Você não pode deletar sua própria conta'}), 400
        
        usuario = User.query.get_or_404(usuario_id)
        email = usuario.email
        
        # Log antes de deletar
        log = LogSistema(
            usuario_id=current_user.id,
            acao='ADMIN_USER_DELETED',
            detalhes={
                'usuario_deletado_id': usuario.id,
                'email': email
            }
        )
        db.session.add(log)
        
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({'message': 'Usuário deletado com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/admin/logs', methods=['GET'])
@admin_required
def listar_logs(current_user):
    """Lista logs do sistema"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        acao_filter = request.args.get('acao', '')
        usuario_filter = request.args.get('usuario_id', type=int)
        
        query = LogSistema.query
        
        if acao_filter:
            query = query.filter(LogSistema.acao.contains(acao_filter))
        
        if usuario_filter:
            query = query.filter(LogSistema.usuario_id == usuario_filter)
        
        logs_paginados = query.order_by(desc(LogSistema.timestamp)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        logs_data = []
        for log in logs_paginados.items:
            log_dict = log.to_dict()
            # Adicionar nome do usuário se existir
            if log.usuario:
                log_dict['usuario_nome'] = log.usuario.nome
                log_dict['usuario_email'] = log.usuario.email
            logs_data.append(log_dict)
        
        return jsonify({
            'logs': logs_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': logs_paginados.total,
                'pages': logs_paginados.pages,
                'has_next': logs_paginados.has_next,
                'has_prev': logs_paginados.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/admin/estatisticas', methods=['GET'])
@admin_required
def obter_estatisticas_admin(current_user):
    """Obtém estatísticas detalhadas para o painel admin"""
    try:
        # Estatísticas gerais
        total_usuarios = User.query.count()
        total_projetos = Projeto.query.count()
        total_uploads = ArquivoUpload.query.count()
        
        # Usuários criados nos últimos 30 dias
        data_limite = datetime.now() - timedelta(days=30)
        novos_usuarios = User.query.filter(User.created_at >= data_limite).count()
        
        # Projetos criados nos últimos 30 dias
        novos_projetos = Projeto.query.filter(Projeto.created_at >= data_limite).count()
        
        # Uploads nos últimos 30 dias
        uploads_recentes = ArquivoUpload.query.filter(ArquivoUpload.uploaded_at >= data_limite).count()
        
        # Atividade por dia (últimos 7 dias)
        atividade_semanal = db.session.query(
            func.date(LogSistema.timestamp).label('data'),
            func.count(LogSistema.id).label('total')
        ).filter(
            LogSistema.timestamp >= datetime.now() - timedelta(days=7)
        ).group_by(
            func.date(LogSistema.timestamp)
        ).order_by(
            func.date(LogSistema.timestamp)
        ).all()
        
        atividade_data = []
        for atividade in atividade_semanal:
            atividade_data.append({
                'data': atividade.data.strftime('%Y-%m-%d'),
                'atividades': atividade.total
            })
        
        # Top 5 ações mais comuns
        top_acoes = db.session.query(
            LogSistema.acao,
            func.count(LogSistema.id).label('total')
        ).filter(
            LogSistema.timestamp >= data_limite
        ).group_by(
            LogSistema.acao
        ).order_by(
            func.count(LogSistema.id).desc()
        ).limit(5).all()
        
        acoes_data = []
        for acao in top_acoes:
            acoes_data.append({
                'acao': acao.acao,
                'total': acao.total
            })
        
        return jsonify({
            'estatisticas_gerais': {
                'total_usuarios': total_usuarios,
                'total_projetos': total_projetos,
                'total_uploads': total_uploads,
                'novos_usuarios_30d': novos_usuarios,
                'novos_projetos_30d': novos_projetos,
                'uploads_recentes_30d': uploads_recentes
            },
            'atividade_semanal': atividade_data,
            'top_acoes': acoes_data
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@admin_bp.route('/admin/projetos', methods=['GET'])
@admin_required
def listar_todos_projetos(current_user):
    """Lista todos os projetos do sistema"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        query = db.session.query(Projeto, User).join(User, Projeto.usuario_id == User.id)
        
        if search:
            query = query.filter(
                (Projeto.nome_cliente.contains(search)) | 
                (User.nome.contains(search))
            )
        
        projetos_paginados = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        projetos_data = []
        for projeto, usuario in projetos_paginados.items:
            projeto_dict = projeto.to_dict()
            projeto_dict['usuario_nome'] = usuario.nome
            projeto_dict['usuario_email'] = usuario.email
            projetos_data.append(projeto_dict)
        
        return jsonify({
            'projetos': projetos_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': projetos_paginados.total,
                'pages': projetos_paginados.pages,
                'has_next': projetos_paginados.has_next,
                'has_prev': projetos_paginados.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500
