# Prioridades para Produção - Habitus Forecast

**Data:** 2025-12-09  
**Status:** 🟡 Parcialmente Concluído - Ver Resumo

---

## 📋 Resumo Executivo

Este documento lista as prioridades críticas que devem ser implementadas antes do deploy em produção.

---

## 🔴 Prioridade 1: HTTPS/SSL (CRÍTICO)

### Status
- [ ] Configurar certificado SSL
- [ ] Configurar Nginx reverse proxy
- [ ] Redirecionar HTTP → HTTPS
- [ ] Validar certificado

### Impacto
- **Alto risco de segurança** sem HTTPS
- Dados trafegando em texto plano
- Não atende requisitos de segurança modernos

### Tempo Estimado
1-2 horas

### Ações
1. Configurar Let's Encrypt ou Cloudflare
2. Configurar Nginx como reverse proxy
3. Configurar redirecionamento HTTP → HTTPS
4. Testar certificado

### Documentação
- `docs/SECURITY.md`
- `HTTPS_QUICK_START.md`
- `scripts/setup-ssl.sh`

---

## 🔴 Prioridade 2: Corrigir Testes Falhando (ALTA)

### Status Atual
- **Taxa de sucesso:** 40% (4/10 testes)
- **Testes falhando:** 6/10

### Testes que Precisam Correção

#### TC002 - POST /api/auth/register
- **Problema:** Status 400 após adicionar campo `nome`
- **Ação:** Investigar payload e validação do backend

#### TC005 - GET /api/projetos
- **Problema:** Procurando `'projects'` em vez de `'projetos'`
- **Ação:** Script de correção já existe, verificar se está funcionando

#### TC006 - POST /api/projetos
- **Problema:** Erro 400 - "Nome do cliente e data base são obrigatórios"
- **Ação:** Verificar campos obrigatórios e payload

#### TC007 - POST /api/upload-planilha
- **Problema:** Erro 400 no upload
- **Ação:** Criar arquivo Excel válido para teste

#### TC009 - POST /api/projetos/<id>/cenarios
- **Problema:** Erro 400 - Depende de TC006
- **Ação:** Corrigir após TC006

#### TC010 - GET /api/admin/usuarios
- **Problema:** Procurando `'users'` em vez de `'usuarios'`
- **Ação:** Script de correção já existe, verificar se está funcionando

### Impacto
- Funcionalidades críticas podem não funcionar corretamente
- Risco de bugs em produção

### Tempo Estimado
4-8 horas

### Ações
1. Investigar cada teste falhando
2. Corrigir bugs encontrados no backend
3. Ajustar testes se necessário
4. Validar manualmente funcionalidades críticas

---

## ✅ Prioridade 3: Monitoramento Básico (CONCLUÍDA)

### Status
- [x] ✅ Configurar Sentry para erros - **IMPLEMENTADO**
- [ ] Configurar monitoramento de uptime - **Pendente (configuração manual)**
- [ ] Configurar alertas básicos - **Pendente (configuração manual)**

### Impacto
- ✅ Sentry implementado e pronto para uso
- ⚠️ Uptime monitoring requer configuração manual (30 minutos)

### Tempo Estimado
- ✅ Sentry: Concluído
- ⏳ Uptime: 30 minutos (configuração manual)

### Ações Concluídas

#### 3.1 Sentry (Erros) ✅
- [x] ✅ SDK Python integrado no backend
- [x] ✅ Configuração automática quando `SENTRY_DSN` está presente
- [x] ✅ Captura automática de exceções
- [x] ✅ Monitoramento de performance
- [x] ✅ Documentação criada (`docs/MONITORAMENTO.md`)

**Como usar:**
1. Criar conta em https://sentry.io
2. Criar projeto Flask/Python
3. Adicionar `SENTRY_DSN` no `.env`
4. Instalar dependências: `pip install -r requirements.txt`

### Ações Pendentes

#### 3.2 Uptime Monitoring ⏳
1. Criar conta no UptimeRobot (https://uptimerobot.com)
2. Configurar monitor para `/api/health`
3. Configurar alertas por email

**Documentação:** `docs/MONITORAMENTO.md` - Seção "Monitoramento de Uptime"

#### 3.3 Alertas Básicos ⏳
1. Configurar alertas no Sentry (via dashboard)
2. Configurar alertas no UptimeRobot
3. Testar alertas

---

## 🟡 Prioridade 4: Validação de Ambiente (MÉDIA)

### Status
- [x] Script de validação pré-deploy existe
- [ ] Validar variáveis de ambiente de produção
- [ ] Testar script de validação

### Ações
1. Executar script de validação
2. Corrigir problemas encontrados
3. Documentar variáveis obrigatórias

---

## 🟡 Prioridade 5: Backup Automático (MÉDIA)

### Status
- [x] Scripts de backup existem
- [ ] Configurar backup automático (cron)
- [ ] Testar restauração de backup

### Ações
1. Configurar cron job para backup diário
2. Testar backup e restore
3. Configurar retenção de backups

---

## 📊 Ordem de Implementação Recomendada

### Sprint 1 (Crítico - 4-6 horas)
1. ✅ **Prioridade 3:** Configurar monitoramento básico (Sentry) - **CONCLUÍDO**
2. ⏳ **Prioridade 1:** Configurar HTTPS/SSL - **PENDENTE (CRÍTICO)**
3. ⏳ **Prioridade 2:** Corrigir testes falhando - **PENDENTE**
4. ⏳ **Prioridade 3.2:** Configurar monitoramento de uptime - **PENDENTE (30min)**

### Sprint 2 (Importante - 2-4 horas)
4. ✅ **Prioridade 4:** Validar ambiente
5. ✅ **Prioridade 5:** Configurar backup automático

---

## ✅ Checklist Final

Antes de fazer deploy em produção, verificar:

- [ ] HTTPS/SSL configurado e funcionando — **CRÍTICO**
- [ ] Todos os testes críticos passando (>80%) — **ALTA PRIORIDADE**
- [x] Monitoramento de erros configurado (Sentry) — **✅ IMPLEMENTADO**
- [ ] Monitoramento de uptime configurado — **30 minutos**
- [ ] Variáveis de ambiente validadas
- [ ] Backup automático configurado
- [x] Script de validação pré-deploy executado com sucesso — **✅ MELHORADO**
- [x] Documentação atualizada — **✅ COMPLETA**

---

## 📝 Resumo do Progresso

### ✅ Concluído
- Integração do Sentry para monitoramento de erros
- Script de validação pré-deploy melhorado
- Documentação completa de monitoramento

### ⏳ Pendente (Crítico)
- HTTPS/SSL (1-2 horas) — **BLOQUEANTE PARA PRODUÇÃO**
- Correção de testes falhando (4-8 horas)
- Monitoramento de uptime (30 minutos)

**Ver:** `RESUMO_IMPLEMENTACOES_CRITICAS.md` para detalhes completos

---

**Última atualização:** 2025-12-09

