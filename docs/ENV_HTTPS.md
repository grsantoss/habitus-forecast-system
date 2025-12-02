# Variáveis de Ambiente para HTTPS

## Backend (.env)

Após configurar HTTPS, atualize o arquivo `backend/.env`:

```env
# Origens permitidas para CORS (separadas por vírgula)
# Adicione suas URLs HTTPS aqui
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com

# Opcional: Configurações de HTTPS
DOMAIN=seu-dominio.com
HTTPS_ENABLED=true
```

## Frontend (.env)

Atualize o arquivo `frontend/.env`:

```env
# URL base da API backend com HTTPS
VITE_API_URL=https://seu-dominio.com/api
```

## Após Atualizar

1. **Backend**: Reinicie o servidor
   ```bash
   # Se usando Gunicorn
   sudo systemctl restart habitus-forecast
   
   # Se usando Docker
   docker-compose restart backend
   ```

2. **Frontend**: Rebuild necessário
   ```bash
   cd frontend
   pnpm run build
   ```

## Verificação

- Acesse: `https://seu-dominio.com`
- Verifique console do navegador (sem erros CORS)
- Teste login e funcionalidades da API

