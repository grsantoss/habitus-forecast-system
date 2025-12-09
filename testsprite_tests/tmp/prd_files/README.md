# Habitus Foreca$t

Sistema de gestão financeira para análise e projeção de fluxo de caixa empresarial com integração direta a planilhas Habitus Foreca$t/FDC-REAL, cenários de vendas e visualizações interativas.

## 📋 Sobre o Projeto

O **Habitus Foreca$t** é uma aplicação web completa para gestão financeira que permite:

- 📊 **Dashboard Interativo**: Visualização de dados financeiros em tempo real
- 📈 **Análise de Cenários**: Comparação entre projeções otimistas, realistas e pessimistas  
- 📤 **Upload de Planilhas**: Processamento automático de planilhas Habitus Foreca$t
- 👥 **Gestão de Usuários**: Sistema completo de autenticação e autorização
- 🔧 **Painel Admin**: Ferramentas administrativas e logs do sistema

## 🏗️ Arquitetura

### Backend (Flask)
- Framework: Flask + SQLAlchemy
- Banco de Dados: SQLite (dev)
- Autenticação: JWT (JSON Web Tokens)
- APIs: RESTful

### Frontend (React)
- Framework: React 18 + Vite
- Roteamento: React Router
- Estado: Context API + Hooks
- UI: shadcn/ui + Tailwind CSS
- HTTP: Axios

## 🚀 Como Executar

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- pnpm ou npm

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install -r requirements.txt
python init_simple.py  # Inicializar banco de dados
python src/main.py
```

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev
```

> Dica (Windows): caso use PowerShell, ative o ambiente virtual com `venv\Scripts\Activate.ps1`.

## 🔑 Credenciais Padrão

- **Email**: admin@habitus.com
- **Senha**: admin123

## 📁 Estrutura do Projeto

```
habitus-forecast/
├── backend/                 # API Flask
│   ├── src/
│   │   ├── models/         # Modelos do banco de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Lógica de negócio
│   │   └── main.py         # Aplicação principal
│   ├── init_simple.py      # Script de inicialização
│   └── requirements.txt    # Dependências Python
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Hooks customizados
│   │   ├── lib/           # Utilitários
│   │   └── App.jsx        # Componente principal
│   └── package.json       # Dependências Node.js
└── README.md              # Este arquivo
```

## 🛠️ Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- Login/logout com JWT
- Controle de acesso por roles (admin/user)
- Middleware de autenticação

### ✅ Gestão de Projetos
- CRUD completo de projetos financeiros
- Múltiplos cenários por projeto
- Histórico de alterações

### ✅ Processamento de Planilhas
- Upload de arquivos Excel
- Extração dirigida por matriz fixa
  - Habitus Foreca$t: linha 56, colunas 3 a 14 (verde)
  - FDC-REAL: linha 63, colunas 3 a 14 (preto)
- Alinhamento mês a mês (12 meses à frente a partir do mês base)
- Sempre exibe os dados do arquivo mais recente enviado
- Exclusão em cascata: ao excluir um upload, remove cenários e lançamentos associados

### ✅ Dashboard Financeiro
- Bloco "Habitus Foreca$t vs FDC-Real" (linha verde x linha preta)
  - Apenas 12 meses, iniciando no mês selecionado em “Data-base”
  - Vazio quando não há planilhas (mensagem “Nenhum dado disponível”)
  - Usa sempre o último arquivo enviado
- Cenários de Vendas (Pessimista, Realista, Otimista, Agressivo)
  - Percentuais configurados em Settings e aplicados à linha verde
- Saldo Inicial Caixa (total)
  - Máscara BRL (pt-BR)
  - Limite: R$ 1.000.000,00
  - Valor é somado a cada mês da linha verde (Habitus Foreca$t) e persistido no projeto
- Métricas (cards) e tabela “Projeção Financeira”
  - Não exibem dados mock quando não há planilhas

### ✅ Painel Administrativo
- Gestão de usuários
- Logs do sistema
- Estatísticas de uso

## 🗄️ Banco de Dados

### Principais Tabelas
- **usuarios**: Gestão de usuários e autenticação
- **projetos**: Projetos financeiros dos clientes
- **cenarios**: Diferentes projeções por projeto
- **categorias_financeiras**: Classificação das linhas financeiras
- **lancamentos_financeiros**: Dados mensais detalhados
- **arquivos_upload**: Histórico de uploads
- **logs_sistema**: Auditoria e monitoramento

### Regras importantes
- Um novo Projeto é criado para cada arquivo enviado (último projeto = último upload)
- `HABITUS_FORECA$T-GRAFICO` representa os valores da aba Habitus Foreca$t (linha 56)
- `FDC-REAL` representa os valores reais (linha 63)
- `saldo_inicial_caixa` pertence ao Projeto e é aplicado na linha verde

## 🔗 Endpoints Relevantes

Base: `/api`

- `POST /upload` — upload de planilha
- `GET /dashboard/fluxo-caixa/<projeto_id>` — dados do gráfico (12 meses)
- `GET /dashboard/categorias/<projeto_id>` — distribuição de custos
- `GET /dashboard/stats` — métricas gerais
- `GET /dashboard/saldo-inicial` — obtém `saldo_inicial_caixa` do projeto corrente do usuário
- `POST /dashboard/saldo-inicial` — atualiza `saldo_inicial_caixa` (valida 0 ≤ valor ≤ 1_000_000)

Payload de atualização de saldo:
```json
{ "saldo_inicial": 50000 }
```

## 🔧 Tecnologias Utilizadas

### Backend
- Flask, SQLAlchemy, Flask-CORS, PyJWT
- Pandas / OpenPyXL (planilhas)

### Frontend
- React 18, Vite, Axios, React Router, Tailwind, shadcn/ui

## 📝 Licença

Este projeto foi desenvolvido como solução personalizada para gestão financeira empresarial.

## 👥 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub.

---

**Desenvolvido com ❤️ para gestão financeira inteligente**
