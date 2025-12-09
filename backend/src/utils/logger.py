"""
Utilitário de logging condicional para produção
"""
import os
import logging
from functools import wraps

# Obter logger da aplicação Flask
def get_logger(name=None):
    """Obtém logger configurado"""
    if name:
        return logging.getLogger(name)
    return logging.getLogger('habitus_forecast')

def is_debug_mode():
    """Verifica se está em modo debug"""
    flask_env = os.getenv('FLASK_ENV', 'development')
    flask_debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    return flask_env != 'production' or flask_debug

def debug_log(message, *args, **kwargs):
    """
    Log apenas em modo debug/desenvolvimento.
    Em produção, não registra nada.
    """
    if is_debug_mode():
        logger = get_logger()
        logger.debug(message, *args, **kwargs)

def info_log(message, *args, **kwargs):
    """Log de informação (sempre registrado)"""
    logger = get_logger()
    logger.info(message, *args, **kwargs)

def warning_log(message, *args, **kwargs):
    """Log de aviso (sempre registrado)"""
    logger = get_logger()
    logger.warning(message, *args, **kwargs)

def error_log(message, *args, **kwargs):
    """Log de erro (sempre registrado)"""
    logger = get_logger()
    logger.error(message, *args, **kwargs)

def exception_log(message, *args, **kwargs):
    """Log de exceção com traceback (sempre registrado)"""
    logger = get_logger()
    logger.exception(message, *args, **kwargs)

