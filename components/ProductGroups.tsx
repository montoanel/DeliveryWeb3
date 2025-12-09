
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { GrupoProduto } from '../types';
import { Plus, Edit2, Save, X, Tag, Power, CheckCircle, Trash2 } from 'lucide-react';

const ProductGroups: React.FC = () => {
  const [groups, setGroups] = useState<GrupoProduto[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setGroups(db.getGrupos());
  };

  const handleStartEdit = (group?: GrupoProduto) => {
    if (group) {
      setEditingId(group.id);
      setEditName(group.nome);
      setEditActive(group.ativo);
    } else {
      setEditingId(0); // Novo
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
      alert('O nome do grupo é obrigatório');
      return;
    }

    const payload: GrupoProduto = {
      id: editingId || 0,
      nome: editName,
      ativo: editActive
    };

    db.saveGrupo(payload);
    loadData();
    setEditingId(null);
  };

  const handleToggleStatus = (group: GrupoProduto) => {
      const newStatus = !group.ativo;
      const confirmMsg = newStatus 
          ? `Deseja ATIVAR o grupo "${group.nome}"?` 
          : `Deseja INATIVAR o grupo "${group.nome}"?`;
      
      if (confirm(confirmMsg)) {
          db.saveGrupo({ ...group, ativo: newStatus });
          loadData();
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Tag className="text-blue-600" /> Grupos de Produtos
        </h1>
        <button 
          onClick={() => handleStartEdit()}
          disabled={editingId !== null}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Plus size={20} /> Novo Grupo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm w-20">ID</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Nome do Grupo</th>
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
                        placeholder="Ex: Bebidas"
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
            )}

            {groups.map(group => (
              editingId === group.id ? (
                 // Edit Row
                <tr key={group.id} className="bg-blue-50">
                    <td className="p-4 text-gray-500 font-mono">{group.id}</td>
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
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-500 font-mono">{group.id}</td>
                    <td className="p-4 font-medium text-gray-800">{group.nome}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${group.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {group.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleStartEdit(group)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => handleToggleStatus(group)}
                            className={`p-2 rounded-lg transition-colors ${group.ativo ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                            title={group.ativo ? "Inativar" : "Ativar"}
                        >
                            {group.ativo ? <Power size={18} /> : <CheckCircle size={18} />}
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

export default ProductGroups;
