from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from flask import current_app, request, jsonify
from functools import wraps
import os
from src.models.user import User, TokenBlacklist, db

# Configuração para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configurações JWT
# SECRET_KEY deve ser obtida de variável de ambiente
# Em produção, SECRET_KEY é obrigatória e não deve ter fallback
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    flask_env = os.getenv('FLASK_ENV', 'development')
    if flask_env == 'production':
        raise ValueError(
            'SECRET_KEY deve ser configurada em produção! '
            'Configure a variável de ambiente SECRET_KEY antes de iniciar a aplicação.'
        )
    # Fallback apenas para desenvolvimento (NUNCA usar em produção)
    SECRET_KEY = 'habitus_secret_key_2025_dev_only_never_use_in_production'
    import warnings
    warnings.warn(
        '⚠️ SECRET_KEY não configurada! Usando valor padrão de desenvolvimento. '
        'Configure SECRET_KEY em produção!',
        UserWarning
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # 7 dias (7 * 24 * 60)

def verify_password(plain_password, hashed_password):
    """Verifica se a senha está correta"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Gera hash da senha"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verifica e decodifica token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None

def authenticate_user(email: str, password: str):
    """Autentica usuário"""
    user = User.query.filter_by(email=email).first()
    if not user:
        return False
    if not user.check_password(password):
        return False
    return user

def get_current_user():
    """Obtém usuário atual a partir do token"""
    token = None
    auth_header = request.headers.get('Authorization')
    
    if auth_header:
        try:
            token = auth_header.split(" ")[1]  # Bearer <token>
        except IndexError:
            return None
    
    if not token:
        return None
    
    # Verificar se token está na blacklist
    blacklisted = TokenBlacklist.query.filter_by(token=token).first()
    if blacklisted:
        return None
    
    email = verify_token(token)
    if email is None:
        return None
    
    user = User.query.filter_by(email=email).first()
    return user

def token_required(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({'message': 'Token inválido ou expirado'}), 401
        return f(current_user=user, *args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator para rotas que requerem privilégios de admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return jsonify({'message': 'Token inválido ou expirado'}), 401
        if user.role != 'admin':
            return jsonify({'message': 'Acesso negado. Privilégios de administrador necessários'}), 403
        return f(current_user=user, *args, **kwargs)
    return decorated
