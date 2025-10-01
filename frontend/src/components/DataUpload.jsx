import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DataUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile);
      setError('');
      setValidationResult(null);
      setUploadResult(null);
      validateFile(selectedFile);
    } else {
      setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
    }
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
    try {
      const response = await uploadAPI.validateSpreadsheet(fileToValidate);
      setValidationResult(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao validar arquivo');
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
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadAPI.uploadSpreadsheet(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(response.data);
      
      // Redirecionar para o dashboard após sucesso
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao fazer upload do arquivo');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Dados</h1>
        <p className="text-gray-600">
          Faça upload de planilhas PROFECIA para criar novos projetos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Planilha</CardTitle>
            <CardDescription>
              Selecione ou arraste uma planilha PROFECIA (.xlsx ou .xls)
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
          </CardContent>
        </Card>

        {/* Validation Results */}
        {validationResult && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Validação</CardTitle>
              <CardDescription>
                Informações sobre a estrutura da planilha
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationResult.validacao.valido ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Planilha válida</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Abas encontradas:</p>
                    <div className="flex flex-wrap gap-2">
                      {validationResult.validacao.abas_encontradas.map((aba, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
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
                            <strong>Saldo Inicial:</strong> {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(validationResult.preview_parametros.saldo_inicial)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Planilha inválida</span>
                  </div>
                  <p className="text-sm text-red-600">
                    {validationResult.validacao.erro}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Formato Suportado</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Planilhas PROFECIA (.xlsx ou .xls)</li>
                  <li>• Tamanho máximo: 16MB</li>
                  <li>• Deve conter as abas: Painel Controle, PROFECIA, VENDAS</li>
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
    </div>
  );
};

export default DataUpload;
