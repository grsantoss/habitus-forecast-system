from flask import Blueprint, request, jsonify
from datetime import datetime, date
from sqlalchemy import func, extract
from src.models.user import db, Projeto, Cenario, LancamentoFinanceiro, CategoriaFinanceira, User, LogSistema
from src.auth import token_required, admin_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@token_required
def obter_estatisticas_dashboard(current_user):
    """Obtém estatísticas gerais para o dashboard"""
    try:
        if current_user.role == 'admin':
            # Admin vê estatísticas globais
            total_projetos = Projeto.query.count()
            total_usuarios = User.query.count()
            projetos_mes_atual = Projeto.query.filter(
                extract('month', Projeto.created_at) == datetime.now().month,
                extract('year', Projeto.created_at) == datetime.now().year
            ).count()
            
            # Atividade recente (últimos 7 dias)
            from datetime import timedelta
            data_limite = datetime.now() - timedelta(days=7)
            atividade_recente = LogSistema.query.filter(
                LogSistema.timestamp >= data_limite
            ).count()
            
        else:
            # Usuário comum vê apenas seus dados
            total_projetos = Projeto.query.filter_by(usuario_id=current_user.id).count()
            total_usuarios = 1  # Apenas ele mesmo
            projetos_mes_atual = Projeto.query.filter(
                Projeto.usuario_id == current_user.id,
                extract('month', Projeto.created_at) == datetime.now().month,
                extract('year', Projeto.created_at) == datetime.now().year
            ).count()
            
            # Atividade recente do usuário
            from datetime import timedelta
            data_limite = datetime.now() - timedelta(days=7)
            atividade_recente = LogSistema.query.filter(
                LogSistema.usuario_id == current_user.id,
                LogSistema.timestamp >= data_limite
            ).count()
        
        return jsonify({
            'total_projetos': total_projetos,
            'total_usuarios': total_usuarios,
            'projetos_mes_atual': projetos_mes_atual,
            'atividade_recente': atividade_recente
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/fluxo-caixa/<int:projeto_id>', methods=['GET'])
@token_required
def obter_fluxo_caixa_projeto(current_user, projeto_id):
    """Obtém dados do fluxo de caixa para gráficos"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        
        # Verificar permissão
        if current_user.role != 'admin' and projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403
        
        # Obter cenário ativo
        cenario = Cenario.query.filter_by(projeto_id=projeto_id, is_active=True).first()
        if not cenario:
            return jsonify({'message': 'Nenhum cenário ativo encontrado'}), 404
        
        # Buscar lançamentos agrupados por mês
        lancamentos = db.session.query(
            LancamentoFinanceiro.data_competencia,
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo,
            func.sum(LancamentoFinanceiro.valor).label('total')
        ).join(
            CategoriaFinanceira
        ).filter(
            LancamentoFinanceiro.cenario_id == cenario.id
        ).group_by(
            LancamentoFinanceiro.data_competencia,
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo
        ).order_by(
            LancamentoFinanceiro.data_competencia
        ).all()
        
        # Organizar dados para o gráfico
        dados_grafico = {}
        for lancamento in lancamentos:
            mes = lancamento.data_competencia.strftime('%Y-%m')
            if mes not in dados_grafico:
                dados_grafico[mes] = {
                    'mes': mes,
                    'entradas': 0,
                    'saidas': 0,
                    'saldo': 0
                }
            
            if lancamento.tipo == 'ENTRADA':
                dados_grafico[mes]['entradas'] += float(lancamento.total)
            else:
                dados_grafico[mes]['saidas'] += float(lancamento.total)
        
        # Calcular saldo acumulado
        saldo_acumulado = float(projeto.saldo_inicial_caixa)
        for mes_data in sorted(dados_grafico.keys()):
            dados_grafico[mes_data]['saldo'] = saldo_acumulado + dados_grafico[mes_data]['entradas'] - dados_grafico[mes_data]['saidas']
            saldo_acumulado = dados_grafico[mes_data]['saldo']
        
        return jsonify({
            'projeto': projeto.to_dict(),
            'cenario': cenario.to_dict(),
            'dados_fluxo': list(dados_grafico.values())
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/categorias/<int:projeto_id>', methods=['GET'])
@token_required
def obter_dados_por_categoria(current_user, projeto_id):
    """Obtém dados agrupados por categoria para gráficos de pizza"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        
        # Verificar permissão
        if current_user.role != 'admin' and projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403
        
        # Obter cenário ativo
        cenario = Cenario.query.filter_by(projeto_id=projeto_id, is_active=True).first()
        if not cenario:
            return jsonify({'message': 'Nenhum cenário ativo encontrado'}), 404
        
        # Buscar totais por categoria
        totais_categoria = db.session.query(
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo,
            func.sum(LancamentoFinanceiro.valor).label('total')
        ).join(
            CategoriaFinanceira
        ).filter(
            LancamentoFinanceiro.cenario_id == cenario.id
        ).group_by(
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo
        ).all()
        
        entradas = []
        saidas = []
        
        for categoria in totais_categoria:
            dados_categoria = {
                'categoria': categoria.nome,
                'valor': float(categoria.total)
            }
            
            if categoria.tipo == 'ENTRADA':
                entradas.append(dados_categoria)
            else:
                saidas.append(dados_categoria)
        
        return jsonify({
            'entradas': entradas,
            'saidas': saidas
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/atividade-plataforma', methods=['GET'])
@admin_required
def obter_atividade_plataforma(current_user):
    """Obtém dados de atividade da plataforma (apenas admin)"""
    try:
        # Atividade dos últimos 30 dias
        from datetime import timedelta
        data_limite = datetime.now() - timedelta(days=30)
        
        atividade_diaria = db.session.query(
            func.date(LogSistema.timestamp).label('data'),
            func.count(LogSistema.id).label('total')
        ).filter(
            LogSistema.timestamp >= data_limite
        ).group_by(
            func.date(LogSistema.timestamp)
        ).order_by(
            func.date(LogSistema.timestamp)
        ).all()
        
        dados_atividade = []
        for atividade in atividade_diaria:
            dados_atividade.append({
                'data': atividade.data.strftime('%Y-%m-%d'),
                'atividades': atividade.total
            })
        
        # Tipos de ação mais comuns
        acoes_populares = db.session.query(
            LogSistema.acao,
            func.count(LogSistema.id).label('total')
        ).filter(
            LogSistema.timestamp >= data_limite
        ).group_by(
            LogSistema.acao
        ).order_by(
            func.count(LogSistema.id).desc()
        ).limit(10).all()
        
        dados_acoes = []
        for acao in acoes_populares:
            dados_acoes.append({
                'acao': acao.acao,
                'total': acao.total
            })
        
        return jsonify({
            'atividade_diaria': dados_atividade,
            'acoes_populares': dados_acoes
        })
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/usuarios-ativos', methods=['GET'])
@admin_required
def obter_usuarios_ativos(current_user):
    """Obtém lista de usuários mais ativos (apenas admin)"""
    try:
        from datetime import timedelta
        data_limite = datetime.now() - timedelta(days=30)
        
        usuarios_ativos = db.session.query(
            User.nome,
            User.email,
            func.count(LogSistema.id).label('atividades')
        ).join(
            LogSistema, User.id == LogSistema.usuario_id
        ).filter(
            LogSistema.timestamp >= data_limite
        ).group_by(
            User.id, User.nome, User.email
        ).order_by(
            func.count(LogSistema.id).desc()
        ).limit(10).all()
        
        dados_usuarios = []
        for usuario in usuarios_ativos:
            dados_usuarios.append({
                'nome': usuario.nome,
                'email': usuario.email,
                'atividades': usuario.atividades
            })
        
        return jsonify({'usuarios_ativos': dados_usuarios})
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500
