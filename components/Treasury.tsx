
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { ContaFinanceira, ContaReceber } from '../types';
import { Landmark, Wallet, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

const Treasury: React.FC = () => {
    const [contas, setContas] = useState<ContaFinanceira[]>([]);
    const [recebiveis, setRecebiveis] = useState<ContaReceber[]>([]);

    useEffect(() => {
        const interval = setInterval(loadData, 2000);
        loadData();
        return () => clearInterval(interval);
    }, []);

    const loadData = () => {
        setContas(db.getContasFinanceiras());
        setRecebiveis(db.getContasReceber());
    };

    const saldoCofres = contas.filter(c => c.tipo === 'Cofre').reduce((acc, c) => acc + c.saldoAtual, 0);
    const saldoBancos = contas.filter(c => c.tipo === 'Banco').reduce((acc, c) => acc + c.saldoAtual, 0);
    const totalRecebiveis = recebiveis.filter(r => r.status === 'Pendente').reduce((acc, r) => acc + r.valorLiquido, 0);

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
                    <div className="space-y-4">
                        {contas.map(c => (
                            <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${c.tipo === 'Cofre' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                    <div>
                                        <p className="font-bold text-gray-800">{c.nome}</p>
                                        <p className="text-xs text-gray-500 uppercase">{c.tipo}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-800">R$ {c.saldoAtual.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* List of Receivables */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[400px]">
                    <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Calendar size={20}/> Previsão de Recebimentos
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
