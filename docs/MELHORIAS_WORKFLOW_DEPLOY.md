# Melhorias Aplicadas no Workflow de Deploy

## 📋 Resumo das Correções

Este documento detalha todas as melhorias aplicadas no workflow `.github/workflows/deploy.yml` para resolver problemas de deploy e melhorar a visibilidade de erros.

## 🔧 Correções Aplicadas

### 1. **Metadata Separado para Backend e Frontend** ✅

**Problema anterior:**
- Um único step de metadata gerava tags que eram concatenadas manualmente com `-backend` e `-frontend`
- Isso causava tags inválidas quando múltiplas tags eram geradas

**Solução:**
- Criados dois steps separados de metadata (`meta-backend` e `meta-frontend`)
- Cada um gera tags corretas para sua respectiva imagem
- Imagens nomeadas corretamente: `ghcr.io/USER/REPO-backend` e `ghcr.io/USER/REPO-frontend`

### 2. **Removido Build Redundante do Frontend** ✅

**Problema anterior:**
- Step "Build frontend" fazia build antes do Docker build
- Duplicação desnecessária e possível fonte de erros

**Solução:**
- Removido o step de build manual do frontend
- O Dockerfile já faz o build internamente

### 3. **Logs Verbosos para Debug** ✅

**Melhorias adicionadas:**

#### a) Verificação de Estrutura do Projeto
```yaml
- name: Verify project structure
  run: |
    echo "📁 Verificando estrutura do projeto..."
    ls -la
    # Verifica se Dockerfiles existem
```

#### b) Debug de Tags
```yaml
- name: Debug backend tags
  run: |
    echo "🏷️ Tags do backend:"
    echo "${{ steps.meta-backend.outputs.tags }}"
```

#### c) Logs Detalhados no Deploy SSH
- Informações do ambiente (host, usuário, branch, commit)
- Verificação de diretórios e arquivos
- Status dos containers após deploy
- Logs detalhados em caso de erro

### 4. **Melhor Tratamento de Erros** ✅

**Melhorias:**

#### No Build:
- Verificação de existência de Dockerfiles antes do build
- Build args para melhor cache (`BUILDKIT_INLINE_CACHE=1`)

#### No Deploy SSH:
- `set -euxo pipefail` para parar em qualquer erro
- Verificação de diretório antes de acessar
- Criação automática de diretório se não existir
- Verificação de arquivos docker-compose antes de usar
- Logs detalhados em caso de falha
- Verificação de status dos containers após deploy

### 5. **Push do Frontend Habilitado** ✅

**Antes:** `push: false`  
**Depois:** `push: ${{ github.event_name != 'pull_request' }}`

Agora ambas as imagens são enviadas para o registry.

### 6. **Tag `latest` Adicionada** ✅

Adicionada tag `latest` para ambas as imagens quando na branch padrão:
```yaml
type=raw,value=latest,enable={{is_default_branch}}
```

## 📊 Comparação Antes/Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Metadata | 1 step compartilhado | 2 steps separados |
| Tags | Concatenação manual | Uso direto das tags geradas |
| Build Frontend | Build manual + Docker | Apenas Docker |
| Logs | Mínimos | Verbosos e detalhados |
| Debug | Sem steps de debug | Steps dedicados |
| Tratamento de Erros | Básico | Robusto com verificações |
| Push Frontend | Desabilitado | Habilitado |

## 🚀 Como Usar

### 1. Fazer Commit das Alterações

```bash
git add .github/workflows/deploy.yml
git commit -m "fix: melhorar workflow de deploy com logs verbosos e correções

- Separar metadata para backend e frontend
- Adicionar logs de debug e verificação de estrutura
- Melhorar tratamento de erros no deploy SSH
- Habilitar push da imagem frontend
- Adicionar tag latest para branch padrão"
```

### 2. Fazer Push

```bash
git push origin main
```

### 3. Monitorar o Workflow

1. Acesse: `https://github.com/SEU_USUARIO/SEU_REPO/actions`
2. Abra a run mais recente
3. Expanda o job "Build and Push Docker Images"
4. Verifique cada step:
   - ✅ "Verify project structure" - mostra estrutura do projeto
   - ✅ "Debug backend tags" - mostra tags geradas
   - ✅ "Debug frontend tags" - mostra tags geradas
   - ✅ "Build and push backend image" - build do backend
   - ✅ "Build and push frontend image" - build do frontend

## 🔍 Diagnóstico de Problemas

### Se o Build Falhar

1. **Verifique o step "Verify project structure":**
   - Confirme que `backend/Dockerfile` existe
   - Confirme que `frontend/Dockerfile` existe

2. **Verifique os steps de Debug:**
   - Confirme que as tags estão sendo geradas corretamente
   - Tags devem estar no formato: `ghcr.io/USER/REPO-backend:TAG`

3. **Verifique os logs do build:**
   - Expanda o step "Build and push backend image"
   - Procure por erros específicos (dependências, Dockerfile, etc.)

### Se o Deploy SSH Falhar

1. **Verifique os logs do step "Deploy to server":**
   - Confirme que o diretório existe ou foi criado
   - Confirme que os arquivos docker-compose existem
   - Verifique os logs dos containers em caso de erro

2. **Verifique os Secrets:**
   - `SERVER_HOST` está configurado?
   - `SERVER_USER` está configurado?
   - `SSH_PRIVATE_KEY` está configurado corretamente?

## 📝 Próximos Passos Recomendados

1. **Habilitar Debug Mode (opcional):**
   - Adicione secrets no GitHub:
     - `ACTIONS_STEP_DEBUG = true`
     - `ACTIONS_RUNNER_DEBUG = true`
   - Isso fornecerá logs ainda mais detalhados

2. **Testar Localmente:**
   ```bash
   # Testar build do backend
   docker build -f backend/Dockerfile ./backend
   
   # Testar build do frontend
   docker build -f frontend/Dockerfile ./frontend
   ```

3. **Monitorar Primeiro Deploy:**
   - Após o push, monitore a primeira execução completa
   - Verifique se todas as tags foram criadas corretamente
   - Confirme que as imagens estão no GitHub Container Registry

## ✅ Checklist de Validação

- [ ] Workflow foi atualizado com sucesso
- [ ] Commit das alterações feito
- [ ] Push para `main` realizado
- [ ] Workflow executado com sucesso
- [ ] Imagens Docker criadas e enviadas para registry
- [ ] Deploy SSH executado (se configurado)
- [ ] Health check passou após deploy

## 🎯 Resultado Esperado

Após essas melhorias, o workflow deve:

1. ✅ Gerar tags corretas para ambas as imagens
2. ✅ Fazer build e push de ambas as imagens
3. ✅ Fornecer logs detalhados para diagnóstico
4. ✅ Tratar erros de forma mais robusta
5. ✅ Facilitar o debug de problemas futuros

---

**Última atualização:** $(date)
**Versão do workflow:** Corrigido e melhorado

