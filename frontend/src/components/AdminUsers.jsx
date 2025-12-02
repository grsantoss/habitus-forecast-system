import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  UserPlus, 
  Search, 
  Pencil, 
  Trash2, 
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { adminAPI } from '../lib/api';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listUsers(1, 50, searchTerm);
      setUsers(response.data.usuarios || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejeitado</Badge>;
      case 'active':
      default:
        return <Badge className="bg-green-100 text-green-700">Ativo</Badge>;
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const newUsersMonth = users.filter((u) => {
    if (!u.created_at) return false;
    try {
      const created = new Date(u.created_at);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    } catch {
      return false;
    }
  }).length;

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
    setIsSubmitting(true);
    try {
      await adminAPI.deleteUser(user.id);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
    setIsSubmitting(false);
  };

  const handleAddUser = async (userData) => {
    setIsSubmitting(true);
    try {
      await adminAPI.createUser(userData);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    }
    setIsSubmitting(false);
    setIsAddModalOpen(false);
  };

  const handleUpdateUser = async (userData) => {
    setIsSubmitting(true);
    try {
      await adminAPI.updateUser(editingUser.id, userData);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
    setIsSubmitting(false);
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleChangeStatus = async (user, status) => {
    setIsSubmitting(true);
    try {
      await adminAPI.updateUser(user.id, { status });
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h2>
            <p className="text-gray-600 mt-1">Gerencie usuários da plataforma, permissões e acessos.</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Administração de usuários</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {totalUsers}
              </div>
              <div className="text-sm text-gray-600">Usuários Total</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {activeUsers}
              </div>
              <div className="text-sm text-gray-600">Usuários Ativos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {adminCount}
              </div>
              <div className="text-sm text-gray-600">Administradores</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {newUsersMonth}
              </div>
              <div className="text-sm text-gray-600">Novos (Mês)</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Usuários</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Usuário</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { 
                      e.preventDefault(); 
                      const formData = new FormData(e.target);
                      handleAddUser({
                        nome: formData.get('userName'),
                        email: formData.get('userEmail'),
                        password: formData.get('userPassword'),
                        role: formData.get('userRole') || 'usuario',
                        status: formData.get('userStatus') || 'active',
                      }); 
                    }}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="userName">Nome Completo</Label>
                          <Input id="userName" name="userName" required />
                        </div>
                        <div>
                          <Label htmlFor="userEmail">Email</Label>
                          <Input id="userEmail" name="userEmail" type="email" required />
                        </div>
                        <div>
                          <Label htmlFor="userPassword">Senha</Label>
                          <Input id="userPassword" name="userPassword" type="password" minLength={6} required />
                          <p className="text-sm text-gray-500">Mínimo 6 caracteres</p>
                        </div>
                        <div>
                          <Label htmlFor="userRole">Perfil</Label>
                          <Select name="userRole">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o perfil" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usuario">Usuário</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="userStatus">Status</Label>
                          <Select name="userStatus" defaultValue="active">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="rejected">Rejeitado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            'Criar Usuário'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                        Carregando usuários...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                  {!loading && filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {getInitials(user.nome)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={user.role === 'admin' ? 'destructive' : 'default'}
                          className={user.role === 'admin' ? 'bg-red-500' : 'bg-green-100 text-green-700'}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.ultima_atividade)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {user.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                disabled={isSubmitting}
                                onClick={() => handleChangeStatus(user, 'active')}
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700"
                                disabled={isSubmitting}
                                onClick={() => handleChangeStatus(user, 'rejected')}
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {user.role !== 'admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o usuário <strong>{user.nome}</strong>?
                                    <br />
                                    <span className="text-red-600 text-sm">Esta ação não pode ser desfeita.</span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir Usuário
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser({}); }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editUserName">Nome Completo</Label>
                  <Input 
                    id="editUserName"
                    name="editUserName"
                    defaultValue={editingUser?.nome || ''} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="editUserEmail">Email</Label>
                  <Input 
                    id="editUserEmail"
                    name="editUserEmail"
                    type="email" 
                    defaultValue={editingUser?.email || ''} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="editUserPassword">Nova Senha (opcional)</Label>
                  <Input 
                    id="editUserPassword"
                    name="editUserPassword"
                    type="password" 
                    minLength={6} 
                  />
                  <p className="text-sm text-gray-500">Deixe em branco para manter a senha atual</p>
                </div>
                <div>
                  <Label htmlFor="editUserRole">Perfil</Label>
                  <Select defaultValue={editingUser?.role || 'usuario'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usuario">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
