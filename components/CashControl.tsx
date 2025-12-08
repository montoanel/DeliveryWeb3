import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Usuario, SessaoCaixa, CaixaMovimento, TipoOperacaoCaixa, StatusSessao, ConferenciaFechamento, Caixa } from '../types';
import { DollarSign, Lock, Unlock, AlertTriangle, TrendingUp, TrendingDown, History, Save, X } from 'lucide-react';

interface CashControlProps {
  user: Usuario;
}

const CashControl: React.FC<CashControlProps> = ({ user }) => {
  const [session, setSession] = useState<SessaoCaixa | undefined>(undefined);
  const [history, setHistory] = useState<CaixaMovimento[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Open Session Form
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [selectedCaixaId, setSelectedCaixaId] = useState<number | ''>('');
  const [initialBalance, setInitialBalance] = useState('0.00');

  // Operation Modal
  const [modalType, setModalType] = useState<TipoOperacaoCaixa | null>(null);
  const [opValue, setOpValue] = useState('');
  const [opObs, setOpObs] = useState('');

  // Closing Modal
  const [isClosing, setIsClosing] = useState(false);
  const [closingValues, setClosingValues] = useState<ConferenciaFechamento>({
    dinheiro: 0, cartaoCredito: 0, cartaoDebito: 0, pix: 0, voucher: 0, outros: 0, observacoes: ''
  });

  const loadData = () => {
    setLoading(true);
    const activeSession = db.getSessaoAberta(user.id);
    setSession(activeSession);
    
    if (activeSession) {
      setHistory(db.getCaixaMovimentos(activeSession.id));
      setSaldo(db.getSaldoSessao(activeSession.id));
    } else {
      setCaixas(db.getCaixas().filter(c => c.ativo));
      if(user.caixaPadraoId) setSelectedCaixaId(user.caixaPadraoId);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaixaId) {
      alert("Selecione um caixa.");
      return;
    }
    try {
      db.abrirSessao(user.id, Number(selectedCaixaId), parseFloat(initialBalance));
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !modalType) return;
    
    const val = parseFloat(opValue);
    if (isNaN(val) || val <= 0) {
      alert("Valor inválido");
      return;
    }

    // If bleed, check balance?
    if (modalType === TipoOperacaoCaixa.Sangria && val > saldo) {
        if(!confirm("O valor da sangria é maior que o saldo atual calculad. Continuar?")) return;
    }

    db.lancarMovimento(session.id, modalType, val, opObs);
    setModalType(null);
    setOpValue('');
    setOpObs('');
    loadData();
    alert("Movimento registrado com sucesso.");
  };

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    if (confirm("Confirma o fechamento do caixa?")) {
        try {
             db.fecharSessao(session.id, closingValues);
             setIsClosing(false);
             loadData();
             alert("Caixa fechado com sucesso.");
        } catch(e: any) {
            alert(e.message);
        }
    }
  };
  
  const getIcon = (type: TipoOperacaoCaixa) => {
      switch(type) {
          case TipoOperacaoCaixa.Abertura: return <Lock size={14} />;
          case TipoOperacaoCaixa.Fechamento: return <Lock size={14} />;
          case TipoOperacaoCaixa.Reforco: return <TrendingUp size={14} />;
          case TipoOperacaoCaixa.Sangria: return <TrendingDown size={14} />;
          case TipoOperacaoCaixa.Vendas: return <DollarSign size={14} />;
          default: return <DollarSign size={14} />;
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  // NO SESSION - SHOW OPEN FORM
  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
           <div className="text-center mb-6">
               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Lock size={32} />
               </div>
               <h2 className="text-2xl font-bold text-gray-800">Caixa Fechado</h2>
               <p className="text-gray-500">Abra uma sessão para começar a vender.</p>
           </div>
           
           <form onSubmit={handleOpenSession} className="space-y-4">
               <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Selecione o Terminal</label>
                   <select 
                     value={selectedCaixaId} 
                     onChange={(e) => setSelectedCaixaId(parseInt(e.target.value))}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   >
                       <option value="">Selecione...</option>
                       {caixas.map(c => (
                           <option key={c.id} value={c.id}>{c.nome}</option>
                       ))}
                   </select>
               </div>
               
               <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Saldo Inicial (Fundo de Troco)</label>
                   <div className="relative">
                       <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                       <input 
                         type="number" 
                         step="0.01"
                         value={initialBalance}
                         onChange={(e) => setInitialBalance(e.target.value)}
                         className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                       />
                   </div>
               </div>
               
               <button 
                 type="submit" 
                 className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
               >
                   <Unlock size={20} /> Abrir Caixa
               </button>
           </form>
        </div>
      </div>
    );
  }

  // ACTIVE SESSION
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Overview Card */}
      <div className="lg:col-span-1 space-y-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo Atual</p>
             <h2 className="text-4xl font-extrabold text-gray-800 mb-4">R$ {saldo.toFixed(2)}</h2>
             <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                 <Unlock size={12} /> Sessão Aberta (#{session.id})
             </div>
             
             <div className="mt-6 grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => setModalType(TipoOperacaoCaixa.Reforco)}
                    className="py-2 px-4 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 flex flex-col items-center gap-1"
                 >
                     <TrendingUp size={20} />
                     <span className="text-xs">Reforço</span>
                 </button>
                 <button 
                    onClick={() => setModalType(TipoOperacaoCaixa.Sangria)}
                    className="py-2 px-4 bg-orange-50 text-orange-700 font-bold rounded-lg hover:bg-orange-100 flex flex-col items-center gap-1"
                 >
                     <TrendingDown size={20} />
                     <span className="text-xs">Sangria</span>
                 </button>
             </div>
             
             <button 
                 onClick={() => setIsClosing(true)}
                 className="w-full mt-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
             >
                 <Lock size={18} /> Fechar Caixa
             </button>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-700 mb-4">Detalhes</h3>
             <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                     <span className="text-gray-500">Operador:</span>
                     <span className="font-bold">{session.usuarioNome}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">Terminal:</span>
                     <span className="font-bold">{session.caixaNome}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">Abertura:</span>
                     <span className="font-bold">{new Date(session.dataAbertura).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-gray-500">Fundo Inicial:</span>
                     <span className="font-bold">R$ {session.saldoInicial.toFixed(2)}</span>
                 </div>
             </div>
         </div>
      </div>

      {/* History List */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <History size={24} className="text-gray-400"/> Movimentações da Sessão
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Obs</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((mov) => {
                const isNegative = mov.tipoOperacao === TipoOperacaoCaixa.Sangria || mov.tipoOperacao === TipoOperacaoCaixa.Fechamento;
                return (
                <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(mov.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                      ${mov.tipoOperacao === TipoOperacaoCaixa.Sangria ? 'bg-orange-100 text-orange-700' : 
                        mov.tipoOperacao === TipoOperacaoCaixa.Vendas ? 'bg-green-100 text-green-700' :
                        mov.tipoOperacao === TipoOperacaoCaixa.Fechamento ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {getIcon(mov.tipoOperacao)}
                      {mov.tipoOperacao}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 truncate max-w-xs" title={mov.observacao}>
                    {mov.observacao || '-'}
                  </td>
                  <td className={`p-4 text-sm font-bold text-right ${
                    isNegative ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {isNegative ? '-' : '+'} R$ {mov.valor.toFixed(2)}
                  </td>
                </tr>
              )})}
              {history.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Sem movimentos nesta sessão.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operation Modal */}
      {modalType && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      {modalType === TipoOperacaoCaixa.Reforco ? <TrendingUp className="text-blue-600"/> : <TrendingDown className="text-orange-600"/>}
                      Novo {modalType}
                  </h3>
                  
                  <form onSubmit={handleOperation} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Valor</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            autoFocus
                            value={opValue} 
                            onChange={(e) => setOpValue(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Observação</label>
                          <input 
                            type="text" 
                            value={opObs} 
                            onChange={(e) => setOpObs(e.target.value)}
                            placeholder="Motivo..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                          <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold text-gray-700">Cancelar</button>
                          <button type="submit" className="flex-1 py-2 bg-blue-600 rounded-lg font-bold text-white">Confirmar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Closing Modal */}
      {isClosing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-red-600">
                          <Lock /> Fechamento de Caixa
                      </h3>
                      <button onClick={() => setIsClosing(false)} className="hover:bg-gray-100 p-1 rounded"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto">
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 flex gap-3">
                          <AlertTriangle className="text-yellow-600 shrink-0" />
                          <div className="text-sm text-yellow-800">
                              <p className="font-bold">Atenção!</p>
                              <p>Informe os valores contados fisicamente na gaveta. O sistema calculará a quebra de caixa automaticamente.</p>
                          </div>
                      </div>

                      <form id="closeForm" onSubmit={handleCloseSession} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Dinheiro</label>
                                  <input 
                                    type="number" step="0.01" 
                                    value={closingValues.dinheiro} 
                                    onChange={(e) => setClosingValues({...closingValues, dinheiro: parseFloat(e.target.value) || 0})}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Cartão Crédito</label>
                                  <input 
                                    type="number" step="0.01" 
                                    value={closingValues.cartaoCredito} 
                                    onChange={(e) => setClosingValues({...closingValues, cartaoCredito: parseFloat(e.target.value) || 0})}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Cartão Débito</label>
                                  <input 
                                    type="number" step="0.01" 
                                    value={closingValues.cartaoDebito} 
                                    onChange={(e) => setClosingValues({...closingValues, cartaoDebito: parseFloat(e.target.value) || 0})}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">PIX</label>
                                  <input 
                                    type="number" step="0.01" 
                                    value={closingValues.pix} 
                                    onChange={(e) => setClosingValues({...closingValues, pix: parseFloat(e.target.value) || 0})}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Voucher / Outros</label>
                                  <input 
                                    type="number" step="0.01" 
                                    value={closingValues.outros} 
                                    onChange={(e) => setClosingValues({...closingValues, outros: parseFloat(e.target.value) || 0})}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                              </div>
                          </div>
                          
                          <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Observações do Fechamento</label>
                               <textarea 
                                  value={closingValues.observacoes}
                                  onChange={(e) => setClosingValues({...closingValues, observacoes: e.target.value})}
                                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                               ></textarea>
                          </div>
                          
                          <div className="bg-gray-100 p-4 rounded text-right">
                              <span className="text-gray-600 font-bold mr-2">Total Informado:</span>
                              <span className="text-xl font-bold text-gray-900">
                                  R$ {(closingValues.dinheiro + closingValues.cartaoCredito + closingValues.cartaoDebito + closingValues.pix + closingValues.voucher + closingValues.outros).toFixed(2)}
                              </span>
                          </div>
                      </form>
                  </div>
                  
                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                      <button onClick={() => setIsClosing(false)} className="px-6 py-2 bg-gray-200 rounded-lg font-bold text-gray-700">Cancelar</button>
                      <button 
                        type="submit" 
                        form="closeForm"
                        className="px-6 py-2 bg-red-600 rounded-lg font-bold text-white hover:bg-red-700 shadow-lg"
                      >
                          Conferir e Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default CashControl;