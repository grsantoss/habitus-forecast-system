# Checklist Final para Produção - Habitus Forecast

**Data:** 2025-12-09  
**Status:** ✅ Pronto para Deploy (após configuração manual)

---

## ✅ Implementações Concluídas

### 1. Monitoramento de Erros ✅
- [x] Sentry SDK integrado no backend
- [x] Configuração automática quando `SENTRY_DSN` está presente
- [x] Captura automática de exceções
- [x] Monitoramento de performance
- [x] Documentação completa (`docs/MONITORAMENTO.md`)

### 2. Scripts de Deploy ✅
- [x] Script de validação pré-deploy melhorado
- [x] Script de deploy completo (`scripts/deploy-producao-completo.sh`)
- [x] Script de configuração SSL (`scripts/setup-ssl.sh`)
- [x] Script de configuração de monitoramento (`scripts/setup-monitoring.sh`)

### 3. Documentação ✅
- [x] Guia completo de deploy (`docs/GUIA_DEPLOY_PRODUCAO.md`)
- [x] Guia de monitoramento (`docs/MONITORAMENTO.md`)
- [x] Lista de prioridades (`docs/PRIORIDADES_PRODUCAO.md`)
- [x] Documentação de implementações (`docs/IMPLEMENTACOES_CRITICAS.md`)

### 4. Configuração Nginx ✅
- [x] Configuração HTTP (`nginx/habitus-forecast-http.conf`)
- [x] Configuração HTTPS (`nginx/habitus-forecast.conf`)
- [x] Redirecionamento HTTP → HTTPS
- [x] Headers de segurança configurados

### 5. Correção de Testes ✅
- [x] Script de correção automática melhorado
- [x] Correções para TC002 (registro)
- [x] Correções para TC006 (criação de projetos)
- [x] Suporte para múltiplos padrões de resposta

---

## 📋 Checklist de Deploy

### Antes do Deploy

#### Infraestrutura
- [ ] Servidor Linux configurado (Ubuntu 20.04+)
- [ ] Docker e Docker Compose instalados
- [ ] Git instalado
- [ ] Portas 80 e 443 abertas no firewall
- [ ] Domínio configurado e apontando para o servidor

#### Configuração
- [ ] Arquivo `.env` criado a partir de `env.production.example`
- [ ] `SECRET_KEY` gerado e configurado (mínimo 32 caracteres)
- [ ] `DATABASE_URL` configurado (PostgreSQL)
- [ ] `POSTGRES_PASSWORD` configurado (senha forte)
- [ ] `CORS_ORIGINS` configurado com domínio de produção
- [ ] `VITE_API_URL` configurado para produção
- [ ] `FLASK_ENV=production` configurado
- [ ] `FLASK_DEBUG=False` configurado

#### Validação
- [ ] Script de validação pré-deploy executado com sucesso
- [ ] Nenhum erro crítico encontrado
- [ ] Avisos revisados e resolvidos

### Durante o Deploy

#### Deploy Inicial
- [ ] Código clonado no servidor
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend buildado (`pnpm run build`)
- [ ] Containers Docker buildados
- [ ] Containers iniciados e rodando
- [ ] Migrações do banco executadas
- [ ] Health check respondendo (`/api/health`)

#### HTTPS/SSL
- [ ] Nginx instalado e configurado
- [ ] Certificado SSL obtido (Let's Encrypt)
- [ ] Configuração HTTPS aplicada
- [ ] Redirecionamento HTTP → HTTPS funcionando
- [ ] Certificado validado no navegador
- [ ] Renovação automática configurada

### Após o Deploy

#### Validação Funcional
- [ ] HTTPS funcionando: `https://seu-dominio.com`
- [ ] Frontend carregando corretamente
- [ ] API respondendo: `https://seu-dominio.com/api/health`
- [ ] Login funcionando
- [ ] Registro de usuário funcionando
- [ ] Criação de projetos funcionando
- [ ] Upload de planilhas funcionando

#### Monitoramento
- [ ] Sentry configurado (`SENTRY_DSN` no `.env`)
- [ ] Teste de captura de erro no Sentry realizado
- [ ] UptimeRobot configurado (monitorando `/api/health`)
- [ ] Alertas configurados (email/SMS)
- [ ] Logs sendo coletados corretamente

#### Segurança
- [ ] HTTPS funcionando e validado
- [ ] Headers de segurança ativos
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente
- [ ] DEBUG desabilitado
- [ ] Secrets não commitados no código

#### Backup
- [ ] Backup automático configurado (cron)
- [ ] Teste de restore realizado
- [ ] Retenção de backups configurada

---

## 🚀 Comandos Rápidos

### Deploy Completo
```bash
bash scripts/deploy-producao-completo.sh
```

### Configurar HTTPS
```bash
sudo bash scripts/setup-ssl.sh
```

### Configurar Monitoramento
```bash
bash scripts/setup-monitoring.sh
```

### Validar Antes do Deploy
```bash
bash scripts/validate-pre-deploy.sh
```

### Verificar Status
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl http://localhost:5000/api/health
```

### Ver Logs
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

---

## 📊 Status Atual

### ✅ Pronto
- Infraestrutura Docker
- Scripts de deploy
- Configuração Nginx
- Integração Sentry
- Documentação completa
- Scripts de correção de testes

### ⚠️ Requer Configuração Manual
- HTTPS/SSL (1-2 horas)
- Monitoramento de uptime (30 minutos)
- Variáveis de ambiente (15 minutos)

### 🔄 Em Progresso
- Correção de testes (script melhorado, mas alguns testes ainda podem falhar)

---

## 🎯 Próximos Passos Imediatos

1. **Configurar Variáveis de Ambiente** (15 min)
   - Copiar `env.production.example` para `.env`
   - Preencher valores reais
   - Gerar `SECRET_KEY` forte

2. **Executar Deploy** (30 min)
   - Executar `scripts/deploy-producao-completo.sh`
   - Verificar se containers estão rodando
   - Testar endpoint `/api/health`

3. **Configurar HTTPS** (1-2 horas)
   - Executar `sudo bash scripts/setup-ssl.sh`
   - Ou seguir `docs/GUIA_DEPLOY_PRODUCAO.md`

4. **Configurar Monitoramento** (30 min)
   - Criar conta no Sentry
   - Adicionar `SENTRY_DSN` no `.env`
   - Configurar UptimeRobot

---

## 📝 Notas Importantes

- ✅ Todos os scripts estão prontos e testados
- ✅ Documentação completa disponível
- ⚠️ HTTPS é **obrigatório** para produção
- ⚠️ Configure monitoramento antes de ir ao ar
- ⚠️ Teste todas as funcionalidades críticas após deploy

---

## 🔗 Documentação de Referência

- `docs/GUIA_DEPLOY_PRODUCAO.md` - Guia completo passo a passo
- `docs/MONITORAMENTO.md` - Guia de monitoramento
- `docs/PRIORIDADES_PRODUCAO.md` - Lista de prioridades
- `HTTPS_QUICK_START.md` - Guia rápido de HTTPS
- `scripts/validate-pre-deploy.sh` - Script de validação

---

**Última atualização:** 2025-12-09  
**Status:** ✅ Pronto para Deploy (após configuração manual de HTTPS e monitoramento)

