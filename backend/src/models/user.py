from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'usuario', name='user_roles'), default='usuario', nullable=False)
    status = db.Column(db.Enum('pending', 'active', 'rejected', name='user_status'), default='pending', nullable=False)
    # Campos adicionais para informações pessoais
    telefone = db.Column(db.String(20), nullable=True)
    empresa = db.Column(db.String(255), nullable=True)
    cnpj = db.Column(db.String(20), nullable=True)
    cargo = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    projetos = db.relationship('Projeto', backref='usuario', lazy=True, cascade='all, delete-orphan')
    logs = db.relationship('LogSistema', backref='usuario', lazy=True)

    def set_password(self, password):
        """Define a senha do usuário usando hash"""
        self.senha_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica se a senha fornecida está correta"""
        return check_password_hash(self.senha_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'role': self.role,
            'status': self.status,
            'telefone': self.telefone,
            'empresa': self.empresa,
            'cnpj': self.cnpj,
            'cargo': self.cargo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<User {self.email}>'


class Projeto(db.Model):
    __tablename__ = 'projetos'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    nome_cliente = db.Column(db.String(255), nullable=False)
    data_base_estudo = db.Column(db.Date, nullable=False)
    saldo_inicial_caixa = db.Column(db.Numeric(15, 2), nullable=False)
    ponto_equilibrio = db.Column(db.Numeric(15, 2), nullable=True)  # Campo para ponto de equilíbrio
    geracao_fdc_livre = db.Column(db.Numeric(15, 2), nullable=True)  # Indicador: Geração FDC Livre
    percentual_custo_fixo = db.Column(db.Numeric(7, 2), nullable=True)  # Indicador: % Custo Fixo (em %)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    cenarios = db.relationship('Cenario', backref='projeto', lazy=True, cascade='all, delete-orphan')
    arquivos_upload = db.relationship('ArquivoUpload', backref='projeto', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'nome_cliente': self.nome_cliente,
            'data_base_estudo': self.data_base_estudo.isoformat() if self.data_base_estudo else None,
            'saldo_inicial_caixa': float(self.saldo_inicial_caixa) if self.saldo_inicial_caixa else 0,
            'ponto_equilibrio': float(self.ponto_equilibrio) if self.ponto_equilibrio else 0,
            'geracao_fdc_livre': float(self.geracao_fdc_livre) if self.geracao_fdc_livre else 0,
            'percentual_custo_fixo': float(self.percentual_custo_fixo) if self.percentual_custo_fixo else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Projeto {self.nome_cliente}>'


class Cenario(db.Model):
    __tablename__ = 'cenarios'
    
    id = db.Column(db.Integer, primary_key=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    lancamentos = db.relationship('LancamentoFinanceiro', backref='cenario', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'projeto_id': self.projeto_id,
            'nome': self.nome,
            'descricao': self.descricao,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Cenario {self.nome}>'


class CategoriaFinanceira(db.Model):
    __tablename__ = 'categorias_financeiras'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), unique=True, nullable=False)
    categoria_pai_id = db.Column(db.Integer, db.ForeignKey('categorias_financeiras.id'))
    tipo_fluxo = db.Column(db.Enum('OPERACIONAL', 'INVESTIMENTO', 'FINANCIAMENTO', name='tipo_fluxo'), nullable=False)
    
    # Relacionamentos
    subcategorias = db.relationship('CategoriaFinanceira', backref=db.backref('categoria_pai', remote_side=[id]))
    lancamentos = db.relationship('LancamentoFinanceiro', backref='categoria', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'categoria_pai_id': self.categoria_pai_id,
            'tipo_fluxo': self.tipo_fluxo
        }

    def __repr__(self):
        return f'<CategoriaFinanceira {self.nome}>'


class LancamentoFinanceiro(db.Model):
    __tablename__ = 'lancamentos_financeiros'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cenario_id = db.Column(db.Integer, db.ForeignKey('cenarios.id'), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias_financeiras.id'), nullable=False)
    data_competencia = db.Column(db.Date, nullable=False)
    valor = db.Column(db.Numeric(15, 2), nullable=False)
    tipo = db.Column(db.Enum('ENTRADA', 'SAIDA', name='tipo_lancamento'), nullable=False)
    origem = db.Column(db.Enum('PROJETADO', 'REALIZADO', name='origem_lancamento'), default='PROJETADO', nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'cenario_id': self.cenario_id,
            'categoria_id': self.categoria_id,
            'data_competencia': self.data_competencia.isoformat() if self.data_competencia else None,
            'valor': float(self.valor) if self.valor else 0,
            'tipo': self.tipo,
            'origem': self.origem
        }

    def __repr__(self):
        return f'<LancamentoFinanceiro {self.valor}>'


class ArquivoUpload(db.Model):
    __tablename__ = 'arquivos_upload'
    
    id = db.Column(db.Integer, primary_key=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id'), nullable=False)
    nome_original = db.Column(db.String(255), nullable=False)
    caminho_storage = db.Column(db.String(512), nullable=False)
    hash_arquivo = db.Column(db.String(255), nullable=False)
    status_processamento = db.Column(db.Enum('pendente', 'processado', 'erro', name='status_processamento'), default='pendente')
    relatorio_processamento = db.Column(db.JSON)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'projeto_id': self.projeto_id,
            'nome_original': self.nome_original,
            'status_processamento': self.status_processamento,
            'relatorio_processamento': self.relatorio_processamento,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }

    def __repr__(self):
        return f'<ArquivoUpload {self.nome_original}>'


class ConfiguracaoCenarios(db.Model):
    __tablename__ = 'configuracoes_cenarios'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    pessimista = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    realista = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    otimista = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    agressivo = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'pessimista': float(self.pessimista) if self.pessimista else 0,
            'realista': float(self.realista) if self.realista else 0,
            'otimista': float(self.otimista) if self.otimista else 0,
            'agressivo': float(self.agressivo) if self.agressivo else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<ConfiguracaoCenarios {self.usuario_id}>'


class LogSistema(db.Model):
    __tablename__ = 'logs_sistema'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    acao = db.Column(db.String(255), nullable=False)
    detalhes = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento será definido via foreign key apenas

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'acao': self.acao,
            'detalhes': self.detalhes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f'<LogSistema {self.acao}>'


class HistoricoCenario(db.Model):
    __tablename__ = 'historico_cenarios'
    
    id = db.Column(db.Integer, primary_key=True)
    cenario_id = db.Column(db.Integer, db.ForeignKey('cenarios.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    descricao = db.Column(db.String(255), nullable=True)  # Descrição opcional do snapshot
    snapshot_data = db.Column(db.JSON, nullable=False)  # Dados serializados do cenário e lançamentos
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    cenario = db.relationship('Cenario', backref='historico_versoes')
    usuario = db.relationship('User', backref='snapshots_criados')
    
    def to_dict(self):
        return {
            'id': self.id,
            'cenario_id': self.cenario_id,
            'usuario_id': self.usuario_id,
            'descricao': self.descricao,
            'snapshot_data': self.snapshot_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<HistoricoCenario {self.id} - Cenário {self.cenario_id}>'
