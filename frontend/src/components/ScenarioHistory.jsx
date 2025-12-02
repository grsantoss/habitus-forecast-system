import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Loader2, Clock, User, RotateCcw, Save, FileText, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';

const ScenarioHistory = ({ scenarioId, cenarioAtivo, onVersionRestored }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historico, setHistorico] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [snapshotDescricao, setSnapshotDescricao] = useState('');
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (scenarioId) {
      fetchHistorico();
    }
  }, [scenarioId]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectsAPI.listHistorico(scenarioId);
      setHistorico(response.data.historico || []);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError('Erro ao carregar histórico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setCreatingSnapshot(true);
      await projectsAPI.createSnapshot(scenarioId, snapshotDescricao);
      setSnapshotDescricao('');
      setShowCreateDialog(false);
      await fetchHistorico();
      alert('Snapshot criado com sucesso!');
    } catch (err) {
      console.error('Erro ao criar snapshot:', err);
      alert(err.response?.data?.message || 'Erro ao criar snapshot. Tente novamente.');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;

    if (!cenarioAtivo) {
      alert('Não é possível restaurar versões em cenários congelados. Descongele o cenário primeiro.');
      return;
    }

    if (!window.confirm(
      `Tem certeza que deseja restaurar esta versão?\n\n` +
      `Versão de: ${formatDate(selectedVersion.created_at)}\n` +
      `Descrição: ${selectedVersion.descricao || 'Sem descrição'}\n\n` +
      `Os dados atuais serão salvos como backup automático antes da restauração.`
    )) {
      return;
    }

    try {
      setRestoring(true);
      await projectsAPI.restoreVersion(scenarioId, selectedVersion.id);
      setShowRestoreDialog(false);
      setSelectedVersion(null);
      alert('Versão restaurada com sucesso! Os dados atuais foram salvos como backup.');
      // Recarregar histórico
      await fetchHistorico();
      // Notificar componente pai para atualizar dados
      if (onVersionRestored) {
        onVersionRestored();
      }
    } catch (err) {
      console.error('Erro ao restaurar versão:', err);
      alert(err.response?.data?.message || 'Erro ao restaurar versão. Tente novamente.');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Cabeçalho com botão de criar snapshot */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Histórico de Versões</h3>
          <p className="text-sm text-gray-600">
            {historico.length} versão(ões) salva(s)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          disabled={!cenarioAtivo}
        >
          <Save className="w-4 h-4 mr-2" />
          Criar Snapshot
        </Button>
      </div>

      {!cenarioAtivo && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Este cenário está congelado. Descongele-o para criar snapshots ou restaurar versões.
          </AlertDescription>
        </Alert>
      )}

      {/* Timeline de versões */}
      {historico.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">Nenhuma versão salva ainda</p>
            <p className="text-sm text-gray-500 mt-2">
              Crie um snapshot para salvar o estado atual do cenário
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {historico.map((versao, index) => {
            const snapshot = versao.snapshot_data || {};
            const stats = snapshot;
            
            return (
              <Card key={versao.id} className={index === 0 ? 'border-blue-300 bg-blue-50/30' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <CardTitle className="text-base">
                          Versão de {formatDate(versao.created_at)}
                        </CardTitle>
                        {index === 0 && (
                          <Badge className="bg-blue-600">Mais Recente</Badge>
                        )}
                      </div>
                      {versao.descricao && (
                        <p className="text-sm text-gray-600 mb-2">{versao.descricao}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {versao.usuario_nome || 'Usuário desconhecido'}
                        </div>
                      </div>
                    </div>
                    {index > 0 && cenarioAtivo && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVersion(versao);
                          setShowRestoreDialog(true);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Lançamentos</p>
                      <p className="font-semibold">{stats.total_lancamentos || snapshot.lancamentos?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Entradas</p>
                      <p className="font-semibold text-green-700">
                        {formatCurrency(stats.total_entradas || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Saídas</p>
                      <p className="font-semibold text-red-700">
                        {formatCurrency(stats.total_saidas || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Saldo Líquido</p>
                      <p className={`font-semibold ${
                        (stats.saldo_liquido || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(stats.saldo_liquido || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de criar snapshot */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Snapshot</DialogTitle>
            <DialogDescription>
              Salve o estado atual do cenário como uma versão para poder restaurá-lo depois
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="snapshot-descricao">Descrição (opcional)</Label>
              <Input
                id="snapshot-descricao"
                value={snapshotDescricao}
                onChange={(e) => setSnapshotDescricao(e.target.value)}
                placeholder="Ex: Antes de alterar valores de receitas"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setSnapshotDescricao('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSnapshot} disabled={creatingSnapshot}>
              {creatingSnapshot ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Snapshot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de restaurar versão */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Versão</DialogTitle>
            <DialogDescription>
              Esta ação irá restaurar o cenário para o estado desta versão. Os dados atuais serão salvos como backup automático.
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="py-4 space-y-2">
              <div>
                <p className="text-sm font-medium">Data da Versão:</p>
                <p className="text-sm text-gray-600">{formatDate(selectedVersion.created_at)}</p>
              </div>
              {selectedVersion.descricao && (
                <div>
                  <p className="text-sm font-medium">Descrição:</p>
                  <p className="text-sm text-gray-600">{selectedVersion.descricao}</p>
                </div>
              )}
              <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  Atenção: Esta ação não pode ser desfeita diretamente. Os dados atuais serão salvos como backup antes da restauração.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRestoreDialog(false);
              setSelectedVersion(null);
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleRestoreVersion}
              disabled={restoring || !cenarioAtivo}
              variant="destructive"
            >
              {restoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Confirmar Restauração
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScenarioHistory;

