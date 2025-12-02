from flask import Blueprint, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from ..models.user import db, ConfiguracaoCenarios, LogSistema, User
from ..auth import token_required

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/cenarios', methods=['GET'])
@token_required
def get_cenarios_config(current_user):
    """Buscar configurações de cenários do usuário.

    Se o usuário for admin e for passado ?usuario_id=XYZ, busca a configuração desse usuário alvo.
    """
    print(f"Endpoint /cenarios GET chamado para usuário {current_user.id}")
    try:
        usuario_id_param = request.args.get('usuario_id', type=int)

        # Determinar usuário alvo
        target_user_id = current_user.id
        if current_user.role == 'admin' and usuario_id_param:
            target_user_id = usuario_id_param

        config = ConfiguracaoCenarios.query.filter_by(usuario_id=target_user_id).first()
        
        if not config:
            # Retornar valores padrão se não existir configuração
            return jsonify({
                'pessimista': 0,
                'realista': 0,
                'otimista': 0,
                'agressivo': 0
            }), 200
        
        return jsonify(config.to_dict()), 200
        
    except Exception as e:
        print(f"Erro ao buscar configurações de cenários: {str(e)}")
        return jsonify({'message': f'Erro ao buscar configurações: {str(e)}'}), 500

@settings_bp.route('/cenarios', methods=['POST', 'PUT'])
@token_required
def save_cenarios_config(current_user):
    """Salvar ou atualizar configurações de cenários do usuário.

    Se o usuário for admin e for passado ?usuario_id=XYZ, salva para esse usuário alvo.
    """
    print(f"=== ENDPOINT /cenarios POST/PUT CHAMADO ===")
    print(f"Usuário autenticado: {current_user.id}")
    print(f"Headers: {request.headers}")
    print(f"Method: {request.method}")
    try:
        data = request.get_json()
        
        # Validar dados
        required_fields = ['pessimista', 'realista', 'otimista', 'agressivo']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Campo {field} é obrigatório'}), 400
            
            value = data[field]
            if not isinstance(value, (int, float)) or value < -100 or value > 100:
                return jsonify({'message': f'Campo {field} deve ser um número entre -100 e 100'}), 400
        
        # Validações específicas para a nova lógica (Realista como ponto zero)
        # Pessimista deve ser negativo ou zero
        if data.get('pessimista', 0) > 0:
            return jsonify({'message': 'Pessimista deve ser negativo ou zero (variação abaixo do Realista)'}), 400
        
        # Realista deve ser sempre 0
        if data.get('realista', 0) != 0:
            return jsonify({'message': 'Realista deve ser sempre 0 (ponto zero/base)'}), 400
        
        # Otimista e Agressivo devem ser positivos ou zero
        if data.get('otimista', 0) < 0:
            return jsonify({'message': 'Otimista deve ser positivo ou zero (variação acima do Realista)'}), 400
        
        if data.get('agressivo', 0) < 0:
            return jsonify({'message': 'Agressivo deve ser positivo ou zero (variação acima do Realista)'}), 400
        
        # Validar ordem lógica: Otimista não pode ser maior que Agressivo
        if data.get('otimista', 0) > data.get('agressivo', 0):
            return jsonify({'message': 'Otimista não pode ser maior que Agressivo'}), 400
        
        # Determinar usuário alvo
        usuario_id_param = request.args.get('usuario_id', type=int)
        target_user_id = current_user.id
        if current_user.role == 'admin' and usuario_id_param:
            target_user_id = usuario_id_param
        
        # Buscar configuração existente
        config = ConfiguracaoCenarios.query.filter_by(usuario_id=target_user_id).first()
        
        if config:
            # Atualizar configuração existente
            config.pessimista = data['pessimista']
            config.realista = 0  # Sempre 0 (ponto zero)
            config.otimista = data['otimista']
            config.agressivo = data['agressivo']
            config.updated_at = datetime.utcnow()
        else:
            # Criar nova configuração
            config = ConfiguracaoCenarios(
                usuario_id=target_user_id,
                pessimista=data['pessimista'],
                realista=0,  # Sempre 0 (ponto zero)
                otimista=data['otimista'],
                agressivo=data['agressivo']
            )
            db.session.add(config)
        
        # Log da ação
        log = LogSistema(
            usuario_id=current_user.id,
            acao='CENARIOS_CONFIGURADOS',
            detalhes={
                'usuario_alvo_id': target_user_id,
                'pessimista': data['pessimista'],
                'realista': data['realista'],
                'otimista': data['otimista'],
                'agressivo': data['agressivo']
            }
        )
        db.session.add(log)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Configurações de cenários salvas com sucesso',
            'config': config.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao salvar configurações de cenários: {str(e)}")
        return jsonify({'message': f'Erro ao salvar configurações: {str(e)}'}), 500

@settings_bp.route('/cenarios/history', methods=['GET'])
@token_required
def get_cenarios_history(current_user):
    """Buscar histórico de configurações de cenários"""
    try:
        logs = LogSistema.query.filter_by(
            usuario_id=current_user.id,
            acao='CENARIOS_CONFIGURADOS'
        ).order_by(LogSistema.timestamp.desc()).limit(10).all()
        
        history = []
        for log in logs:
            history.append({
                'id': log.id,
                'timestamp': log.timestamp.isoformat(),
                'detalhes': log.detalhes
            })
        
        return jsonify(history), 200
        
    except Exception as e:
        print(f"Erro ao buscar histórico de cenários: {str(e)}")
        return jsonify({'message': f'Erro ao buscar histórico: {str(e)}'}), 500

@settings_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Buscar informações pessoais do usuário"""
    print(f"Endpoint /profile GET chamado para usuário {current_user.id}")
    try:
        return jsonify({
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Erro ao buscar perfil: {str(e)}")
        return jsonify({'message': f'Erro ao buscar perfil: {str(e)}'}), 500

@settings_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Atualizar informações pessoais do usuário"""
    print(f"Endpoint /profile PUT chamado para usuário {current_user.id}")
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        if not data.get('nome'):
            return jsonify({'message': 'Nome é obrigatório'}), 400
        
        if not data.get('email'):
            return jsonify({'message': 'Email é obrigatório'}), 400
        
        # Verificar se email já existe em outro usuário
        existing_user = User.query.filter(
            User.email == data.get('email'),
            User.id != current_user.id
        ).first()
        
        if existing_user:
            return jsonify({'message': 'Email já está em uso por outro usuário'}), 400
        
        # Atualizar campos
        current_user.nome = data.get('nome', current_user.nome)
        current_user.email = data.get('email', current_user.email)
        current_user.telefone = data.get('telefone', current_user.telefone)
        current_user.empresa = data.get('empresa', current_user.empresa)
        current_user.cnpj = data.get('cnpj', current_user.cnpj)
        current_user.cargo = data.get('cargo', current_user.cargo)
        current_user.updated_at = datetime.utcnow()
        
        # Log da ação
        log = LogSistema(
            usuario_id=current_user.id,
            acao='PROFILE_UPDATED',
            detalhes={
                'nome': current_user.nome,
                'email': current_user.email,
                'telefone': current_user.telefone,
                'empresa': current_user.empresa,
                'cnpj': current_user.cnpj,
                'cargo': current_user.cargo
            }
        )
        db.session.add(log)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar perfil: {str(e)}")
        return jsonify({'message': f'Erro ao atualizar perfil: {str(e)}'}), 500

@settings_bp.route('/password', methods=['PUT'])
@token_required
def change_password(current_user):
    """Alterar senha do usuário"""
    print(f"Endpoint /password PUT chamado para usuário {current_user.id}")
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        if not data.get('currentPassword'):
            return jsonify({'message': 'Senha atual é obrigatória'}), 400
        
        if not data.get('newPassword'):
            return jsonify({'message': 'Nova senha é obrigatória'}), 400
        
        if not data.get('confirmPassword'):
            return jsonify({'message': 'Confirmação de senha é obrigatória'}), 400
        
        # Verificar se a senha atual está correta
        if not current_user.check_password(data.get('currentPassword')):
            return jsonify({'message': 'Senha atual incorreta'}), 400
        
        # Verificar se as senhas coincidem
        if data.get('newPassword') != data.get('confirmPassword'):
            return jsonify({'message': 'Nova senha e confirmação não coincidem'}), 400
        
        # Verificar se a nova senha é diferente da atual
        if current_user.check_password(data.get('newPassword')):
            return jsonify({'message': 'A nova senha deve ser diferente da senha atual'}), 400
        
        # Atualizar senha
        current_user.set_password(data.get('newPassword'))
        current_user.updated_at = datetime.utcnow()
        
        # Log da ação
        log = LogSistema(
            usuario_id=current_user.id,
            acao='PASSWORD_CHANGED',
            detalhes={
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        db.session.add(log)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Senha alterada com sucesso'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao alterar senha: {str(e)}")
        return jsonify({'message': f'Erro ao alterar senha: {str(e)}'}), 500
