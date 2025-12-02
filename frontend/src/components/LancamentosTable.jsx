import React, { useState } from 'react';
import { projectsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

const LancamentosTable = ({ lancamentos, categorias, cenarioId, cenarioAtivo, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleEdit = (lancamento) => {
    if (!cenarioAtivo) {
      alert('Não é possível editar lançamentos em cenários congelados. Descongele o cenário primeiro.');
      return;
    }
    setEditingId(lancamento.id);
    setEditingData({
      categoria_id: lancamento.categoria_id.toString(),
      categoria_nome: lancamento.categoria_nome,
      data_competencia: formatDate(lancamento.data_competencia),
      valor: lancamento.valor.toString(),
      tipo: lancamento.tipo,
      origem: lancamento.origem
    });
    setError('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
    setError('');
  };

  const handleSave = async () => {
    if (!editingData.categoria_id || !editingData.data_competencia || !editingData.valor) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (parseFloat(editingData.valor) <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await projectsAPI.updateLancamento(cenarioId, editingId, {
        categoria_id: parseInt(editingData.categoria_id),
        data_competencia: editingData.data_competencia,
        valor: parseFloat(editingData.valor),
        tipo: editingData.tipo,
        origem: editingData.origem
      });

      setEditingId(null);
      setEditingData({});
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Erro ao atualizar lançamento:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar lançamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lancamentoId) => {
    if (!cenarioAtivo) {
      alert('Não é possível deletar lançamentos em cenários congelados. Descongele o cenário primeiro.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir este lançamento?\n\nEsta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingId(lancamentoId);
      setError('');

      await projectsAPI.deleteLancamento(cenarioId, lancamentoId);

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Erro ao deletar lançamento:', err);
      alert(err.response?.data?.message || 'Erro ao deletar lançamento');
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (field, value) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  if (!lancamentos || lancamentos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum lançamento encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lancamentos.map((lancamento) => (
              <TableRow key={lancamento.id}>
                {editingId === lancamento.id ? (
                  <>
                    <TableCell>
                      <Input
                        type="date"
                        value={editingData.data_competencia}
                        onChange={(e) => handleChange('data_competencia', e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editingData.categoria_id}
                        onValueChange={(value) => {
                          const categoria = categorias.find(c => c.id.toString() === value);
                          handleChange('categoria_id', value);
                          if (categoria) {
                            handleChange('categoria_nome', categoria.nome);
                          }
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editingData.tipo}
                        onValueChange={(value) => handleChange('tipo', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ENTRADA">Entrada</SelectItem>
                          <SelectItem value="SAIDA">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editingData.valor}
                        onChange={(e) => handleChange('valor', e.target.value)}
                        className="w-32 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editingData.origem}
                        onValueChange={(value) => handleChange('origem', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROJETADO">Projetado</SelectItem>
                          <SelectItem value="REALIZADO">Realizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSave}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      {new Date(lancamento.data_competencia).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{lancamento.categoria_nome}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        lancamento.tipo === 'ENTRADA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {lancamento.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={lancamento.tipo === 'ENTRADA' ? 'text-green-700' : 'text-red-700'}>
                        {formatCurrency(lancamento.valor)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600">
                        {lancamento.origem === 'PROJETADO' ? 'Projetado' : 'Realizado'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(lancamento)}
                          disabled={!cenarioAtivo || deletingId === lancamento.id}
                          title={!cenarioAtivo ? 'Cenário congelado' : 'Editar'}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(lancamento.id)}
                          disabled={!cenarioAtivo || deletingId === lancamento.id}
                          className="text-red-600 hover:text-red-700"
                          title={!cenarioAtivo ? 'Cenário congelado' : 'Excluir'}
                        >
                          {deletingId === lancamento.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LancamentosTable;

