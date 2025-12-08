
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/mockDb';
import { Usuario, SessaoCaixa, CaixaMovimento, TipoOperacaoCaixa, StatusSessao, ConferenciaFechamento, Caixa } from '../types';
import { DollarSign, Lock, Unlock, AlertTriangle, TrendingUp, TrendingDown, History, Save, X, ClipboardCheck, Eye, Printer, Calendar, Search } from 'lucide-react';

interface CashControlProps {
  user: Usuario;
}

const CashControl: React.FC<CashControlProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'my-cash' | 'audit' | 'history'>('my-cash');

  const isAdmin = user.perfil === 'Administrador';

  return (
    <div className="space-y-6">
       {/* Tab Navigation (Visible only to Admin) */}
       {isAdmin && (
           <div className="flex gap-4 border-b border-gray-200">
               <button 
                  onClick={() => setActiveTab('my-cash')}
                  className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'my-cash' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                   Meu Caixa Atual
               </button>
               <button 
                  onClick={() => setActiveTab('audit')}
                  className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'audit' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                   Conferência / Auditoria
               </button>
               <button 
                  onClick={() => setActiveTab('history')}
                  className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'history' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                   Histórico / Relatórios
               </button>
           </div>
       )}

       {activeTab === 'my-cash' ? (
           <OperatorView user={user} />
       ) : activeTab === 'audit' ? (
           <AuditView user={user} />
       ) : (
           <HistoryView user={user} />
       )}
    </div>
  );
};

// --- SUB-COMPONENT: OPERATOR VIEW (Existing Logic) ---
const OperatorView: React.FC<{ user: Usuario }> = ({ user }) => {
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

    if (modalType === TipoOperacaoCaixa.Sangria && val > saldo) {
        if(!confirm("O valor da sangria é maior que o saldo atual calculado. Continuar?")) return;
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
             alert("Caixa fechado com sucesso. Aguardando conferência da gerência.");
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
          case TipoOperacaoCaixa.Troco: return <TrendingDown size={14} />;
          case TipoOperacaoCaixa.Vendas: return <DollarSign size={14} />;
          default: return <DollarSign size={14} />;
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-10 animate-in fade-in zoom-in duration-300">
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

  // ACTIVE SESSION UI (Same as before)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      
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
                const isNegative = mov.tipoOperacao === TipoOperacaoCaixa.Sangria || mov.tipoOperacao === TipoOperacaoCaixa.Fechamento || mov.tipoOperacao === TipoOperacaoCaixa.Troco;
                const isNeutral = mov.tipoOperacao === TipoOperacaoCaixa.UsoCredito;
                return (
                <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(mov.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                      ${isNegative ? 'bg-orange-100 text-orange-700' : 
                        isNeutral ? 'bg-blue-100 text-blue-700' :
                        mov.tipoOperacao === TipoOperacaoCaixa.Fechamento ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
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
                    isNegative ? 'text-red-600' : isNeutral ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {isNegative ? '-' : isNeutral ? '' : '+'} R$ {mov.valor.toFixed(2)}
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

// --- SUB-COMPONENT: AUDIT VIEW (Existing Logic) ---
const AuditView: React.FC<{ user: Usuario }> = ({ user }) => {
    const [closedSessions, setClosedSessions] = useState<SessaoCaixa[]>([]);
    const [selectedSession, setSelectedSession] = useState<SessaoCaixa | null>(null);
    const [auditValues, setAuditValues] = useState<ConferenciaFechamento | null>(null);

    const loadSessions = () => {
        setClosedSessions(db.getSessoesFechadas());
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleSelectSession = (s: SessaoCaixa) => {
        setSelectedSession(s);
        // Start Audit with User's values
        setAuditValues(s.conferenciaOperador || {
             dinheiro: 0, cartaoCredito: 0, cartaoDebito: 0, pix: 0, voucher: 0, outros: 0, observacoes: ''
        });
    };

    const handleConsolidate = () => {
        if (!selectedSession || !auditValues) return;
        if (confirm("Confirmar a consolidação deste caixa? Esta ação é irreversível.")) {
            try {
                db.consolidarSessao(selectedSession.id, auditValues);
                alert("Caixa consolidado com sucesso!");
                setSelectedSession(null);
                setAuditValues(null);
                loadSessions();
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    // Helper to compare values rows
    const renderComparisonRow = (label: string, field: keyof ConferenciaFechamento, systemVal: number = 0) => {
        if (!selectedSession || !auditValues) return null;
        const operatorVal = (selectedSession.conferenciaOperador as any)[field] as number;
        const auditVal = (auditValues as any)[field] as number;
        const diff = auditVal - systemVal; // Based on final audit

        return (
            <tr className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-700">{label}</td>
                <td className="p-3 text-sm font-bold text-gray-500 text-right">R$ {systemVal.toFixed(2)}</td>
                <td className="p-3 text-sm font-bold text-blue-600 text-right">R$ {operatorVal.toFixed(2)}</td>
                <td className="p-3 text-right">
                    <input 
                        type="number" step="0.01"
                        value={auditVal}
                        onChange={(e) => setAuditValues({...auditValues, [field]: parseFloat(e.target.value) || 0})}
                        className="w-24 p-1 border border-purple-300 rounded text-right font-bold text-purple-700 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </td>
                <td className={`p-3 text-sm font-bold text-right ${diff === 0 ? 'text-gray-400' : diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diff > 0 ? '+' : ''} R$ {diff.toFixed(2)}
                </td>
            </tr>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* List of Closed Sessions */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex justify-between items-center">
                    <span>Caixas Fechados (Aguardando)</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">{closedSessions.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {closedSessions.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => handleSelectSession(s)}
                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-purple-50 ${selectedSession?.id === s.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-gray-800">#{s.id} - {s.caixaNome}</span>
                                <span className="text-xs text-gray-500">{new Date(s.dataFechamento!).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">Op: {s.usuarioNome}</div>
                            <div className="flex justify-between items-center">
                                <div className={`text-xs font-bold px-2 py-1 rounded ${s.quebraDeCaixa === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Dif: R$ {s.quebraDeCaixa?.toFixed(2)}
                                </div>
                                <div className="text-purple-600 flex items-center gap-1 text-xs font-bold">
                                    <ClipboardCheck size={14} /> Conferir
                                </div>
                            </div>
                        </div>
                    ))}
                    {closedSessions.length === 0 && (
                         <div className="p-8 text-center text-gray-400 text-sm">Nenhum caixa aguardando conferência.</div>
                    )}
                </div>
            </div>

            {/* Audit Form */}
            <div className="lg:col-span-2">
                {selectedSession && auditValues ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Consolidação de Caixa #{selectedSession.id}</h2>
                            <div className="text-sm text-gray-500">
                                Fechado em: {new Date(selectedSession.dataFechamento!).toLocaleString()}
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 text-sm text-yellow-800">
                            <b>Instruções:</b> A coluna "Auditado" vem preenchida com o valor contado pelo operador. 
                            Se houver divergência, corrija o valor nesta coluna. A diferença final será registrada como Quebra de Caixa.
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="p-3 text-left">Tipo</th>
                                        <th className="p-3 text-right">Sistema (Calc)</th>
                                        <th className="p-3 text-right">Informado (Op)</th>
                                        <th className="p-3 text-right text-purple-700">Auditado (Final)</th>
                                        <th className="p-3 text-right">Diferença</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderComparisonRow('Dinheiro', 'dinheiro', db.getSaldoDinheiroSessao(selectedSession.id))}
                                    {renderComparisonRow('Cartão Crédito', 'cartaoCredito', db.getSaldoFormaPagamentoSessao(selectedSession.id, 2))}
                                    {renderComparisonRow('Cartão Débito', 'cartaoDebito', db.getSaldoFormaPagamentoSessao(selectedSession.id, 3))}
                                    {renderComparisonRow('PIX', 'pix', db.getSaldoFormaPagamentoSessao(selectedSession.id, 4))}
                                    {renderComparisonRow('Voucher / Outros', 'voucher', db.getSaldoFormaPagamentoSessao(selectedSession.id, 5))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-6 border-t border-gray-100 pt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Observações da Auditoria</label>
                            <textarea 
                                value={auditValues.observacoes}
                                onChange={(e) => setAuditValues({...auditValues, observacoes: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                rows={2}
                                placeholder="Justificativa da correção..."
                            ></textarea>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button 
                                onClick={() => setSelectedSession(null)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConsolidate}
                                className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-200 flex items-center gap-2"
                            >
                                <ClipboardCheck size={18} /> Finalizar Consolidação
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <Eye size={48} className="mb-4 opacity-20"/>
                        <p>Selecione um caixa fechado para auditar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: HISTORY VIEW & REPORT ---

const PrintableSessionReport = ({ session }: { session: SessaoCaixa | null }) => {
    if (!session || !session.conferenciaAuditoria) return null;

    const audit = session.conferenciaAuditoria;
    const systemDinheiro = db.getSaldoDinheiroSessao(session.id);
    const systemCred = db.getSaldoFormaPagamentoSessao(session.id, 2);
    const systemDeb = db.getSaldoFormaPagamentoSessao(session.id, 3);
    const systemPix = db.getSaldoFormaPagamentoSessao(session.id, 4);
    const systemOutros = db.getSaldoFormaPagamentoSessao(session.id, 5);

    const renderRow = (label: string, system: number, audited: number) => {
        const diff = audited - system;
        return (
            <tr className="border-b border-black/20">
                <td className="py-1">{label}</td>
                <td className="text-right">R$ {system.toFixed(2)}</td>
                <td className="text-right">R$ {audited.toFixed(2)}</td>
                <td className="text-right">{diff === 0 ? '-' : `R$ ${diff.toFixed(2)}`}</td>
            </tr>
        )
    }

    return createPortal(
        <div id="printable-report" className="fixed inset-0 bg-white z-[9999] p-8 text-black font-mono">
            <style>{`
                @media print {
                    #root { display: none !important; }
                    #printable-report { 
                        display: block !important; 
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: white; z-index: 9999;
                    }
                    @page { margin: 10mm; size: A4; }
                }
                @media screen {
                    #printable-report { display: none !important; }
                }
            `}</style>
            
            <div className="border-b-2 border-black pb-4 mb-4 text-center">
                <h1 className="text-2xl font-bold uppercase">Conferência de Caixa</h1>
                <p>Relatório de Fechamento Consolidado</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <p><b>Sessão ID:</b> #{session.id}</p>
                    <p><b>Terminal:</b> {session.caixaNome}</p>
                    <p><b>Operador:</b> {session.usuarioNome}</p>
                </div>
                <div className="text-right">
                    <p><b>Abertura:</b> {new Date(session.dataAbertura).toLocaleString()}</p>
                    <p><b>Fechamento:</b> {new Date(session.dataFechamento || '').toLocaleString()}</p>
                    <p><b>Consolidação:</b> {new Date(session.dataConsolidacao || '').toLocaleString()}</p>
                </div>
            </div>

            <h3 className="font-bold border-b border-black mb-2 uppercase">Conferência Financeira</h3>
            <table className="w-full text-sm mb-6">
                <thead>
                    <tr className="border-b-2 border-black text-left">
                        <th className="py-1">Forma de Pagamento</th>
                        <th className="text-right">Sistema</th>
                        <th className="text-right">Auditado</th>
                        <th className="text-right">Diferença</th>
                    </tr>
                </thead>
                <tbody>
                    {renderRow('Dinheiro', systemDinheiro, audit.dinheiro)}
                    {renderRow('Cartão Crédito', systemCred, audit.cartaoCredito)}
                    {renderRow('Cartão Débito', systemDeb, audit.cartaoDebito)}
                    {renderRow('PIX', systemPix, audit.pix)}
                    {renderRow('Voucher/Outros', systemOutros, audit.voucher + audit.outros)}
                </tbody>
            </table>

            <div className="flex justify-end mb-6">
                <div className="w-1/2 border border-black p-2">
                    <div className="flex justify-between font-bold">
                        <span>Quebra de Caixa:</span>
                        <span>{session.quebraDeCaixa && session.quebraDeCaixa < 0 ? `R$ ${session.quebraDeCaixa.toFixed(2)}` : 'R$ 0,00'}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Sobra de Caixa:</span>
                        <span>{session.quebraDeCaixa && session.quebraDeCaixa > 0 ? `R$ ${session.quebraDeCaixa.toFixed(2)}` : 'R$ 0,00'}</span>
                    </div>
                </div>
            </div>

            <h3 className="font-bold border-b border-black mb-2 uppercase">Observações</h3>
            <div className="border border-black p-2 min-h-[50px] text-sm mb-8">
                <p className="mb-1"><b>Operador:</b> {session.conferenciaOperador?.observacoes || '-'}</p>
                <p><b>Auditoria:</b> {audit.observacoes || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-16 mt-12 text-center text-xs">
                <div className="border-t border-black pt-2">
                    Assinatura Operador
                </div>
                <div className="border-t border-black pt-2">
                    Assinatura Gerente/Auditor
                </div>
            </div>
        </div>,
        document.body
    );
};

const HistoryView: React.FC<{ user: Usuario }> = ({ user }) => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [sessions, setSessions] = useState<SessaoCaixa[]>([]);
    const [reportSession, setReportSession] = useState<SessaoCaixa | null>(null);

    const loadHistory = () => {
        setSessions(db.getSessoesConsolidadas(startDate, endDate));
    };

    useEffect(() => {
        loadHistory();
    }, []);

    // Print Trigger
    useEffect(() => {
        if (reportSession) {
            const timer = setTimeout(() => {
                window.print();
                setReportSession(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [reportSession]);

    return (
        <div className="animate-in fade-in duration-300">
             <PrintableSessionReport session={reportSession} />
             
             {/* Filters */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-end gap-4">
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Inicial</label>
                     <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-2">
                         <Calendar size={18} className="text-gray-400"/>
                         <input 
                             type="date" 
                             value={startDate}
                             onChange={(e) => setStartDate(e.target.value)}
                             className="bg-transparent outline-none text-sm font-bold text-gray-700"
                         />
                     </div>
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Final</label>
                     <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-2">
                         <Calendar size={18} className="text-gray-400"/>
                         <input 
                             type="date" 
                             value={endDate}
                             onChange={(e) => setEndDate(e.target.value)}
                             className="bg-transparent outline-none text-sm font-bold text-gray-700"
                         />
                     </div>
                 </div>
                 <button 
                    onClick={loadHistory}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
                 >
                     <Search size={18} /> Filtrar
                 </button>
             </div>

             {/* Table */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-gray-600 uppercase">ID</th>
                      <th className="p-4 text-xs font-bold text-gray-600 uppercase">Data Consolidação</th>
                      <th className="p-4 text-xs font-bold text-gray-600 uppercase">Terminal / Operador</th>
                      <th className="p-4 text-xs font-bold text-gray-600 uppercase text-right">Saldo Final (Sist.)</th>
                      <th className="p-4 text-xs font-bold text-gray-600 uppercase text-right">Quebra/Sobra</th>
                      <th className="p-4 text-xs font-bold text-gray-600 uppercase text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map(s => {
                        const quebra = s.quebraDeCaixa || 0;
                        return (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="p-4 text-sm font-mono text-gray-500">#{s.id}</td>
                                <td className="p-4 text-sm font-bold text-gray-800">
                                    {new Date(s.dataConsolidacao || s.dataAbertura).toLocaleString()}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    <div>{s.caixaNome}</div>
                                    <div className="text-xs text-gray-400">{s.usuarioNome}</div>
                                </td>
                                <td className="p-4 text-sm text-right text-gray-600">
                                    R$ {s.saldoFinalSistema?.toFixed(2)}
                                </td>
                                <td className="p-4 text-sm text-right font-bold">
                                    <span className={`px-2 py-1 rounded ${quebra === 0 ? 'bg-gray-100 text-gray-600' : quebra > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {quebra > 0 ? '+' : ''} R$ {quebra.toFixed(2)}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => setReportSession(s)}
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                        title="Imprimir Relatório de Conferência"
                                    >
                                        <Printer size={18} />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    {sessions.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum histórico encontrado para o período.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
        </div>
    );
};

export default CashControl;
