"""
WSGI entry point para produção.
Use este arquivo com Gunicorn ou outros servidores WSGI.
"""
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Importar a aplicação Flask
from src.main import app

# A aplicação Flask está disponível como 'application' para servidores WSGI
application = app

if __name__ == "__main__":
    # Para desenvolvimento local, pode executar diretamente
    port = int(os.getenv('PORT', '5000'))
    application.run(host='0.0.0.0', port=port, debug=False)

