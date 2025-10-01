# Habitus Foreca$t

Sistema de gestão financeira inteligente para análise e projeção de fluxo de caixa empresarial.

## 📋 Sobre o Projeto

O **Habitus Foreca$t** é uma aplicação web completa para gestão financeira que permite:

- 📊 **Dashboard Interativo**: Visualização de dados financeiros em tempo real
- 📈 **Análise de Cenários**: Comparação entre projeções otimistas, realistas e pessimistas  
- 📤 **Upload de Planilhas**: Processamento automático de planilhas PROFECIA
- 👥 **Gestão de Usuários**: Sistema completo de autenticação e autorização
- 🔧 **Painel Admin**: Ferramentas administrativas e logs do sistema

## 🏗️ Arquitetura

### Backend (Flask)
- **Framework**: Flask + SQLAlchemy
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **Autenticação**: JWT (JSON Web Tokens)
- **APIs**: RESTful com documentação completa

### Frontend (React)
- **Framework**: React 18 + Vite
- **Roteamento**: React Router
- **Estado**: Context API + Hooks
- **Estilização**: CSS Modules
- **Requisições**: Axios

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
- Upload automático de arquivos Excel
- Extração de dados das 29 abas da planilha PROFECIA
- Validação e mapeamento para banco de dados

### ✅ Dashboard Financeiro
- Gráficos interativos de fluxo de caixa
- Comparação entre cenários
- Métricas e KPIs financeiros

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

## 🔧 Tecnologias Utilizadas

### Backend
- Flask 2.3+
- SQLAlchemy (ORM)
- Flask-CORS
- PyJWT
- Pandas (processamento de planilhas)
- OpenPyXL (leitura Excel)

### Frontend
- React 18
- Vite (build tool)
- Axios (HTTP client)
- React Router (roteamento)

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
