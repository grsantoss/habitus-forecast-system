# Guia de Segurança - Habitus Forecast

Este documento descreve as medidas de segurança implementadas e recomendações.

## Medidas Implementadas

### 1. Headers de Segurança HTTP

Aplicados automaticamente em todas as respostas:

- **Content-Security-Policy**: Previne XSS
- **X-Content-Type-Options**: Previne MIME sniffing
- **X-Frame-Options**: Previne clickjacking
- **X-XSS-Protection**: Proteção adicional XSS
- **Referrer-Policy**: Controla informações de referrer
- **Permissions-Policy**: Controla APIs do navegador
- **Strict-Transport-Security**: Força HTTPS (produção)

### 2. Rate Limiting

Implementado com Flask-Limiter:

- Limite padrão: 200 requisições/hora por IP
- Configurável via `RATELIMIT_DEFAULT`
- Headers de rate limit incluídos nas respostas
- Storage: Memory (dev) ou Redis (produção)

**Configuração:**
```env
RATELIMIT_DEFAULT=200 per hour
RATELIMIT_STORAGE_URI=redis://localhost:6379/0  # Produção
```

### 3. Validação de Uploads

Melhorias implementadas:

- ✅ Validação de extensão
- ✅ Validação de tamanho (16MB máximo)
- ✅ Validação de MIME type
- ✅ Sanitização de nomes de arquivo
- ✅ Verificação de conteúdo real do arquivo

### 4. Logging Estruturado

- Logs em formato JSON (produção)
- Inclusão de contexto (user_id, request_id, IP)
- Rotação automática de logs
- Separação de níveis (INFO, ERROR, WARNING)

### 5. Autenticação

- JWT tokens com expiração
- Senhas hasheadas com bcrypt
- Tokens invalidados no logout

## Recomendações Adicionais

### HTTPS/SSL

**Crítico para produção!**

Opções:

1. **Let's Encrypt** (gratuito):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d seu-dominio.com
   ```

2. **Cloudflare** (recomendado):
   - Configure DNS no Cloudflare
   - SSL automático (Full ou Full Strict)
   - Proteção DDoS incluída

3. **Nginx Reverse Proxy**:
   ```nginx
   server {
       listen 443 ssl http2;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:5000;
       }
   }
   ```

### Variáveis de Ambiente

**Nunca commite secrets!**

```env
# Gerar SECRET_KEY forte
python -c "import secrets; print(secrets.token_hex(32))"

# Configurar em produção
SECRET_KEY=<chave-gerada>
FLASK_ENV=production
FLASK_DEBUG=False
```

### CORS

Configure apenas domínios necessários:

```env
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
```

### Backup de Segurança

Execute backups regulares:

```bash
# Automatizar via cron
0 2 * * * /path/to/backup_db.sh
```

### Monitoramento

Configure alertas para:

- Erros 500
- Rate limit excedido
- Tentativas de login falhadas
- Uptime do serviço

### Atualizações

Mantenha dependências atualizadas:

```bash
pip list --outdated
pip install --upgrade <package>
```

## Checklist de Segurança

### Antes de Produção

- [ ] HTTPS configurado
- [ ] SECRET_KEY forte gerado
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Logging configurado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Dependências atualizadas
- [ ] DEBUG desabilitado
- [ ] Headers de segurança ativos

### Manutenção Regular

- [ ] Revisar logs de segurança
- [ ] Atualizar dependências
- [ ] Rotacionar secrets periodicamente
- [ ] Testar restauração de backup
- [ ] Revisar permissões de arquivos
- [ ] Auditar acesso ao banco

## Incidentes de Segurança

Se detectar uma vulnerabilidade:

1. **Imediato**: Isolar o sistema afetado
2. **Documentar**: Registrar o incidente
3. **Corrigir**: Aplicar patch/atualização
4. **Notificar**: Informar usuários se necessário
5. **Prevenir**: Implementar medidas preventivas

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Flask Security Best Practices](https://flask.palletsprojects.com/en/latest/security/)
- [Let's Encrypt](https://letsencrypt.org/)

