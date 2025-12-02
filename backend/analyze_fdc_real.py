import pandas as pd
import sys
import os

def analyze_fdc_real_line_63():
    # Caminho para o arquivo
    file_path = 'src/uploads/1caaad47-18d7-439f-a858-9a0042d1dc5b_HABITUS_FORECA$T-SMASH_102025.xlsx'
    
    try:
        print("Analisando a planilha...")
        print("=" * 50)
        
        # Ler o arquivo Excel
        with pd.ExcelFile(file_path, engine='openpyxl') as excel_file:
            # Verificar se a aba FDC-REAL existe
            if 'FDC-REAL' not in excel_file.sheet_names:
                print("❌ Aba 'FDC-REAL' não encontrada!")
                print(f"Abas disponíveis: {excel_file.sheet_names}")
                return
            
            print("✅ Aba 'FDC-REAL' encontrada!")
            
            # Ler a aba FDC-REAL
            df = pd.read_excel(excel_file, sheet_name='FDC-REAL', header=None)
            
            print(f"📊 Dimensões da aba FDC-REAL: {df.shape[0]} linhas x {df.shape[1]} colunas")
            
            # Verificar se a linha 63 existe (índice 62, pois começa em 0)
            if df.shape[0] < 63:
                print(f"❌ A planilha tem apenas {df.shape[0]} linhas. Linha 63 não existe!")
                return
            
            # Extrair a linha 63 (índice 62)
            linha_63 = df.iloc[62]  # Índice 62 = linha 63
            
            print("\n📋 CONTEÚDO DA LINHA 63:")
            print("=" * 50)
            
            # Mostrar cada célula da linha
            for i, valor in enumerate(linha_63):
                if pd.notna(valor):  # Só mostrar valores não nulos
                    print(f"Coluna {i+1}: {valor}")
            
            print("\n📊 RESUMO DA LINHA 63:")
            print(f"Total de colunas: {len(linha_63)}")
            print(f"Valores não nulos: {linha_63.notna().sum()}")
            print(f"Valores nulos: {linha_63.isna().sum()}")
            
            # Mostrar as primeiras 10 colunas com valores
            print("\n🔍 PRIMEIRAS 10 COLUNAS COM VALORES:")
            valores_nao_nulos = linha_63.dropna()
            for i, (idx, valor) in enumerate(valores_nao_nulos.head(10).items()):
                print(f"Coluna {idx+1}: {valor}")
            
    except Exception as e:
        print(f"❌ Erro ao analisar a planilha: {e}")

if __name__ == "__main__":
    analyze_fdc_real_line_63()