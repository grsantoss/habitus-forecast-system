import pandas as pd
import hashlib
import os
from datetime import datetime, date
from typing import Dict, Any, List
from src.models.user import db, Projeto, Cenario, CategoriaFinanceira, LancamentoFinanceiro, ArquivoUpload

class ProcessadorPlanilhaProfecia:
    """
    Classe responsável por processar planilhas do tipo PROFECIA
    e inserir os dados no banco de dados
    """
    
    def __init__(self):
        self.abas_obrigatorias = ['Painel Controle', 'PROFECIA', 'VENDAS']
        self.categorias_mapeamento = {
            'FATURAMENTO': ('FATURAMENTO', 'OPERACIONAL', 'ENTRADA'),
            'ENTRADAS - OPERACIONAIS': ('ENTRADAS OPERACIONAIS', 'OPERACIONAL', 'ENTRADA'),
            '(=) MARGEM CONTRIBUIÇÃO FINANCEIRA': ('MARGEM CONTRIBUIÇÃO', 'OPERACIONAL', 'ENTRADA'),
            '(-) SAÍDAS [GASTOS FIXOS]': ('GASTOS FIXOS', 'OPERACIONAL', 'SAIDA'),
            '(+/-) FDC DAS ATIVIDADES OPERACIONAIS': ('FDC OPERACIONAL', 'OPERACIONAL', 'ENTRADA'),
            'IMPOSTOS': ('IMPOSTOS', 'OPERACIONAL', 'SAIDA'),
            'COMISSÕES': ('COMISSÕES', 'OPERACIONAL', 'SAIDA'),
            'CUSTO COM SERVIÇO PRESTADO': ('CUSTOS SERVIÇOS', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS COM PESSOAL': ('DESPESAS PESSOAL', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS ADMINISTRATIVAS': ('DESPESAS ADMINISTRATIVAS', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS FINANCEIRAS': ('DESPESAS FINANCEIRAS', 'OPERACIONAL', 'SAIDA'),
        }
    
    def calcular_hash_arquivo(self, caminho_arquivo: str) -> str:
        """Calcula hash SHA256 do arquivo"""
        hash_sha256 = hashlib.sha256()
        with open(caminho_arquivo, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def validar_planilha(self, caminho_arquivo: str) -> Dict[str, Any]:
        """Valida se a planilha possui a estrutura esperada"""
        try:
            excel_file = pd.ExcelFile(caminho_arquivo)
            abas_encontradas = excel_file.sheet_names
            
            # Verifica se as abas obrigatórias existem
            abas_faltantes = [aba for aba in self.abas_obrigatorias if aba not in abas_encontradas]
            
            if abas_faltantes:
                return {
                    'valido': False,
                    'erro': f'Abas obrigatórias não encontradas: {", ".join(abas_faltantes)}',
                    'abas_encontradas': abas_encontradas
                }
            
            return {
                'valido': True,
                'abas_encontradas': abas_encontradas,
                'total_abas': len(abas_encontradas)
            }
            
        except Exception as e:
            return {
                'valido': False,
                'erro': f'Erro ao ler planilha: {str(e)}'
            }
    
    def extrair_parametros_gerais(self, caminho_arquivo: str) -> Dict[str, Any]:
        """Extrai os parâmetros gerais da aba 'Painel Controle'"""
        try:
            df = pd.read_excel(caminho_arquivo, sheet_name='Painel Controle', header=None)
            parametros = {}
            
            for _, row in df.iterrows():
                if pd.notna(row.iloc[1]):
                    texto = str(row.iloc[1]).strip()
                    valor = row.iloc[4] if len(row) > 4 else None
                    
                    if 'Nome do Cliente' in texto and pd.notna(valor):
                        parametros['nome_cliente'] = str(valor).strip()
                    elif 'Data-base' in texto and pd.notna(valor):
                        if isinstance(valor, str):
                            parametros['data_base'] = datetime.strptime(valor, '%Y-%m-%d').date()
                        else:
                            parametros['data_base'] = pd.to_datetime(valor).date()
                    elif 'Saldo Inicial' in texto and pd.notna(valor):
                        parametros['saldo_inicial'] = float(valor)
                    elif 'Cenário' in texto and pd.notna(valor):
                        parametros['cenario_vendas'] = str(valor).strip()
            
            return parametros
            
        except Exception as e:
            raise Exception(f"Erro ao extrair parâmetros gerais: {str(e)}")
    
    def extrair_dados_profecia(self, caminho_arquivo: str) -> List[Dict]:
        """Extrai os dados de fluxo de caixa da aba 'PROFECIA'"""
        try:
            # Ler a planilha sem header para ter controle total
            df_raw = pd.read_excel(caminho_arquivo, sheet_name='PROFECIA', header=None)
            
            # Encontrar a linha com as datas (geralmente linha 1, colunas 2-13)
            datas_row = df_raw.iloc[1, 2:14]
            meses = []
            
            for data in datas_row:
                if pd.notna(data):
                    try:
                        if isinstance(data, str):
                            # Se for string, tentar converter
                            data_convertida = pd.to_datetime(data).date()
                        else:
                            # Se já for datetime, converter para date
                            data_convertida = pd.to_datetime(data).date()
                        meses.append(data_convertida)
                    except:
                        # Se não conseguir converter, usar o último dia do mês baseado no índice
                        ano = 2025
                        mes = len(meses) + 1
                        if mes <= 12:
                            from calendar import monthrange
                            ultimo_dia = monthrange(ano, mes)[1]
                            meses.append(date(ano, mes, ultimo_dia))
            
            # Garantir que temos 12 meses
            while len(meses) < 12:
                if meses:
                    ultimo_mes = meses[-1]
                    if ultimo_mes.month == 12:
                        proximo_mes = date(ultimo_mes.year + 1, 1, 31)
                    else:
                        from calendar import monthrange
                        proximo_mes_num = ultimo_mes.month + 1
                        ultimo_dia = monthrange(ultimo_mes.year, proximo_mes_num)[1]
                        proximo_mes = date(ultimo_mes.year, proximo_mes_num, ultimo_dia)
                    meses.append(proximo_mes)
                else:
                    meses.append(date(2025, len(meses) + 1, 31))
            
            # Extrair dados das linhas principais
            dados_extraidos = []
            
            # Procurar pelas linhas de dados a partir da linha 3
            df_dados = df_raw.iloc[3:]
            
            for categoria_original, (categoria_nome, tipo_fluxo, tipo_entrada_saida) in self.categorias_mapeamento.items():
                # Encontrar a linha que contém esta categoria
                linha_encontrada = None
                for idx, row in df_dados.iterrows():
                    if pd.notna(row.iloc[0]) and categoria_original in str(row.iloc[0]):
                        linha_encontrada = row
                        break
                
                if linha_encontrada is not None:
                    # Extrair valores para cada mês
                    for i, mes in enumerate(meses):
                        if i + 2 < len(linha_encontrada):  # +2 porque as colunas de dados começam no índice 2
                            valor = linha_encontrada.iloc[i + 2]
                            if pd.notna(valor) and valor != 0:
                                dados_extraidos.append({
                                    'categoria_nome': categoria_nome,
                                    'tipo_fluxo': tipo_fluxo,
                                    'tipo': tipo_entrada_saida,
                                    'data_competencia': mes,
                                    'valor': float(valor),
                                    'origem': 'PROJETADO'
                                })
            
            return dados_extraidos
            
        except Exception as e:
            raise Exception(f"Erro ao extrair dados da PROFECIA: {str(e)}")
    
    def garantir_categorias_existem(self):
        """Garante que todas as categorias necessárias existem no banco"""
        for categoria_original, (categoria_nome, tipo_fluxo, tipo_entrada_saida) in self.categorias_mapeamento.items():
            categoria_existente = CategoriaFinanceira.query.filter_by(nome=categoria_nome).first()
            if not categoria_existente:
                nova_categoria = CategoriaFinanceira(
                    nome=categoria_nome,
                    tipo_fluxo=tipo_fluxo
                )
                db.session.add(nova_categoria)
        
        db.session.commit()
    
    def processar_planilha_completa(self, caminho_arquivo: str, usuario_id: int) -> Dict[str, Any]:
        """Processa a planilha completa e salva no banco de dados"""
        try:
            # 1. Validar planilha
            validacao = self.validar_planilha(caminho_arquivo)
            if not validacao['valido']:
                raise Exception(validacao['erro'])
            
            # 2. Calcular hash do arquivo
            hash_arquivo = self.calcular_hash_arquivo(caminho_arquivo)
            
            # 3. Verificar se arquivo já foi processado
            arquivo_existente = ArquivoUpload.query.filter_by(hash_arquivo=hash_arquivo).first()
            if arquivo_existente:
                return {
                    'status': 'arquivo_ja_processado',
                    'projeto_id': arquivo_existente.projeto_id,
                    'message': 'Este arquivo já foi processado anteriormente'
                }
            
            # 4. Extrair parâmetros gerais
            parametros = self.extrair_parametros_gerais(caminho_arquivo)
            
            # 5. Criar projeto
            projeto = Projeto(
                usuario_id=usuario_id,
                nome_cliente=parametros.get('nome_cliente', 'Cliente Importado'),
                data_base_estudo=parametros.get('data_base', date.today()),
                saldo_inicial_caixa=parametros.get('saldo_inicial', 0)
            )
            
            db.session.add(projeto)
            db.session.flush()  # Para obter o ID
            
            # 6. Criar cenário
            cenario = Cenario(
                projeto_id=projeto.id,
                nome=parametros.get('cenario_vendas', 'Realista'),
                descricao='Cenário importado da planilha PROFECIA',
                is_active=True
            )
            
            db.session.add(cenario)
            db.session.flush()  # Para obter o ID
            
            # 7. Garantir que categorias existem
            self.garantir_categorias_existem()
            
            # 8. Extrair e salvar dados financeiros
            dados_profecia = self.extrair_dados_profecia(caminho_arquivo)
            
            lancamentos_criados = 0
            for dado in dados_profecia:
                categoria = CategoriaFinanceira.query.filter_by(nome=dado['categoria_nome']).first()
                if categoria:
                    lancamento = LancamentoFinanceiro(
                        cenario_id=cenario.id,
                        categoria_id=categoria.id,
                        data_competencia=dado['data_competencia'],
                        valor=dado['valor'],
                        tipo=dado['tipo'],
                        origem=dado['origem']
                    )
                    db.session.add(lancamento)
                    lancamentos_criados += 1
            
            # 9. Registrar arquivo
            arquivo_upload = ArquivoUpload(
                projeto_id=projeto.id,
                nome_original=os.path.basename(caminho_arquivo),
                caminho_storage=caminho_arquivo,
                hash_arquivo=hash_arquivo,
                status_processamento='processado',
                relatorio_processamento={
                    'lancamentos_criados': lancamentos_criados,
                    'categorias_processadas': len(self.categorias_mapeamento),
                    'parametros_extraidos': parametros
                }
            )
            
            db.session.add(arquivo_upload)
            db.session.commit()
            
            return {
                'status': 'sucesso',
                'projeto_id': projeto.id,
                'lancamentos_criados': lancamentos_criados,
                'parametros': parametros,
                'validacao': validacao
            }
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Erro ao processar planilha: {str(e)}")
