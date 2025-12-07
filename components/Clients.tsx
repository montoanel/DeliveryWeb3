import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Cliente } from '../types';
import { Plus, Search, Edit2, Trash2, Save, X, User, MapPin, Phone } from 'lucide-react';

// --- Validation Helpers ---

const isValidCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) 
    soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) 
    soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

const isValidCNPJ = (cnpj: string) => {
  const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');
  if (cleanCNPJ.length !== 14 || /^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  let tamanho = cleanCNPJ.length - 2;
  let numeros = cleanCNPJ.substring(0, tamanho);
  let digitos = cleanCNPJ.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cleanCNPJ.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  
  return true;
};

// --- Component ---

const Clients: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [clients, setClients] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormState: Cliente = {
    id: 0,
    tipoPessoa: 'Física',
    nome: '',
    cpfCnpj: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: ''
  };

  const [formData, setFormData] = useState<Cliente>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClients(db.getClientes());
  };

  const handleNew = () => {
    setFormData({ ...initialFormState });
    setView('form');
  };

  const handleEdit = (client: Cliente) => {
    setFormData({ ...client });
    setView('form');
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      db.deleteCliente(id);
      loadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Regra de Negócio: Validação de CPF/CNPJ
    const cleanDoc = formData.cpfCnpj.replace(/[^\d]+/g, '');
    
    // Se estiver vazio, permitimos ou bloqueamos? Geralmente bloqueia se for obrigatório.
    // Assumindo que é obrigatório dado que é chave de negócio.
    if (!cleanDoc) {
      alert("O campo CPF/CNPJ é obrigatório.");
      return;
    }

    if (formData.tipoPessoa === 'Física') {
      if (!isValidCPF(cleanDoc)) {
        alert(`O CPF ${formData.cpfCnpj} é inválido!\nPor favor verifique os dígitos e tente novamente.`);
        return;
      }
    } else {
      if (!isValidCNPJ(cleanDoc)) {
        alert(`O CNPJ ${formData.cpfCnpj} é inválido!\nPor favor verifique os dígitos e tente novamente.`);
        return;
      }
    }

    db.saveCliente(formData);
    loadData();
    setView('list');
    alert('Cliente salvo com sucesso!');
  };

  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpfCnpj.includes(searchTerm) ||
    c.telefone.includes(searchTerm)
  );

  if (view === 'form') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-blue-600"/>
            {formData.id === 0 ? 'Novo Cliente' : 'Editar Cliente'}
          </h1>
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} /> Cancelar
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          {/* Header Data */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
              <input 
                type="text" 
                value={formData.id === 0 ? 'Auto' : formData.id} 
                disabled 
                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-center"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Pessoa</label>
              <select 
                value={formData.tipoPessoa}
                onChange={(e) => setFormData({...formData, tipoPessoa: e.target.value as 'Física' | 'Jurídica'})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Física">Física</option>
                <option value="Jurídica">Jurídica</option>
              </select>
            </div>

            <div className="md:col-span-7">
               <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo / Razão Social</label>
               <input 
                  type="text" 
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: João da Silva"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-gray-100 pb-8">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF / CNPJ</label>
                <input 
                  type="text" 
                  required
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({...formData, cpfCnpj: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={formData.tipoPessoa === 'Física' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
                <p className="text-xs text-gray-400 mt-1">
                  * Somente números válidos serão aceitos.
                </p>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone / Celular</label>
                <input 
                  type="text" 
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="(00) 00000-0000"
                />
             </div>
          </div>

          {/* Address Section */}
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-gray-400"/> Endereço
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (Rua, Av.)</label>
              <input 
                type="text" 
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Rua Exemplo"
              />
            </div>
             <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
              <input 
                type="text" 
                value={formData.numero}
                onChange={(e) => setFormData({...formData, numero: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
              <input 
                type="text" 
                value={formData.complemento}
                onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Apto, Sala, Bloco..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
              <input 
                type="text" 
                value={formData.bairro}
                onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Centro"
              />
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
              <Save size={18} /> Salvar Cliente
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
          <User className="text-blue-600" /> Clientes
        </h1>
        <button 
          onClick={handleNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Pesquisar por nome, CPF ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-gray-700"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm">ID</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Nome</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Contato</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Endereço Principal</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredClients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm text-gray-500 font-mono">#{client.id}</td>
                <td className="p-4">
                   <div className="font-medium text-gray-800">{client.nome}</div>
                   <div className="text-xs text-gray-400">{client.tipoPessoa} - {client.cpfCnpj}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400"/> {client.telefone}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400"/> {client.endereco}, {client.numero} - {client.bairro}</div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(client)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(client.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;