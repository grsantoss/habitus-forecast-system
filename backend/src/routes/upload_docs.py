"""
Documentação Swagger para endpoints de upload
"""
try:
    from flask_restx import Resource
    from flask_restx import reqparse
    from src.api_docs import upload_ns
    from src.schemas.upload_schema import (
        upload_response_schema, validacao_schema, upload_history_item_schema
    )
    
    # Parser para upload de arquivo
    upload_parser = reqparse.RequestParser()
    upload_parser.add_argument('file', location='files', type='file', required=True, help='Arquivo Excel (.xlsx ou .xls)')
    
    @upload_ns.route('/upload-planilha')
    @upload_ns.doc('upload_planilha')
    class UploadPlanilha(Resource):
        @upload_ns.doc(security='Bearer Auth')
        @upload_ns.expect(upload_parser)
        @upload_ns.marshal_with(upload_response_schema, code=201)
        @upload_ns.response(400, 'Arquivo inválido')
        @upload_ns.response(401, 'Não autenticado')
        def post(self):
            """
            Upload e processamento de planilha Excel
            
            Processa planilha Habitus Forecast ou FDC-REAL e cria:
            - Novo projeto
            - Cenários baseados na planilha
            - Lançamentos financeiros
            
            Formatos aceitos: .xlsx, .xls
            Tamanho máximo: 16MB
            """
            pass
    
    @upload_ns.route('/validar-planilha')
    @upload_ns.doc('validar_planilha')
    class ValidarPlanilha(Resource):
        @upload_ns.doc(security='Bearer Auth')
        @upload_ns.expect(upload_parser)
        @upload_ns.marshal_with(validacao_schema)
        def post(self):
            """
            Validar planilha sem processar
            
            Valida estrutura e formato da planilha sem criar dados no banco.
            Útil para preview antes do upload definitivo.
            """
            pass
    
    @upload_ns.route('/uploads/history')
    @upload_ns.doc('upload_history')
    class UploadHistory(Resource):
        @upload_ns.doc(security='Bearer Auth')
        @upload_ns.marshal_list_with(upload_history_item_schema)
        def get(self):
            """Histórico de uploads do usuário"""
            pass
    
    @upload_ns.route('/uploads/<int:upload_id>/download')
    @upload_ns.doc('download_upload')
    class DownloadUpload(Resource):
        @upload_ns.doc(security='Bearer Auth')
        @upload_ns.produces(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
        @upload_ns.response(404, 'Upload não encontrado')
        def get(self, upload_id):
            """Download de arquivo processado"""
            pass
    
    @upload_ns.route('/uploads/<int:upload_id>')
    @upload_ns.doc('delete_upload')
    class DeleteUpload(Resource):
        @upload_ns.doc(security='Bearer Auth')
        @upload_ns.response(204, 'Upload deletado')
        @upload_ns.response(404, 'Upload não encontrado')
        def delete(self, upload_id):
            """
            Deletar upload e dados associados
            
            Remove o upload, projeto associado, cenários e lançamentos.
            """
            pass
    
    rename_parser = reqparse.RequestParser()
    rename_parser.add_argument('nome', type=str, required=True, help='Novo nome do arquivo')
    
    @upload_ns.route('/uploads/<int:upload_id>/rename')
    @upload_ns.doc('rename_upload')
    class RenameUpload(Resource):
        @upload_ns.doc(security='Bearer Auth')
        @upload_ns.expect(rename_parser)
        @upload_ns.marshal_with(upload_history_item_schema)
        def put(self, upload_id):
            """Renomear upload (apenas nome exibido)"""
            pass

except ImportError:
    pass

