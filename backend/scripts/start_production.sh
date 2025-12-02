#!/bin/bash
# Script para iniciar a aplicação em produção com Gunicorn
# Execute: bash scripts/start_production.sh

cd "$(dirname "$0")/.."

echo "🔍 Verificando ambiente..."

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Copie .env.example para .env e configure as variáveis"
    exit 1
fi

# Carregar variáveis de ambiente
export $(cat .env | grep -v '^#' | xargs)

# Verificar se Gunicorn está instalado
python -c "import gunicorn" 2>/dev/null || {
    echo "❌ Gunicorn não está instalado"
    echo "   Execute: pip install -r requirements.txt"
    exit 1
}

# Verificar se migrações foram aplicadas
echo "🔍 Verificando migrações..."
alembic current > /dev/null 2>&1 || {
    echo "⚠ Aviso: Migrações podem não estar aplicadas"
    echo "   Execute: alembic upgrade head"
}

# Verificar se frontend foi buildado
if [ ! -f "src/static/index.html" ]; then
    echo "⚠ Aviso: Frontend não foi buildado"
    echo "   Execute: cd ../frontend && pnpm run build"
fi

echo "🚀 Iniciando servidor Gunicorn..."
gunicorn --config gunicorn_config.py wsgi:application

