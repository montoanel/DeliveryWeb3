import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { FormaPagamento } from '../types';
import { Plus, Edit2, Trash2, Save, X, CreditCard, CheckCircle } from 'lucide-react';

const PaymentMethods: React.FC = () => {
  const [methods, setMethods] = useState<FormaPagamento[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMethods(db.getFormasPagamento());
  };

  const handleStartEdit = (method?: FormaPagamento) => {
    if (method) {
      setEditingId(method.id);
      setEditName(method.nome);
      setEditActive(method.ativo);
    } else {
      setEditingId(0); // New
      setEditName('');
      setEditActive(true);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSave = () => {
    if (!editName.trim()) {
      alert('O nome é obrigatório');
      return;
    }

    const payload: FormaPagamento = {
      id: editingId || 0,
      nome: editName,
      ativo: editActive
    };

    db.saveFormaPagamento(payload);
    loadData();
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Deseja realmente remover esta forma de pagamento?')) {
      db.deleteFormaPagamento(id);
      loadData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="text-blue-600" /> Formas de Pagamento
        </h1>
        <button 
          onClick={() => handleStartEdit()}
          disabled={editingId !== null}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Plus size={20} /> Nova Forma
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm w-20">ID</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Nome / Descrição</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Situação</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            
            {/* Inline Editor for New Item */}
            {editingId === 0 && (
               <tr className="bg-blue-50">
                <td className="p-4 text-center text-gray-400">Novo</td>
                <td className="p-4">
                    <input 
                        autoFocus
                        type="text" 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Ex: Vale Alimentação"
                        className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </td>
                <td className="p-4">
                    <select 
                        value={editActive ? 'true' : 'false'}
                        onChange={e => setEditActive(e.target.value === 'true')}
                        className="p-2 border border-blue-300 rounded bg-white"
                    >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </td>
                <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={handleSave} className="p-2 bg-green-600 text-white rounded hover:bg-green-700"><CheckCircle size={18}/></button>
                        <button onClick={handleCancel} className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500"><X size={18}/></button>
                    </div>
                </td>
               </tr>
            )}

            {methods.map(method => (
              editingId === method.id ? (
                 // Edit Row
                <tr key={method.id} className="bg-blue-50">
                    <td className="p-4 text-gray-500 font-mono">{method.id}</td>
                    <td className="p-4">
                        <input 
                            type="text" 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </td>
                    <td className="p-4">
                        <select 
                            value={editActive ? 'true' : 'false'}
                            onChange={e => setEditActive(e.target.value === 'true')}
                            className="p-2 border border-blue-300 rounded bg-white"
                        >
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                        </select>
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={handleSave} className="p-2 bg-green-600 text-white rounded hover:bg-green-700"><Save size={18}/></button>
                            <button onClick={handleCancel} className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500"><X size={18}/></button>
                        </div>
                    </td>
                </tr>
              ) : (
                // Display Row
                <tr key={method.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-500 font-mono">{method.id}</td>
                    <td className="p-4 font-medium text-gray-800">{method.nome}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${method.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {method.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                        onClick={() => handleStartEdit(method)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                        >
                        <Edit2 size={18} />
                        </button>
                        <button 
                        onClick={() => handleDelete(method.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                    </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentMethods;