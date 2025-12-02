"""
Middleware de segurança para a aplicação Flask
"""
from flask import Flask
from functools import wraps
import os

def setup_security_headers(app: Flask):
    """Configura headers de segurança HTTP"""
    
    @app.after_request
    def set_security_headers(response):
        """Adiciona headers de segurança em todas as respostas"""
        
        # Content Security Policy
        csp = os.getenv('CSP_HEADER', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';")
        response.headers['Content-Security-Policy'] = csp
        
        # X-Content-Type-Options
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # X-Frame-Options
        response.headers['X-Frame-Options'] = 'DENY'
        
        # X-XSS-Protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer-Policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions-Policy
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Strict-Transport-Security (apenas em HTTPS)
        if os.getenv('FLASK_ENV') == 'production':
            hsts_max_age = os.getenv('HSTS_MAX_AGE', '31536000')  # 1 ano
            response.headers['Strict-Transport-Security'] = f'max-age={hsts_max_age}; includeSubDomains'
        
        return response

def setup_rate_limiting(app: Flask):
    """Configura rate limiting usando Flask-Limiter"""
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address
        
        # Configurar storage (Redis em produção, memory em dev)
        storage_uri = os.getenv('RATELIMIT_STORAGE_URI')
        if not storage_uri:
            storage_uri = 'memory://'
        
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=[os.getenv('RATELIMIT_DEFAULT', '200 per hour')],
            storage_uri=storage_uri,
            headers_enabled=True
        )
        
        return limiter
    except ImportError:
        # Se Flask-Limiter não estiver instalado, retornar None
        app.logger.warning("Flask-Limiter não instalado. Rate limiting desabilitado.")
        return None

