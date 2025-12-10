


import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { ContaPagar, Fornecedor, ContaFinanceira, FormaPagamento } from '../types';
import { Plus, Edit2, Trash2, Save, X, FileText, Calendar, CheckCircle, AlertTriangle, ArrowRightCircle, Wallet, Filter, CreditCard } from 'lucide-react';

const BillsToPay: React.FC = () => {
  const [bills, setBills] = useState<ContaPagar[]>([]);
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<ContaFinanceira[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  
  // Filters State
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Pendente' | 'Pago'>('Pendente');
  const [filterSupplier, setFilterSupplier] = useState<number | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDateType, setFilterDateType] = useState<'Vencimento' | 'Emissao'>('Vencimento');

  // Form State
  const initialForm: ContaPagar = {
      id: 0,
      fornecedorId: 0,
      fornecedorNome: '',
      descricao: '',
      valor: 0,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: new Date().toISOString().split('T')[0],
      status: 'Pendente'
  };
  const [formData, setFormData] = useState<ContaPagar>(initialForm);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payBillId, setPayBillId] = useState<number | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [paySourceId, setPaySourceId] = useState<number | ''>('');
  const [payMethodId, setPayMethodId] = useState<number | ''>('');
  const [payObs, setPayObs] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBills(db.getContasPagar());
    setSuppliers(db.getFornecedores());
    setFinancialAccounts(db.getContasFinanceiras());
    setPaymentMethods(db.getFormasPagamento());
  };

  const handleNew = () => {
      setFormData({...initialForm});
      setView('form');
  };

  const handleEdit = (bill: ContaPagar) => {
      if (bill.status === 'Pago') {
          alert("Não é possível editar uma conta já paga.");
          return;
      }
      setFormData({...bill});
      setView('form');
  };

  const handleDelete = (id: number) => {
      if(confirm("Excluir esta conta a pagar?")) {
          db.deleteContaPagar(id);
          loadData();
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.fornecedorId === 0 || !formData.descricao || formData.valor <= 0) {
          alert("Preencha todos os campos obrigatórios.");
          return;
      }
      db.saveContaPagar(formData);
      loadData();
      setView('list');
  };

  // Payment Logic
  const openPayModal = (bill: ContaPagar) => {
      setPayBillId(bill.id);
      setPayDate(new Date().toISOString().split('T')[0]);
      setPaySourceId('');
      setPayMethodId('');
      setPayObs('');
      setIsPayModalOpen(true);
  };

  const confirmPayment = () => {
      if (!payBillId || !paySourceId) {
          alert("Selecione a conta de origem para o pagamento.");
          return;
      }
      try {
          db.pagarConta(payBillId, Number(paySourceId), payDate, payMethodId ? Number(payMethodId) : undefined, payObs);
          alert("Pagamento registrado com sucesso!");
          setIsPayModalOpen(false);
          loadData();
      } catch (e: any) {
          alert(e.message);
      }
  };

  // Filter Logic
  const filteredBills = bills.filter(b => {
      // 1. Status Filter
      if (filterStatus !== 'Todos' && b.status !== filterStatus) return false;
      
      // 2. Supplier Filter
      if (filterSupplier && b.fornecedorId !== filterSupplier) return false;

      // 3. Date Range Filter
      if (filterStartDate && filterEndDate) {
          const dateToCheck = filterDateType === 'Vencimento' ? b.dataVencimento : b.dataEmissao;
          if (dateToCheck < filterStartDate || dateToCheck > filterEndDate) return false;
      }

      return true;
  });

  const clearFilters = () => {
      setFilterStatus('Pendente');
      setFilterSupplier('');
      setFilterStartDate('');
      setFilterEndDate('');
      setFilterDateType('Vencimento');
  };

  if (view === 'form') {
      return (
          <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">{formData.id === 0 ? 'Nova Conta a Pagar' : 'Editar Conta'}</h1>
                  <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20}/> Cancelar</button>
              </div>
              <form onSubmit={handleSave} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Fornecedor</label>
                      <select 
                        value={formData.fornecedorId} 
                        onChange={e => setFormData({...formData, fornecedorId: Number(e.target.value)})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                          <option value={0}>Selecione...</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                      <input type="text" required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Compra de Mercadoria NFe 123"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                          <input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({...formData, valor: parseFloat(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Data Emissão</label>
                          <input type="date" required value={formData.dataEmissao} onChange={e => setFormData({...formData, dataEmissao: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Data Vencimento</label>
                          <input type="date" required value={formData.dataVencimento} onChange={e => setFormData({...formData, dataVencimento: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Salvar Conta</button>
                  </div>
              </form>
          </div>
      )
  }

  return (
    <div className="space-y-6 relative">
        {/* Payment Modal */}
        {isPayModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 animate-in zoom-in duration-200">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700"><CheckCircle /> Baixar / Pagar Conta</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Data do Pagamento</label>
                            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Origem do Dinheiro (Conta/Cofre)</label>
                            <select value={paySourceId} onChange={e => setPaySourceId(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                                <option value="">Selecione...</option>
                                {financialAccounts.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome} ({c.tipo}) - Saldo: R$ {c.saldoAtual.toFixed(2)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Forma de Pagamento</label>
                            <select value={payMethodId} onChange={e => setPayMethodId(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                                <option value="">Selecione (Opcional)...</option>
                                {paymentMethods.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Observações (Opcional)</label>
                            <input type="text" value={payObs} onChange={e => setPayObs(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="Ex: Pago via Pix, NFe 123"/>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setIsPayModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded font-bold text-gray-600">Cancelar</button>
                            <button onClick={confirmPayment} className="flex-1 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Confirmar Pagamento</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-red-600"/> Contas a Pagar</h1>
            <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"><Plus size={20}/> Nova Conta</button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-gray-500 font-bold mb-2 w-full lg:w-auto lg:mb-0">
                <Filter size={18} /> Filtros
            </div>
            
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 mb-1">Fornecedor</label>
                <select 
                    value={filterSupplier} 
                    onChange={e => setFilterSupplier(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                >
                    <option value="">Todos</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
            </div>

            <div className="w-32">
                <label className="block text-xs font-bold text-gray-500 mb-1">Considerar Data</label>
                <select 
                    value={filterDateType} 
                    onChange={e => setFilterDateType(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                >
                    <option value="Vencimento">Vencimento</option>
                    <option value="Emissao">Emissão</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">De</label>
                    <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Até</label>
                    <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
            </div>

            <div className="w-32">
                <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                >
                    <option value="Todos">Todos</option>
                    <option value="Pendente">Pendentes</option>
                    <option value="Pago">Pagos</option>
                </select>
            </div>

            <button onClick={clearFilters} className="px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm font-bold hover:bg-gray-200">Limpar</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-4 text-sm font-bold text-gray-600">Datas</th>
                        <th className="p-4 text-sm font-bold text-gray-600">Fornecedor</th>
                        <th className="p-4 text-sm font-bold text-gray-600">Descrição</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-right">Valor</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-center">Status</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredBills.map(b => {
                        const isLate = b.status === 'Pendente' && new Date(b.dataVencimento) < new Date(new Date().toISOString().split('T')[0]);
                        return (
                        <tr key={b.id} className="hover:bg-gray-50">
                            <td className="p-4 text-sm text-gray-600 font-mono">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14}/> Venc: {new Date(b.dataVencimento).toLocaleDateString('pt-BR')}
                                    {isLate && <AlertTriangle size={14} className="text-red-500" title="Vencido"/>}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">Emissão: {b.dataEmissao ? new Date(b.dataEmissao).toLocaleDateString('pt-BR') : '-'}</div>
                            </td>
                            <td className="p-4 font-bold text-gray-800">{b.fornecedorNome}</td>
                            <td className="p-4 text-sm text-gray-600">{b.descricao}</td>
                            <td className="p-4 text-right font-bold text-red-600">R$ {b.valor.toFixed(2)}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${b.status === 'Pago' ? 'bg-green-100 text-green-700' : isLate ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {b.status === 'Pago' ? 'Pago' : isLate ? 'Vencido' : 'Pendente'}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {b.status === 'Pendente' && (
                                        <>
                                            <button onClick={() => openPayModal(b)} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold hover:bg-green-100 flex items-center gap-1">
                                                <Wallet size={14}/> Pagar
                                            </button>
                                            <button onClick={() => handleEdit(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18}/></button>
                                        </>
                                    )}
                                    <button onClick={() => handleDelete(b.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    )})}
                    {filteredBills.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma conta encontrada com os filtros selecionados.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default BillsToPay;