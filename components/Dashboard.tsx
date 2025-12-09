

import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, ChefHat, Calendar, Filter, Package } from 'lucide-react';
import { StatusCozinha, PedidoStatus } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC = () => {
  const [saldo, setSaldo] = useState(0);
  const [filaCozinha, setFilaCozinha] = useState(0);
  
  // Date Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Report Data
  const [reportData, setReportData] = useState<{
      totalVendas: number;
      totalPedidos: number;
      pieDataPayment: {name: string, value: number}[];
      pieDataType: {name: string, value: number}[];
      topProducts: {name: string, qty: number, total: number}[];
      chartData: {name: string, vendas: number}[];
  } | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      loadReport();
  }, [startDate, endDate]);

  const loadData = () => {
      setSaldo(db.getSaldoCaixa());
      // Fila cozinha
      const pedidosAtivos = db.getPedidos().filter(p => 
        p.status !== PedidoStatus.Cancelado && 
        (p.statusCozinha === StatusCozinha.Aguardando || p.statusCozinha === StatusCozinha.Preparando)
      );
      setFilaCozinha(pedidosAtivos.length);
  };

  const loadReport = () => {
      const data = db.getDashboardData(new Date(startDate), new Date(endDate));
      setReportData(data);
  };

  const ticketMedio = reportData && reportData.totalPedidos > 0 
    ? reportData.totalVendas / reportData.totalPedidos 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          
          <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-2">
                  <Filter size={16} className="text-gray-400"/>
                  <span className="text-xs font-bold text-gray-500 uppercase">Período:</span>
              </div>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
              />
              <button onClick={loadReport} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-700">Filtrar</button>
          </div>
      </div>
      
      {/* Realtime Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold">Saldo em Caixa (Atual)</p>
            <h3 className="text-2xl font-bold text-gray-800">R$ {saldo.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold">Vendas (Período)</p>
            <h3 className="text-2xl font-bold text-gray-800">R$ {reportData?.totalVendas.toFixed(2) || '0.00'}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 flex items-center space-x-4">
           <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <ShoppingBag size={24} />
          </div>
           <div>
            <p className="text-sm text-gray-500 font-bold">Pedidos (Período)</p>
            <h3 className="text-2xl font-bold text-gray-800">{reportData?.totalPedidos || 0}</h3>
            <span className="text-xs text-gray-400">Ticket Médio: R$ {ticketMedio.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <ChefHat size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold">Fila da Cozinha</p>
            <h3 className="text-2xl font-bold text-gray-800">{filaCozinha} <span className="text-xs font-normal text-gray-400">pedidos</span></h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales over Time */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp size={20}/> Vendas por Horário (Agregado)</h3>
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12}/>
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods Pie */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
             <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><DollarSign size={20}/> Vendas por Forma de Pagamento</h3>
             <div className="flex-1 flex">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={reportData?.pieDataPayment || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {(reportData?.pieDataPayment || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Order Type Pie */}
           <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
             <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><ShoppingBag size={20}/> Tipo de Atendimento</h3>
             <div className="flex-1 flex">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={reportData?.pieDataType || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#82ca9d"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {(reportData?.pieDataType || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Top Products Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-96 flex flex-col">
              <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2"><Package size={20}/> Top 5 Produtos Mais Vendidos</h3>
              </div>
              <div className="flex-1 overflow-auto">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50 sticky top-0">
                          <tr>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Produto</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Qtd. Vendida</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Total (R$)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {reportData?.topProducts.map((p, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                  <td className="p-4 text-sm font-medium text-gray-800 flex items-center gap-3">
                                      <span className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                                          {i + 1}
                                      </span>
                                      {p.name}
                                  </td>
                                  <td className="p-4 text-sm text-center text-gray-600">{p.qty}</td>
                                  <td className="p-4 text-sm text-right font-bold text-blue-600">R$ {p.total.toFixed(2)}</td>
                              </tr>
                          ))}
                          {(!reportData?.topProducts || reportData.topProducts.length === 0) && (
                              <tr><td colSpan={3} className="p-8 text-center text-gray-400">Nenhum dado no período.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
