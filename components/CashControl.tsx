import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { CaixaMovimento, TipoOperacaoCaixa } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Lock, Unlock, History } from 'lucide-react';

const CashControl: React.FC = () => {
  const [history, setHistory] = useState<CaixaMovimento[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // Form State
  const [operation, setOperation] = useState<TipoOperacaoCaixa>(TipoOperacaoCaixa.Reforco);
  const [amount, setAmount] = useState('');
  const [obs, setObs] = useState('');

  const refreshData = () => {
    setHistory(db.getMovimentos());
    setCurrentBalance(db.getSaldoCaixa());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    db.addMovimento({
      id: Math.floor(Math.random() * 100000),
      data: new Date().toISOString(),
      tipoOperacao: operation,
      valor: parseFloat(amount),
      observacao: obs
    });

    setAmount('');
    setObs('');
    refreshData();
    alert("Operação registrada com sucesso.");
  };

  const getIcon = (type: TipoOperacaoCaixa) => {
    switch(type) {
      case TipoOperacaoCaixa.Abertura: return <Unlock size={18} className="text-green-600"/>;
      case TipoOperacaoCaixa.Fechamento: return <Lock size={18} className="text-red-600"/>;
      case TipoOperacaoCaixa.Reforco: return <ArrowUpCircle size={18} className="text-blue-600"/>;
      case TipoOperacaoCaixa.Sangria: return <ArrowDownCircle size={18} className="text-orange-600"/>;
      default: return <History size={18} className="text-gray-600"/>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Operation Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Nova Operação</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operação</label>
              <div className="grid grid-cols-2 gap-2">
                {[TipoOperacaoCaixa.Reforco, TipoOperacaoCaixa.Sangria, TipoOperacaoCaixa.Abertura, TipoOperacaoCaixa.Fechamento].map(op => (
                  <button
                    type="button"
                    key={op}
                    onClick={() => setOperation(op)}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      operation === op 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none"
                placeholder="Motivo da sangria, etc..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-black transition-colors"
            >
              Registrar Operação
            </button>
          </form>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
            <p className="text-blue-100 text-sm font-medium mb-1">Saldo Atual em Caixa</p>
            <h3 className="text-4xl font-bold">R$ {currentBalance.toFixed(2)}</h3>
        </div>
      </div>

      {/* History List */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <History size={24} className="text-gray-400"/> Histórico do Caixa
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
              {history.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(mov.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                      ${mov.tipoOperacao === TipoOperacaoCaixa.Sangria ? 'bg-orange-100 text-orange-700' : 
                        mov.tipoOperacao === TipoOperacaoCaixa.Vendas ? 'bg-green-100 text-green-700' :
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
                    mov.tipoOperacao === TipoOperacaoCaixa.Sangria ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {mov.tipoOperacao === TipoOperacaoCaixa.Sangria ? '-' : '+'} R$ {mov.valor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashControl;