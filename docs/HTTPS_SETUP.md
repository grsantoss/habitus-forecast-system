# Guia de Configuração HTTPS/SSL - Habitus Forecast

Este guia descreve como configurar HTTPS/SSL para a aplicação Habitus Forecast.

## 📋 Pré-requisitos

- Domínio apontando para o servidor (registro DNS A)
- Acesso root/sudo ao servidor
- Portas 80 e 443 abertas no firewall
- Aplicação rodando e acessível via HTTP

## 🚀 Opção 1: Let's Encrypt com Nginx (Recomendado para VPS)

### Passo 1: Instalar Dependências

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Passo 2: Configurar Nginx (HTTP temporário)

1. Copie o arquivo de configuração:
   ```bash
   sudo cp nginx/habitus-forecast-http.conf /etc/nginx/sites-available/habitus-forecast
   ```

2. Edite o arquivo e substitua:
   - `seu-dominio.com` → seu domínio real
   - `/path/to/habitus-forecast-system` → caminho completo do projeto

3. Habilite o site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/habitus-forecast /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remover default se existir
   ```

4. Teste a configuração:
   ```bash
   sudo nginx -t
   ```

5. Reinicie o Nginx:
   ```bash
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

### Passo 3: Obter Certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

O Certbot irá:
- Obter certificado do Let's Encrypt
- Configurar automaticamente o Nginx para HTTPS
- Configurar renovação automática

### Passo 4: Atualizar Configuração Nginx

Após obter o certificado, atualize a configuração completa:

```bash
sudo cp nginx/habitus-forecast.conf /etc/nginx/sites-available/habitus-forecast
```

Edite e substitua os placeholders:
- `seu-dominio.com` → seu domínio
- `/path/to/habitus-forecast-system` → caminho do projeto

Reinicie:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 5: Configurar Renovação Automática

O Certbot já configura isso automaticamente, mas você pode verificar:

```bash
# Verificar timer
sudo systemctl status certbot.timer

# Testar renovação
sudo certbot renew --dry-run
```

### Passo 6: Atualizar Aplicação

1. **Backend (.env):**
   ```env
   CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
   ```

2. **Frontend (.env):**
   ```env
   VITE_API_URL=https://seu-dominio.com/api
   ```

3. **Rebuild do frontend:**
   ```bash
   cd frontend
   pnpm run build
   ```

### Verificação

- Acesse: `https://seu-dominio.com`
- Verifique o certificado no navegador (cadeado verde)
- Teste redirecionamento HTTP → HTTPS
- Teste API: `https://seu-dominio.com/api/health`

## ☁️ Opção 2: Cloudflare (Mais Simples)

### Passo 1: Configurar DNS

1. Adicione seu domínio ao Cloudflare
2. Altere nameservers no registrador do domínio
3. Crie registro A apontando para IP do servidor

### Passo 2: Configurar SSL no Cloudflare

1. Acesse: SSL/TLS → Overview
2. Selecione: **Full** ou **Full (strict)**
3. SSL/TLS → Edge Certificates:
   - **Always Use HTTPS**: ON
   - **Automatic HTTPS Rewrites**: ON
   - **Minimum TLS Version**: 1.2

### Passo 3: Configurar Nginx para Cloudflare

1. Use a configuração HTTP básica (sem SSL no Nginx)
2. Cloudflare gerencia SSL automaticamente
3. Configure headers de proxy confiável (opcional):

```nginx
# Adicionar ao nginx.conf ou site config
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;
```

### Passo 4: Atualizar Aplicação

Mesmo processo da Opção 1, mas usando domínio Cloudflare.

## 🐳 Opção 3: Docker com Traefik

### Passo 1: Configurar Variáveis

Crie arquivo `.env` na raiz:

```env
DOMAIN=seu-dominio.com
ACME_EMAIL=seu-email@exemplo.com
```

### Passo 2: Iniciar com Traefik

```bash
docker-compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

### Passo 3: Verificar

- Acesse: `https://seu-dominio.com`
- Dashboard Traefik: `http://seu-dominio.com:8080`

## 🔧 Troubleshooting

### Erro: "Failed to obtain certificate"

**Causas comuns:**
- DNS não está apontando para o servidor
- Porta 80 bloqueada no firewall
- Domínio já tem certificado ativo

**Solução:**
```bash
# Verificar DNS
dig seu-dominio.com

# Verificar firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar certificados existentes
sudo certbot certificates
```

### Erro: "Nginx configuration test failed"

**Solução:**
```bash
# Verificar sintaxe
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

### Certificado não renova automaticamente

**Solução:**
```bash
# Verificar timer
sudo systemctl status certbot.timer

# Renovar manualmente
sudo certbot renew

# Forçar renovação
sudo certbot renew --force-renewal
```

### Redirecionamento HTTP → HTTPS não funciona

**Solução:**
- Verifique se há múltiplas configurações de servidor
- Certifique-se de que o bloco HTTP está antes do HTTPS
- Verifique logs: `sudo tail -f /var/log/nginx/access.log`

## 📊 Verificação de SSL

### Testar Certificado Online

- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

### Comandos Úteis

```bash
# Ver certificados instalados
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Revogar certificado
sudo certbot revoke --cert-path /etc/letsencrypt/live/seu-dominio.com/cert.pem

# Verificar configuração Nginx
sudo nginx -t

# Ver logs do Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## 🔒 Segurança Adicional

### Headers de Segurança

Já incluídos na configuração Nginx:
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Configurações SSL Recomendadas

A configuração já inclui:
- TLS 1.2 e 1.3 apenas
- Ciphers modernos
- Session cache
- OCSP Stapling (habilitar se necessário)

## 📝 Checklist Final

- [ ] Certificado SSL instalado e válido
- [ ] HTTP redireciona para HTTPS
- [ ] CORS_ORIGINS atualizado para HTTPS
- [ ] VITE_API_URL atualizado para HTTPS
- [ ] Frontend rebuildado
- [ ] Testado acesso via HTTPS
- [ ] Renovação automática configurada
- [ ] Headers de segurança ativos
- [ ] SSL testado em ferramentas online

## 🆘 Suporte

Para problemas:
1. Verifique logs: `/var/log/nginx/error.log`
2. Verifique certificado: `certbot certificates`
3. Teste configuração: `nginx -t`
4. Consulte documentação: [Certbot Docs](https://certbot.eff.org/docs/)

