
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { FormaPagamento, OperadoraCartao, ContaFinanceira } from '../types';
import { Plus, Edit2, Trash2, Save, X, CreditCard, CheckCircle } from 'lucide-react';

const PaymentMethods: React.FC = () => {
  const [methods, setMethods] = useState<FormaPagamento[]>([]);
  const [operadoras, setOperadoras] = useState<OperadoraCartao[]>([]);
  const [contas, setContas] = useState<ContaFinanceira[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  
  // Link Fields
  const [editVinculo, setEditVinculo] = useState<'Nenhum' | 'Operadora' | 'Conta'>('Nenhum');
  const [editOpId, setEditOpId] = useState<number | undefined>(undefined);
  const [editContaId, setEditContaId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMethods(db.getFormasPagamento());
    setOperadoras(db.getOperadoras());
    setContas(db.getContasFinanceiras());
  };

  const handleStartEdit = (method?: FormaPagamento) => {
    if (method) {
      setEditingId(method.id);
      setEditName(method.nome);
      setEditActive(method.ativo);
      setEditVinculo(method.tipoVinculo || 'Nenhum');
      setEditOpId(method.operadoraId);
      setEditContaId(method.contaDestinoId);
    } else {
      setEditingId(0); // New
      setEditName('');
      setEditActive(true);
      setEditVinculo('Nenhum');
      setEditOpId(undefined);
      setEditContaId(undefined);
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
      ativo: editActive,
      tipoVinculo: editVinculo,
      operadoraId: editVinculo === 'Operadora' ? editOpId : undefined,
      contaDestinoId: editVinculo === 'Conta' ? editContaId : undefined
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
    <div className="max-w-5xl mx-auto space-y-6">
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
              <th className="p-4 font-semibold text-gray-600 text-sm">Vínculo Financeiro</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Situação</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            
            {/* Inline Editor Row */}
            {editingId !== null && (
               <tr className="bg-blue-50 border-b-2 border-blue-200">
                <td className="p-4 text-center text-gray-400 font-bold">{editingId === 0 ? 'Novo' : editingId}</td>
                <td className="p-4 align-top">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Nome</label>
                    <input 
                        autoFocus
                        type="text" 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Ex: Cartão Crédito"
                        className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                    />
                </td>
                <td className="p-4 align-top">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Tipo de Vínculo</label>
                    <select 
                        value={editVinculo}
                        onChange={e => setEditVinculo(e.target.value as any)}
                        className="w-full p-2 border border-blue-300 rounded bg-white mb-2 text-sm"
                    >
                        <option value="Nenhum">Nenhum (Apenas Caixa)</option>
                        <option value="Operadora">Cartão (Operadora)</option>
                        <option value="Conta">Depósito/PIX (Conta)</option>
                    </select>

                    {editVinculo === 'Operadora' && (
                        <div>
                             <label className="text-[10px] uppercase font-bold text-gray-500">Selecione Operadora</label>
                             <select 
                                value={editOpId || ''}
                                onChange={e => setEditOpId(parseInt(e.target.value))}
                                className="w-full p-2 border border-blue-300 rounded bg-white text-sm"
                            >
                                <option value="">Selecione...</option>
                                {operadoras.map(op => <option key={op.id} value={op.id}>{op.nome}</option>)}
                            </select>
                        </div>
                    )}

                    {editVinculo === 'Conta' && (
                        <div>
                             <label className="text-[10px] uppercase font-bold text-gray-500">Selecione Conta Destino</label>
                             <select 
                                value={editContaId || ''}
                                onChange={e => setEditContaId(parseInt(e.target.value))}
                                className="w-full p-2 border border-blue-300 rounded bg-white text-sm"
                            >
                                <option value="">Selecione...</option>
                                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                    )}
                </td>
                <td className="p-4 align-top">
                     <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                    <select 
                        value={editActive ? 'true' : 'false'}
                        onChange={e => setEditActive(e.target.value === 'true')}
                        className="w-full p-2 border border-blue-300 rounded bg-white"
                    >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </td>
                <td className="p-4 text-right align-top pt-8">
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={handleSave} className="p-2 bg-green-600 text-white rounded hover:bg-green-700"><CheckCircle size={18}/></button>
                        <button onClick={handleCancel} className="p-2 bg-gray-400 text-white rounded hover:bg-gray-500"><X size={18}/></button>
                    </div>
                </td>
               </tr>
            )}

            {methods.map(method => {
              if (editingId === method.id) return null; // Skip if editing
              
              const linkedOp = method.operadoraId ? operadoras.find(o => o.id === method.operadoraId)?.nome : null;
              const linkedConta = method.contaDestinoId ? contas.find(c => c.id === method.contaDestinoId)?.nome : null;

              return (
                <tr key={method.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-500 font-mono">{method.id}</td>
                    <td className="p-4 font-medium text-gray-800">{method.nome}</td>
                    <td className="p-4 text-sm text-gray-600">
                        {method.tipoVinculo === 'Operadora' ? (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Op: {linkedOp || '?'}</span>
                        ) : method.tipoVinculo === 'Conta' ? (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Conta: {linkedConta || '?'}</span>
                        ) : (
                            <span className="text-gray-400 italic">Sem vínculo</span>
                        )}
                    </td>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentMethods;
