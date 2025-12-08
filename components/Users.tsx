
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Usuario, PerfilAcesso, Caixa } from '../types';
import { Plus, Edit2, Trash2, Save, X, UserCog, Shield, CheckCircle, Monitor } from 'lucide-react';

const Users: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [users, setUsers] = useState<Usuario[]>([]);
  const [terminals, setTerminals] = useState<Caixa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const initialFormState: Usuario = {
    id: 0,
    nome: '',
    login: '',
    senha: '',
    perfil: 'Padrão',
    ativo: true,
    caixaPadraoId: undefined
  };
  const [formData, setFormData] = useState<Usuario>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(db.getUsuarios());
    setTerminals(db.getCaixas());
  };

  const handleNew = () => {
    setFormData({ ...initialFormState });
    setView('form');
  };

  const handleEdit = (user: Usuario) => {
    setFormData({ ...user });
    setView('form');
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      db.deleteUsuario(id);
      loadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.login || !formData.senha) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    db.saveUsuario(formData);
    loadData();
    setView('list');
    alert('Usuário salvo com sucesso!');
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'form') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserCog className="text-blue-600"/>
            {formData.id === 0 ? 'Novo Usuário' : 'Editar Usuário'}
          </h1>
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} /> Cancelar
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: João Silva"
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Login / Usuário</label>
                <input 
                  type="text" 
                  required
                  value={formData.login}
                  onChange={(e) => setFormData({...formData, login: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: joaosilva"
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input 
                  type="password" 
                  required
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="******"
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Perfil de Acesso</label>
                <div className="relative">
                    <Shield className="absolute left-3 top-3 text-gray-400" size={16}/>
                    <select 
                      value={formData.perfil}
                      onChange={(e) => setFormData({...formData, perfil: e.target.value as PerfilAcesso})}
                      className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Padrão">Padrão</option>
                    </select>
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caixa Padrão</label>
                <div className="relative">
                    <Monitor className="absolute left-3 top-3 text-gray-400" size={16}/>
                    <select 
                      value={formData.caixaPadraoId || ''}
                      onChange={(e) => setFormData({...formData, caixaPadraoId: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
                    >
                      <option value="">Selecione um caixa...</option>
                      {terminals.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                   * Sugere este caixa na abertura.
                </p>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Situação</label>
                <select 
                  value={formData.ativo ? 'true' : 'false'}
                  onChange={(e) => setFormData({...formData, ativo: e.target.value === 'true'})}
                  className={`w-full p-2.5 rounded-lg border ${formData.ativo ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'} font-medium focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
             </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button 
              type="button"
              onClick={() => setView('list')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} /> Salvar Usuário
            </button>
          </div>
        </form>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserCog className="text-blue-600" /> Usuários e Perfis
        </h1>
        <button 
          onClick={handleNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Nome</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Login</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Perfil</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Caixa Padrão</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(user => {
              const term = terminals.find(t => t.id === user.caixaPadraoId);
              return (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 font-medium text-gray-800">{user.nome}</td>
                <td className="p-4 text-sm text-gray-600 font-mono">{user.login}</td>
                <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${user.perfil === 'Administrador' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        <Shield size={12}/> {user.perfil}
                    </span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                    {term ? term.nome : '-'}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
