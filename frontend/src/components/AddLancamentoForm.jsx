import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const AddLancamentoForm = ({ cenarioId, cenarioAtivo, onSuccess, onCancel }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    categoria_id: '',
    data_competencia: '',
    valor: '',
    tipo: 'ENTRADA',
    origem: 'PROJETADO'
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const response = await projectsAPI.listCategorias();
      setCategorias(response.data.categorias || []);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      setError('Erro ao carregar categorias');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cenarioAtivo) {
      setError('Não é possível adicionar lançamentos em cenários congelados. Descongele o cenário primeiro.');
      return;
    }

    // Validações
    if (!formData.categoria_id) {
      setError('Selecione uma categoria');
      return;
    }
    if (!formData.data_competencia) {
      setError('Informe a data de competência');
      return;
    }
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      setError('Informe um valor válido maior que zero');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await projectsAPI.createLancamento(cenarioId, {
        categoria_id: parseInt(formData.categoria_id),
        data_competencia: formData.data_competencia,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo,
        origem: formData.origem
      });

      // Limpar formulário
      setFormData({
        categoria_id: '',
        data_competencia: '',
        valor: '',
        tipo: 'ENTRADA',
        origem: 'PROJETADO'
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Erro ao criar lançamento:', err);
      setError(err.response?.data?.message || 'Erro ao criar lançamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formatar data para input (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Lançamento
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!cenarioAtivo && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              Este cenário está congelado. Descongele-o para adicionar lançamentos.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria_id">Categoria *</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) => handleChange('categoria_id', value)}
                disabled={!cenarioAtivo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data_competencia">Data de Competência *</Label>
              <Input
                id="data_competencia"
                type="date"
                value={formData.data_competencia}
                onChange={(e) => handleChange('data_competencia', e.target.value)}
                max={today}
                disabled={!cenarioAtivo}
                required
              />
            </div>

            <div>
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                placeholder="0.00"
                disabled={!cenarioAtivo}
                required
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleChange('tipo', value)}
                disabled={!cenarioAtivo}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="origem">Origem</Label>
              <Select
                value={formData.origem}
                onValueChange={(value) => handleChange('origem', value)}
                disabled={!cenarioAtivo}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROJETADO">Projetado</SelectItem>
                  <SelectItem value="REALIZADO">Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading || !cenarioAtivo}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddLancamentoForm;

