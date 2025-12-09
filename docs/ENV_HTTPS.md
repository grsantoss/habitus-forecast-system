# Variáveis de Ambiente para HTTPS

## Backend (.env)

Após configurar HTTPS, atualize o arquivo `backend/.env`:

```env
# Origens permitidas para CORS (separadas por vírgula)
# URL de produção
CORS_ORIGINS=https://app.habitusforecast.com.br

# Opcional: Configurações de HTTPS
DOMAIN=app.habitusforecast.com.br
HTTPS_ENABLED=true
```

## Frontend (.env)

Atualize o arquivo `frontend/.env`:

```env
# URL base da API backend com HTTPS
VITE_API_URL=https://app.habitusforecast.com.br/api
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

- Acesse: `https://app.habitusforecast.com.br`
- Verifique console do navegador (sem erros CORS)
- Teste login e funcionalidades da API

