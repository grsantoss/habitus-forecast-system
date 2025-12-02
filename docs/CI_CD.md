# Guia CI/CD - GitHub Actions

Este documento descreve a configuração de CI/CD com GitHub Actions.

## Workflows Disponíveis

### 1. CI - Tests and Linting (`ci.yml`)

Executa em:
- Pull Requests para `main`/`master`
- Push para `main`/`master`

Tarefas:
- ✅ Testes do backend (Python)
- ✅ Linting do backend
- ✅ Linting do frontend (ESLint)
- ✅ Verificação de build do frontend
- ✅ Testes de conexão com banco de dados
- ✅ Validação de sintaxe Docker Compose

### 2. Deploy (`deploy.yml`)

Executa em:
- Push para `main`/`master`
- Tags `v*`

Tarefas:
- ✅ Build de imagens Docker
- ✅ Push para GitHub Container Registry
- ✅ Deploy via SSH (VPS)
- ✅ Deploy para Railway (opcional)
- ✅ Deploy para Render (opcional)

### 3. Docker Build (`docker-build.yml`)

Executa em:
- Pull Requests
- Push para `main`/`master`

Tarefas:
- ✅ Build de imagens Docker
- ✅ Teste de containers
- ✅ Validação de docker-compose

### 4. Release (`release.yml`)

Executa em:
- Tags `v*.*.*`

Tarefas:
- ✅ Criação automática de release
- ✅ Geração de changelog

## Configuração de Secrets

Configure os seguintes secrets no GitHub (Settings > Secrets and variables > Actions):

### Para Deploy SSH (VPS)

```
SERVER_HOST=seu-servidor.com
SERVER_USER=usuario
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
SSH_PORT=22 (opcional)
```

### Para Railway

```
RAILWAY_TOKEN=seu-token-do-railway
```

### Para Render

```
RENDER_SERVICE_ID=seu-service-id
RENDER_API_KEY=sua-api-key
```

## Como Usar

### Desenvolvimento Normal

1. Crie uma branch:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. Faça commits e push:
   ```bash
   git add .
   git commit -m "Adiciona nova funcionalidade"
   git push origin feature/nova-funcionalidade
   ```

3. Abra um Pull Request:
   - O workflow `ci.yml` será executado automaticamente
   - Verifique os resultados na aba "Checks"

### Deploy Automático

1. Faça merge na `main`:
   - O workflow `deploy.yml` será executado automaticamente
   - As imagens Docker serão buildadas e publicadas
   - O deploy será executado (se configurado)

### Release

1. Crie uma tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. O workflow `release.yml` criará automaticamente um release no GitHub

## Troubleshooting

### Workflow falha no lint

- Verifique os logs na aba "Actions"
- Corrija os erros de lint localmente antes de fazer push

### Deploy falha

- Verifique se os secrets estão configurados corretamente
- Verifique os logs do workflow
- Teste a conexão SSH manualmente

### Build Docker falha

- Verifique se o Dockerfile está correto
- Teste localmente: `docker build -t test ./backend`

## Personalização

### Adicionar Testes

Edite `.github/workflows/ci.yml`:

```yaml
- name: Run tests
  run: |
    pytest tests/
```

### Adicionar Notificações

Adicione ao final do workflow:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Próximos Passos

- Adicionar testes unitários
- Adicionar testes de integração
- Configurar monitoramento de deploy
- Adicionar rollback automático

