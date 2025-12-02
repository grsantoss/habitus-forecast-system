"""
Schemas para Upload de Planilhas
"""
from flask_restx import fields, Model

# Schema de resposta de upload
upload_response_schema = Model('UploadResponse', {
    'message': fields.String(required=True, description='Mensagem de resposta'),
    'projeto_id': fields.Integer(description='ID do projeto criado'),
    'lancamentos_criados': fields.Integer(description='Número de lançamentos criados'),
    'parametros': fields.Raw(description='Parâmetros extraídos da planilha'),
    'upload_data': fields.Raw(description='Dados do upload'),
})

# Schema de validação de planilha
validacao_schema = Model('ValidacaoPlanilha', {
    'valido': fields.Boolean(required=True, description='Se a planilha é válida'),
    'erros': fields.List(fields.String, description='Lista de erros encontrados'),
    'avisos': fields.List(fields.String, description='Lista de avisos'),
    'preview_parametros': fields.Raw(description='Preview dos parâmetros extraídos'),
})

# Schema de histórico de uploads
upload_history_item_schema = Model('UploadHistoryItem', {
    'id': fields.Integer(required=True, description='ID do upload'),
    'nome': fields.String(required=True, description='Nome original do arquivo'),
    'data': fields.DateTime(required=True, description='Data do upload'),
    'status': fields.String(required=True, enum=['pendente', 'processado', 'erro'], description='Status do processamento'),
    'lancamentos': fields.Integer(description='Número de lançamentos criados'),
})

