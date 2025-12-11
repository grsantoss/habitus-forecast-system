import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../lib/config';
import { 
  User, 
  Shield, 
  Camera, 
  Check, 
  ShieldCheck, 
  X,
  Circle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const Settings = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingScenarios, setIsSubmittingScenarios] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scenarios, setScenarios] = useState({
    pessimista: 0,
    realista: 0,
    otimista: 0,
    agressivo: 0
  });
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const metCount = Object.values(requirements).filter(Boolean).length;
    
    if (metCount <= 1) return { level: 'weak', color: 'bg-red-500', width: '25%' };
    if (metCount <= 2) return { level: 'fair', color: 'bg-yellow-500', width: '50%' };
    if (metCount <= 3) return { level: 'good', color: 'bg-orange-500', width: '75%' };
    return { level: 'strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = checkPasswordStrength(newPassword);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    
    try {
      const formData = new FormData(e.target);
      const profileData = {
        nome: formData.get('fullName') || document.getElementById('fullName').value,
        email: formData.get('email') || document.getElementById('email').value,
        telefone: formData.get('phone') || document.getElementById('phone').value,
        empresa: formData.get('company') || document.getElementById('company').value,
        cnpj: formData.get('cnpj') || document.getElementById('cnpj').value,
        cargo: formData.get('position') || document.getElementById('position').value
      };
      
      
      const response = await fetch(`${API_BASE_URL}/settings/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Atualizar dados do usuário no contexto
        if (result.user) {
          setUser(result.user);
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        
        // Mostrar mensagem de sucesso
        setSuccessMessage('Perfil atualizado com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (response.status === 401) {
        console.error('Token inválido - redirecionando para login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        const error = await response.json();
        console.error('Erro ao atualizar perfil:', error.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingPassword(true);
    setErrorMessage('');
    
    try {
      // Validar se as senhas coincidem
      if (newPassword !== confirmPassword) {
        setErrorMessage('Nova senha e confirmação não coincidem');
        return;
      }
      
      // Validar força da senha
      if (newPassword.length < 8) {
        setErrorMessage('A nova senha deve ter pelo menos 8 caracteres');
        return;
      }
      
      const passwordData = {
        currentPassword,
        newPassword,
        confirmPassword
      };
      
      
      const response = await fetch(`${API_BASE_URL}/settings/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Limpar campos
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPassword('');
        
        // Mostrar mensagem de sucesso
        setSuccessMessage('Senha alterada com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (response.status === 401) {
        console.error('Token inválido - redirecionando para login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        const error = await response.json();
        console.error('Erro ao alterar senha:', error.message);
        setErrorMessage(error.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setErrorMessage('Erro ao alterar senha');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleScenariosSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingScenarios(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Validar antes de enviar
      const pessimistaValue = typeof scenarios.pessimista === 'string' 
        ? (scenarios.pessimista === '' || scenarios.pessimista === '-' ? 0 : parseFloat(scenarios.pessimista) || 0) 
        : scenarios.pessimista;
      
      if (pessimistaValue > 0) {
        setErrorMessage('Pessimista deve ser negativo ou zero');
        setIsSubmittingScenarios(false);
        return;
      }

      const otimistaValue = typeof scenarios.otimista === 'string' 
        ? (scenarios.otimista === '' || scenarios.otimista === '-' ? 0 : parseFloat(scenarios.otimista) || 0) 
        : scenarios.otimista;
      
      const agressivoValue = typeof scenarios.agressivo === 'string' 
        ? (scenarios.agressivo === '' || scenarios.agressivo === '-' ? 0 : parseFloat(scenarios.agressivo) || 0) 
        : scenarios.agressivo;

      if (otimistaValue < 0 || agressivoValue < 0) {
        setErrorMessage('Otimista e Agressivo devem ser positivos ou zero');
        setIsSubmittingScenarios(false);
        return;
      }

      if (otimistaValue > agressivoValue) {
        setErrorMessage('Otimista não pode ser maior que Agressivo');
        setIsSubmittingScenarios(false);
        return;
      }

      // Converter valores para números antes de enviar
      const scenariosToSend = {
        pessimista: pessimistaValue,
        realista: 0, // Sempre 0
        otimista: otimistaValue,
        agressivo: agressivoValue
      };
      
      
      const qs = user?.role === 'admin' && selectedClientId 
        ? `?usuario_id=${selectedClientId}` 
        : '';

      const response = await fetch(`${API_BASE_URL}/settings/cenarios${qs}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scenariosToSend)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Mostrar mensagem de sucesso
        setSuccessMessage('Cenários salvos com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else if (response.status === 401) {
        console.error('Token inválido - redirecionando para login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        const errorData = await response.json();
        console.error('Erro ao salvar cenários:', response.statusText, errorData);
        setErrorMessage(errorData.message || 'Erro ao salvar cenários');
      }
    } catch (error) {
      console.error('Erro ao salvar cenários:', error);
    } finally {
      setIsSubmittingScenarios(false);
    }
  };

  const updateScenario = (scenario, value) => {
    // Sempre limpar mensagem de erro ao editar
    if (errorMessage) {
      setErrorMessage('');
    }

    // Realista sempre deve ser 0
    if (scenario === 'realista') {
      setScenarios(prev => ({ ...prev, realista: 0 }));
      return;
    }

    if (value === '' || value === '-') {
      setScenarios(prev => ({
        ...prev,
        [scenario]: value
      }));
      return;
    }

    const parsedValue = parseFloat(value);
    
    if (isNaN(parsedValue)) {
      setScenarios(prev => ({
        ...prev,
        [scenario]: 0
      }));
      return;
    }

    // Validações específicas
    if (scenario === 'pessimista' && parsedValue > 0) {
      setErrorMessage('Pessimista deve ser negativo ou zero (ex: -15 para 15% abaixo do Realista)');
      setScenarios(prev => ({ ...prev, pessimista: 0 }));
      return;
    }
    if ((scenario === 'otimista' || scenario === 'agressivo') && parsedValue < 0) {
      setErrorMessage('Otimista e Agressivo devem ser positivos ou zero');
      setScenarios(prev => ({ ...prev, [scenario]: 0 }));
      return;
    }

    setScenarios(prev => ({
      ...prev,
      [scenario]: parsedValue
    }));
  };

  const handleKeyDown = (e) => {
    // Prevent arrow keys from changing the number value
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  // Carregar configurações salvas ao montar o componente
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const qs = user?.role === 'admin' && selectedClientId 
          ? `?usuario_id=${selectedClientId}` 
          : '';

        const response = await fetch(`${API_BASE_URL}/settings/cenarios${qs}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setScenarios({
            pessimista: data.pessimista || 0,
            realista: 0, // Sempre 0
            otimista: data.otimista || 0,
            agressivo: data.agressivo || 0
          });
        }
      } catch (error) {
        console.error('Erro ao carregar cenários:', error);
      }
    };

    // Carregar cenários: se admin não tem cliente selecionado, carrega seus próprios cenários
    loadScenarios();
  }, [user, selectedClientId]);

  // Carregar lista de clientes (usuários comuns) para admin
  useEffect(() => {
    const loadClients = async () => {
      if (user?.role !== 'admin') return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/usuarios?page=1&per_page=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const usuarios = data.usuarios || [];
          const apenasClientes = usuarios.filter((u) => u.role === 'usuario');
          setClients(apenasClientes);

          // Restaurar cliente selecionado do Dashboard, se existir
          const storedId = localStorage.getItem('adminSelectedClientId');
          if (storedId) {
            const parsedId = parseInt(storedId, 10);
            if (!Number.isNaN(parsedId) && apenasClientes.some((c) => c.id === parsedId)) {
              setSelectedClientId(parsedId);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar clientes para cenários:', error);
      }
    };

    loadClients();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mensagem de Sucesso */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mx-6 mt-6" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {/* Mensagem de Erro */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-6 mt-6" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurações da Conta</h2>
            <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e preferências do sistema.</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Olá, {user?.nome || 'Usuário'}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <X className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Information and Password Change Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h5 className="text-xl font-semibold text-gray-900">Informações Pessoais</h5>
                  <p className="text-sm text-gray-500">Gerencie suas informações de perfil</p>
                </div>
              </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="fullName" className="mb-2">Nome Completo</Label>
                  <Input id="fullName" name="fullName" defaultValue={user?.nome || ''} required />
                </div>
                <div>
                  <Label htmlFor="email" className="mb-2">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={user?.email || ''} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="phone" className="mb-2">Telefone</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={user?.telefone || ''} />
                </div>
                <div>
                  <Label htmlFor="company" className="mb-2">Empresa</Label>
                  <Input id="company" name="company" defaultValue={user?.empresa || ''} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="cnpj" className="mb-2">CNPJ</Label>
                  <Input id="cnpj" name="cnpj" defaultValue={user?.cnpj || ''} />
                </div>
                <div>
                  <Label htmlFor="position" className="mb-2">Cargo</Label>
                  <Input id="position" name="position" defaultValue={user?.cargo || ''} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h5 className="text-xl font-semibold text-gray-900">Alterar Senha</h5>
                  <p className="text-sm text-gray-500">Mantenha sua conta segura com uma senha forte</p>
                </div>
              </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="currentPassword" className="mb-2">Senha Atual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    placeholder="Digite sua senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="mb-2">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    placeholder="Digite a nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div className={`flex items-center mb-1 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        <Circle className={`w-2 h-2 mr-2 ${password.length >= 8 ? 'fill-current' : ''}`} />
                        Mínimo 8 caracteres
                      </div>
                      <div className={`flex items-center mb-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <Circle className={`w-2 h-2 mr-2 ${/[A-Z]/.test(password) ? 'fill-current' : ''}`} />
                        Pelo menos 1 letra maiúscula
                      </div>
                      <div className={`flex items-center mb-1 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <Circle className={`w-2 h-2 mr-2 ${/[a-z]/.test(password) ? 'fill-current' : ''}`} />
                        Pelo menos 1 letra minúscula
                      </div>
                      <div className={`flex items-center mb-1 ${/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <Circle className={`w-2 h-2 mr-2 ${/\d/.test(password) ? 'fill-current' : ''}`} />
                        Pelo menos 1 número
                      </div>
                      <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <Circle className={`w-2 h-2 mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'fill-current' : ''}`} />
                        Pelo menos 1 caractere especial
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="confirmPassword" className="mb-2">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="Confirme a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>

        {/* Sales Scenarios */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h5 className="text-xl font-semibold text-gray-900">Cenário de Vendas</h5>
                  <p className="text-sm text-gray-500">Configure os percentuais para cada cenário de vendas</p>
                </div>
              </div>

              {/* Seletor de cliente apenas para admin */}
              {user?.role === 'admin' && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-gray-700">Cliente:</Label>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={selectedClientId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setSelectedClientId(null);
                        localStorage.removeItem('adminSelectedClientId');
                      } else {
                        const parsed = parseInt(value, 10);
                        setSelectedClientId(parsed);
                        localStorage.setItem('adminSelectedClientId', String(parsed));
                      }
                    }}
                  >
                    <option value="">Meus cenários (admin)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={handleScenariosSubmit}>
              {/* Explicação Visual */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Como funciona:</strong> O cenário <strong>Realista</strong> é a base (0%) 
                  calculada diretamente da planilha. Os outros cenários são variações percentuais 
                  em relação ao Realista.
                </p>
                <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                  <li><strong>Pessimista:</strong> Valor negativo (ex: -15 = 15% abaixo do Realista)</li>
                  <li><strong>Realista:</strong> Sempre 0% (ponto zero/base - calculado da planilha)</li>
                  <li><strong>Otimista:</strong> Valor positivo (ex: 10 = 10% acima do Realista)</li>
                  <li><strong>Agressivo:</strong> Valor positivo (ex: 30 = 30% acima do Realista)</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label htmlFor="pessimista" className="mb-2">Cenário Pessimista (%)</Label>
                  <Input 
                    id="pessimista" 
                    type="number" 
                    min="-100"
                    max="0"
                    step="0.1"
                    value={typeof scenarios.pessimista === 'string' ? scenarios.pessimista : scenarios.pessimista.toString()}
                    onChange={(e) => updateScenario('pessimista', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: -15"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor negativo: variação abaixo do Realista (ex: -15 = 15% abaixo)
                  </p>
                </div>
                <div>
                  <Label htmlFor="realista" className="mb-2">Cenário Realista (%)</Label>
                  <Input 
                    id="realista" 
                    type="number" 
                    disabled
                    value="0"
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sempre 0% - Este é o cenário base calculado diretamente da planilha
                  </p>
                </div>
                <div>
                  <Label htmlFor="otimista" className="mb-2">Cenário Otimista (%)</Label>
                  <Input 
                    id="otimista" 
                    type="number" 
                    min="0"
                    max="100" 
                    step="0.1"
                    value={typeof scenarios.otimista === 'string' ? scenarios.otimista : scenarios.otimista.toString()}
                    onChange={(e) => updateScenario('otimista', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor positivo: variação acima do Realista (ex: 10 = 10% acima)
                  </p>
                </div>
                <div>
                  <Label htmlFor="agressivo" className="mb-2">Cenário Agressivo (%)</Label>
                  <Input 
                    id="agressivo" 
                    type="number" 
                    min="0"
                    max="100" 
                    step="0.1"
                    value={typeof scenarios.agressivo === 'string' ? scenarios.agressivo : scenarios.agressivo.toString()}
                    onChange={(e) => updateScenario('agressivo', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: 30"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor positivo: variação acima do Realista (ex: 30 = 30% acima)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmittingScenarios}>
                  {isSubmittingScenarios ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Salvar Cenários
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Settings;
