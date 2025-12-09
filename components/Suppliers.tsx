
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Fornecedor } from '../types';
import { Plus, Edit2, Trash2, Save, X, Truck, Search, Phone, Mail, FileText } from 'lucide-react';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const initialForm: Fornecedor = {
      id: 0,
      nome: '',
      documento: '',
      telefone: '',
      email: '',
      ativo: true
  };
  const [formData, setFormData] = useState<Fornecedor>(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSuppliers(db.getFornecedores());
  };

  const handleNew = () => {
      setFormData({...initialForm});
      setView('form');
  };

  const handleEdit = (item: Fornecedor) => {
      setFormData({...item});
      setView('form');
  };

  const handleDelete = (id: number) => {
      if(confirm("Excluir este fornecedor?")) {
          db.deleteFornecedor(id);
          loadData();
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if(!formData.nome) { alert("Nome é obrigatório"); return; }
      db.saveFornecedor(formData);
      loadData();
      setView('list');
  };

  const filtered = suppliers.filter(s => s.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  if (view === 'form') {
      return (
          <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">{formData.id === 0 ? 'Novo Fornecedor' : 'Editar Fornecedor'}</h1>
                  <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20}/> Cancelar</button>
              </div>
              <form onSubmit={handleSave} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Razão Social / Nome Fantasia</label>
                      <input type="text" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Distribuidora de Bebidas"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">CNPJ / CPF</label>
                          <input type="text" value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="00.000.000/0000-00"/>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
                          <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="(00) 0000-0000"/>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="contato@fornecedor.com"/>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Salvar</button>
                  </div>
              </form>
          </div>
      )
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Truck className="text-blue-600"/> Fornecedores</h1>
            <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"><Plus size={20}/> Novo Fornecedor</button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <Search className="text-gray-400" size={20} />
            <input type="text" placeholder="Pesquisar fornecedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 outline-none text-gray-700"/>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-4 text-sm font-bold text-gray-600">Nome</th>
                        <th className="p-4 text-sm font-bold text-gray-600">Documento</th>
                        <th className="p-4 text-sm font-bold text-gray-600">Contato</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filtered.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-800">{s.nome}</td>
                            <td className="p-4 text-sm text-gray-600 flex items-center gap-2"><FileText size={14}/> {s.documento || '-'}</td>
                            <td className="p-4 text-sm text-gray-600">
                                <div className="flex flex-col gap-1">
                                    <span className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {s.telefone}</span>
                                    {s.email && <span className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> {s.email}</span>}
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18}/></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum fornecedor encontrado.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default Suppliers;
