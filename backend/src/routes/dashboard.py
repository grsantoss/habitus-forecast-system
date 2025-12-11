from flask import Blueprint, request, jsonify
from datetime import datetime, date
from sqlalchemy import func, extract
from src.models.user import (
    db,
    Projeto,
    Cenario,
    LancamentoFinanceiro,
    CategoriaFinanceira,
    User,
    LogSistema,
    ConfiguracaoCenarios,
)
from src.auth import token_required, admin_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@token_required
def obter_estatisticas_dashboard(current_user):
    """Obtém estatísticas gerais para o dashboard.

    Se admin e for passado ?usuario_id=XYZ, calcula as estatísticas como se fosse esse usuário.
    """
    try:
        indicadores = None
        from datetime import timedelta

        usuario_id_param = request.args.get('usuario_id', type=int)

        # Se admin e foi passado usuario_id, usar esse usuário como alvo
        if current_user.role == 'admin' and usuario_id_param:
            usuario_alvo = User.query.get(usuario_id_param)
            if not usuario_alvo:
                return jsonify({'message': 'Usuário alvo não encontrado'}), 404

            total_projetos = Projeto.query.filter_by(usuario_id=usuario_alvo.id).count()
            total_usuarios = 1
            projetos_mes_atual = Projeto.query.filter(
                Projeto.usuario_id == usuario_alvo.id,
                extract('month', Projeto.created_at) == datetime.now().month,
                extract('year', Projeto.created_at) == datetime.now().year
            ).count()

            data_limite = datetime.now() - timedelta(days=7)
            atividade_recente = LogSistema.query.filter(
                LogSistema.usuario_id == usuario_alvo.id,
                LogSistema.timestamp >= data_limite
            ).count()

            projeto_ref = Projeto.query.filter_by(
                usuario_id=usuario_alvo.id
            ).order_by(Projeto.created_at.desc()).first()

        elif current_user.role == 'admin':
            # Admin sem usuario_id → visão global
            total_projetos = Projeto.query.count()
            total_usuarios = User.query.count()
            projetos_mes_atual = Projeto.query.filter(
                extract('month', Projeto.created_at) == datetime.now().month,
                extract('year', Projeto.created_at) == datetime.now().year
            ).count()

            data_limite = datetime.now() - timedelta(days=7)
            atividade_recente = LogSistema.query.filter(
                LogSistema.timestamp >= data_limite
            ).count()

            projeto_ref = Projeto.query.order_by(Projeto.created_at.desc()).first()

        else:
            # Usuário comum vê apenas seus dados
            total_projetos = Projeto.query.filter_by(usuario_id=current_user.id).count()
            total_usuarios = 1  # Apenas ele mesmo
            projetos_mes_atual = Projeto.query.filter(
                Projeto.usuario_id == current_user.id,
                extract('month', Projeto.created_at) == datetime.now().month,
                extract('year', Projeto.created_at) == datetime.now().year
            ).count()

            data_limite = datetime.now() - timedelta(days=7)
            atividade_recente = LogSistema.query.filter(
                LogSistema.usuario_id == current_user.id,
                LogSistema.timestamp >= data_limite
            ).count()

            projeto_ref = Projeto.query.filter_by(
                usuario_id=current_user.id
            ).order_by(Projeto.created_at.desc()).first()

        if projeto_ref:
            indicadores = {
                'geracao_fdc_livre': float(projeto_ref.geracao_fdc_livre or 0),
                'ponto_equilibrio': float(projeto_ref.ponto_equilibrio or 0),
                'percentual_custo_fixo': float(projeto_ref.percentual_custo_fixo or 0),
            }

        return jsonify({
            'total_projetos': total_projetos,
            'total_usuarios': total_usuarios,
            'projetos_mes_atual': projetos_mes_atual,
            'atividade_recente': atividade_recente,
            'indicadores': indicadores
        })

    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/fluxo-caixa/<int:projeto_id>', methods=['GET'])
@token_required
def obter_fluxo_caixa_projeto(current_user, projeto_id):
    """Obtém dados do fluxo de caixa para gráficos.

    Aplica o cenário de vendas (pessimista/realista/otimista/agressivo) no backend.
    Admin pode visualizar o fluxo de um cliente específico usando ?usuario_id= e
    ?cenario= (Pessimista|Realista|Otimista|Agressivo).
    """
    try:
        projeto = Projeto.query.get_or_404(projeto_id)

        # Verificar permissão básica: admin pode ver tudo, usuário comum só seus projetos
        if current_user.role != 'admin' and projeto.usuario_id != current_user.id:
            return jsonify({'message': 'Acesso negado'}), 403

        # Determinar usuário alvo para fins de cenário
        usuario_id_param = request.args.get('usuario_id', type=int)
        if current_user.role == 'admin' and usuario_id_param:
            target_user_id = usuario_id_param
        else:
            target_user_id = projeto.usuario_id

        # Determinar qual cenário aplicar
        cenario_nome = (request.args.get('cenario') or 'Realista').strip().lower()
        if cenario_nome not in ['pessimista', 'realista', 'otimista', 'agressivo']:
            cenario_nome = 'realista'

        # Buscar configuração de cenários do usuário alvo
        cfg = ConfiguracaoCenarios.query.filter_by(usuario_id=target_user_id).first()
        if cfg:
            if cenario_nome == 'pessimista':
                perc = float(cfg.pessimista or 0)
            elif cenario_nome == 'otimista':
                perc = float(cfg.otimista or 0)
            elif cenario_nome == 'agressivo':
                perc = float(cfg.agressivo or 0)
            else:
                # Realista é a base 0%
                perc = 0.0
        else:
            perc = 0.0

        multiplier = 1 + (perc / 100.0)

        # Obter cenário ativo de lançamentos financeiros
        cenario = Cenario.query.filter_by(projeto_id=projeto_id, is_active=True).first()
        if not cenario:
            return jsonify({'message': 'Nenhum cenário ativo encontrado'}), 404

        # Buscar lançamentos projetados (Habitus Foreca$t)
        lancamentos_projetados = db.session.query(
            LancamentoFinanceiro.data_competencia,
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo,
            func.sum(LancamentoFinanceiro.valor).label('total')
        ).join(
            CategoriaFinanceira
        ).filter(
            LancamentoFinanceiro.cenario_id == cenario.id,
            LancamentoFinanceiro.origem == 'PROJETADO'
        ).group_by(
            LancamentoFinanceiro.data_competencia,
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo
        ).order_by(
            LancamentoFinanceiro.data_competencia
        ).all()

        # Buscar lançamentos realizados (FDC-REAL)
        lancamentos_realizados = db.session.query(
            LancamentoFinanceiro.data_competencia,
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo,
            func.sum(LancamentoFinanceiro.valor).label('total')
        ).join(
            CategoriaFinanceira
        ).filter(
            LancamentoFinanceiro.cenario_id == cenario.id,
            LancamentoFinanceiro.origem == 'REALIZADO'
        ).group_by(
            LancamentoFinanceiro.data_competencia,
            CategoriaFinanceira.nome,
            LancamentoFinanceiro.tipo
        ).order_by(
            LancamentoFinanceiro.data_competencia
        ).all()

        # Organizar dados para o gráfico - criar 12 meses baseados na data-base
        dados_grafico = {}

        # Criar estrutura para 12 meses baseados na data-base (outubro 2025)
        meses_base = [
            '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03',
            '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'
        ]

        for mes in meses_base:
            dados_grafico[mes] = {
                'mes': mes,
                'receita': 0.0,  # Linha verde - Habitus Foreca$t (com cenário)
                'fdc_real': 0.0  # Linha preta - FDC-REAL
            }

        # Processar dados projetados (Habitus Foreca$t)
        saldo_inicial = float(projeto.saldo_inicial_caixa or 0)

        for lancamento in lancamentos_projetados:
            mes = lancamento.data_competencia.strftime('%Y-%m')
            if mes in dados_grafico:
                # Usar apenas a categoria HABITUS_FORECA$T-GRAFICO / PROFECIA-GRAFICO para a linha verde
                if (lancamento.nome == 'HABITUS_FORECA$T-GRAFICO' or lancamento.nome == 'PROFECIA-GRAFICO') and lancamento.tipo == 'ENTRADA':
                    valor_base = float(lancamento.total or 0)
                    # Aplica cenário somente sobre o fluxo (sem saldo inicial)
                    valor_ajustado = valor_base * multiplier
                    valor_com_saldo = valor_ajustado + saldo_inicial
                    dados_grafico[mes]['receita'] = valor_com_saldo
                    print(f"Mês {mes}: base={valor_base} perc={perc} -> ajustado={valor_ajustado} + saldo({saldo_inicial}) = {valor_com_saldo}")

        # Processar dados realizados (FDC-REAL)
        for lancamento in lancamentos_realizados:
            mes = lancamento.data_competencia.strftime('%Y-%m')
            if mes in dados_grafico and lancamento.nome == 'FDC-REAL' and lancamento.tipo == 'ENTRADA':
                dados_grafico[mes]['fdc_real'] = float(lancamento.total or 0)

        # Calcular saldo acumulado (usando receita projetada)
        saldo_acumulado = float(projeto.saldo_inicial_caixa or 0)
        for mes_data in sorted(dados_grafico.keys()):
            dados_grafico[mes_data]['saldo'] = saldo_acumulado + dados_grafico[mes_data]['receita']
            saldo_acumulado = dados_grafico[mes_data]['saldo']

        # Limitar a 12 meses
        dados_fluxo_ordenados = sorted(dados_grafico.values(), key=lambda x: x['mes'])
        dados_fluxo_limitados = dados_fluxo_ordenados[:12]

        return jsonify({
            'projeto': projeto.to_dict(),
            'cenario': cenario.to_dict(),
            'dados_fluxo': dados_fluxo_limitados
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

@dashboard_bp.route('/dashboard/saldo-inicial', methods=['POST'])
@token_required
def atualizar_saldo_inicial(current_user):
    """Atualiza o saldo inicial do caixa do projeto do usuário.

    Se admin e for passado ?usuario_id=XYZ, atualiza o projeto desse usuário alvo.
    """
    try:
        data = request.get_json()
        saldo_inicial = data.get('saldo_inicial', 0)
        
        # Validar valor
        try:
            saldo_inicial = float(saldo_inicial)
            if saldo_inicial < 0:
                return jsonify({'message': 'Saldo inicial não pode ser negativo'}), 400
            if saldo_inicial > 1000000:
                return jsonify({'message': 'Saldo inicial não pode ser maior que R$ 1.000.000,00'}), 400
        except (ValueError, TypeError):
            return jsonify({'message': 'Valor inválido para saldo inicial'}), 400
        
        # Determinar usuário alvo
        target_user_id = current_user.id
        if current_user.role == 'admin':
            usuario_id_param = request.args.get('usuario_id', type=int)
            if usuario_id_param:
                # Validar se o usuário existe
                target_user = User.query.get(usuario_id_param)
                if not target_user:
                    return jsonify({
                        'message': f'Usuário com ID {usuario_id_param} não encontrado'
                    }), 404
                target_user_id = usuario_id_param
        
        # Buscar projeto do usuário (ou do usuário alvo)
        projeto = Projeto.query.filter_by(usuario_id=target_user_id).first()
        if not projeto:
            # Criar projeto padrão se não existir
            from datetime import date
            projeto = Projeto(
                usuario_id=target_user_id,
                nome_cliente='Projeto Padrão',
                data_base_estudo=date.today(),
                saldo_inicial_caixa=saldo_inicial,
                ponto_equilibrio=0
            )
            db.session.add(projeto)
            db.session.flush()
        
        # Atualizar saldo inicial
        projeto.saldo_inicial_caixa = saldo_inicial
        db.session.commit()
        
        # Log da alteração
        log = LogSistema(
            usuario_id=current_user.id,
            acao='SALDO_INICIAL_ATUALIZADO',
            detalhes={
                'projeto_id': projeto.id,
                'saldo_anterior': getattr(projeto, 'saldo_inicial_caixa_anterior', 0),
                'saldo_novo': saldo_inicial,
                'usuario_alvo_id': target_user_id
            }
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Saldo inicial atualizado com sucesso',
            'saldo_inicial': saldo_inicial,
            'projeto_id': projeto.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/saldo-inicial', methods=['GET'])
@token_required
def obter_saldo_inicial(current_user):
    """Obtém o saldo inicial do caixa do projeto do usuário.

    Se admin e for passado ?usuario_id=XYZ, retorna o projeto desse usuário alvo.
    """
    try:
        # Determinar usuário alvo
        target_user_id = current_user.id
        if current_user.role == 'admin':
            usuario_id_param = request.args.get('usuario_id', type=int)
            if usuario_id_param:
                # Validar se o usuário existe
                target_user = User.query.get(usuario_id_param)
                if not target_user:
                    return jsonify({
                        'message': f'Usuário com ID {usuario_id_param} não encontrado'
                    }), 404
                target_user_id = usuario_id_param

        # Buscar projeto do usuário (ou do usuário alvo)
        projeto = Projeto.query.filter_by(usuario_id=target_user_id).first()
        if not projeto:
            # Retornar valores padrão quando não há projeto
            return jsonify({
                'saldo_inicial': 0.0,
                'ponto_equilibrio': 0.0,
                'projeto_id': None,
                'message': 'Nenhum projeto encontrado. Faça upload de uma planilha para criar um projeto.'
            }), 200
        
        return jsonify({
            'saldo_inicial': float(projeto.saldo_inicial_caixa or 0),
            'ponto_equilibrio': float(projeto.ponto_equilibrio or 0),
            'projeto_id': projeto.id
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/ponto-equilibrio', methods=['POST'])
@token_required
def atualizar_ponto_equilibrio(current_user):
    """Atualiza o ponto de equilíbrio do projeto do usuário.

    Se admin e for passado ?usuario_id=XYZ, atualiza o projeto desse usuário alvo.
    """
    try:
        data = request.get_json()
        ponto_equilibrio = data.get('ponto_equilibrio', 0)
        
        # Validar valor
        try:
            ponto_equilibrio = float(ponto_equilibrio)
            if ponto_equilibrio < 0:
                return jsonify({'message': 'Ponto de equilíbrio não pode ser negativo'}), 400
        except (ValueError, TypeError):
            return jsonify({'message': 'Valor inválido para ponto de equilíbrio'}), 400
        
        # Determinar usuário alvo
        target_user_id = current_user.id
        if current_user.role == 'admin':
            usuario_id_param = request.args.get('usuario_id', type=int)
            if usuario_id_param:
                # Validar se o usuário existe
                target_user = User.query.get(usuario_id_param)
                if not target_user:
                    return jsonify({
                        'message': f'Usuário com ID {usuario_id_param} não encontrado'
                    }), 404
                target_user_id = usuario_id_param

        # Buscar projeto do usuário (ou do usuário alvo)
        projeto = Projeto.query.filter_by(usuario_id=target_user_id).first()
        if not projeto:
            # Criar projeto padrão se não existir
            from datetime import date
            projeto = Projeto(
                usuario_id=target_user_id,
                nome_cliente='Projeto Padrão',
                data_base_estudo=date.today(),
                saldo_inicial_caixa=0,
                ponto_equilibrio=ponto_equilibrio
            )
            db.session.add(projeto)
            db.session.flush()
        
        # Atualizar ponto de equilíbrio
        projeto.ponto_equilibrio = ponto_equilibrio
        db.session.commit()
        
        # Log da alteração
        log = LogSistema(
            usuario_id=current_user.id,
            acao='PONTO_EQUILIBRIO_ATUALIZADO',
            detalhes={
                'projeto_id': projeto.id,
                'ponto_equilibrio_anterior': getattr(projeto, 'ponto_equilibrio_anterior', 0),
                'ponto_equilibrio_novo': ponto_equilibrio,
                'usuario_alvo_id': target_user_id
            }
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'message': 'Ponto de equilíbrio atualizado com sucesso',
            'ponto_equilibrio': ponto_equilibrio,
            'projeto_id': projeto.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro interno: {str(e)}'}), 500
