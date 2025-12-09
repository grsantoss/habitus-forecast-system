# Migração: Tabela de Relatórios

Este documento descreve a migração do banco de dados para adicionar suporte ao histórico de relatórios.

## Arquivo de Migração

- **Arquivo**: `backend/migrations/versions/ac814967bae3_add_relatorios_table.py`
- **Descrição**: Cria a tabela `relatorios` para armazenar histórico de relatórios gerados

## Estrutura da Tabela

A tabela `relatorios` contém os seguintes campos:

- `id`: ID único do relatório
- `usuario_id`: ID do usuário que criou o relatório (FK para `usuarios`)
- `title`: Título do relatório
- `type`: Tipo do relatório ('pdf' ou 'excel')
- `template`: Template usado ('executive', 'detailed' ou 'comparison')
- `scenario`: Nome do(s) cenário(s)
- `scenario_id`: ID do cenário (FK para `cenarios`, null para comparativos)
- `scenario_ids`: Array de IDs de cenários (para relatórios comparativos)
- `size`: Tamanho do arquivo em MB
- `pages`: Número de páginas (null para Excel)
- `sheets`: Número de planilhas (null para PDF)
- `downloads`: Contador de downloads
- `status`: Status do relatório ('completed' ou 'scheduled')
- `periodo`: Período do relatório ('todos', 'mensal', 'trimestral', 'anual')
- `descricao`: Descrição opcional
- `created_at`: Data de criação
- `updated_at`: Data de atualização

## Como Executar a Migração

### Windows (PowerShell)

```powershell
cd backend
.\scripts\run_migration.ps1
```

Ou manualmente:

```powershell
cd backend
python -m alembic -c migrations/alembic.ini upgrade head
```

### Linux/Mac

```bash
cd backend
./scripts/run_migration.sh
```

Ou manualmente:

```bash
cd backend
python -m alembic -c migrations/alembic.ini upgrade head
```

## Verificar Status da Migração

Para verificar quais migrações foram aplicadas:

```bash
python -m alembic -c migrations/alembic.ini current
```

Para ver histórico de migrações:

```bash
python -m alembic -c migrations/alembic.ini history
```

## Reverter Migração (se necessário)

Para reverter a última migração:

```bash
python -m alembic -c migrations/alembic.ini downgrade -1
```

## Compatibilidade

A migração é compatível com:
- **SQLite**: Usa String com constraints CHECK para simular ENUMs
- **PostgreSQL**: Usa tipos ENUM nativos

## Notas Importantes

1. **Backup**: Sempre faça backup do banco de dados antes de executar migrações em produção
2. **Dados existentes**: A migração não afeta dados existentes, apenas cria a nova tabela
3. **Migração automática**: O frontend migra automaticamente dados do localStorage para o backend na primeira execução

## Troubleshooting

### Erro: "Table 'relatorios' already exists"

Se a tabela já existe, você pode:
1. Verificar se a migração já foi aplicada: `python -m alembic -c migrations/alembic.ini current`
2. Se necessário, marcar a migração como aplicada: `python -m alembic -c migrations/alembic.ini stamp head`

### Erro: "No such table: usuarios" ou "No such table: cenarios"

Certifique-se de que as tabelas base (`usuarios` e `cenarios`) existem antes de executar esta migração.

### Erro de permissões

Certifique-se de que o usuário do banco de dados tem permissões para criar tabelas e tipos ENUM (PostgreSQL).

