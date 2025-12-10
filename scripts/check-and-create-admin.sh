#!/bin/bash
# Script para verificar e criar usuário admin se necessário
# Execute: bash scripts/check-and-create-admin.sh

set -e

echo "🔍 Verificando usuários no banco de dados..."

# Verificar usuários existentes
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python -c "
from src.main import app, db
from src.models.user import User
with app.app_context():
    users = User.query.all()
    print(f'📊 Total de usuários no banco: {len(users)}')
    if users:
        print('\\n👥 Usuários existentes:')
        for user in users:
            print(f'   - ID: {user.id} | Email: {user.email} | Nome: {user.nome} | Role: {user.role} | Status: {user.status}')
    else:
        print('\\n⚠️  Nenhum usuário encontrado no banco!')
" || {
    echo "❌ Erro ao verificar usuários"
    exit 1
}

echo ""
echo "🔄 Executando script de seed para criar usuário admin se necessário..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python scripts/seed_db.py

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📋 Credenciais padrão do admin:"
echo "   Email: admin@habitus.com"
echo "   Senha: admin123"
echo ""
echo "🌐 Teste fazer login em: https://app.habitusforecast.com.br/login"

