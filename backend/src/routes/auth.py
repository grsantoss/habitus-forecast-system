from flask import Blueprint, request, jsonify
from datetime import timedelta
from src.models.user import db, User, LogSistema
from src.auth import authenticate_user, create_access_token, token_required, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint de login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email e senha são obrigatórios'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        # Autenticar usuário
        user = authenticate_user(email, password)
        if not user:
            # Log de tentativa de login falhada
            log = LogSistema(
                acao='LOGIN_FAILED',
                detalhes={'email': email, 'ip': request.remote_addr}
            )
            db.session.add(log)
            db.session.commit()
            
            return jsonify({'message': 'Email ou senha incorretos'}), 401

        # Verificar status do usuário (fluxo de aprovação)
        if user.status != 'active':
            log = LogSistema(
                usuario_id=user.id,
                acao='LOGIN_BLOCKED_STATUS',
                detalhes={
                    'ip': request.remote_addr,
                    'status': user.status
                }
            )
            db.session.add(log)
            db.session.commit()

            if user.status == 'pending':
                return jsonify({'message': 'Seu cadastro está aguardando aprovação do administrador.'}), 403
            elif user.status == 'rejected':
                return jsonify({'message': 'Seu cadastro foi rejeitado. Entre em contato com o administrador.'}), 403
            else:
                return jsonify({'message': 'Usuário inativo. Entre em contato com o administrador.'}), 403
        
        # Criar token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Log de login bem-sucedido
        log = LogSistema(
            usuario_id=user.id,
            acao='LOGIN_SUCCESS',
            detalhes={'ip': request.remote_addr}
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'access_token': access_token,
            'token_type': 'bearer',
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """Endpoint de registro de usuário"""
    try:
        data = request.get_json()
        
        if not data or not data.get('nome') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Nome, email e senha são obrigatórios'}), 400
        
        # Verificar se usuário já existe
        existing_user = User.query.filter_by(email=data.get('email')).first()
        if existing_user:
            return jsonify({'message': 'Email já está em uso'}), 400
        
        # Criar novo usuário
        # Usuários criados via registro comum iniciam como "pending" para aprovação do admin
        user = User(
            nome=data.get('nome'),
            email=data.get('email'),
            role=data.get('role', 'usuario')  # Default para 'usuario'
        )
        user.set_password(data.get('password'))
        
        db.session.add(user)
        db.session.commit()
        
        # Log de registro
        log = LogSistema(
            usuario_id=user.id,
            acao='USER_REGISTERED',
            detalhes={'email': user.email, 'role': user.role}
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user_info(current_user):
    """Retorna informações do usuário atual"""
    return jsonify({'user': current_user.to_dict()})

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Endpoint de logout (apenas para log)"""
    try:
        # Log de logout
        log = LogSistema(
            usuario_id=current_user.id,
            acao='LOGOUT',
            detalhes={'ip': request.remote_addr}
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'message': 'Logout realizado com sucesso'})
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500
