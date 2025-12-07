import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { ConfiguracaoAdicional, Produto } from '../types';
import { Plus, Edit2, Trash2, Save, X, Layers, CheckSquare, Square } from 'lucide-react';

const AddonConfig: React.FC = () => {
  const [configs, setConfigs] = useState<ConfiguracaoAdicional[]>([]);
  const [products, setProducts] = useState<Produto[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');

  // Form State
  const initialFormState: ConfiguracaoAdicional = {
    id: 0,
    produtoPrincipalId: 0,
    cobrarApartirDe: 0,
    complementosIds: []
  };
  const [formData, setFormData] = useState<ConfiguracaoAdicional>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setConfigs(db.getConfiguracoesAdicionais());
    setProducts(db.getProdutos());
  };

  const handleNew = () => {
    setFormData({ ...initialFormState });
    setView('form');
  };

  const handleEdit = (config: ConfiguracaoAdicional) => {
    setFormData({ ...config });
    setView('form');
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja excluir esta configuração?")) {
      db.deleteConfiguracaoAdicional(id);
      loadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.produtoPrincipalId === 0) {
      alert("Selecione um produto principal.");
      return;
    }
    db.saveConfiguracaoAdicional(formData);
    loadData();
    setView('list');
    alert("Configuração salva com sucesso!");
  };

  const toggleComplement = (id: number) => {
    setFormData(prev => {
      const exists = prev.complementosIds.includes(id);
      if (exists) {
        return { ...prev, complementosIds: prev.complementosIds.filter(c => c !== id) };
      } else {
        return { ...prev, complementosIds: [...prev.complementosIds, id] };
      }
    });
  };

  // Filters
  const mainProducts = products.filter(p => p.tipo === 'Principal');
  const complementProducts = products.filter(p => p.tipo === 'Complemento');

  if (view === 'form') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {formData.id === 0 ? 'Nova Regra de Adicionais' : 'Editar Regra'}
          </h1>
          <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20} /> Cancelar
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produto Principal</label>
                <select 
                  value={formData.produtoPrincipalId}
                  onChange={(e) => setFormData({...formData, produtoPrincipalId: parseInt(e.target.value)})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={formData.id !== 0} // Avoid changing main product on edit to simplify logic
                >
                  <option value={0}>Selecione...</option>
                  {mainProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Produtos tipo 'Principal' apenas.</p>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cobrar Adicionais a partir de:</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.cobrarApartirDe}
                  onChange={(e) => setFormData({...formData, cobrarApartirDe: parseInt(e.target.value)})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Ex: Se colocar 3, os primeiros 3 itens selecionados serão grátis.</p>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-4">Adicionais / Complementos Disponíveis</label>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                {complementProducts.map(comp => {
                  const isSelected = formData.complementosIds.includes(comp.id);
                  return (
                    <div 
                      key={comp.id} 
                      onClick={() => toggleComplement(comp.id)}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                    >
                       <div className={`mr-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                       </div>
                       <div>
                          <div className="text-sm font-bold text-gray-800">{comp.nome}</div>
                          <div className="text-xs text-gray-500">Add: R$ {comp.preco.toFixed(2)}</div>
                       </div>
                    </div>
                  );
                })}
                {complementProducts.length === 0 && (
                   <p className="col-span-3 text-center text-gray-400 py-4">Nenhum produto do tipo 'Complemento' cadastrado.</p>
                )}
             </div>
             <p className="text-xs text-gray-500 mt-2 text-right">Selecionados: {formData.complementosIds.length}</p>
          </div>

          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Save size={18} /> Salvar Regra
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Layers className="text-blue-600" /> Configuração de Adicionais
        </h1>
        <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus size={20} /> Nova Regra
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm">Produto Principal</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Gratuidade (Qtd)</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Opções Vinculadas</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {configs.map(config => {
              const mainProduct = products.find(p => p.id === config.produtoPrincipalId);
              return (
                <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{mainProduct?.nome || `Produto #${config.produtoPrincipalId} (Removido)`}</td>
                  <td className="p-4 text-center">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                       {config.cobrarApartirDe} Grátis
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-600">{config.complementosIds.length} itens</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(config)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(config.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {configs.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma regra cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddonConfig;