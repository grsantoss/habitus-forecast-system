# HTTPS Quick Start - Habitus Forecast

Guia rápido para configurar HTTPS em 5 minutos.

## 🚀 Setup Automático (Recomendado)

### Linux/Mac

```bash
# 1. Execute o script de setup
sudo bash scripts/setup-ssl.sh

# 2. Siga as instruções na tela
#    - Digite seu domínio
#    - Digite seu email
#    - Digite o caminho do projeto
```

### Windows (via SSH)

```powershell
# 1. Execute o script PowerShell
.\scripts\setup-ssl.ps1

# 2. Siga as instruções para conectar ao servidor Linux
```

## 📝 Setup Manual

### 1. Instalar Nginx e Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configurar Nginx

```bash
# Copiar configuração
sudo cp nginx/habitus-forecast-http.conf /etc/nginx/sites-available/habitus-forecast

# Editar e substituir:
# - seu-dominio.com → seu domínio real
# - /path/to/habitus-forecast-system → caminho do projeto
sudo nano /etc/nginx/sites-available/habitus-forecast

# Habilitar site
sudo ln -s /etc/nginx/sites-available/habitus-forecast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Obter Certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 4. Atualizar Configuração Completa

```bash
# Copiar configuração com SSL
sudo cp nginx/habitus-forecast.conf /etc/nginx/sites-available/habitus-forecast

# Editar e substituir placeholders
sudo nano /etc/nginx/sites-available/habitus-forecast

# Reiniciar
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Atualizar Aplicação

**Backend (.env):**
```env
CORS_ORIGINS=https://app.habitusforecast.com.br
```

**Frontend (.env):**
```env
VITE_API_URL=https://app.habitusforecast.com.br/api
```

**Rebuild frontend:**
```bash
cd frontend
pnpm run build
```

## ✅ Verificação

1. Acesse: `https://app.habitusforecast.com.br`
2. Verifique cadeado verde no navegador
3. Teste API: `https://app.habitusforecast.com.br/api/health`
4. Verifique redirecionamento HTTP → HTTPS

## 📚 Documentação Completa

Veja `docs/HTTPS_SETUP.md` para guia detalhado com troubleshooting.

## 🔧 Troubleshooting Rápido

**Erro ao obter certificado:**
- Verifique DNS: `dig seu-dominio.com`
- Verifique firewall: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`

**Nginx não inicia:**
- Teste configuração: `sudo nginx -t`
- Ver logs: `sudo tail -f /var/log/nginx/error.log`

**Certificado não renova:**
- Verificar timer: `sudo systemctl status certbot.timer`
- Renovar manualmente: `sudo certbot renew`

