# Guia de Monitoramento - Habitus Forecast

Este documento descreve como configurar e usar o monitoramento da aplicação em produção.

---

## 📊 Monitoramento de Erros - Sentry

### O que é Sentry?

Sentry é uma plataforma de monitoramento de erros que captura exceções, rastreia performance e fornece insights sobre problemas em produção.

### Configuração

#### 1. Criar Conta no Sentry

1. Acesse https://sentry.io
2. Crie uma conta gratuita (plano gratuito disponível)
3. Crie uma nova organização (se necessário)

#### 2. Criar Projeto

1. No dashboard do Sentry, clique em "Create Project"
2. Selecione **Flask** como plataforma
3. Escolha um nome para o projeto (ex: `habitus-forecast`)
4. Copie o **DSN** fornecido

#### 3. Configurar na Aplicação

Adicione o DSN no arquivo `.env`:

```env
SENTRY_DSN=https://seu-dsn-do-sentry@sentry.io/projeto
APP_VERSION=1.0.0  # Opcional
```

#### 4. Instalar Dependências

As dependências já estão no `requirements.txt`:
```bash
pip install -r requirements.txt
```

Ou instalar manualmente:
```bash
pip install sentry-sdk[flask]
```

### O que é Monitorado?

- ✅ **Erros e Exceções**: Todas as exceções não tratadas
- ✅ **Performance**: Tempo de resposta de requisições
- ✅ **Queries SQL**: Queries lentas ou problemáticas
- ✅ **Contexto**: Informações sobre o usuário, request, etc.

### Funcionalidades

#### Captura Automática de Erros

Todos os erros não tratados são automaticamente capturados e enviados ao Sentry:

```python
# Erro será capturado automaticamente
@app.route('/api/test')
def test():
    raise ValueError("Erro de teste")  # Capturado pelo Sentry
```

#### Captura Manual de Erros

Você também pode capturar erros manualmente:

```python
import sentry_sdk

try:
    # código que pode falhar
    pass
except Exception as e:
    sentry_sdk.capture_exception(e)
    # ou
    sentry_sdk.capture_message("Algo deu errado", level="error")
```

#### Adicionar Contexto

Adicione informações úteis para debugging:

```python
import sentry_sdk

with sentry_sdk.configure_scope() as scope:
    scope.user = {"id": user_id, "email": user_email}
    scope.set_tag("feature", "upload")
    scope.set_extra("file_name", file_name)
```

### Dashboard do Sentry

Após configurar, você terá acesso a:

- **Issues**: Lista de erros capturados
- **Performance**: Métricas de performance
- **Releases**: Rastreamento de versões
- **Alerts**: Alertas configuráveis

### Alertas

Configure alertas no Sentry para:

- Novos erros
- Erros recorrentes
- Performance degradada
- Queries SQL lentas

---

## 📈 Monitoramento de Uptime

### UptimeRobot (Recomendado)

#### Configuração

1. Acesse https://uptimerobot.com
2. Crie uma conta gratuita (até 50 monitores)
3. Adicione um novo monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://seu-dominio.com/api/health`
   - **Interval**: 5 minutos
   - **Alert Contacts**: Configure seu email

#### Endpoint de Health Check

A aplicação já possui um endpoint de health check:

```
GET /api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "message": "Habitus Forecast API está funcionando"
}
```

### Outras Opções

- **Pingdom**: https://www.pingdom.com
- **StatusCake**: https://www.statuscake.com
- **Better Uptime**: https://betteruptime.com

---

## 🔔 Configuração de Alertas

### Sentry Alerts

1. No dashboard do Sentry, vá em **Alerts**
2. Clique em **Create Alert Rule**
3. Configure:
   - **Trigger**: Quando um novo issue é criado
   - **Conditions**: Frequência de erros
   - **Actions**: Enviar email/Slack/Discord

### UptimeRobot Alerts

1. Configure **Alert Contacts** no UptimeRobot
2. Adicione seu email
3. Configure alertas para:
   - Servidor offline
   - Tempo de resposta alto
   - Erros HTTP

---

## 📊 Métricas Recomendadas

### Monitorar Regularmente

1. **Taxa de Erros**: % de requisições com erro
2. **Tempo de Resposta**: P50, P95, P99
3. **Uptime**: % de tempo online
4. **Queries SQL Lentas**: Queries > 1s
5. **Rate Limit**: Requisições bloqueadas

### Dashboard Recomendado

Crie um dashboard com:

- Gráfico de erros ao longo do tempo
- Top 10 erros mais frequentes
- Tempo de resposta por endpoint
- Uptime do serviço
- Queries SQL mais lentas

---

## 🛠️ Troubleshooting

### Sentry não está capturando erros

1. Verifique se `SENTRY_DSN` está configurado
2. Verifique se `sentry-sdk` está instalado
3. Verifique os logs da aplicação para erros de conexão
4. Teste manualmente:
   ```python
   import sentry_sdk
   sentry_sdk.capture_message("Teste de monitoramento")
   ```

### Alertas não estão funcionando

1. Verifique configuração de email no Sentry/UptimeRobot
2. Verifique spam/lixo eletrônico
3. Teste alertas manualmente

---

## 📝 Checklist de Configuração

- [ ] Conta no Sentry criada
- [ ] Projeto Flask criado no Sentry
- [ ] `SENTRY_DSN` configurado no `.env`
- [ ] `sentry-sdk[flask]` instalado
- [ ] Teste de captura de erro realizado
- [ ] Alertas configurados no Sentry
- [ ] Monitor de uptime configurado (UptimeRobot)
- [ ] Endpoint `/api/health` testado
- [ ] Alertas de uptime configurados

---

## 🔗 Recursos

- **Sentry Docs**: https://docs.sentry.io/platforms/python/flask/
- **UptimeRobot Docs**: https://uptimerobot.com/api/
- **Health Check Endpoint**: `/api/health`

---

**Última atualização:** 2025-12-09

