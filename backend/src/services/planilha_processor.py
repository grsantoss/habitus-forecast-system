import pandas as pd
import hashlib
import os
from datetime import datetime, date
from typing import Dict, Any, List
from src.models.user import db, Projeto, Cenario, CategoriaFinanceira, LancamentoFinanceiro, ArquivoUpload, ConfiguracaoCenarios

class ProcessadorPlanilhaHabitusForecast:
    """
    Classe responsável por processar planilhas do tipo Habitus Foreca$t
    e inserir os dados no banco de dados
    """
    
    def __init__(self):
        # Suporte a três layouts de planilha: antigo, novo e novo com RECEITAS
        self.layouts_aceitos = [
            ['Painel Controle', 'HABITUS_FORECA$T', 'VENDAS'],  # layout antigo
            ['REALIZADO', 'RECEITAS', 'DESPESAS', 'INVESTIMENTOS', 'FINANCIAMENTOS'],  # layout novo com RECEITAS
            ['REALIZADO', 'DESPESAS', 'INVESTIMENTOS', 'FINANCIAMENTOS']  # layout novo sem RECEITAS
        ]
        # Mantém compatibilidade com código existente que acessa 'abas_obrigatorias'
        self.abas_obrigatorias = self.layouts_aceitos[0]
        self.categorias_mapeamento = {
            # Aba REALIZADO
            'FATURAMENTO': ('FATURAMENTO', 'OPERACIONAL', 'ENTRADA'),
            'ENTRADAS [OPERACIONAIS]': ('ENTRADAS OPERACIONAIS', 'OPERACIONAL', 'ENTRADA'),
            'RECEITA OPERACIONAL 1': ('RECEITA OPERACIONAL 1', 'OPERACIONAL', 'ENTRADA'),
            'RECEITA OPERACIONAL 2': ('RECEITA OPERACIONAL 2', 'OPERACIONAL', 'ENTRADA'),
            'RECEITA OPERACIONAL 3': ('RECEITA OPERACIONAL 3', 'OPERACIONAL', 'ENTRADA'),
            'RECEITA OPERACIONAL 4': ('RECEITA OPERACIONAL 4', 'OPERACIONAL', 'ENTRADA'),
            'IMPOSTOS': ('IMPOSTOS', 'OPERACIONAL', 'SAIDA'),
            'COMISSÃO': ('COMISSÃO', 'OPERACIONAL', 'SAIDA'),
            'CUSTOS DE TRANSAÇÕES': ('CUSTOS DE TRANSAÇÕES', 'OPERACIONAL', 'SAIDA'),
            'CUSTOS COM SERVIÇO PRESTADO - BPO': ('CUSTOS COM SERVIÇO PRESTADO - BPO', 'OPERACIONAL', 'SAIDA'),
            'CPV / CMV - NOVAS COMPRAS': ('CPV / CMV - NOVAS COMPRAS', 'OPERACIONAL', 'SAIDA'),
            'OUTROS CUSTOS - CPV / CMV': ('OUTROS CUSTOS - CPV / CMV', 'OPERACIONAL', 'SAIDA'),
            'CONTAS A PAGAR (CLARO/TELEFONE)': ('CONTAS A PAGAR (CLARO/TELEFONE)', 'OPERACIONAL', 'SAIDA'),
            'OUTROS CUSTOS - VARIÁVEIS': ('OUTROS CUSTOS - VARIÁVEIS', 'OPERACIONAL', 'SAIDA'),
            '(=) MARGEM CONTRIBUIÇÃO FINANCEIRA': ('MARGEM CONTRIBUIÇÃO FINANCEIRA', 'OPERACIONAL', 'ENTRADA'),
            'DESPESAS COM PESSOAL (BRUNO)': ('DESPESAS COM PESSOAL (BRUNO)', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS COM PESSOAL (MKT DIGITAL)': ('DESPESAS COM PESSOAL (MKT DIGITAL)', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS COM DIRETORIA (PRO LAB G)': ('DESPESAS COM DIRETORIA (PRO LAB G)', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS COMERCIAIS (ARTES)': ('DESPESAS COMERCIAIS (ARTES)', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS COMERCIAIS (CRM CHATWO)': ('DESPESAS COMERCIAIS (CRM CHATWO)', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS ADMINISTRATIVAS (CONTADC)': ('DESPESAS ADMINISTRATIVAS (CONTADC)', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS FINANCEIRAS (CAMPANHAS)': ('DESPESAS FINANCEIRAS (CAMPANHAS)', 'OPERACIONAL', 'SAIDA'),
            'DESPESAS TRIBUTÁRIAS E OUTRAS': ('DESPESAS TRIBUTÁRIAS E OUTRAS', 'OPERACIONAL', 'SAIDA'),
            '(+/-) FDC DAS ATIVIDADES OPERACIONAIS': ('FDC DAS ATIVIDADES OPERACIONAIS', 'OPERACIONAL', 'ENTRADA'),
            '(+) VENDA DE ATIVOS': ('VENDA DE ATIVOS', 'INVESTIMENTO', 'ENTRADA'),
            '(+) RECEITAS FINANCEIRAS': ('RECEITAS FINANCEIRAS', 'INVESTIMENTO', 'ENTRADA'),
            '(-) INVESTIMENTOS': ('INVESTIMENTOS', 'INVESTIMENTO', 'SAIDA'),
            '(+/-) FDC DAS ATIVIDADES INVESTIMENTOS': ('FDC DAS ATIVIDADES INVESTIMENTOS', 'INVESTIMENTO', 'ENTRADA'),
            '(+) CAPTAÇÃO DE RECURSOS': ('CAPTAÇÃO DE RECURSOS', 'FINANCIAMENTO', 'ENTRADA'),
            '(+) APORTES, CAPITAL PRÓPRIO E OUTROS': ('APORTES, CAPITAL PRÓPRIO E OUTROS', 'FINANCIAMENTO', 'ENTRADA'),
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
        excel_file = None
        try:
            excel_file = pd.ExcelFile(caminho_arquivo)
            abas_encontradas = excel_file.sheet_names
            
            # Detectar qual layout é atendido
            layout_detectado = None
            for layout in self.layouts_aceitos:
                if all(aba in abas_encontradas for aba in layout):
                    layout_detectado = layout
                    break
            
            if not layout_detectado:
                return {
                    'valido': False,
                    'erro': 'Estrutura de abas não reconhecida. Esperado um dos layouts válidos.',
                    'abas_encontradas': abas_encontradas
                }
            
            return {
                'valido': True,
                'abas_encontradas': abas_encontradas,
                'total_abas': len(abas_encontradas),
                'layout': 'novo' if 'REALIZADO' in layout_detectado else 'antigo'
            }
            
        except Exception as e:
            return {
                'valido': False,
                'erro': f'Erro ao ler planilha: {str(e)}'
            }
        finally:
            # Garantir que o arquivo seja fechado
            if excel_file is not None:
                try:
                    excel_file.close()
                except:
                    pass
    
    def extrair_parametros_gerais(self, caminho_arquivo: str) -> Dict[str, Any]:
        """Extrai os parâmetros gerais da planilha (compatível com layout antigo e novo)"""
        try:
            with pd.ExcelFile(caminho_arquivo, engine='openpyxl') as excel_file:
                parametros = {}
                
                # Tentar layout antigo primeiro (aba 'Painel Controle')
                if 'Painel Controle' in excel_file.sheet_names:
                    df = pd.read_excel(excel_file, sheet_name='Painel Controle', header=None)
                    
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
                
                # Layout novo: extrair parâmetros da aba 'REALIZADO' se disponível
                elif 'REALIZADO' in excel_file.sheet_names:
                    df = pd.read_excel(excel_file, sheet_name='REALIZADO', header=None)
                    
                    # Procurar por informações do cliente na célula B2
                    if df.shape[0] >= 2 and df.shape[1] >= 2:
                        cliente_cell = df.iloc[1, 1]  # B2
                        if pd.notna(cliente_cell):
                            parametros['nome_cliente'] = str(cliente_cell).strip()
                    
                    # Definir valores padrão para layout novo
                    parametros['data_base'] = date.today()
                    parametros['saldo_inicial'] = 0.0
                    parametros['cenario_vendas'] = 'Realista'
                
                # Se nenhum layout for encontrado, usar valores padrão
                else:
                    parametros['nome_cliente'] = 'Cliente Importado'
                    parametros['data_base'] = date.today()
                    parametros['saldo_inicial'] = 0.0
                    parametros['cenario_vendas'] = 'Realista'
                
                return parametros
            
        except Exception as e:
            # Em caso de erro, retornar valores padrão ao invés de falhar
            print(f"Aviso: Erro ao extrair parâmetros gerais: {str(e)}")
            return {
                'nome_cliente': 'Cliente Importado',
                'data_base': date.today(),
                'saldo_inicial': 0.0,
                'cenario_vendas': 'Realista'
            }

    def extrair_indicadores_forecast(self, caminho_arquivo: str) -> Dict[str, Any]:
        """Extrai indicadores da aba 'indicadores forecast' se existir.

        Mapeamento solicitado:
        - Geração FDC Livre: linha 19, coluna H
        - Ponto de Equilíbrio: linha 31, coluna H
        - % Custo Fixo: linha 35, coluna H
        """
        indicadores = {
            'geracao_fdc_livre': 0.0,
            'ponto_equilibrio': 0.0,
            'percentual_custo_fixo': 0.0
        }

        try:
            with pd.ExcelFile(caminho_arquivo, engine='openpyxl') as excel_file:
                # Procurar aba ignorando diferença de maiúsculas/minúsculas/acentos simples
                sheet_name = None
                for nome in excel_file.sheet_names:
                    if str(nome).strip().lower() == 'indicadores forecast':
                        sheet_name = nome
                        break

                if not sheet_name:
                    return indicadores

                df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)

                def get_float(row_idx: int, col_idx: int) -> float:
                    try:
                        valor = df.iloc[row_idx, col_idx]
                        if pd.isna(valor):
                            return 0.0
                        return float(valor)
                    except Exception:
                        return 0.0

                # Índices zero-based: linha 19 -> 18, linha 31 -> 30, linha 35 -> 34; coluna H -> 7
                indicadores['geracao_fdc_livre'] = get_float(18, 7)
                indicadores['ponto_equilibrio'] = get_float(30, 7)

                # % Custo Fixo pode vir como 0,0923 (9,23%) no Excel; converter para 9,23
                pct_bruto = get_float(34, 7)
                if 0 < pct_bruto <= 1:
                    pct_tratado = pct_bruto * 100.0
                else:
                    pct_tratado = pct_bruto
                indicadores['percentual_custo_fixo'] = pct_tratado

                return indicadores
        except Exception as e:
            print(f"Aviso: erro ao extrair indicadores forecast: {e}")
            return indicadores
    
    def extrair_dados_habitus_forecast(self, caminho_arquivo: str) -> List[Dict]:
        """Extrai os dados de fluxo de caixa (compatível com layout antigo e novo)"""
        try:
            with pd.ExcelFile(caminho_arquivo, engine='openpyxl') as excel_file:
                # Determinar qual aba usar baseado no layout disponível
                if 'HABITUS_FORECA$T' in excel_file.sheet_names or 'PROFECIA' in excel_file.sheet_names:
                    # Layout antigo (compatibilidade com nome antigo)
                    sheet_name = 'HABITUS_FORECA$T' if 'HABITUS_FORECA$T' in excel_file.sheet_names else 'PROFECIA'
                    df_raw = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)
                elif 'RECEITAS' in excel_file.sheet_names:
                    # Layout novo com aba RECEITAS - usar aba RECEITAS para dados do gráfico
                    df_raw = pd.read_excel(excel_file, sheet_name='RECEITAS', header=None)
                elif 'REALIZADO' in excel_file.sheet_names:
                    # Layout novo - usar aba REALIZADO
                    df_raw = pd.read_excel(excel_file, sheet_name='REALIZADO', header=None)
                else:
                    raise Exception("Nenhuma aba compatível encontrada para extração de dados")
                
                # Gerar meses baseados no mês atual (já que a planilha não tem datas reais)
                from datetime import date
                from calendar import monthrange
                
                # Começar do mês atual (outubro 2025)
                meses = []
                ano_inicial = 2025
                mes_inicial = 10  # Outubro
                
                for i in range(12):
                    mes_atual = mes_inicial + i
                    if mes_atual > 12:
                        mes_atual = mes_atual - 12
                        ano_atual = ano_inicial + 1
                    else:
                        ano_atual = ano_inicial
                    
                    # Último dia do mês
                    ultimo_dia = monthrange(ano_atual, mes_atual)[1]
                    meses.append(date(ano_atual, mes_atual, ultimo_dia))
                
                print(f"Meses gerados: {[mes.strftime('%Y-%m-%d') for mes in meses]}")
                
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
                
                # Extrair dados para o gráfico (linha verde)
                # Layout antigo: linha 56 da aba Habitus Foreca$t
                # Layout novo: linha que contém "FATURAMENTO" na aba REALIZADO
                dados_grafico_encontrados = False
                
                if ('HABITUS_FORECA$T' in excel_file.sheet_names or 'PROFECIA' in excel_file.sheet_names) and df_raw.shape[0] >= 56:
                    # Layout antigo - linha 56
                    linha_56 = df_raw.iloc[55]  # Índice 55 = linha 56
                    dados_linha_56 = linha_56.iloc[2:14]  # Colunas 3-14 (índices 2-13)
                    
                    print(f"Extraindo dados da linha 56 (Habitus Foreca$t - gráfico)")
                    print(f"Valores encontrados na linha 56: {[float(v) if pd.notna(v) else 0 for v in dados_linha_56]}")
                    
                    for i, valor in enumerate(dados_linha_56):
                        if pd.notna(valor) and i < len(meses):
                            valor_original = float(valor)
                            dados_extraidos.append({
                                'categoria_nome': 'HABITUS_FORECA$T-GRAFICO',
                                'tipo_fluxo': 'OPERACIONAL',
                                'tipo': 'ENTRADA',
                                'data_competencia': meses[i],
                                'valor': valor_original,
                                'origem': 'PROJETADO'
                            })
                            print(f"  Mês {i+1} ({meses[i]}): R$ {valor_original}")
                    dados_grafico_encontrados = True
                    print(f"Total de valores extraídos da linha 56: {len([v for v in dados_linha_56 if pd.notna(v)])}")
                
                elif 'RECEITAS' in excel_file.sheet_names:
                    # Layout novo com aba RECEITAS - linha 6, colunas E-P (índices 4-15)
                    if df_raw.shape[0] >= 6:
                        linha_6 = df_raw.iloc[5]  # Índice 5 = linha 6
                        dados_receitas = linha_6.iloc[4:16]  # Colunas E-P (índices 4-15)

                        print(f"Extraindo dados da linha 6 (RECEITAS - base do gráfico)")
                        print(f"Valores encontrados: {[float(v) if pd.notna(v) else 0 for v in dados_receitas]}")

                        # Compor fórmula sempre - permitir composição parcial (valores ausentes = 0)
                        try:
                            df_inv = pd.read_excel(excel_file, sheet_name='INVESTIMENTOS', header=None) if 'INVESTIMENTOS' in excel_file.sheet_names else None
                            df_fin = pd.read_excel(excel_file, sheet_name='FINANCIAMENTOS', header=None) if 'FINANCIAMENTOS' in excel_file.sheet_names else None
                            df_desp = pd.read_excel(excel_file, sheet_name='DESPESAS', header=None) if 'DESPESAS' in excel_file.sheet_names else None

                            # Linhas alvo (1-based): inv(63,61), fin(80,78), desp(217)
                            # Índices pandas (0-based): 62, 60, 79, 77, 216
                            serie_inv_63 = df_inv.iloc[62].iloc[4:16] if df_inv is not None and df_inv.shape[0] > 62 else None
                            serie_inv_61 = df_inv.iloc[60].iloc[4:16] if df_inv is not None and df_inv.shape[0] > 60 else None
                            serie_fin_80 = df_fin.iloc[79].iloc[4:16] if df_fin is not None and df_fin.shape[0] > 79 else None
                            serie_fin_78 = df_fin.iloc[77].iloc[4:16] if df_fin is not None and df_fin.shape[0] > 77 else None
                            serie_desp_217 = df_desp.iloc[216].iloc[4:16] if df_desp is not None and df_desp.shape[0] > 216 else None
                        except Exception as e:
                            print(f"Falha ao ler abas INV/FIN/DESP: {e}")
                            serie_inv_63 = serie_inv_61 = serie_fin_80 = serie_fin_78 = serie_desp_217 = None

                        print("Compondo linha verde com valores disponíveis (ausentes=0): RECEITAS(6) + INV(63) + FIN(80) - DESP(217) - INV(61) - FIN(78)")
                        
                        def num(s, i):
                            """Extrai número de uma série, retorna 0 se ausente"""
                            try:
                                if s is None:
                                    return 0.0
                                v = s.iloc[i]
                                return float(v) if pd.notna(v) else 0.0
                            except Exception:
                                return 0.0

                        for i in range(12):
                            base_rec = float(dados_receitas.iloc[i]) if pd.notna(dados_receitas.iloc[i]) else 0.0
                            v = (
                                base_rec +
                                num(serie_inv_63, i) +
                                num(serie_fin_80, i) -
                                num(serie_desp_217, i) -
                                num(serie_inv_61, i) -
                                num(serie_fin_78, i)
                            )
                            dados_extraidos.append({
                                'categoria_nome': 'HABITUS_FORECA$T-GRAFICO',
                                'tipo_fluxo': 'OPERACIONAL',
                                'tipo': 'ENTRADA',
                                'data_competencia': meses[i],
                                'valor': v,
                                'origem': 'PROJETADO'
                            })
                            print(f"  Mês {i+1} ({meses[i]}): {base_rec} + INV(63)={num(serie_inv_63, i)} + FIN(80)={num(serie_fin_80, i)} - DESP(217)={num(serie_desp_217, i)} - INV(61)={num(serie_inv_61, i)} - FIN(78)={num(serie_fin_78, i)} = {v}")
                        dados_grafico_encontrados = True
                    else:
                        print(f"Aba RECEITAS tem apenas {df_raw.shape[0]} linhas, linha 6 não existe")
                
                elif 'REALIZADO' in excel_file.sheet_names:
                    # Layout novo - procurar linha com "FATURAMENTO"
                    for idx, row in df_raw.iterrows():
                        try:
                            primeira_col = str(row.iloc[0]).strip().upper() if pd.notna(row.iloc[0]) else ''
                        except Exception:
                            primeira_col = ''
                        
                        if 'FATURAMENTO' in primeira_col:
                            dados_faturamento = row.iloc[2:14]  # Colunas 3-14
                            print(f"Extraindo dados da linha FATURAMENTO (REALIZADO - gráfico)")
                            print(f"Valores encontrados: {[float(v) if pd.notna(v) else 0 for v in dados_faturamento]}")
                            
                            for i, valor in enumerate(dados_faturamento):
                                if pd.notna(valor) and i < len(meses):
                                    valor_original = float(valor)
                                    dados_extraidos.append({
                                        'categoria_nome': 'HABITUS_FORECA$T-GRAFICO',
                                        'tipo_fluxo': 'OPERACIONAL',
                                        'tipo': 'ENTRADA',
                                        'data_competencia': meses[i],
                                        'valor': valor_original,
                                        'origem': 'PROJETADO'
                                    })
                                    print(f"  Mês {i+1} ({meses[i]}): R$ {valor_original}")
                            dados_grafico_encontrados = True
                            print(f"Total de valores extraídos do FATURAMENTO: {len([v for v in dados_faturamento if pd.notna(v)])}")
                            break
                
                if not dados_grafico_encontrados:
                    print(f"AVISO: Dados para gráfico não encontrados na planilha")
                
                return dados_extraidos
            
        except Exception as e:
            raise Exception(f"Erro ao extrair dados da Habitus Foreca$t: {str(e)}")
    
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
        
        # Garantir que a categoria HABITUS_FORECA$T-GRAFICO existe (linha 56)
        categoria_habitus_forecast_grafico = CategoriaFinanceira.query.filter_by(nome='HABITUS_FORECA$T-GRAFICO').first()
        if not categoria_habitus_forecast_grafico:
            # Também verificar categoria antiga para compatibilidade
            categoria_profecia_grafico = CategoriaFinanceira.query.filter_by(nome='PROFECIA-GRAFICO').first()
            if categoria_profecia_grafico:
                # Renomear categoria antiga para nova
                categoria_profecia_grafico.nome = 'HABITUS_FORECA$T-GRAFICO'
                categoria_habitus_forecast_grafico = categoria_profecia_grafico
            else:
                nova_categoria = CategoriaFinanceira(
                    nome='HABITUS_FORECA$T-GRAFICO',
                    tipo_fluxo='OPERACIONAL'
                )
                db.session.add(nova_categoria)
            print("Categoria HABITUS_FORECA$T-GRAFICO criada/atualizada")
        
        db.session.commit()
    
    def extrair_dados_fdc_real(self, caminho_arquivo: str) -> List[Dict]:
        """Extrai os dados de FDC-REAL.
        Compatibilidade:
        - Layout antigo: aba 'FDC-REAL', linha 63, colunas 3-14
        - Layout novo: aba 'REALIZADO', linha 61, colunas F-Q (índices 5-16)
        """
        try:
            with pd.ExcelFile(caminho_arquivo, engine='openpyxl') as excel_file:
                dados_fdc_real = None
                if 'FDC-REAL' in excel_file.sheet_names:
                    # Layout antigo
                    df = pd.read_excel(excel_file, sheet_name='FDC-REAL', header=None)
                    if df.shape[0] < 63:
                        print(f"Aba FDC-REAL tem apenas {df.shape[0]} linhas, linha 63 não existe")
                        return []
                    linha = df.iloc[62]
                    dados_fdc_real = linha.iloc[2:14]
                elif 'REALIZADO' in excel_file.sheet_names:
                    # Layout novo - usar linha 61, colunas F-Q (índices 5-16)
                    df = pd.read_excel(excel_file, sheet_name='REALIZADO', header=None)
                    
                    # Verificar se a linha 61 existe
                    if df.shape[0] < 61:
                        print(f"Aba REALIZADO tem apenas {df.shape[0]} linhas, linha 61 não existe")
                        return []
                    
                    # Extrair dados da linha 61, colunas F-Q (índices 5-16)
                    linha_61 = df.iloc[60]  # Índice 60 = linha 61
                    dados_fdc_real = linha_61.iloc[5:17]  # Colunas F-Q (índices 5-16)
                    
                    print(f"Extraindo dados da linha 61 (REALIZADO - FDC-Real)")
                    print(f"Valores encontrados na linha 61: {[float(v) if pd.notna(v) else 0 for v in dados_fdc_real]}")
                else:
                    print("Nenhuma aba compatível para FDC-REAL encontrada")
                    return []
                
                # Criar lista de dados mensais
                lancamentos_fdc_real = []
                
                # Gerar datas para os 12 meses (outubro 2025 a setembro 2026)
                from datetime import date
                from calendar import monthrange
                
                # Usar as mesmas datas da Habitus Foreca$t (outubro 2025 a setembro 2026)
                ano_inicial = 2025
                mes_inicial = 10  # Outubro
                
                for i, valor in enumerate(dados_fdc_real):
                    if pd.notna(valor):
                        # Calcular data do mês baseado na sequência outubro 2025 a setembro 2026
                        mes_atual = mes_inicial + i
                        if mes_atual > 12:
                            mes_atual = mes_atual - 12
                            ano_atual = ano_inicial + 1
                        else:
                            ano_atual = ano_inicial
                        
                        # Último dia do mês
                        ultimo_dia = monthrange(ano_atual, mes_atual)[1]
                        data_competencia = date(ano_atual, mes_atual, ultimo_dia)
                        
                        lancamentos_fdc_real.append({
                            'data_competencia': data_competencia,
                            'valor': float(valor),
                            'tipo': 'ENTRADA',  # FDC-REAL geralmente são entradas
                            'origem': 'REALIZADO',
                            'categoria': 'FDC-REAL',
                            'descricao': f'Dados FDC-REAL - {data_competencia.strftime("%B %Y")}'
                        })
                
                print(f"Extraídos {len(lancamentos_fdc_real)} lançamentos FDC-REAL")
                return lancamentos_fdc_real
                
        except Exception as e:
            print(f"Erro ao extrair dados FDC-REAL: {str(e)}")
            return []
    
    def processar_planilha_completa(self, caminho_arquivo: str, usuario_id: int, caminho_permanente: str = None) -> Dict[str, Any]:
        """Processa a planilha completa e salva no banco de dados"""
        try:
            # 1. Validar planilha
            validacao = self.validar_planilha(caminho_arquivo)
            if not validacao['valido']:
                raise Exception(validacao['erro'])
            
            # 2. Mover arquivo para localização permanente se especificado
            if caminho_permanente:
                import shutil
                shutil.move(caminho_arquivo, caminho_permanente)
                caminho_arquivo = caminho_permanente
                print(f"Arquivo movido para: {caminho_permanente}")
            
            # 3. Calcular hash do arquivo
            hash_arquivo = self.calcular_hash_arquivo(caminho_arquivo)
            
            # 4. Verificar se arquivo já foi processado (apenas se for exatamente o mesmo arquivo)
            # Removido para permitir múltiplos uploads de planilhas diferentes
            # arquivo_existente = ArquivoUpload.query.filter_by(hash_arquivo=hash_arquivo).first()
            # if arquivo_existente:
            #     return {
            #         'status': 'arquivo_ja_processado',
            #         'projeto_id': arquivo_existente.projeto_id,
            #         'message': 'Este arquivo já foi processado anteriormente'
            #     }
            
            # 5. Extrair parâmetros gerais
            parametros = self.extrair_parametros_gerais(caminho_arquivo)

            # 5.1. Extrair indicadores da aba 'indicadores forecast', se disponível
            indicadores = self.extrair_indicadores_forecast(caminho_arquivo)
            
            # 6. Criar um novo projeto para cada arquivo
            import os
            nome_arquivo = os.path.basename(caminho_arquivo)
            nome_projeto = f"Projeto {nome_arquivo.split('_')[0][:8]}"
            
            # Sempre criar um novo projeto para cada arquivo
            projeto = Projeto(
                usuario_id=usuario_id,
                nome_cliente=nome_projeto,
                data_base_estudo=date.today(),
                saldo_inicial_caixa=0,
                ponto_equilibrio=indicadores.get('ponto_equilibrio', 0.0),
                geracao_fdc_livre=indicadores.get('geracao_fdc_livre', 0.0),
                percentual_custo_fixo=indicadores.get('percentual_custo_fixo', 0.0)
            )
            db.session.add(projeto)
            db.session.flush()  # Para obter o ID
            
            # 7. Buscar configurações de cenários do usuário
            config_cenarios = ConfiguracaoCenarios.query.filter_by(usuario_id=usuario_id).first()
            
            # Se não houver configuração, usar valores padrão (0 para todos)
            if config_cenarios:
                percentuais = {
                    'pessimista': float(config_cenarios.pessimista) if config_cenarios.pessimista else 0,
                    'realista': float(config_cenarios.realista) if config_cenarios.realista else 0,
                    'otimista': float(config_cenarios.otimista) if config_cenarios.otimista else 0,
                    'agressivo': float(config_cenarios.agressivo) if config_cenarios.agressivo else 0
                }
            else:
                percentuais = {
                    'pessimista': 0,
                    'realista': 0,
                    'otimista': 0,
                    'agressivo': 0
                }
            
            print(f"Configurações de cenários encontradas: {percentuais}")
            
            # 8. Garantir que categorias existem
            self.garantir_categorias_existem()
            
            # 9. Extrair dados financeiros da planilha (base)
            dados_habitus_forecast = self.extrair_dados_habitus_forecast(caminho_arquivo)
            
            # 9.1. Extrair dados FDC-REAL (dados realizados - não variam por cenário)
            dados_fdc_real = self.extrair_dados_fdc_real(caminho_arquivo)
            
            # Criar categoria FDC-REAL se não existir
            categoria_fdc_real = CategoriaFinanceira.query.filter_by(nome='FDC-REAL').first()
            if not categoria_fdc_real:
                categoria_fdc_real = CategoriaFinanceira(
                    nome='FDC-REAL',
                    tipo_fluxo='OPERACIONAL'
                )
                db.session.add(categoria_fdc_real)
                db.session.flush()
            
            # 10. Criar 4 cenários automaticamente
            # NOVA LÓGICA: Realista é o ponto zero (base), outros são variações relativas ao Realista
            nome_arquivo = os.path.basename(caminho_arquivo)
            
            # Primeiro criar o Realista (ponto zero - dados da planilha sem ajuste)
            cenario_realista = Cenario(
                projeto_id=projeto.id,
                nome='Realista',
                descricao=f'Cenário Realista baseado na planilha {nome_arquivo} (ponto zero - base)',
                is_active=True
            )
            db.session.add(cenario_realista)
            db.session.flush()
            
            # Salvar dados do Realista primeiro (será usado como base para outros cenários)
            # Apenas dados Habitus Foreca$t (projetados), FDC-REAL será processado separadamente
            lancamentos_realista = []
            lancamentos_criados_realista = 0
            
            for dado in dados_habitus_forecast:
                categoria = CategoriaFinanceira.query.filter_by(nome=dado['categoria_nome']).first()
                if categoria:
                    lancamento = LancamentoFinanceiro(
                        cenario_id=cenario_realista.id,
                        categoria_id=categoria.id,
                        data_competencia=dado['data_competencia'],
                        valor=dado['valor'],  # Sem ajuste - dados originais da planilha
                        tipo=dado['tipo'],
                        origem=dado['origem']
                    )
                    db.session.add(lancamento)
                    # Armazenar apenas dados Habitus Foreca$t (não FDC-REAL)
                    if dado['categoria_nome'] != 'FDC-REAL':
                        lancamentos_realista.append({
                            'categoria_id': categoria.id,
                            'data_competencia': dado['data_competencia'],
                            'valor': dado['valor'],
                            'tipo': dado['tipo'],
                            'origem': dado['origem']
                        })
                    lancamentos_criados_realista += 1
            
            # Processar FDC-REAL para Realista
            if dados_fdc_real:
                for i, dado_fdc in enumerate(dados_fdc_real):
                    try:
                        lancamento_fdc = LancamentoFinanceiro(
                            cenario_id=cenario_realista.id,
                            categoria_id=categoria_fdc_real.id,
                            data_competencia=dado_fdc['data_competencia'],
                            valor=dado_fdc['valor'],
                            tipo=dado_fdc['tipo'],
                            origem='REALIZADO'
                        )
                        db.session.add(lancamento_fdc)
                        lancamentos_criados_realista += 1
                    except Exception as e:
                        print(f"Erro ao criar lançamento FDC-REAL {i+1} para Realista: {e}")
                        continue
            
            print(f"Cenário Realista criado: ID={cenario_realista.id} ({lancamentos_criados_realista} lançamentos)")
            
            # Agora criar os outros cenários baseados no Realista
            cenarios_config = [
                {'nome': 'Pessimista', 'percentual': percentuais['pessimista'], 'is_active': False},
                {'nome': 'Otimista', 'percentual': percentuais['otimista'], 'is_active': False},
                {'nome': 'Agressivo', 'percentual': percentuais['agressivo'], 'is_active': False}
            ]
            
            lancamentos_criados_total = lancamentos_criados_realista
            cenarios_criados = [cenario_realista]
            
            for config_cenario in cenarios_config:
                # Criar cenário
                # Calcular multiplicador baseado no percentual (relativo ao Realista)
                # Pessimista: negativo (ex: -15% = 0.85)
                # Otimista/Agressivo: positivo (ex: 10% = 1.10, 30% = 1.30)
                multiplicador = 1 + (config_cenario['percentual'] / 100)
                
                cenario = Cenario(
                    projeto_id=projeto.id,
                    nome=config_cenario['nome'],
                    descricao=f'Cenário {config_cenario["nome"]} baseado no Realista ({config_cenario["percentual"]:+}% em relação ao Realista)',
                    is_active=config_cenario['is_active']
                )
                db.session.add(cenario)
                db.session.flush()
                cenarios_criados.append(cenario)
                print(f"Cenário criado: {cenario.nome} (ID: {cenario.id}, Variação: {config_cenario['percentual']:+}% do Realista, Multiplicador: {multiplicador:.4f})")
                
                lancamentos_criados = 0
                
                # Processar dados baseados no Realista (não na planilha diretamente)
                # Apenas dados projetados (Habitus Foreca$t) - FDC-REAL é processado separadamente abaixo
                for lancamento_realista in lancamentos_realista:
                    valor_ajustado = lancamento_realista['valor']
                    
                    # Aplicar multiplicador apenas para valores de ENTRADA (receitas)
                    # Valores de SAÍDA (despesas) permanecem iguais ao Realista
                    if lancamento_realista['tipo'] == 'ENTRADA':
                        valor_ajustado = lancamento_realista['valor'] * multiplicador
                    
                    lancamento = LancamentoFinanceiro(
                        cenario_id=cenario.id,
                        categoria_id=lancamento_realista['categoria_id'],
                        data_competencia=lancamento_realista['data_competencia'],
                        valor=valor_ajustado,
                        tipo=lancamento_realista['tipo'],
                        origem=lancamento_realista['origem']
                    )
                    db.session.add(lancamento)
                    lancamentos_criados += 1
                    if lancamento_realista['tipo'] == 'ENTRADA':
                        print(f"  Lançamento {config_cenario['nome']}: {lancamento_realista['data_competencia']} = R$ {lancamento_realista['valor']:.2f} (Realista) -> R$ {valor_ajustado:.2f} ({config_cenario['percentual']:+}%)")
                
                # Processar dados FDC-REAL (dados realizados - iguais para todos os cenários)
                # FDC-REAL não varia por cenário, são dados históricos/realizados
                if dados_fdc_real:
                    for i, dado_fdc in enumerate(dados_fdc_real):
                        try:
                            lancamento_fdc = LancamentoFinanceiro(
                                cenario_id=cenario.id,
                                categoria_id=categoria_fdc_real.id,
                                data_competencia=dado_fdc['data_competencia'],
                                valor=dado_fdc['valor'],
                                tipo=dado_fdc['tipo'],
                                origem='REALIZADO'  # Dados FDC-REAL são sempre realizados
                            )
                            db.session.add(lancamento_fdc)
                            lancamentos_criados += 1
                        except Exception as e:
                            print(f"Erro ao criar lançamento FDC-REAL {i+1} para cenário {config_cenario['nome']}: {e}")
                            continue
                
                lancamentos_criados_total += lancamentos_criados
                print(f"  Total de lançamentos criados para {config_cenario['nome']}: {lancamentos_criados}")
            
            # Commit de todos os cenários e lançamentos
            db.session.commit()
            print(f"Processamento completo: {len(cenarios_criados)} cenários criados com {lancamentos_criados_total} lançamentos totais")
            
            # 9. Registrar arquivo
            # Converter datas para strings para evitar erro de serialização JSON
            parametros_serializaveis = {}
            if parametros:
                for key, value in parametros.items():
                    if isinstance(value, date):
                        parametros_serializaveis[key] = value.isoformat()
                    elif isinstance(value, datetime):
                        parametros_serializaveis[key] = value.isoformat()
                    else:
                        parametros_serializaveis[key] = value
            
            arquivo_upload = ArquivoUpload(
                projeto_id=projeto.id,
                nome_original=os.path.basename(caminho_arquivo),
                caminho_storage=caminho_arquivo,
                hash_arquivo=hash_arquivo,
                status_processamento='processado',
                relatorio_processamento={
                    'lancamentos_criados': lancamentos_criados_total,
                    'cenarios_criados': len(cenarios_criados),
                    'categorias_processadas': len(self.categorias_mapeamento),
                    'parametros_extraidos': parametros_serializaveis,
                    'percentuais_aplicados': percentuais
                }
            )
            
            print(f"Criando ArquivoUpload: projeto_id={projeto.id}, nome={os.path.basename(caminho_arquivo)}")
            db.session.add(arquivo_upload)
            db.session.commit()
            print(f"ArquivoUpload criado com ID: {arquivo_upload.id}")
            
            return {
                'status': 'sucesso',
                'projeto_id': projeto.id,
                'lancamentos_criados': lancamentos_criados_total,
                'cenarios_criados': len(cenarios_criados),
                'parametros': parametros,
                'validacao': validacao,
                'hash_arquivo': hash_arquivo,
                'cenarios': [{'id': c.id, 'nome': c.nome} for c in cenarios_criados]
            }
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Erro ao processar planilha: {str(e)}")
