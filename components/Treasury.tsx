

import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { ContaFinanceira, ContaReceber, MovimentoConta } from '../types';
import { Landmark, Wallet, TrendingUp, Calendar, AlertCircle, ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const Treasury: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'account-detail'>('dashboard');
    const [contas, setContas] = useState<ContaFinanceira[]>([]);
    const [recebiveis, setRecebiveis] = useState<ContaReceber[]>([]);
    
    // Detail View State
    const [selectedAccount, setSelectedAccount] = useState<ContaFinanceira | null>(null);
    const [movements, setMovements] = useState<MovimentoConta[]>([]);
    const [accountReceivables, setAccountReceivables] = useState<ContaReceber[]>([]); // New State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Poll for balance updates
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setContas(db.getContasFinanceiras());
        setRecebiveis(db.getContasReceber());
    };

    const handleSelectAccount = (account: ContaFinanceira) => {
        setSelectedAccount(account);
        setStartDate('');
        setEndDate('');
        setMovements(db.getMovimentosConta(account.id));
        setAccountReceivables(db.getRecebiveisPorConta(account.id)); // Load specific receivables
        setView('account-detail');
    };

    const handleFilterMovements = () => {
        if (!selectedAccount) return;
        setMovements(db.getMovimentosConta(selectedAccount.id, startDate, endDate));
        setAccountReceivables(db.getRecebiveisPorConta(selectedAccount.id, startDate, endDate));
    };

    const saldoCofres = contas.filter(c => c.tipo === 'Cofre').reduce((acc, c) => acc + c.saldoAtual, 0);
    const saldoBancos = contas.filter(c => c.tipo === 'Banco').reduce((acc, c) => acc + c.saldoAtual, 0);
    const totalRecebiveis = recebiveis.filter(r => r.status === 'Pendente').reduce((acc, r) => acc + r.valorLiquido, 0);

    if (view === 'account-detail' && selectedAccount) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600"/>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{selectedAccount.nome}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedAccount.tipo === 'Cofre' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {selectedAccount.tipo}
                            </span>
                            <span>Saldo Atual: <b className="text-gray-800 text-lg">R$ {selectedAccount.saldoAtual.toFixed(2)}</b></span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Data Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-gray-300 rounded text-sm"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Data Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border border-gray-300 rounded text-sm"/>
                    </div>
                    <button onClick={handleFilterMovements} className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700">Filtrar</button>
                    <button onClick={() => {setStartDate(''); setEndDate(''); if(selectedAccount) { setMovements(db.getMovimentosConta(selectedAccount.id)); setAccountReceivables(db.getRecebiveisPorConta(selectedAccount.id)); }}} className="px-4 py-2 bg-gray-100 text-gray-600 rounded font-bold text-sm hover:bg-gray-200">Limpar</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Realized Movements */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700">Extrato (Realizado)</div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white border-b border-gray-200 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-500">Data</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-500">Descrição</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-500 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {movements.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50">
                                            <td className="p-3 text-xs text-gray-600">{new Date(m.data).toLocaleString()}</td>
                                            <td className="p-3 text-xs font-medium text-gray-800">{m.descricao}</td>
                                            <td className={`p-3 text-right text-xs font-bold ${m.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                                {m.tipo === 'Saída' ? '-' : '+'} R$ {m.valor.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {movements.length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-gray-400">Nenhuma movimentação.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pending Receivables (Future) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 bg-yellow-50 border-b border-yellow-200 font-bold text-yellow-800 flex justify-between">
                            <span>Lançamentos Futuros / A Compensar</span>
                            <span className="text-xs bg-white px-2 py-1 rounded border border-yellow-300">Previsão</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white border-b border-gray-200 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-500">Data Prev.</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-500">Origem</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-500 text-right">Valor Líq.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {accountReceivables.filter(r => r.status === 'Pendente').map(r => (
                                        <tr key={r.id} className="hover:bg-yellow-50">
                                            <td className="p-3 text-xs text-gray-600">{new Date(r.dataPrevisao).toLocaleDateString()}</td>
                                            <td className="p-3 text-xs font-medium text-gray-800">
                                                {r.origem} (Ped #{r.pedidoId})
                                                <div className="text-[10px] text-gray-400">Venda: {new Date(r.dataVenda).toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-3 text-right text-xs font-bold text-blue-600">
                                                + R$ {r.valorLiquido.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {accountReceivables.filter(r => r.status === 'Pendente').length === 0 && (
                                        <tr><td colSpan={3} className="p-8 text-center text-gray-400">Nenhum lançamento futuro previsto para este período.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                         <div className="p-3 bg-gray-50 border-t border-gray-200 text-right text-xs text-gray-500">
                             Total a Compensar: <b className="text-gray-800">R$ {accountReceivables.filter(r => r.status === 'Pendente').reduce((acc, r) => acc + r.valorLiquido, 0).toFixed(2)}</b>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Landmark size={32} className="text-blue-700"/> Tesouraria & Financeiro
            </h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">Saldo em Cofres</p>
                            <h3 className="text-2xl font-bold text-gray-800">R$ {saldoCofres.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <Landmark size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">Saldo em Bancos</p>
                            <h3 className="text-2xl font-bold text-gray-800">R$ {saldoBancos.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">A Receber (Cartão/PIX)</p>
                            <h3 className="text-2xl font-bold text-gray-800">R$ {totalRecebiveis.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* List of Accounts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Wallet size={20}/> Saldos de Contas
                    </h2>
                    <p className="text-xs text-gray-400 mb-4">Clique em uma conta para ver o extrato detalhado.</p>
                    <div className="space-y-4">
                        {contas.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => handleSelectAccount(c)}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${c.tipo === 'Cofre' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                    <div>
                                        <p className="font-bold text-gray-800 group-hover:text-blue-700">{c.nome}</p>
                                        <p className="text-xs text-gray-500 uppercase">{c.tipo}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-800">R$ {c.saldoAtual.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* List of Receivables (General) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[400px]">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Calendar size={20}/> Previsão de Recebimentos (Geral)
                    </h2>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-2 text-xs font-bold text-gray-500">Data Prev.</th>
                                    <th className="p-2 text-xs font-bold text-gray-500">Origem</th>
                                    <th className="p-2 text-xs font-bold text-gray-500 text-right">Valor Líq.</th>
                                    <th className="p-2 text-xs font-bold text-gray-500 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recebiveis.map(r => (
                                    <tr key={r.id} className="border-b border-gray-100 text-sm">
                                        <td className="p-2">{new Date(r.dataPrevisao).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-2">
                                            <div className="font-bold text-gray-700">{r.origem}</div>
                                            <div className="text-xs text-gray-400">Ped #{r.pedidoId}</div>
                                        </td>
                                        <td className="p-2 text-right font-bold text-green-600">R$ {r.valorLiquido.toFixed(2)}</td>
                                        <td className="p-2 text-center">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${r.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recebiveis.length === 0 && (
                                    <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum recebimento previsto.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Treasury;
