"""
Middleware de monitoramento para a aplicação Flask
"""
from flask import Flask, request, g
import time
import logging
from functools import wraps

def setup_request_logging(app: Flask):
    """Configura logging de requisições"""
    
    @app.before_request
    def before_request():
        """Log antes da requisição"""
        g.start_time = time.time()
        g.request_id = request.headers.get('X-Request-ID', 'unknown')
        
        # Log da requisição
        app.logger.info(
            f"Request started",
            extra={
                'request_id': g.request_id,
                'method': request.method,
                'path': request.path,
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', 'unknown')
            }
        )
    
    @app.after_request
    def after_request(response):
        """Log após a requisição"""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            # Log da resposta
            app.logger.info(
                f"Request completed",
                extra={
                    'request_id': getattr(g, 'request_id', 'unknown'),
                    'method': request.method,
                    'path': request.path,
                    'status_code': response.status_code,
                    'duration_ms': round(duration * 1000, 2),
                    'ip_address': request.remote_addr
                }
            )
            
            # Adicionar header com tempo de resposta
            response.headers['X-Response-Time'] = f"{duration:.3f}s"
        
        return response
    
    @app.errorhandler(500)
    def internal_error(error):
        """Log de erros internos"""
        app.logger.error(
            f"Internal server error: {str(error)}",
            extra={
                'request_id': getattr(g, 'request_id', 'unknown'),
                'path': request.path,
                'method': request.method,
                'ip_address': request.remote_addr
            },
            exc_info=True
        )
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(404)
    def not_found(error):
        """Log de 404"""
        app.logger.warning(
            f"Not found: {request.path}",
            extra={
                'request_id': getattr(g, 'request_id', 'unknown'),
                'path': request.path,
                'method': request.method,
                'ip_address': request.remote_addr
            }
        )
        return {'error': 'Not found'}, 404

def track_user_action(action_name):
    """Decorator para rastrear ações de usuário"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from src.auth import get_current_user
            
            try:
                current_user = get_current_user()
                user_id = current_user.id if current_user else None
            except:
                user_id = None
            
            # Log da ação
            from flask import current_app
            current_app.logger.info(
                f"User action: {action_name}",
                extra={
                    'action': action_name,
                    'user_id': user_id,
                    'path': request.path,
                    'method': request.method
                }
            )
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

