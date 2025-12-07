import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Produto, GrupoProduto, TipoProduto } from '../types';
import { Plus, Search, Edit2, Trash2, Save, X, Package } from 'lucide-react';

const Products: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [products, setProducts] = useState<Produto[]>([]);
  const [groups, setGroups] = useState<GrupoProduto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const initialFormState: Produto = {
    id: 0,
    ativo: true,
    tipo: 'Principal',
    codigoInterno: '',
    codigoBarras: '',
    nome: '',
    preco: 0,
    custo: 0,
    unidadeMedida: 'UN',
    grupoProdutoId: 1
  };
  const [formData, setFormData] = useState<Produto>(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(db.getProdutos());
    setGroups(db.getGrupos());
  };

  const handleEdit = (product: Produto) => {
    setFormData({ ...product });
    setView('form');
  };

  const handleNew = () => {
    setFormData({ ...initialFormState });
    setView('form');
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      db.deleteProduto(id);
      loadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveProduto(formData);
    loadData();
    setView('list');
    alert('Produto salvo com sucesso!');
  };

  const filteredProducts = products.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigoBarras.includes(searchTerm) ||
    p.codigoInterno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const units = ['UN', 'KG', 'LT', 'M', 'CX', 'PC', 'POR'];

  if (view === 'form') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {formData.id === 0 ? 'Novo Produto' : 'Editar Produto'}
          </h1>
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} /> Cancelar
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          {/* Top Row: Status & Type & ID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-1">
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

             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Produto</label>
              <select 
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value as TipoProduto})}
                className="w-full p-2.5 rounded-lg border border-gray-300 font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="Principal">Principal (Ex: Lanche, Açaí)</option>
                <option value="Complemento">Complemento (Ex: Adicional, Borda)</option>
              </select>
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
              <input 
                type="text" 
                value={formData.id === 0 ? 'Auto' : formData.id} 
                disabled 
                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
              />
            </div>
          </div>

          {/* Codes Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código Interno</label>
              <input 
                type="text" 
                value={formData.codigoInterno}
                onChange={(e) => setFormData({...formData, codigoInterno: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ex: A1"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras (EAN)</label>
              <input 
                type="text" 
                value={formData.codigoBarras}
                onChange={(e) => setFormData({...formData, codigoBarras: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ex: 789..."
              />
              <span className="absolute right-3 top-9 text-xs font-bold text-gray-400 border border-gray-200 px-1 rounded">F1</span>
            </div>
          </div>

          {/* Name Row */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Produto</label>
            <input 
              type="text" 
              required
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Descrição completa do produto"
            />
          </div>

          {/* Values & Unit Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Venda (R$)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.preco}
                onChange={(e) => setFormData({...formData, preco: parseFloat(e.target.value)})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custo (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.custo}
                onChange={(e) => setFormData({...formData, custo: parseFloat(e.target.value)})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidade Medida</label>
              <select 
                value={formData.unidadeMedida}
                onChange={(e) => setFormData({...formData, unidadeMedida: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Group Row */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Grupo de Produto</label>
            <div className="flex gap-2">
              <select 
                value={formData.grupoProdutoId}
                onChange={(e) => setFormData({...formData, grupoProdutoId: parseInt(e.target.value)})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
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
              <Save size={18} /> Salvar Produto
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
          <Package className="text-blue-600" /> Produtos
        </h1>
        <button 
          onClick={handleNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Pesquisar por nome, código ou EAN..."
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
              <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Código</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Nome</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Tipo</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Preço</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">
                  <div className="font-mono text-xs">{product.codigoInterno}</div>
                  <div className="text-[10px] text-gray-400">{product.codigoBarras}</div>
                </td>
                <td className="p-4 font-medium text-gray-800">{product.nome}</td>
                <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded border ${product.tipo === 'Principal' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                        {product.tipo}
                    </span>
                </td>
                <td className="p-4 font-medium text-gray-800">R$ {product.preco.toFixed(2)}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;