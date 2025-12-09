
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { ContaFinanceira, OperadoraCartao } from '../types';
import { Plus, Edit2, Trash2, Save, X, Landmark, CreditCard, Wallet } from 'lucide-react';

const FinanceConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contas' | 'operadoras'>('contas');
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [operadoras, setOperadoras] = useState<OperadoraCartao[]>([]);
  
  // States for Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Forms Data
  const [contaForm, setContaForm] = useState<ContaFinanceira>({id: 0, nome: '', tipo: 'Banco', saldoAtual: 0, ativo: true});
  const [opForm, setOpForm] = useState<OperadoraCartao>({id: 0, nome: '', taxaCredito: 0, diasRecebimentoCredito: 30, taxaDebito: 0, diasRecebimentoDebito: 1, ativo: true});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setContas(db.getContasFinanceiras());
    setOperadoras(db.getOperadoras());
  };

  const resetForms = () => {
      setContaForm({id: 0, nome: '', tipo: 'Banco', saldoAtual: 0, ativo: true});
      setOpForm({id: 0, nome: '', taxaCredito: 0, diasRecebimentoCredito: 30, taxaDebito: 0, diasRecebimentoDebito: 1, ativo: true});
      setIsEditing(false);
      setEditingId(null);
  };

  const handleEditConta = (c: ContaFinanceira) => {
      setContaForm({...c});
      setEditingId(c.id);
      setIsEditing(true);
      setActiveTab('contas');
  };

  const handleEditOp = (o: OperadoraCartao) => {
      setOpForm({...o});
      setEditingId(o.id);
      setIsEditing(true);
      setActiveTab('operadoras');
  };

  const handleSaveConta = (e: React.FormEvent) => {
      e.preventDefault();
      db.saveContaFinanceira(contaForm);
      loadData();
      resetForms();
  };

  const handleSaveOp = (e: React.FormEvent) => {
      e.preventDefault();
      db.saveOperadora(opForm);
      loadData();
      resetForms();
  };

  const handleDeleteConta = (id: number) => {
      if(confirm("Deseja excluir esta conta?")) { db.deleteContaFinanceira(id); loadData(); }
  };

  const handleDeleteOp = (id: number) => {
      if(confirm("Deseja excluir esta operadora?")) { db.deleteOperadora(id); loadData(); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Landmark className="text-blue-600" /> Configurações Financeiras
        </h1>

        <div className="flex gap-4 border-b border-gray-200">
           <button 
              onClick={() => { setActiveTab('contas'); resetForms(); }}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
               <Wallet size={18} /> Contas e Cofres
           </button>
           <button 
              onClick={() => { setActiveTab('operadoras'); resetForms(); }}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'operadoras' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
               <CreditCard size={18} /> Operadoras de Cartão
           </button>
        </div>

        {activeTab === 'contas' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4">{isEditing ? 'Editar Conta' : 'Nova Conta / Cofre'}</h3>
                    <form onSubmit={handleSaveConta} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Conta</label>
                            <input type="text" required value={contaForm.nome} onChange={e => setContaForm({...contaForm, nome: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Cofre Principal"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                            <select value={contaForm.tipo} onChange={e => setContaForm({...contaForm, tipo: e.target.value as any})} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="Banco">Conta Bancária</option>
                                <option value="Cofre">Cofre Físico</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Saldo Atual (Inicial)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500 text-sm">R$</span>
                                <input type="number" step="0.01" required value={contaForm.saldoAtual} onChange={e => setContaForm({...contaForm, saldoAtual: parseFloat(e.target.value)})} className="w-full pl-8 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"/>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                             {isEditing && <button type="button" onClick={resetForms} className="flex-1 py-2 bg-gray-200 rounded font-bold text-gray-600">Cancelar</button>}
                             <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><Save size={18}/> Salvar</button>
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {contas.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg ${c.tipo === 'Cofre' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {c.tipo === 'Cofre' ? <Wallet size={16}/> : <Landmark size={16}/>}
                                    </span>
                                    <h4 className="font-bold text-gray-800">{c.nome}</h4>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-9">Saldo: <span className="text-green-600 font-bold text-sm">R$ {c.saldoAtual.toFixed(2)}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditConta(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18}/></button>
                                <button onClick={() => handleDeleteConta(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {contas.length === 0 && <p className="text-gray-400 text-center py-10">Nenhuma conta cadastrada.</p>}
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Operator Form */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4">{isEditing ? 'Editar Operadora' : 'Nova Operadora'}</h3>
                    <form onSubmit={handleSaveOp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Operadora</label>
                            <input type="text" required value={opForm.nome} onChange={e => setOpForm({...opForm, nome: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: Stone"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Taxa Crédito (%)</label>
                                <input type="number" step="0.01" required value={opForm.taxaCredito} onChange={e => setOpForm({...opForm, taxaCredito: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded outline-none"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Dias Receb. (D+)</label>
                                <input type="number" required value={opForm.diasRecebimentoCredito} onChange={e => setOpForm({...opForm, diasRecebimentoCredito: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded outline-none"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Taxa Débito (%)</label>
                                <input type="number" step="0.01" required value={opForm.taxaDebito} onChange={e => setOpForm({...opForm, taxaDebito: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded outline-none"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Dias Receb. (D+)</label>
                                <input type="number" required value={opForm.diasRecebimentoDebito} onChange={e => setOpForm({...opForm, diasRecebimentoDebito: parseFloat(e.target.value)})} className="w-full p-2 border border-gray-300 rounded outline-none"/>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                             {isEditing && <button type="button" onClick={resetForms} className="flex-1 py-2 bg-gray-200 rounded font-bold text-gray-600">Cancelar</button>}
                             <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 flex items-center justify-center gap-2"><Save size={18}/> Salvar</button>
                        </div>
                    </form>
                </div>

                {/* Operator List */}
                <div className="lg:col-span-2 space-y-4">
                    {operadoras.map(o => (
                        <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-purple-100 text-purple-600"><CreditCard size={16}/></span>
                                    <h4 className="font-bold text-gray-800">{o.nome}</h4>
                                </div>
                                <div className="flex gap-6 mt-2 ml-9 text-xs text-gray-600">
                                    <div>Crédito: <b>{o.taxaCredito}%</b> (D+{o.diasRecebimentoCredito})</div>
                                    <div>Débito: <b>{o.taxaDebito}%</b> (D+{o.diasRecebimentoDebito})</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditOp(o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18}/></button>
                                <button onClick={() => handleDeleteOp(o.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                    {operadoras.length === 0 && <p className="text-gray-400 text-center py-10">Nenhuma operadora cadastrada.</p>}
                </div>
            </div>
        )}
    </div>
  );
};

export default FinanceConfig;
