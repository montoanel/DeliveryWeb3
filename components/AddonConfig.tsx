
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { ConfiguracaoAdicional, Produto } from '../types';
import { Plus, Edit2, Trash2, Save, X, Layers, ArrowRight, AlertCircle, DollarSign, Check, Copy } from 'lucide-react';

const AddonConfig: React.FC = () => {
  const [configs, setConfigs] = useState<ConfiguracaoAdicional[]>([]);
  const [products, setProducts] = useState<Produto[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');

  // Form State
  const initialFormState: ConfiguracaoAdicional = {
    id: 0,
    produtoPrincipalId: 0,
    cobrarApartirDe: 0,
    itens: [] // New structure
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

  const handleClone = (config: ConfiguracaoAdicional) => {
    // Copia toda a configuração, mas reseta o ID e o Produto Principal
    // Isso permite aproveitar a lista de itens e a regra, aplicando a um novo produto
    setFormData({
        ...config,
        id: 0,
        produtoPrincipalId: 0 // Força o usuário a escolher o novo produto alvo
    });
    setView('form');
    // Pequeno timeout para alertar o usuário visualmente ou apenas focar no campo
    setTimeout(() => alert(`Regra clonada! Agora selecione o novo Produto Principal para esta configuração.`), 100);
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
    if (formData.itens.length === 0) {
      alert("Adicione pelo menos um item complementar à regra.");
      return;
    }

    db.saveConfiguracaoAdicional(formData);
    loadData();
    setView('list');
    alert("Configuração salva com sucesso!");
  };

  const addItemToRule = (complementId: number) => {
    if (!formData.itens.find(i => i.produtoComplementoId === complementId)) {
      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, { produtoComplementoId: complementId, cobrarSempre: false }]
      }));
    }
  };

  const removeItemFromRule = (complementId: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter(i => i.produtoComplementoId !== complementId)
    }));
  };

  const toggleCobrarSempre = (complementId: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map(i => 
        i.produtoComplementoId === complementId 
        ? { ...i, cobrarSempre: !i.cobrarSempre } 
        : i
      )
    }));
  };

  // Filters
  const mainProducts = products.filter(p => p.tipo === 'Principal');
  const complementProducts = products.filter(p => p.tipo === 'Complemento');
  
  // Available complements (not yet in rule)
  const availableComplements = complementProducts.filter(p => !formData.itens.find(i => i.produtoComplementoId === p.id));

  if (view === 'form') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {formData.id === 0 ? 'Nova Regra de Adicionais' : 'Editar Regra'}
          </h1>
          <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={20} /> Cancelar
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
          
          {/* Header Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Produto Principal</label>
                <select 
                  value={formData.produtoPrincipalId}
                  onChange={(e) => setFormData({...formData, produtoPrincipalId: parseInt(e.target.value)})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={formData.id !== 0 && formData.produtoPrincipalId !== 0} 
                >
                  <option value={0}>Selecione...</option>
                  {mainProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">O produto que dispara a abertura dos adicionais.</p>
             </div>

             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Regra de Gratuidade</label>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-600 font-bold">Cobrar excedente a partir de:</span>
                        <input 
                            type="number" 
                            min="0"
                            value={formData.cobrarApartirDe}
                            onChange={(e) => setFormData({...formData, cobrarApartirDe: parseInt(e.target.value)})}
                            className="w-16 p-1 border-b-2 border-blue-500 font-bold text-center text-lg outline-none"
                        />
                         <span className="text-sm text-gray-600 font-bold">itens.</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Os primeiros {formData.cobrarApartirDe} itens <b>PADRÃO</b> serão grátis. O restante será cobrado.
                </p>
             </div>
          </div>

          {/* Builder Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
             
             {/* Left: Available */}
             <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b border-gray-200 font-bold text-gray-700 text-sm">
                    Adicionais Disponíveis
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                    {availableComplements.map(comp => (
                        <div key={comp.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 flex justify-between items-center group hover:border-blue-300 transition-colors">
                            <div>
                                <div className="font-bold text-gray-800">{comp.nome}</div>
                                <div className="text-xs text-gray-500">Preço Cadastro: R$ {comp.preco.toFixed(2)}</div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => addItemToRule(comp.id)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200 flex items-center gap-1"
                            >
                                Adicionar <ArrowRight size={14}/>
                            </button>
                        </div>
                    ))}
                    {availableComplements.length === 0 && <p className="text-center text-gray-400 mt-10">Não há mais adicionais disponíveis.</p>}
                </div>
             </div>

             {/* Right: Selected & Configured */}
             <div className="flex flex-col border-2 border-blue-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 p-3 border-b border-blue-100 font-bold text-blue-800 text-sm flex justify-between">
                    <span>Itens Vinculados a Regra ({formData.itens.length})</span>
                    <span className="text-xs font-normal text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">
                        Clique no botão para alterar o tipo
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-white">
                    {formData.itens.map((item, index) => {
                        const product = products.find(p => p.id === item.produtoComplementoId);
                        if (!product) return null;
                        
                        return (
                            <div key={item.produtoComplementoId} className={`p-3 rounded-lg border flex justify-between items-center shadow-sm transition-colors ${item.cobrarSempre ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${item.cobrarSempre ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <div className="font-bold text-gray-800">{product.nome}</div>
                                        <div className="text-xs text-gray-500">Valor Unitário: R$ {product.preco.toFixed(2)}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleCobrarSempre(item.produtoComplementoId)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors flex items-center gap-2 ${
                                            item.cobrarSempre 
                                            ? 'bg-white border-orange-300 text-orange-700 hover:bg-orange-100 shadow-sm' 
                                            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                        }`}
                                        title={item.cobrarSempre ? "Clique para tornar Padrão (Grátis)" : "Clique para tornar Premium (Pago)"}
                                    >
                                        {item.cobrarSempre ? (
                                            <>
                                                <DollarSign size={14} /> 
                                                PREMIUM (Sempre Cobra)
                                            </>
                                        ) : (
                                            <>
                                                <Check size={14} /> 
                                                PADRÃO (Conta como Grátis)
                                            </>
                                        )}
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => removeItemFromRule(item.produtoComplementoId)}
                                        className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                                        title="Remover da lista"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                     {formData.itens.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                            <Layers size={48} className="mb-2"/>
                            <p>Adicione itens da lista ao lado</p>
                        </div>
                    )}
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button 
                type="submit" 
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-transform active:scale-95"
            >
              <Save size={20} /> Salvar Configuração
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
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Gratuidade</th>
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
                       {config.cobrarApartirDe} Primeiros Grátis
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-600">
                      {config.itens.length} itens
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleClone(config)} 
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Clonar Regra"
                      >
                        <Copy size={18} />
                      </button>
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
