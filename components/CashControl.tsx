
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/mockDb';
import { Usuario, SessaoCaixa, CaixaMovimento, TipoOperacaoCaixa, StatusSessao, ConferenciaFechamento, Caixa, ContaFinanceira } from '../types';
import { DollarSign, Lock, Unlock, AlertTriangle, TrendingUp, TrendingDown, History, X, ClipboardCheck, Eye, Printer, Calendar, Search, ScrollText, FileText, ArrowRight } from 'lucide-react';

interface CashControlProps {
  user: Usuario;
}

// Data structure for the unified print component
interface CashPrintData {
    type: 'OPENING' | 'CLOSING' | 'AUDIT';
    format: 'A4' | 'TICKET';
    session: SessaoCaixa;
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

// ... PrintableCashReceipt component remains identical ...
// --- UNIFIED PRINT COMPONENT ---
const PrintableCashReceipt = ({ data }: { data: CashPrintData | null }) => {
    if (!data) return null;
    const { session, type, format } = data;

    // Helper for currency
    const fmt = (v: number) => `R$ ${v.toFixed(2)}`;
    const isTicket = format === 'TICKET';

    return createPortal(
        <div id="printable-report" className={`fixed inset-0 bg-white z-[9999] text-black font-mono leading-tight ${isTicket ? 'p-2' : 'p-8'}`}>
            <style>{`
                @media print {
                    #root { display: none !important; }
                    #printable-report { 
                        display: block !important; 
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: white; z-index: 9999;
                    }
                    @page { 
                        margin: ${isTicket ? '0' : '10mm'}; 
                        size: ${isTicket ? '80mm auto' : 'A4'};
                    }
                    body {
                        width: ${isTicket ? '80mm' : '100%'};
                    }
                }
                @media screen {
                    #printable-report { display: none !important; }
                }
            `}</style>
            
            <div className={`${isTicket ? 'max-w-[72mm] mx-auto' : ''}`}>
                <div className={`border-b-2 border-black pb-2 mb-2 text-center ${isTicket ? 'text-sm' : ''}`}>
                    <h1 className="font-bold uppercase">DeliverySys</h1>
                    <h2 className="font-bold uppercase text-xs mt-1">
                        {type === 'OPENING' && 'COMPROVANTE DE ABERTURA'}
                        {type === 'CLOSING' && 'DECLARAÇÃO DE FECHAMENTO'}
                        {type === 'AUDIT' && 'RELATÓRIO DE CONSOLIDAÇÃO'}
                    </h2>
                </div>
                <div className={`mb-4 text-xs ${isTicket ? '' : 'grid grid-cols-2 gap-4'}`}>
                    <div>
                        <p><b>Sessão:</b> #{session.id}</p>
                        <p><b>Terminal:</b> {session.caixaNome}</p>
                        <p><b>Operador:</b> {session.usuarioNome}</p>
                    </div>
                    <div className={`${isTicket ? 'mt-2 border-t border-dashed border-black pt-2' : 'text-right'}`}>
                        {type === 'OPENING' && <p><b>Data:</b> {new Date(session.dataAbertura).toLocaleString('pt-BR')}</p>}
                        {(type === 'CLOSING' || type === 'AUDIT') && (
                            <>
                                <p><b>Abertura:</b> {new Date(session.dataAbertura).toLocaleString('pt-BR')}</p>
                                <p><b>Fechamento:</b> {session.dataFechamento ? new Date(session.dataFechamento).toLocaleString('pt-BR') : 'Agora'}</p>
                            </>
                        )}
                    </div>
                </div>

                {type === 'OPENING' && (
                    <div className="mb-6">
                        <div className="border border-black p-2 mb-4">
                            <div className="flex justify-between font-bold text-sm">
                                <span>FUNDO DE TROCO:</span>
                                <span>{fmt(session.saldoInicial)}</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-justify mb-8 uppercase">
                            Declaro ter recebido a importância acima discriminada para suprimento inicial do caixa sob minha responsabilidade.
                        </p>
                    </div>
                )}

                {type === 'CLOSING' && session.conferenciaOperador && (
                    <div className="mb-6">
                        <h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Valores Conferidos (Operador)</h3>
                        <table className="w-full text-xs mb-4">
                            <tbody>
                                <tr><td className="py-1">Dinheiro</td><td className="text-right font-bold">{fmt(session.conferenciaOperador.dinheiro)}</td></tr>
                                <tr><td className="py-1">Crédito</td><td className="text-right">{fmt(session.conferenciaOperador.cartaoCredito)}</td></tr>
                                <tr><td className="py-1">Débito</td><td className="text-right">{fmt(session.conferenciaOperador.cartaoDebito)}</td></tr>
                                <tr><td className="py-1">PIX</td><td className="text-right">{fmt(session.conferenciaOperador.pix)}</td></tr>
                                <tr><td className="py-1">Outros</td><td className="text-right">{fmt(session.conferenciaOperador.voucher + session.conferenciaOperador.outros)}</td></tr>
                                <tr className="border-t border-black font-bold text-sm">
                                    <td className="py-2">TOTAL DECLARADO</td>
                                    <td className="text-right py-2">
                                        {fmt(
                                            session.conferenciaOperador.dinheiro + 
                                            session.conferenciaOperador.cartaoCredito + 
                                            session.conferenciaOperador.cartaoDebito + 
                                            session.conferenciaOperador.pix + 
                                            session.conferenciaOperador.voucher + 
                                            session.conferenciaOperador.outros
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="border border-black p-2 mb-6 text-[10px] bg-gray-50">
                            <p className="font-bold uppercase text-center mb-1">TERMO DE RESPONSABILIDADE</p>
                            <p className="text-justify leading-tight">
                                Declaro que os valores acima conferem EXATAMENTE com a contagem física realizada por mim neste momento. Estou ciente de que quaisquer divergências apuradas posteriormente serão passíveis de auditoria.
                            </p>
                        </div>
                    </div>
                )}

                {type === 'AUDIT' && session.conferenciaAuditoria && (
                    <div className="mb-6">
                        <h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Conferência Analítica</h3>
                        <table className="w-full text-[10px] mb-4">
                            <thead>
                                <tr className="border-b border-black text-left">
                                    <th className="py-1">Tipo</th>
                                    {!isTicket && <th className="text-right">Sist.</th>}
                                    <th className="text-right">Final</th>
                                    <th className="text-right">Dif.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { l: 'Din', s: db.getSaldoDinheiroSessao(session.id), a: session.conferenciaAuditoria.dinheiro },
                                    { l: 'Cré', s: db.getSaldoFormaPagamentoSessao(session.id, 2), a: session.conferenciaAuditoria.cartaoCredito },
                                    { l: 'Déb', s: db.getSaldoFormaPagamentoSessao(session.id, 3), a: session.conferenciaAuditoria.cartaoDebito },
                                    { l: 'PIX', s: db.getSaldoFormaPagamentoSessao(session.id, 4), a: session.conferenciaAuditoria.pix },
                                ].map((row, i) => {
                                    const diff = row.a - row.s;
                                    return (
                                        <tr key={i} className="border-b border-black/10">
                                            <td className="py-1">{row.l}</td>
                                            {!isTicket && <td className="text-right">{fmt(row.s)}</td>}
                                            <td className="text-right">{fmt(row.a)}</td>
                                            <td className="text-right font-bold">{diff === 0 ? '-' : fmt(diff)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        <div className="flex justify-between font-bold border-t border-black pt-2 mb-4 text-sm">
                            <span>QUEBRA DE CAIXA:</span>
                            <span>{fmt(session.quebraDeCaixa || 0)}</span>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center text-[10px]">
                    <div className={`grid ${isTicket ? 'grid-cols-1 gap-8' : 'grid-cols-1 gap-12'}`}>
                        <div className="mx-auto w-full max-w-[200px] border-t border-black pt-1">
                            Assinatura do Operador<br/>
                            <b>{session.usuarioNome}</b>
                        </div>
                        {type !== 'OPENING' && (
                            <div className="mx-auto w-full max-w-[200px] border-t border-black pt-1">
                                Assinatura do Gerente / Responsável
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="text-[9px] text-center mt-6">Impresso em {new Date().toLocaleString('pt-BR')}</div>
            </div>
        </div>,
        document.body
    );
};

// --- SUB-COMPONENT: OPERATOR VIEW ---
const OperatorView: React.FC<{ user: Usuario }> = ({ user }) => {
  const [session, setSession] = useState<SessaoCaixa | undefined>(undefined);
  const [history, setHistory] = useState<CaixaMovimento[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Printing State
  const [printData, setPrintData] = useState<CashPrintData | null>(null);
  
  // Open Session Form
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [selectedCaixaId, setSelectedCaixaId] = useState<number | ''>('');
  const [initialBalance, setInitialBalance] = useState('0.00');

  // Operation Modal (Reforco/Sangria)
  const [modalType, setModalType] = useState<TipoOperacaoCaixa | null>(null);
  const [opValue, setOpValue] = useState('');
  const [opObs, setOpObs] = useState('');
  // New: Treasury Integration
  const [contasFinanceiras, setContasFinanceiras] = useState<ContaFinanceira[]>([]);
  const [selectedContaId, setSelectedContaId] = useState<number | ''>('');

  // Closing Modal
  const [isClosing, setIsClosing] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false); 
  const [lastClosedSession, setLastClosedSession] = useState<SessaoCaixa | null>(null); 
  const [closingValues, setClosingValues] = useState<ConferenciaFechamento>({
    dinheiro: 0, cartaoCredito: 0, cartaoDebito: 0, pix: 0, voucher: 0, outros: 0, observacoes: ''
  });

  const loadData = () => {
    setLoading(true);
    const activeSession = db.getSessaoAberta(user.id);
    setSession(activeSession);
    setContasFinanceiras(db.getContasFinanceiras());
    
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

  useEffect(() => {
      if (printData) {
          const timer = setTimeout(() => {
              window.print();
              setPrintData(null);
          }, 500); 
          return () => clearTimeout(timer);
      }
  }, [printData]);

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaixaId) { alert("Selecione um caixa."); return; }
    try {
      const newSession = db.abrirSessao(user.id, Number(selectedCaixaId), parseFloat(initialBalance));
      setPrintData({ type: 'OPENING', format: 'TICKET', session: newSession });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !modalType) return;
    
    const val = parseFloat(opValue);
    if (isNaN(val) || val <= 0) { alert("Valor inválido"); return; }

    // Validations
    if (modalType === TipoOperacaoCaixa.Sangria && val > saldo) {
        if(!confirm("O valor da sangria é maior que o saldo atual calculado. Continuar?")) return;
    }
    
    if (modalType === TipoOperacaoCaixa.Reforco && !selectedContaId) {
        alert("Selecione a Origem (Cofre/Conta) do Reforço.");
        return;
    }
    if (modalType === TipoOperacaoCaixa.Sangria && !selectedContaId) {
        alert("Selecione o Destino (Cofre/Conta) da Sangria.");
        return;
    }
    
    try {
        db.lancarMovimento(
            session.id, 
            modalType, 
            val, 
            opObs, 
            undefined, 
            modalType === TipoOperacaoCaixa.Reforco ? Number(selectedContaId) : undefined,
            modalType === TipoOperacaoCaixa.Sangria ? Number(selectedContaId) : undefined
        );
        setModalType(null);
        setOpValue('');
        setOpObs('');
        setSelectedContaId('');
        loadData();
        alert("Movimento registrado com sucesso.");
    } catch(e: any) {
        alert(e.message);
    }
  };

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    if (confirm("ATENÇÃO: Você está encerrando o caixa.\n\nCertifique-se de que os valores informados correspondem EXATAMENTE ao que você contou fisicamente na gaveta.")) {
        try {
             db.fecharSessao(session.id, closingValues);
             const closedSessionForPrint: SessaoCaixa = {
                 ...session, status: StatusSessao.Fechada, conferenciaOperador: closingValues, dataFechamento: new Date().toISOString()
             };
             setLastClosedSession(closedSessionForPrint);
             setIsClosing(false);
             setShowPrintOptions(true); 
             loadData();
        } catch(e: any) { alert(e.message); }
    }
  };

  const triggerPrint = (type: 'OPENING' | 'CLOSING', format: 'A4' | 'TICKET', sess: SessaoCaixa) => {
      setPrintData({ type, format, session: sess });
  };
  
  const getIcon = (type: TipoOperacaoCaixa) => {
      switch(type) {
          case TipoOperacaoCaixa.Abertura: return <Lock size={14} />;
          case TipoOperacaoCaixa.Fechamento: return <Lock size={14} />;
          case TipoOperacaoCaixa.Reforco: return <TrendingUp size={14} />;
          case TipoOperacaoCaixa.Sangria: return <TrendingDown size={14} />;
          default: return <DollarSign size={14} />;
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  return (
    <>
      <PrintableCashReceipt data={printData} />
      
      {!session ? (
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
                    <select value={selectedCaixaId} onChange={(e) => setSelectedCaixaId(parseInt(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Selecione...</option>
                        {caixas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Saldo Inicial (Fundo de Troco)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                        <input type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"/>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Geralmente é a sobra do caixa anterior.</p>
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Unlock size={20} /> Abrir Caixa</button>
            </form>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo Atual (Lógico)</p>
                <h2 className="text-4xl font-extrabold text-gray-800 mb-4">R$ {saldo.toFixed(2)}</h2>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Unlock size={12} /> Sessão Aberta (#{session.id})
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button onClick={() => setModalType(TipoOperacaoCaixa.Reforco)} className="py-2 px-4 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 flex flex-col items-center gap-1">
                        <TrendingUp size={20} /> <span className="text-xs">Reforço (Entrada)</span>
                    </button>
                    <button onClick={() => setModalType(TipoOperacaoCaixa.Sangria)} className="py-2 px-4 bg-orange-50 text-orange-700 font-bold rounded-lg hover:bg-orange-100 flex flex-col items-center gap-1">
                        <TrendingDown size={20} /> <span className="text-xs">Sangria (Saída)</span>
                    </button>
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                     <div className="flex gap-2">
                        <button onClick={() => triggerPrint('OPENING', 'A4', session)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 text-xs">A4</button>
                        <button onClick={() => triggerPrint('OPENING', 'TICKET', session)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 text-xs">Cupom</button>
                     </div>
                    <button onClick={() => setIsClosing(true)} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"><Lock size={18} /> Fechar Caixa</button>
                </div>
            </div>
            {/* ... Details Card ... */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-4">Detalhes</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Operador:</span><span className="font-bold">{session.usuarioNome}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Terminal:</span><span className="font-bold">{session.caixaNome}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Abertura:</span><span className="font-bold">{new Date(session.dataAbertura).toLocaleString('pt-BR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Fundo Inicial:</span><span className="font-bold">R$ {session.saldoInicial.toFixed(2)}</span></div>
                </div>
            </div>
        </div>

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
                    <td className="p-4 text-sm text-gray-600">{new Date(mov.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isNegative ? 'bg-orange-100 text-orange-700' : isNeutral ? 'bg-blue-100 text-blue-700' : mov.tipoOperacao === TipoOperacaoCaixa.Fechamento ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {getIcon(mov.tipoOperacao)} {mov.tipoOperacao}
                        </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 truncate max-w-xs" title={mov.observacao}>{mov.observacao || '-'}</td>
                    <td className={`p-4 text-sm font-bold text-right ${isNegative ? 'text-red-600' : isNeutral ? 'text-blue-600' : 'text-green-600'}`}>
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
                        {modalType === TipoOperacaoCaixa.Reforco ? 'Reforço (Entrada)' : 'Sangria (Saída)'}
                    </h3>
                    
                    <form onSubmit={handleOperation} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                {modalType === TipoOperacaoCaixa.Reforco ? 'Origem do Dinheiro' : 'Destino do Dinheiro'}
                            </label>
                            <select 
                                value={selectedContaId} 
                                onChange={(e) => setSelectedContaId(parseInt(e.target.value))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Selecione...</option>
                                {contasFinanceiras.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome} (Saldo: R$ {c.saldoAtual.toFixed(2)})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Valor</label>
                            <input 
                                type="number" step="0.01" autoFocus
                                value={opValue} onChange={(e) => setOpValue(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Observação</label>
                            <input 
                                type="text" value={opObs} onChange={(e) => setOpObs(e.target.value)} placeholder="Motivo..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => { setModalType(null); setSelectedContaId(''); }} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold text-gray-700">Cancelar</button>
                            <button type="submit" className="flex-1 py-2 bg-blue-600 rounded-lg font-bold text-white">Confirmar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Closing & Print Modal Logic (Keep Existing Code) */}
        {isClosing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                     {/* Simplified for brevity - reuse same closing form logic */}
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-red-600"><Lock /> Fechamento de Caixa</h3>
                        <button onClick={() => setIsClosing(false)} className="hover:bg-gray-100 p-1 rounded"><X size={20}/></button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                        <form id="closeForm" onSubmit={handleCloseSession} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {['dinheiro', 'cartaoCredito', 'cartaoDebito', 'pix', 'voucher', 'outros'].map(field => (
                                    <div key={field}>
                                        <label className="block text-sm font-bold text-gray-700 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        <input type="number" step="0.01" value={(closingValues as any)[field]} onChange={(e) => setClosingValues({...closingValues, [field]: parseFloat(e.target.value) || 0})} className="w-full p-2 border border-gray-300 rounded"/>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Observações</label>
                                <textarea value={closingValues.observacoes} onChange={(e) => setClosingValues({...closingValues, observacoes: e.target.value})} className="w-full p-2 border border-gray-300 rounded" rows={3}></textarea>
                            </div>
                        </form>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                        <button onClick={() => setIsClosing(false)} className="px-6 py-2 bg-gray-200 rounded-lg font-bold text-gray-700">Cancelar</button>
                        <button type="submit" form="closeForm" className="px-6 py-2 bg-red-600 rounded-lg font-bold text-white hover:bg-red-700">Conferir e Fechar</button>
                    </div>
                 </div>
            </div>
        )}
        
        {showPrintOptions && lastClosedSession && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><ClipboardCheck size={32} /></div>
                    <h3 className="text-xl font-bold mb-2">Caixa Fechado!</h3>
                    <p className="text-gray-500 mb-6">Imprimir comprovante?</p>
                    <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => { triggerPrint('CLOSING', 'A4', lastClosedSession); setShowPrintOptions(false); }} className="py-3 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200"><FileText size={20}/> A4</button>
                         <button onClick={() => { triggerPrint('CLOSING', 'TICKET', lastClosedSession); setShowPrintOptions(false); }} className="py-3 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200"><ScrollText size={20}/> Cupom</button>
                    </div>
                    <button onClick={() => setShowPrintOptions(false)} className="mt-4 text-gray-400 text-sm hover:text-gray-600">Não imprimir</button>
                </div>
            </div>
        )}
        </div>
      )}
    </>
  );
};

// ... AuditView and HistoryView remain same but import the unified type ...
// --- SUB-COMPONENT: AUDIT VIEW ---
const AuditView: React.FC<{ user: Usuario }> = ({ user }) => {
    // ... Existing Code ...
    const [closedSessions, setClosedSessions] = useState<SessaoCaixa[]>([]);
    const [selectedSession, setSelectedSession] = useState<SessaoCaixa | null>(null);
    const [auditValues, setAuditValues] = useState<ConferenciaFechamento | null>(null);
    const [printData, setPrintData] = useState<CashPrintData | null>(null);

    // Re-use logic
    const loadSessions = () => setClosedSessions(db.getSessoesFechadas());
    useEffect(() => loadSessions(), []);
    useEffect(() => { if(printData) { setTimeout(() => { window.print(); setPrintData(null); }, 300); } }, [printData]);

    const handleConsolidate = () => {
        if (!selectedSession || !auditValues) return;
        if (confirm("Confirmar a consolidação deste caixa?")) {
            db.consolidarSessao(selectedSession.id, auditValues);
            const updated = { ...selectedSession, conferenciaAuditoria: auditValues, quebraDeCaixa: (auditValues.dinheiro + auditValues.cartaoCredito + auditValues.cartaoDebito + auditValues.pix + auditValues.voucher + auditValues.outros) - (selectedSession.saldoFinalSistema || 0), dataConsolidacao: new Date().toISOString() };
            setPrintData({ type: 'AUDIT', format: 'A4', session: updated });
            alert("Consolidado!"); setSelectedSession(null); setAuditValues(null); loadSessions();
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <PrintableCashReceipt data={printData} />
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex justify-between items-center">
                    <span>Caixas Fechados</span><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">{closedSessions.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {closedSessions.map(s => (
                        <div key={s.id} onClick={() => {setSelectedSession(s); setAuditValues(s.conferenciaOperador || {dinheiro:0,cartaoCredito:0,cartaoDebito:0,pix:0,voucher:0,outros:0,observacoes:''});}} className={`p-4 border-b border-gray-100 cursor-pointer ${selectedSession?.id === s.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}>
                            <div className="font-bold">#{s.id} - {s.caixaNome}</div>
                            <div className="text-xs text-gray-500">{new Date(s.dataFechamento!).toLocaleTimeString()}</div>
                            <div className={`text-xs font-bold mt-1 px-2 py-1 rounded w-fit ${s.quebraDeCaixa===0?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>Dif: R$ {s.quebraDeCaixa?.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-2">
                {selectedSession && auditValues ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-4">Consolidação #{selectedSession.id}</h2>
                        {/* Simplified Table for Brevity */}
                        <div className="bg-yellow-50 p-4 rounded mb-4 text-sm text-yellow-800">Corrija os valores na coluna Auditado se necessário.</div>
                        <table className="w-full text-sm mb-4">
                            <thead><tr className="text-left"><th className="pb-2">Tipo</th><th className="text-right pb-2">Sistema</th><th className="text-right pb-2">Op. Informou</th><th className="text-right pb-2 text-purple-700">Auditado</th></tr></thead>
                            <tbody>
                                {[
                                    {l:'Dinheiro',k:'dinheiro',s:db.getSaldoDinheiroSessao(selectedSession.id)},
                                    {l:'Crédito',k:'cartaoCredito',s:db.getSaldoFormaPagamentoSessao(selectedSession.id,2)},
                                    {l:'Débito',k:'cartaoDebito',s:db.getSaldoFormaPagamentoSessao(selectedSession.id,3)},
                                    {l:'PIX',k:'pix',s:db.getSaldoFormaPagamentoSessao(selectedSession.id,4)},
                                ].map((r,i)=>(
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-2">{r.l}</td>
                                        <td className="text-right font-bold text-gray-500">R$ {r.s.toFixed(2)}</td>
                                        <td className="text-right text-blue-600">R$ {(selectedSession.conferenciaOperador as any)[r.k].toFixed(2)}</td>
                                        <td className="text-right"><input type="number" step="0.01" value={(auditValues as any)[r.k]} onChange={(e)=>setAuditValues({...auditValues,[r.k]:parseFloat(e.target.value)||0})} className="w-24 p-1 border rounded text-right font-bold text-purple-700"/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end gap-3">
                            <button onClick={()=>setSelectedSession(null)} className="px-4 py-2 border rounded">Cancelar</button>
                            <button onClick={handleConsolidate} className="px-4 py-2 bg-purple-600 text-white rounded font-bold">Finalizar</button>
                        </div>
                    </div>
                ) : <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 border border-dashed rounded-xl">Selecione um caixa</div>}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: HISTORY VIEW ---
const HistoryView: React.FC<{ user: Usuario }> = ({ user }) => {
    // ... Existing ...
    const [sessions, setSessions] = useState<SessaoCaixa[]>([]);
    const [printData, setPrintData] = useState<CashPrintData | null>(null);
    useEffect(() => { setSessions(db.getSessoesConsolidadas()); }, []);
    useEffect(() => { if(printData) { setTimeout(() => { window.print(); setPrintData(null); }, 300); } }, [printData]);

    return (
        <div>
             <PrintableCashReceipt data={printData} />
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr><th className="p-4 text-xs font-bold uppercase">ID</th><th className="p-4 text-xs font-bold uppercase">Data</th><th className="p-4 text-xs font-bold uppercase">Operador</th><th className="p-4 text-xs font-bold uppercase text-right">Quebra</th><th className="p-4 text-center">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map(s => (
                        <tr key={s.id}>
                            <td className="p-4 text-sm text-gray-500">#{s.id}</td>
                            <td className="p-4 font-bold text-gray-800">{new Date(s.dataConsolidacao || s.dataAbertura).toLocaleString()}</td>
                            <td className="p-4 text-sm text-gray-600">{s.usuarioNome}</td>
                            <td className={`p-4 text-right font-bold ${s.quebraDeCaixa===0?'text-gray-400':s.quebraDeCaixa!>0?'text-green-600':'text-red-600'}`}>R$ {s.quebraDeCaixa?.toFixed(2)}</td>
                            <td className="p-4 text-center">
                                <button onClick={()=>setPrintData({type:'AUDIT',format:'A4',session:s})} className="text-blue-600 p-2"><FileText size={18}/></button>
                            </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
             </div>
        </div>
    );
};

export default CashControl;
