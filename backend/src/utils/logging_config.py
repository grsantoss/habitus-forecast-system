"""
Configuração de logging estruturado para produção
"""
import os
import json
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Formatter que produz logs em formato JSON"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Adicionar informações extras se existirem
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_data['ip_address'] = record.ip_address
        
        # Adicionar exception info se existir
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

def setup_logging(app):
    """Configura logging estruturado"""
    
    # Nível de log baseado em ambiente
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    app.logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Formato baseado em ambiente
    use_json = os.getenv('LOG_FORMAT', 'json').lower() == 'json'
    
    if use_json:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    # Handler para arquivo (produção)
    if os.getenv('LOG_TO_FILE', 'false').lower() == 'true':
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, 'app.log'),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
    
    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if app.debug else logging.INFO)
    console_handler.setFormatter(formatter)
    app.logger.addHandler(console_handler)
    
    # Desabilitar logs verbosos de bibliotecas
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

