from flask import Blueprint, jsonify
from src.models.user import User
from src.auth import admin_required

user_bp = Blueprint('user', __name__)


@user_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user):
    """Lista todos os usuários (somente admin) - endpoint genérico/legado"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])
