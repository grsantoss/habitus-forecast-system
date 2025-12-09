"""
Configuração do Gunicorn para produção.
"""
import os
import multiprocessing

# Bind address e porta
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"

# Número de workers
# Fórmula recomendada: (2 x CPU cores) + 1
workers = int(os.getenv('WORKERS', multiprocessing.cpu_count() * 2 + 1))

# Worker class
# 'sync' é padrão e funciona bem para a maioria dos casos
# 'gevent' ou 'eventlet' para aplicações assíncronas
worker_class = os.getenv('WORKER_CLASS', 'sync')

# Timeout em segundos (aumentado para suportar uploads grandes de até 16MB)
# Uploads grandes podem levar mais tempo, especialmente em conexões lentas
timeout = int(os.getenv('TIMEOUT', '300'))  # 5 minutos padrão

# Keep-alive timeout
keepalive = int(os.getenv('KEEPALIVE', '5'))

# Logging
accesslog = os.getenv('ACCESS_LOG', '-')  # '-' significa stdout
errorlog = os.getenv('ERROR_LOG', '-')    # '-' significa stderr
loglevel = os.getenv('LOG_LEVEL', 'info')

# Process naming
proc_name = 'habitus-forecast'

# Preload app para melhor performance
preload_app = True

# Worker connections (apenas para async workers)
worker_connections = int(os.getenv('WORKER_CONNECTIONS', '1000'))

# Max requests (reinicie workers após N requests para evitar memory leaks)
max_requests = int(os.getenv('MAX_REQUESTS', '1000'))
max_requests_jitter = int(os.getenv('MAX_REQUESTS_JITTER', '50'))

# Graceful timeout
graceful_timeout = int(os.getenv('GRACEFUL_TIMEOUT', '30'))

