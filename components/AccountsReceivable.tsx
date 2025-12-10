
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { ContaReceber, Cliente, ContaFinanceira, FormaPagamento } from '../types';
import { Plus, Edit2, Trash2, Save, X, TrendingUp, Calendar, CheckCircle, Wallet, Filter, ArrowDownLeft } from 'lucide-react';

const AccountsReceivable: React.FC = () => {
  const [receivables, setReceivables] = useState<ContaReceber[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<ContaFinanceira[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  
  // Filters State
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Pendente' | 'Recebido' | 'Parcial'>('Pendente');
  const [filterClient, setFilterClient] = useState<string>(''); // Name filter
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form State (Manual Entry)
  const initialForm: ContaReceber = {
      id: '',
      descricao: '',
      clienteNome: '',
      valorBruto: 0,
      taxaAplicada: 0,
      valorLiquido: 0,
      valorRecebido: 0,
      historicoRecebimentos: [],
      dataVenda: new Date().toISOString().split('T')[0],
      dataPrevisao: new Date().toISOString().split('T')[0],
      status: 'Pendente',
      origem: 'Lançamento Manual',
      formaPagamentoNome: 'Outros'
  };
  const [formData, setFormData] = useState<ContaReceber>(initialForm);

  // Receive Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveBillId, setReceiveBillId] = useState<string | null>(null);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiveDestId, setReceiveDestId] = useState<number | ''>('');
  const [receiveMethodId, setReceiveMethodId] = useState<number | ''>('');
  const [receiveObs, setReceiveObs] = useState('');
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [selectedBillForReceive, setSelectedBillForReceive] = useState<ContaReceber | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setReceivables(db.getContasReceber());
    setClients(db.getClientes());
    setFinancialAccounts(db.getContasFinanceiras());
    setPaymentMethods(db.getFormasPagamento());
  };

  const handleNew = () => {
      setFormData({...initialForm});
      setView('form');
  };

  const handleDelete = (id: string) => {
      if(confirm("Excluir este lançamento a receber?")) {
          db.deleteContaReceber(id);
          loadData();
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.descricao || formData.valorBruto <= 0) {
          alert("Preencha descrição e valor.");
          return;
      }
      // Simple manual logic: Net = Gross (no auto tax calc for manual yet)
      const payload = {
          ...formData,
          valorLiquido: formData.valorBruto
      };
      db.saveContaReceber(payload);
      loadData();
      setView('list');
  };

  // Receive Logic
  const openReceiveModal = (bill: ContaReceber) => {
      setSelectedBillForReceive(bill);
      setReceiveBillId(bill.id);
      setReceiveDate(new Date().toISOString().split('T')[0]);
      setReceiveDestId(bill.contaDestinoId || '');
      setReceiveMethodId('');
      setReceiveObs('');
      
      const restante = bill.valorLiquido - (bill.valorRecebido || 0);
      setReceiveAmount(restante.toFixed(2));
      
      setIsReceiveModalOpen(true);
  };

  const confirmReceive = () => {
      if (!receiveBillId || !receiveDestId) {
          alert("Selecione a conta de destino para o recebimento.");
          return;
      }
      
      const val = parseFloat(receiveAmount);
      if (isNaN(val) || val <= 0) {
          alert("Valor inválido.");
          return;
      }

      try {
          db.receberConta(receiveBillId, Number(receiveDestId), receiveDate, receiveMethodId ? Number(receiveMethodId) : undefined, receiveObs, val);
          alert("Recebimento registrado com sucesso!");
          setIsReceiveModalOpen(false);
          loadData();
      } catch (e: any) {
          alert(e.message);
      }
  };

  // Filter Logic
  const filteredList = receivables.filter(r => {
      if (filterStatus !== 'Todos' && r.status !== filterStatus) return false;
      if (filterClient && !r.clienteNome?.toLowerCase().includes(filterClient.toLowerCase()) && !r.origem.toLowerCase().includes(filterClient.toLowerCase())) return false;
      
      if (filterStartDate && filterEndDate) {
          if (r.dataPrevisao < filterStartDate || r.dataPrevisao > filterEndDate) return false;
      }
      return true;
  });

  if (view === 'form') {
      return (
          <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">Novo Título a Receber (Manual)</h1>
                  <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20}/> Cancelar</button>
              </div>
              <form onSubmit={handleSave} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                      <input type="text" required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Venda de Ativo, Bônus..."/>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Cliente / Origem</label>
                      <input type="text" value={formData.clienteNome} onChange={e => setFormData({...formData, clienteNome: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opcional"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                          <input type="number" step="0.01" required value={formData.valorBruto} onChange={e => setFormData({...formData, valorBruto: parseFloat(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Data Previsão</label>
                          <input type="date" required value={formData.dataPrevisao} onChange={e => setFormData({...formData, dataPrevisao: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>
                  </div>
                  <div className="flex justify-end pt-4">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> Salvar</button>
                  </div>
              </form>
          </div>
      )
  }

  return (
    <div className="space-y-6 relative">
        {/* Receive Modal */}
        {isReceiveModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 animate-in zoom-in duration-200">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700"><ArrowDownLeft /> Receber Título</h3>
                    
                    {selectedBillForReceive && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                            <p><b>Origem:</b> {selectedBillForReceive.origem}</p>
                            <p><b>Total Líquido:</b> R$ {selectedBillForReceive.valorLiquido.toFixed(2)}</p>
                            <p><b>Já Recebido:</b> R$ {(selectedBillForReceive.valorRecebido || 0).toFixed(2)}</p>
                            <p className="text-blue-600 font-bold">Restante: R$ {(selectedBillForReceive.valorLiquido - (selectedBillForReceive.valorRecebido || 0)).toFixed(2)}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Data do Recebimento</label>
                            <input type="date" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Conta de Destino (Entrada)</label>
                            <select value={receiveDestId} onChange={e => setReceiveDestId(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                                <option value="">Selecione...</option>
                                {financialAccounts.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Forma (Opcional)</label>
                            <select value={receiveMethodId} onChange={e => setReceiveMethodId(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
                                <option value="">Selecione...</option>
                                {paymentMethods.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Valor a Receber (R$)</label>
                            <input type="number" step="0.01" value={receiveAmount} onChange={e => setReceiveAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded font-bold text-lg"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Observações</label>
                            <input type="text" value={receiveObs} onChange={e => setReceiveObs(e.target.value)} className="w-full p-2 border border-gray-300 rounded"/>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setIsReceiveModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded font-bold text-gray-600">Cancelar</button>
                            <button onClick={confirmReceive} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="text-green-600"/> Contas a Receber</h1>
            <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"><Plus size={20}/> Novo Lançamento</button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-gray-500 font-bold mb-2 w-full lg:w-auto lg:mb-0">
                <Filter size={18} /> Filtros
            </div>
            
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 mb-1">Cliente / Origem</label>
                <input 
                    type="text" 
                    value={filterClient} 
                    onChange={e => setFilterClient(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                    placeholder="Nome..."
                />
            </div>

            <div className="flex items-center gap-2">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">De (Previsão)</label>
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
                    <option value="Parcial">Parciais</option>
                    <option value="Recebido">Recebidos</option>
                </select>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-4 text-sm font-bold text-gray-600">Previsão</th>
                        <th className="p-4 text-sm font-bold text-gray-600">Origem / Descrição</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-right">Valor Líq.</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-right">Recebido</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-center">Status</th>
                        <th className="p-4 text-sm font-bold text-gray-600 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredList.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                            <td className="p-4 text-sm text-gray-600 font-mono">
                                {new Date(r.dataPrevisao).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-4">
                                <div className="font-bold text-gray-800">{r.origem}</div>
                                <div className="text-xs text-gray-500">{r.descricao || (r.pedidoId ? `Pedido #${r.pedidoId}` : '-')}</div>
                                {r.clienteNome && <div className="text-xs text-blue-600">{r.clienteNome}</div>}
                            </td>
                            <td className="p-4 text-right font-bold text-blue-600">R$ {r.valorLiquido.toFixed(2)}</td>
                            <td className="p-4 text-right text-sm text-green-600">
                                {r.valorRecebido && r.valorRecebido > 0 ? `R$ ${r.valorRecebido.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                    ${r.status === 'Recebido' ? 'bg-green-100 text-green-700' : 
                                      r.status === 'Parcial' ? 'bg-blue-100 text-blue-700' : 
                                      'bg-yellow-100 text-yellow-700'}`}>
                                    {r.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {r.status !== 'Recebido' && (
                                        <button onClick={() => openReceiveModal(r)} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold hover:bg-green-100 flex items-center gap-1">
                                            <Wallet size={14}/> Baixar
                                        </button>
                                    )}
                                    {/* Only allow deleting manual entries */}
                                    {!r.pedidoId && (
                                        <button onClick={() => handleDelete(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredList.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum título encontrado.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default AccountsReceivable;
