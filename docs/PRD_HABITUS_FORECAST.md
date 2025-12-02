# Product Requirements Document (PRD)
## Habitus Forecast - Sistema de Gestão Financeira

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Status:** Em Produção

---

## 1. Visão Geral do Produto

### 1.1. Descrição do Produto

O **Habitus Forecast** é uma aplicação web completa para gestão financeira empresarial que permite análise e projeção de fluxo de caixa com integração direta a planilhas Habitus Forecast/FDC-REAL. O sistema oferece visualizações interativas, múltiplos cenários de vendas e ferramentas administrativas para tomada de decisão estratégica.

### 1.2. Objetivos do Produto

- **Objetivo Principal:** Facilitar a análise financeira e projeção de fluxo de caixa através de processamento automatizado de planilhas Excel e visualização interativa de dados.

- **Objetivos Secundários:**
  - Reduzir tempo de análise financeira manual
  - Permitir comparação de múltiplos cenários de vendas
  - Fornecer insights visuais através de dashboards interativos
  - Garantir segurança e controle de acesso aos dados financeiros
  - Facilitar gestão de múltiplos projetos e clientes

### 1.3. Público-Alvo

- **Usuários Primários:** Analistas financeiros, gestores financeiros, CFOs
- **Usuários Secundários:** Administradores do sistema, equipes de planejamento financeiro
- **Contexto de Uso:** Empresas que utilizam planilhas Habitus Forecast/FDC-REAL para análise financeira

### 1.4. Proposta de Valor

- Processamento automático de planilhas Excel complexas
- Visualização interativa de dados financeiros
- Comparação de múltiplos cenários em tempo real
- Acesso seguro e controlado aos dados financeiros
- Histórico completo de alterações e auditoria

---

## 2. Requisitos Funcionais

### 2.1. Autenticação e Autorização

#### RF-001: Sistema de Login
- **Prioridade:** Crítica
- **Descrição:** Usuários devem poder fazer login com email e senha
- **Critérios de Aceitação:**
  - Login via POST `/api/auth/login`
  - Retorno de token JWT válido por 24 horas
  - Validação de credenciais
  - Log de tentativas de login (sucesso e falha)
  - Bloqueio de usuários com status diferente de "active"

#### RF-002: Registro de Usuários
- **Prioridade:** Alta
- **Descrição:** Novos usuários podem se registrar no sistema
- **Critérios de Aceitação:**
  - Registro via POST `/api/auth/register`
  - Status inicial: "pending" (aguardando aprovação admin)
  - Validação de email único
  - Hash seguro de senha (bcrypt)
  - Log de registro criado

#### RF-003: Controle de Acesso por Roles
- **Prioridade:** Crítica
- **Descrição:** Sistema deve diferenciar permissões entre admin e usuário comum
- **Roles:**
  - **Admin:** Acesso total ao sistema, gestão de usuários, visualização de todos os projetos
  - **Usuário:** Acesso apenas aos próprios projetos e dados
- **Critérios de Aceitação:**
  - Middleware `@admin_required` para endpoints administrativos
  - Middleware `@token_required` para endpoints protegidos
  - Validação de role em cada requisição

#### RF-004: Gestão de Status de Usuários
- **Prioridade:** Alta
- **Descrição:** Administradores devem poder aprovar/rejeitar usuários
- **Status possíveis:**
  - `pending`: Aguardando aprovação
  - `active`: Usuário ativo
  - `rejected`: Usuário rejeitado
- **Critérios de Aceitação:**
  - Apenas usuários "active" podem fazer login
  - Admin pode alterar status via PUT `/api/admin/usuarios/<id>`
  - Mensagens apropriadas para cada status

---

### 2.2. Gestão de Projetos Financeiros

#### RF-005: CRUD de Projetos
- **Prioridade:** Crítica
- **Descrição:** Usuários devem poder criar, visualizar, editar e deletar projetos financeiros
- **Campos do Projeto:**
  - `nome_cliente`: Nome do cliente (obrigatório)
  - `data_base_estudo`: Data base do estudo (obrigatório)
  - `saldo_inicial_caixa`: Saldo inicial (obrigatório, padrão: 0)
  - `ponto_equilibrio`: Ponto de equilíbrio (opcional)
- **Critérios de Aceitação:**
  - GET `/api/projetos` - Lista projetos do usuário (admin vê todos)
  - POST `/api/projetos` - Cria novo projeto
  - GET `/api/projetos/<id>` - Visualiza projeto específico
  - PUT `/api/projetos/<id>` - Atualiza projeto
  - DELETE `/api/projetos/<id>` - Deleta projeto e dados associados (cascata)

#### RF-006: Associação de Projetos a Usuários
- **Prioridade:** Crítica
- **Descrição:** Cada projeto pertence a um usuário específico
- **Critérios de Aceitação:**
  - Projeto criado automaticamente associado ao usuário autenticado
  - Usuários comuns veem apenas seus projetos
  - Admins podem visualizar todos os projetos
  - Validação de propriedade ao editar/deletar

---

### 2.3. Processamento de Planilhas

#### RF-007: Upload de Planilhas Excel
- **Prioridade:** Crítica
- **Descrição:** Sistema deve processar planilhas Habitus Forecast/FDC-REAL
- **Formatos Aceitos:**
  - `.xlsx` (Excel 2007+)
  - `.xls` (Excel 97-2003)
- **Limitações:**
  - Tamanho máximo: 16MB
  - Validação de extensão
  - Validação de estrutura da planilha
- **Critérios de Aceitação:**
  - POST `/api/upload-planilha` - Upload e processamento
  - POST `/api/validar-planilha` - Validação sem processar
  - Criação automática de projeto ao processar
  - Extração de dados conforme especificação técnica

#### RF-008: Extração de Dados de Planilhas
- **Prioridade:** Crítica
- **Descrição:** Sistema deve extrair dados de locais específicos da planilha
- **Especificação Técnica:**
  - **Habitus Forecast (linha verde):**
    - Linha: 56
    - Colunas: 3 a 14 (12 meses)
    - Cor: Verde
  - **FDC-REAL (linha preta):**
    - Linha: 63
    - Colunas: 3 a 14 (12 meses)
    - Cor: Preto
- **Critérios de Aceitação:**
  - Extração precisa dos valores das células especificadas
  - Alinhamento mês a mês (12 meses a partir da data base)
  - Criação automática de cenários baseados nos dados
  - Tratamento de erros de leitura

#### RF-009: Histórico de Uploads
- **Prioridade:** Média
- **Descrição:** Sistema deve manter histórico de arquivos processados
- **Critérios de Aceitação:**
  - GET `/api/uploads/history` - Lista histórico do usuário
  - GET `/api/uploads/<id>/download` - Download do arquivo original
  - DELETE `/api/uploads/<id>` - Deleta upload e dados associados (cascata)
  - PUT `/api/uploads/<id>/rename` - Renomeia arquivo

#### RF-010: Regra de Último Upload
- **Prioridade:** Alta
- **Descrição:** Sistema sempre exibe dados do arquivo mais recente
- **Critérios de Aceitação:**
  - Dashboard sempre usa último projeto criado
  - Último upload = último projeto do usuário
  - Ordenação por data de criação (mais recente primeiro)

---

### 2.4. Gestão de Cenários

#### RF-011: Criação de Cenários
- **Prioridade:** Crítica
- **Descrição:** Sistema deve permitir criação de múltiplos cenários por projeto
- **Tipos de Cenários:**
  - Pessimista
  - Realista (base)
  - Otimista
  - Agressivo
- **Critérios de Aceitação:**
  - POST `/api/projetos/<id>/cenarios` - Cria cenário
  - Cenários criados automaticamente ao processar planilha
  - Validação de nomes de cenários
  - Um cenário pode ser marcado como ativo

#### RF-012: Configuração de Percentuais de Cenários
- **Prioridade:** Alta
- **Descrição:** Usuários devem poder configurar percentuais de variação para cada cenário
- **Validações:**
  - Pessimista: ≤ 0 (variação abaixo do Realista)
  - Realista: sempre 0 (ponto zero/base)
  - Otimista: ≥ 0 (variação acima do Realista)
  - Agressivo: ≥ 0 (variação acima do Realista)
  - Todos entre -100 e 100
- **Critérios de Aceitação:**
  - GET `/api/settings/cenarios` - Obtém configurações
  - POST `/api/settings/cenarios` - Salva configurações
  - Percentuais aplicados à linha verde (Habitus Forecast)
  - Configurações por usuário (admin pode configurar para outros)

#### RF-013: Análise de Cenários
- **Prioridade:** Alta
- **Descrição:** Sistema deve fornecer análise detalhada de cada cenário
- **Critérios de Aceitação:**
  - GET `/api/cenarios/<id>/analise` - Retorna análise completa
  - Cálculo de receita total, despesa total, saldo final
  - Cálculo de margem de lucro
  - Comparação entre cenários

#### RF-014: Comparação de Cenários
- **Prioridade:** Alta
- **Descrição:** Sistema deve permitir comparar múltiplos cenários
- **Critérios de Aceitação:**
  - POST `/api/cenarios/comparar` - Compara cenários selecionados
  - Retorno de dados comparativos
  - Visualização lado a lado

#### RF-015: Histórico e Snapshots
- **Prioridade:** Média
- **Descrição:** Sistema deve manter histórico de versões de cenários
- **Critérios de Aceitação:**
  - POST `/api/cenarios/<id>/snapshot` - Cria snapshot
  - GET `/api/cenarios/<id>/historico` - Lista histórico
  - POST `/api/cenarios/<id>/restaurar/<historico_id>` - Restaura versão

---

### 2.5. Gestão de Lançamentos Financeiros

#### RF-016: CRUD de Lançamentos
- **Prioridade:** Crítica
- **Descrição:** Sistema deve permitir gerenciar lançamentos financeiros por cenário
- **Campos do Lançamento:**
  - `categoria_id`: ID da categoria financeira (obrigatório)
  - `data_competencia`: Data de competência (obrigatório)
  - `valor`: Valor do lançamento (obrigatório)
  - `tipo`: ENTRADA ou SAIDA (obrigatório)
  - `origem`: PROJETADO ou REALIZADO (padrão: PROJETADO)
- **Critérios de Aceitação:**
  - GET `/api/cenarios/<id>/lancamentos` - Lista lançamentos
  - POST `/api/cenarios/<id>/lancamentos` - Cria lançamento
  - PUT `/api/cenarios/<id>/lancamentos/<lancamento_id>` - Atualiza
  - DELETE `/api/cenarios/<id>/lancamentos/<lancamento_id>` - Deleta

#### RF-017: Categorias Financeiras
- **Prioridade:** Alta
- **Descrição:** Sistema deve ter categorias pré-definidas para classificação
- **Categorias Padrão:**
  - FATURAMENTO
  - ENTRADAS OPERACIONAIS
  - MARGEM CONTRIBUIÇÃO
  - GASTOS FIXOS
  - FDC OPERACIONAL
  - IMPOSTOS
  - COMISSÕES
  - CUSTOS SERVIÇOS
  - DESPESAS PESSOAL
  - DESPESAS ADMINISTRATIVAS
  - DESPESAS FINANCEIRAS
  - INVESTIMENTOS
  - FINANCIAMENTOS
- **Tipos de Fluxo:**
  - OPERACIONAL
  - INVESTIMENTO
  - FINANCIAMENTO
- **Critérios de Aceitação:**
  - GET `/api/categorias` - Lista todas as categorias
  - Categorias criadas automaticamente no seed
  - Categorias imutáveis (não podem ser editadas/deletadas)

---

### 2.6. Dashboard Financeiro

#### RF-018: Dashboard Principal
- **Prioridade:** Crítica
- **Descrição:** Sistema deve exibir dashboard com métricas e visualizações
- **Componentes:**
  - Cards de métricas (total projetos, cenários, lançamentos, receita, despesa, saldo)
  - Gráfico de fluxo de caixa (Habitus Forecast vs FDC-REAL)
  - Gráfico de categorias
  - Tabela de projeção financeira
- **Critérios de Aceitação:**
  - GET `/api/dashboard/stats` - Retorna métricas gerais
  - Dados sempre do último projeto do usuário
  - Admin pode visualizar dados de outros usuários (parâmetro `usuario_id`)

#### RF-019: Gráfico Habitus Forecast vs FDC-REAL
- **Prioridade:** Crítica
- **Descrição:** Gráfico comparativo de 12 meses
- **Especificações:**
  - Período: 12 meses a partir da data base do projeto
  - Linha verde: Habitus Forecast (valores projetados)
  - Linha preta: FDC-REAL (valores realizados)
  - Mensagem quando não há dados: "Nenhum dado disponível"
- **Critérios de Aceitação:**
  - GET `/api/dashboard/fluxo-caixa/<projeto_id>` - Retorna dados do gráfico
  - Parâmetro `cenario` para filtrar por cenário (padrão: "Realista")
  - Retorno em formato JSON para gráfico de linha

#### RF-020: Saldo Inicial de Caixa
- **Prioridade:** Alta
- **Descrição:** Sistema deve permitir configurar saldo inicial de caixa
- **Validações:**
  - Valor entre 0 e 1.000.000 (R$ 1 milhão)
  - Formato BRL (pt-BR) na interface
  - Valor somado a cada mês da linha verde
- **Critérios de Aceitação:**
  - GET `/api/dashboard/saldo-inicial` - Obtém saldo atual
  - POST `/api/dashboard/saldo-inicial` - Atualiza saldo
  - Valor persistido no projeto
  - Validação de limites

#### RF-021: Gráfico de Categorias
- **Prioridade:** Média
- **Descrição:** Visualização da distribuição de categorias financeiras
- **Critérios de Aceitação:**
  - GET `/api/dashboard/categorias/<projeto_id>` - Retorna dados
  - Agrupamento por categoria
  - Cores diferenciadas por tipo de fluxo

#### RF-022: Ponto de Equilíbrio
- **Prioridade:** Média
- **Descrição:** Sistema deve calcular e permitir configurar ponto de equilíbrio
- **Critérios de Aceitação:**
  - POST `/api/dashboard/ponto-equilibrio` - Atualiza ponto de equilíbrio
  - Valor persistido no projeto
  - Exibição no dashboard

---

### 2.7. Relatórios

#### RF-023: Relatório PDF de Cenário
- **Prioridade:** Média
- **Descrição:** Sistema deve gerar relatório PDF de um cenário específico
- **Critérios de Aceitação:**
  - GET `/api/cenarios/<id>/relatorio/pdf` - Gera PDF
  - Inclui dados do cenário, gráficos, tabelas
  - Download direto do arquivo PDF

#### RF-024: Relatório Excel de Cenário
- **Prioridade:** Média
- **Descrição:** Sistema deve gerar relatório Excel de um cenário
- **Critérios de Aceitação:**
  - GET `/api/cenarios/<id>/relatorio/excel` - Gera Excel
  - Formato compatível com Excel
  - Download direto do arquivo

#### RF-025: Relatório Comparativo
- **Prioridade:** Média
- **Descrição:** Sistema deve gerar relatório comparando múltiplos cenários
- **Critérios de Aceitação:**
  - POST `/api/cenarios/relatorio-comparativo/pdf` - PDF comparativo
  - POST `/api/cenarios/relatorio-comparativo/excel` - Excel comparativo
  - Seleção de cenários no request body

---

### 2.8. Painel Administrativo

#### RF-026: Gestão de Usuários
- **Prioridade:** Alta
- **Descrição:** Administradores devem poder gerenciar todos os usuários
- **Critérios de Aceitação:**
  - GET `/api/admin/usuarios` - Lista todos (paginado, busca)
  - POST `/api/admin/usuarios` - Cria usuário
  - PUT `/api/admin/usuarios/<id>` - Atualiza usuário
  - DELETE `/api/admin/usuarios/<id>` - Deleta usuário
  - Apenas admins têm acesso

#### RF-027: Logs do Sistema
- **Prioridade:** Média
- **Descrição:** Sistema deve registrar e exibir logs de ações
- **Ações Registradas:**
  - LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_BLOCKED_STATUS
  - USER_REGISTERED
  - LOGOUT
  - Criação/edição/exclusão de projetos, cenários, lançamentos
- **Critérios de Aceitação:**
  - GET `/api/admin/logs` - Lista logs (paginado, filtros)
  - Filtros por ação, usuário, data
  - Apenas admins têm acesso

#### RF-028: Estatísticas Administrativas
- **Prioridade:** Média
- **Descrição:** Sistema deve fornecer estatísticas agregadas
- **Critérios de Aceitação:**
  - GET `/api/admin/estatisticas` - Retorna estatísticas
  - Total de usuários, projetos, cenários
  - Usuários ativos, pendentes, rejeitados
  - Apenas admins têm acesso

#### RF-029: Visualização de Todos os Projetos
- **Prioridade:** Média
- **Descrição:** Administradores devem ver todos os projetos do sistema
- **Critérios de Aceitação:**
  - GET `/api/admin/projetos` - Lista todos (paginado, busca)
  - Filtros por usuário, cliente, data
  - Apenas admins têm acesso

---

### 2.9. Configurações do Usuário

#### RF-030: Perfil do Usuário
- **Prioridade:** Média
- **Descrição:** Usuários devem poder visualizar e editar seu perfil
- **Campos Editáveis:**
  - Nome
  - Email
  - Telefone
  - Empresa
  - CNPJ
  - Cargo
- **Critérios de Aceitação:**
  - GET `/api/settings/profile` - Obtém perfil
  - PUT `/api/settings/profile` - Atualiza perfil
  - Validação de email único

#### RF-031: Alteração de Senha
- **Prioridade:** Alta
- **Descrição:** Usuários devem poder alterar sua senha
- **Critérios de Aceitação:**
  - PUT `/api/settings/password` - Altera senha
  - Requer senha atual para validação
  - Nova senha e confirmação devem ser iguais
  - Hash seguro da nova senha

---

## 3. Requisitos Não-Funcionais

### 3.1. Performance

#### RNF-001: Tempo de Resposta
- **Descrição:** API deve responder em menos de 2 segundos para 95% das requisições
- **Métricas:**
  - Endpoints simples: < 500ms
  - Endpoints com processamento: < 2s
  - Upload de planilhas: < 10s (dependendo do tamanho)

#### RNF-002: Processamento de Planilhas
- **Descrição:** Sistema deve processar planilhas de até 16MB em tempo razoável
- **Critérios:** Processamento completo em menos de 30 segundos

#### RNF-003: Escalabilidade
- **Descrição:** Sistema deve suportar múltiplos usuários simultâneos
- **Critérios:** Suporte a pelo menos 50 usuários simultâneos

### 3.2. Segurança

#### RNF-004: Autenticação Segura
- **Descrição:** Sistema deve usar autenticação JWT segura
- **Critérios:**
  - Tokens expiram em 24 horas
  - Senhas armazenadas com hash bcrypt
  - Validação de token em cada requisição protegida

#### RNF-005: Controle de Acesso
- **Descrição:** Sistema deve implementar controle de acesso baseado em roles
- **Critérios:**
  - Middleware de autenticação em todos os endpoints protegidos
  - Validação de permissões (admin vs usuário)
  - Isolamento de dados entre usuários

#### RNF-006: Validação de Uploads
- **Descrição:** Sistema deve validar arquivos enviados
- **Critérios:**
  - Validação de extensão (.xlsx, .xls)
  - Validação de tamanho (máximo 16MB)
  - Validação de estrutura da planilha
  - Sanitização de nomes de arquivo

#### RNF-007: Headers de Segurança
- **Descrição:** Sistema deve incluir headers de segurança HTTP
- **Critérios:**
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security (em produção com HTTPS)
  - Content-Security-Policy

#### RNF-008: Rate Limiting
- **Descrição:** Sistema deve implementar rate limiting
- **Critérios:**
  - Limite padrão: 200 requisições por dia, 50 por hora
  - Configurável por endpoint
  - Mensagens de erro apropriadas

### 3.3. Confiabilidade

#### RNF-009: Disponibilidade
- **Descrição:** Sistema deve estar disponível 99% do tempo
- **Critérios:** Uptime mínimo de 99% (máximo 7.2 horas de downtime por mês)

#### RNF-010: Backup e Recuperação
- **Descrição:** Sistema deve ter backups automáticos
- **Critérios:**
  - Backup diário do banco de dados
  - Retenção de 7 backups
  - Scripts de restore disponíveis

#### RNF-011: Tratamento de Erros
- **Descrição:** Sistema deve tratar erros adequadamente
- **Critérios:**
  - Mensagens de erro claras e úteis
  - Logs de erros estruturados
  - Não expor informações sensíveis em erros

### 3.4. Usabilidade

#### RNF-012: Interface Responsiva
- **Descrição:** Interface deve funcionar em diferentes tamanhos de tela
- **Critérios:**
  - Responsivo para desktop, tablet e mobile
  - Layout adaptável

#### RNF-013: Feedback Visual
- **Descrição:** Sistema deve fornecer feedback visual para ações do usuário
- **Critérios:**
  - Mensagens de sucesso/erro
  - Indicadores de carregamento
  - Confirmações para ações destrutivas

#### RNF-014: Acessibilidade
- **Descrição:** Interface deve ser acessível
- **Critérios:**
  - Contraste adequado de cores
  - Navegação por teclado
  - Labels descritivos

### 3.5. Manutenibilidade

#### RNF-015: Documentação
- **Descrição:** Sistema deve ter documentação completa
- **Critérios:**
  - Documentação da API (Swagger/OpenAPI)
  - Documentação de código
  - Guias de deploy e configuração

#### RNF-016: Logging
- **Descrição:** Sistema deve ter logging estruturado
- **Critérios:**
  - Logs em formato JSON
  - Níveis de log configuráveis
  - Logs de requisições e erros

#### RNF-017: Testes
- **Descrição:** Sistema deve ter cobertura de testes
- **Critérios:**
  - Testes unitários para lógica de negócio
  - Testes de integração para APIs
  - Cobertura mínima de 70%

---

## 4. Arquitetura e Tecnologias

### 4.1. Stack Tecnológico

#### Backend
- **Framework:** Flask 3.1.1
- **Linguagem:** Python 3.11+
- **ORM:** SQLAlchemy 2.0.41
- **Banco de Dados:**
  - Desenvolvimento: SQLite
  - Produção: PostgreSQL 15+
- **Autenticação:** JWT (python-jose)
- **Processamento de Planilhas:** Pandas, OpenPyXL
- **Servidor WSGI:** Gunicorn
- **Documentação API:** Flask-RESTX (Swagger)

#### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Roteamento:** React Router
- **Estado:** Context API + Hooks
- **UI Library:** shadcn/ui + Tailwind CSS
- **HTTP Client:** Axios
- **Package Manager:** pnpm

#### Infraestrutura
- **Containerização:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Deploy:** SSH/VPS com Nginx
- **SSL:** Let's Encrypt
- **Monitoramento:** Logs estruturados (preparado para Sentry)

### 4.2. Arquitetura de Dados

#### Modelo de Dados Principal

```
usuarios
├── projetos (1:N)
│   ├── cenarios (1:N)
│   │   └── lancamentos_financeiros (1:N)
│   └── arquivos_upload (1:N)
├── logs_sistema (1:N)
└── configuracao_cenarios (1:1)
```

#### Tabelas Principais

1. **usuarios**
   - id, nome, email, senha_hash, role, status
   - telefone, empresa, cnpj, cargo
   - created_at, updated_at

2. **projetos**
   - id, usuario_id, nome_cliente
   - data_base_estudo, saldo_inicial_caixa
   - ponto_equilibrio, geracao_fdc_livre, percentual_custo_fixo
   - created_at, updated_at

3. **cenarios**
   - id, projeto_id, nome, descricao
   - is_active, created_at

4. **lancamentos_financeiros**
   - id, cenario_id, categoria_id
   - data_competencia, valor, tipo, origem

5. **categorias_financeiras**
   - id, nome, tipo_fluxo

6. **arquivos_upload**
   - id, projeto_id, usuario_id
   - nome_arquivo, caminho_arquivo, data_upload

7. **logs_sistema**
   - id, usuario_id, acao, detalhes, created_at

8. **configuracao_cenarios**
   - id, usuario_id
   - pessimista, realista, otimista, agressivo

---

## 5. Regras de Negócio

### 5.1. Regras de Projetos

- **RN-001:** Cada projeto pertence a um único usuário
- **RN-002:** Um novo projeto é criado automaticamente para cada upload de planilha
- **RN-003:** O último projeto criado é considerado o projeto atual do usuário
- **RN-004:** Ao deletar um projeto, todos os cenários e lançamentos associados são deletados (cascata)
- **RN-005:** Saldo inicial de caixa deve estar entre 0 e R$ 1.000.000,00

### 5.2. Regras de Cenários

- **RN-006:** Cada projeto pode ter múltiplos cenários
- **RN-007:** Cenários são criados automaticamente ao processar planilha:
  - Habitus Forecast (linha verde)
  - FDC-REAL (linha preta)
- **RN-008:** Percentuais de cenários são aplicados à linha verde (Habitus Forecast)
- **RN-009:** Realista sempre tem percentual 0 (ponto zero/base)
- **RN-010:** Pessimista deve ser ≤ 0 (variação abaixo do Realista)
- **RN-011:** Otimista e Agressivo devem ser ≥ 0 (variação acima do Realista)
- **RN-012:** Percentuais devem estar entre -100 e 100

### 5.3. Regras de Upload

- **RN-013:** Apenas arquivos .xlsx e .xls são aceitos
- **RN-014:** Tamanho máximo de arquivo: 16MB
- **RN-015:** Planilha deve ter estrutura válida (linhas 56 e 63, colunas 3-14)
- **RN-016:** Ao deletar um upload, projeto, cenários e lançamentos associados são deletados (cascata)
- **RN-017:** Sistema sempre exibe dados do último arquivo enviado

### 5.4. Regras de Autenticação

- **RN-018:** Tokens JWT expiram em 24 horas
- **RN-019:** Apenas usuários com status "active" podem fazer login
- **RN-020:** Novos usuários começam com status "pending"
- **RN-021:** Administradores devem aprovar usuários antes do primeiro login
- **RN-022:** Senhas são armazenadas com hash bcrypt

### 5.5. Regras de Acesso

- **RN-023:** Usuários comuns veem apenas seus próprios projetos
- **RN-024:** Administradores veem todos os projetos
- **RN-025:** Administradores podem gerenciar todos os usuários
- **RN-026:** Endpoints administrativos requerem role "admin"

---

## 6. Casos de Uso Principais

### UC-001: Login no Sistema
**Ator:** Usuário  
**Pré-condições:** Usuário possui conta criada e aprovada  
**Fluxo Principal:**
1. Usuário acessa página de login
2. Informa email e senha
3. Sistema valida credenciais
4. Sistema retorna token JWT
5. Usuário é redirecionado para dashboard

**Fluxos Alternativos:**
- 3a. Credenciais inválidas → Mensagem de erro
- 3b. Usuário pendente → Mensagem de aprovação necessária
- 3c. Usuário rejeitado → Mensagem de rejeição

### UC-002: Upload e Processamento de Planilha
**Ator:** Usuário Autenticado  
**Pré-condições:** Usuário está logado, possui planilha válida  
**Fluxo Principal:**
1. Usuário acessa página de upload
2. Seleciona arquivo Excel (.xlsx ou .xls)
3. Sistema valida arquivo (extensão, tamanho)
4. Sistema processa planilha (extrai dados linhas 56 e 63)
5. Sistema cria projeto automaticamente
6. Sistema cria cenários baseados nos dados
7. Sistema cria lançamentos financeiros
8. Usuário é redirecionado para dashboard com dados atualizados

**Fluxos Alternativos:**
- 3a. Arquivo inválido → Mensagem de erro
- 4a. Estrutura inválida → Mensagem de erro específica

### UC-003: Visualização de Dashboard
**Ator:** Usuário Autenticado  
**Pré-condições:** Usuário está logado, possui pelo menos um projeto  
**Fluxo Principal:**
1. Usuário acessa dashboard
2. Sistema carrega dados do último projeto
3. Sistema exibe métricas (cards)
4. Sistema exibe gráfico Habitus Forecast vs FDC-REAL
5. Sistema exibe gráfico de categorias
6. Sistema exibe tabela de projeção financeira

**Fluxos Alternativos:**
- 2a. Sem projetos → Mensagem "Nenhum dado disponível"

### UC-004: Configuração de Cenários
**Ator:** Usuário Autenticado  
**Pré-condições:** Usuário está logado  
**Fluxo Principal:**
1. Usuário acessa Settings > Cenários
2. Sistema exibe percentuais atuais
3. Usuário ajusta percentuais
4. Sistema valida valores
5. Sistema salva configurações
6. Percentuais são aplicados aos gráficos

**Fluxos Alternativos:**
- 4a. Valores inválidos → Mensagem de erro de validação

### UC-005: Gestão de Usuários (Admin)
**Ator:** Administrador  
**Pré-condições:** Usuário está logado como admin  
**Fluxo Principal:**
1. Admin acessa Painel Admin > Usuários
2. Sistema lista todos os usuários
3. Admin pode filtrar/buscar usuários
4. Admin pode aprovar/rejeitar usuários pendentes
5. Admin pode editar informações de usuários
6. Admin pode deletar usuários

---

## 7. Interface do Usuário

### 7.1. Páginas Principais

1. **Login/Registro**
   - Formulário de login
   - Link para registro
   - Mensagens de erro/sucesso

2. **Dashboard**
   - Cards de métricas
   - Gráfico de fluxo de caixa (12 meses)
   - Gráfico de categorias
   - Tabela de projeção financeira
   - Campo de saldo inicial de caixa

3. **Upload**
   - Área de drag-and-drop
   - Botão de seleção de arquivo
   - Histórico de uploads
   - Validação visual

4. **Projetos**
   - Lista de projetos
   - Formulário de criação/edição
   - Detalhes do projeto

5. **Cenários**
   - Lista de cenários por projeto
   - Visualização de análise
   - Comparação de cenários
   - Geração de relatórios

6. **Settings**
   - Configuração de cenários
   - Perfil do usuário
   - Alteração de senha

7. **Admin Panel** (apenas admins)
   - Gestão de usuários
   - Logs do sistema
   - Estatísticas

### 7.2. Componentes de UI

- Design System: shadcn/ui
- Estilização: Tailwind CSS
- Componentes principais:
  - Cards, Tabelas, Gráficos (Chart.js/Recharts)
  - Formulários, Modais, Dropdowns
  - Navegação, Layout responsivo

---

## 8. Integrações

### 8.1. Processamento de Planilhas Excel
- **Biblioteca:** Pandas + OpenPyXL
- **Formato:** Excel (.xlsx, .xls)
- **Especificação:** Extração de células específicas (linhas 56 e 63, colunas 3-14)

### 8.2. Geração de Relatórios
- **PDF:** ReportLab
- **Excel:** OpenPyXL
- **Formato:** Relatórios padronizados com gráficos e tabelas

### 8.3. Autenticação
- **Método:** JWT (JSON Web Tokens)
- **Biblioteca:** python-jose
- **Expiração:** 24 horas

---

## 9. Métricas e KPIs

### 9.1. Métricas de Negócio
- Total de projetos criados
- Total de planilhas processadas
- Total de usuários ativos
- Taxa de sucesso de uploads
- Tempo médio de processamento

### 9.2. Métricas Técnicas
- Tempo de resposta da API
- Taxa de erro (5xx)
- Disponibilidade do sistema
- Uso de recursos (CPU, memória)
- Tamanho do banco de dados

---

## 10. Roadmap e Melhorias Futuras

### 10.1. Fase Atual (v1.0)
- ✅ Sistema de autenticação
- ✅ Gestão de projetos e cenários
- ✅ Processamento de planilhas
- ✅ Dashboard interativo
- ✅ Painel administrativo
- ✅ Deploy em produção

### 10.2. Melhorias Planejadas

#### Curto Prazo
- [ ] Notificações por email
- [ ] Exportação de dados em CSV
- [ ] Filtros avançados no dashboard
- [ ] Histórico de alterações mais detalhado

#### Médio Prazo
- [ ] API pública para integrações
- [ ] Aplicativo mobile
- [ ] Integração com sistemas contábeis
- [ ] Análise preditiva com IA

#### Longo Prazo
- [ ] Multi-tenancy (múltiplas empresas)
- [ ] Colaboração em tempo real
- [ ] Integração com bancos
- [ ] Marketplace de templates

---

## 11. Glossário

- **Habitus Forecast:** Linha verde da planilha (valores projetados)
- **FDC-REAL:** Linha preta da planilha (valores realizados)
- **Cenário:** Projeção financeira baseada em percentuais de variação
- **Lançamento Financeiro:** Entrada ou saída financeira em uma data específica
- **Data Base:** Data inicial do estudo financeiro
- **Saldo Inicial de Caixa:** Valor inicial somado a cada mês da projeção
- **Ponto de Equilíbrio:** Valor mínimo necessário para cobrir custos

---

## 12. Aprovações

**Documento criado por:** Equipe de Desenvolvimento  
**Revisado por:** [Nome do Revisor]  
**Aprovado por:** [Nome do Aprovador]  
**Data de Aprovação:** [Data]

---

**Versão do Documento:** 1.0  
**Última Atualização:** Janeiro 2025

