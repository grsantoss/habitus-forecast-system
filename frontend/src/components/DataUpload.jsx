import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { uploadAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, FileText, Download, Plus, Minus, Calendar, FileDown, Trash2 } from 'lucide-react';

const DataUpload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadHistory, setUploadHistory] = useState([]);
  const [manualData, setManualData] = useState({
    receitas: [
      { mes: 'Janeiro', receitaBruta: 50000, contas30d: 15000, contas60d: 5000, contas90d: 2500, inadimplencia: 2 },
      { mes: 'Fevereiro', receitaBruta: 52000, contas30d: 15600, contas60d: 5200, contas90d: 2600, inadimplencia: 2 },
      { mes: 'Março', receitaBruta: 55000, contas30d: 16500, contas60d: 5500, contas90d: 2750, inadimplencia: 2 }
    ]
  });
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const manualSectionRef = useRef(null);

  const goToManual = () => {
    setActiveTab('manual');
    // aguarda o render e faz scroll até a seção
    setTimeout(() => {
      if (manualSectionRef.current) {
        manualSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo');
      return;
    }

    // Validar extensão
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    // Validar tamanho (16MB máximo)
    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB em bytes
    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeInMB = (selectedFile.size / 1024 / 1024).toFixed(2);
      setError(`Arquivo muito grande (${sizeInMB} MB). O tamanho máximo permitido é 16 MB.`);
      return;
    }

    // Arquivo válido
    setFile(selectedFile);
    setError('');
    setValidationResult(null);
    setUploadResult(null);
    validateFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const validateFile = async (fileToValidate) => {
    setValidating(true);
    setError('');
    try {
      const response = await uploadAPI.validateSpreadsheet(fileToValidate);
      setValidationResult(response.data);
    } catch (error) {
      // Tratamento específico de erros
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Erro ao validar arquivo';
        
        if (status === 400) {
          setError(message);
        } else if (status === 413) {
          setError('Arquivo muito grande. O tamanho máximo permitido é 16 MB.');
        } else if (status === 500) {
          setError('Erro no servidor ao validar arquivo. Tente novamente mais tarde.');
        } else {
          setError(message);
        }
      } else if (error.request) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        setError('Erro ao validar arquivo. Tente novamente.');
      }
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Criar FormData e XMLHttpRequest para progresso real
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // Configurar progresso real
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 90); // Até 90%, depois completa quando receber resposta
          setUploadProgress(percentComplete);
        }
      });
      
      // Promise para aguardar resposta
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ data: response });
            } catch (e) {
              reject(new Error('Resposta inválida do servidor'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject({ response: { status: xhr.status, data: errorResponse } });
            } catch (e) {
              reject({ response: { status: xhr.status, data: { message: 'Erro ao processar resposta do servidor' } } });
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          reject({ request: true });
        });
        
        xhr.addEventListener('timeout', () => {
          reject({ code: 'ECONNABORTED' });
        });
        
        xhr.addEventListener('abort', () => {
          reject({ code: 'ABORTED' });
        });
        
        xhr.open('POST', `${apiUrl}/upload-planilha`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.timeout = 300000; // 5 minutos
        xhr.send(formData);
      });

      const response = await uploadPromise;
      
      setUploadProgress(100);
      setUploadResult(response.data);
      
      // Guardar o projeto do upload para o Dashboard carregar os dados reais (FDC-REAL)
      if (response?.data?.projeto_id) {
        localStorage.setItem('lastUploadedProjectId', String(response.data.projeto_id));
      }
      
      // Recarregar histórico completo após upload bem-sucedido
      await fetchUploadHistory();
      
      // Aguardar um pouco antes de redirecionar para garantir que o histórico seja atualizado
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      // Tratamento específico de erros
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Erro ao fazer upload do arquivo';
        
        if (status === 400) {
          setError(message);
        } else if (status === 413) {
          setError('Arquivo muito grande. O tamanho máximo permitido é 16 MB.');
        } else if (status === 500) {
          setError('Erro no servidor ao processar arquivo. Tente novamente mais tarde.');
        } else if (status === 408 || error.code === 'ECONNABORTED') {
          setError('Tempo limite excedido. O arquivo pode ser muito grande ou a conexão está lenta.');
        } else {
          setError(message);
        }
      } else if (error.request) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        setError('Erro ao fazer upload do arquivo. Tente novamente.');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setValidationResult(null);
    setUploadResult(null);
    setError('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const updateManualData = (section, index, field, value) => {
    setManualData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: parseFloat(value) || 0 } : item
      )
    }));
  };

  const handleDownload = async (uploadItem) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/uploads/${uploadItem.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = uploadItem.nome;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Erro ao fazer download do arquivo');
      }
    } catch (error) {
      console.error('Erro no download:', error);
      setError('Erro ao fazer download do arquivo');
    }
  };

  const handleDeleteUpload = async (uploadId) => {
    if (window.confirm('Tem certeza que deseja excluir este upload?')) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/uploads/${uploadId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          setUploadHistory(prev => prev.filter(item => item.id !== uploadId));
          
          // Limpar localStorage para forçar atualização do dashboard
          localStorage.removeItem('lastUploadedProjectId');
          
          // Se não há mais arquivos, limpar todos os dados
          const remainingUploads = uploadHistory.filter(item => item.id !== uploadId);
          if (remainingUploads.length === 0) {
            // Forçar atualização da página do dashboard se estiver aberta
            window.dispatchEvent(new CustomEvent('uploadDeleted', { detail: { hasFiles: false } }));
          } else {
            // Ainda há arquivos, mas pode ter mudado o projeto ativo
            window.dispatchEvent(new CustomEvent('uploadDeleted', { detail: { hasFiles: true } }));
          }
        } else {
          setError('Erro ao excluir upload');
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        setError('Erro ao excluir upload');
      }
    }
  };

  const handleRenameUpload = async (upload) => {
    try {
      const baseSemExt = upload.nome.replace(/\.[^/.]+$/, '');
      const novoBase = window.prompt('Novo nome do arquivo (sem extensão):', baseSemExt);
      if (novoBase === null) return;
      const trimmed = (novoBase || '').trim();
      if (!trimmed) return;

      const ext = upload.nome.includes('.') ? '.' + upload.nome.split('.').pop() : '';
      const finalName = `${trimmed}${ext}`;

      const res = await uploadAPI.rename(upload.id, finalName);
      if (res.status === 200) {
        const atualizado = res.data;
        setUploadHistory(prev => prev.map(it => it.id === upload.id ? { ...it, nome: atualizado.nome } : it));
      } else {
        setError('Falha ao renomear arquivo');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao renomear arquivo');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para buscar histórico de uploads
  const fetchUploadHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/uploads/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        setUploadHistory(history);
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText);
        // Fallback: dados mockados para demonstração
        setUploadHistory([
          {
            id: 1,
            nome: 'HABITUS_FORECA$T-SMASH 08 04.xlsx',
            data: new Date().toISOString(),
            status: 'processado',
            lancamentos: 45
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      // Fallback: dados mockados para demonstração
      setUploadHistory([
        {
          id: 1,
          nome: 'HABITUS_FORECA$T-SMASH 08 04.xlsx',
          data: new Date().toISOString(),
          status: 'processado',
          lancamentos: 45
        }
      ]);
    }
  };

  // Função para adicionar novo upload ao histórico
  const addToHistory = (uploadData) => {
    setUploadHistory(prev => [uploadData, ...prev]);
  };

  // Carregar histórico quando o componente monta e quando volta para a página
  useEffect(() => {
    fetchUploadHistory();
  }, []);

  // Recarregar histórico quando a página ganha foco (usuário volta do dashboard)
  useEffect(() => {
    const handleFocus = () => {
      fetchUploadHistory();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
      <div>
            <h2 className="text-2xl font-bold text-gray-900">Importação de Dados Financeiros</h2>
            <p className="text-gray-600 mt-1">Escolha como deseja inserir seus dados financeiros para criar simulações.</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Olá, {user?.nome}</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>


      {/* Seção de Ações (apenas Upload em 100%) */}
      <div className="mb-6 grid grid-cols-1 gap-6">
        {/* Card: Upload de Planilha Habitus Foreca$t */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Planilha Habitus Foreca$t</CardTitle>
            <CardDescription>
              Selecione ou arraste uma planilha Habitus Foreca$t (.xlsx ou .xls)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${dragOver 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Clique para selecionar ou arraste o arquivo aqui
                </p>
                <p className="text-sm text-gray-600">
                  Arquivos suportados: .xlsx, .xls (máx. 16MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Info */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    disabled={uploading}
                  >
                    Remover
                  </Button>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processando arquivo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Upload Button */}
                {!uploading && !uploadResult && (
                  <Button
                    onClick={handleUpload}
                    disabled={!validationResult?.validacao?.valido || uploading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Processar Planilha
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {uploadResult && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Planilha processada com sucesso! {uploadResult.lancamentos_criados} lançamentos criados.
                  Redirecionando para o dashboard...
                </AlertDescription>
              </Alert>
            )}

        {/* Validation Results */}
        {validationResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Resultado da Validação</h4>
              {validationResult.validacao.valido ? (
                  <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Planilha válida</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Abas encontradas:</p>
                    <div className="flex flex-wrap gap-2">
                      {validationResult.validacao.abas_encontradas.map((aba, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {aba}
                        </span>
                      ))}
                    </div>
                  </div>
                  {validationResult.preview_parametros && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Parâmetros identificados:</p>
                      <div className="text-sm space-y-1">
                        {validationResult.preview_parametros.nome_cliente && (
                          <div>
                            <strong>Cliente:</strong> {validationResult.preview_parametros.nome_cliente}
                          </div>
                        )}
                        {validationResult.preview_parametros.data_base && (
                          <div>
                            <strong>Data Base:</strong> {validationResult.preview_parametros.data_base}
                          </div>
                        )}
                        {validationResult.preview_parametros.saldo_inicial && (
                          <div>
                              <strong>Saldo Inicial:</strong> {formatCurrency(validationResult.preview_parametros.saldo_inicial)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                  <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Planilha inválida</span>
                    </div>
                    <p className="text-sm text-red-600">{validationResult.validacao.erro}</p>
                  </div>
                )}
                </div>
              )}
            </CardContent>
          </Card>

      </div>

      {/* Manual Entry Section */}
      {activeTab === 'manual' && (
        <Card ref={manualSectionRef}>
          <CardHeader>
            <CardTitle>Inserção Manual de Dados</CardTitle>
            <CardDescription>
              Preencha os dados financeiros manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="receitas" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="receitas">Receitas</TabsTrigger>
                <TabsTrigger value="custos">Custos Variáveis</TabsTrigger>
                <TabsTrigger value="despesas">Despesas Fixas</TabsTrigger>
                <TabsTrigger value="investimentos">Investimentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="receitas" className="mt-6">
                <h5 className="text-lg font-semibold mb-4">Receitas Mensais</h5>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Mês</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Receita Bruta</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Contas a Receber (30d)</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Contas a Receber (60d)</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Contas a Receber (90d+)</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Taxa de Inadimplência (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualData.receitas.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2 font-medium">{item.mes}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Input
                              type="number"
                              value={item.receitaBruta}
                              onChange={(e) => updateManualData('receitas', index, 'receitaBruta', e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Input
                              type="number"
                              value={item.contas30d}
                              onChange={(e) => updateManualData('receitas', index, 'contas30d', e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Input
                              type="number"
                              value={item.contas60d}
                              onChange={(e) => updateManualData('receitas', index, 'contas60d', e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Input
                              type="number"
                              value={item.contas90d}
                              onChange={(e) => updateManualData('receitas', index, 'contas90d', e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Input
                              type="number"
                              value={item.inadimplencia}
                              onChange={(e) => updateManualData('receitas', index, 'inadimplencia', e.target.value)}
                              className="w-full"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button className="bg-green-600 hover:bg-green-700">Avançar</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="custos" className="mt-6">
                <h5 className="text-lg font-semibold mb-4">Custos Variáveis</h5>
                <p className="text-gray-600">Informações de custos variáveis mensais serão inseridas aqui.</p>
              </TabsContent>
              
              <TabsContent value="despesas" className="mt-6">
                <h5 className="text-lg font-semibold mb-4">Despesas Fixas</h5>
                <p className="text-gray-600">Informações de despesas fixas mensais serão inseridas aqui.</p>
              </TabsContent>
              
              <TabsContent value="investimentos" className="mt-6">
                <h5 className="text-lg font-semibold mb-4">Investimentos e Financiamentos</h5>
                <p className="text-gray-600">Informações de investimentos e financiamentos serão inseridas aqui.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Upload History */}
      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Histórico de Uploads
            </CardTitle>
            <CardDescription>
              Visualize e gerencie os arquivos já processados
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {uploadHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum arquivo foi processado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadHistory.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.nome}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(upload.data)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              upload.status === 'processado'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {upload.status === 'processado' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Processado
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Erro
                              </>
                            )}
                          </span>
                          {upload.status === 'processado' && (
                            <span className="text-xs text-gray-500">
                              {upload.lancamentos} lançamentos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {upload.status === 'processado' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(upload)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRenameUpload(upload)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Renomear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUpload(upload.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

        {/* Instructions */}
      <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Formato Suportado</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Planilhas Habitus Foreca$t (.xlsx ou .xls)</li>
                  <li>• Tamanho máximo: 16MB</li>
                  <li>• Deve conter a aba FDC-Real</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">O que acontece após o upload</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Validação automática da estrutura</li>
                  <li>• Extração dos dados financeiros</li>
                  <li>• Criação de projeto no sistema</li>
                  <li>• Disponibilização no dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default DataUpload;
