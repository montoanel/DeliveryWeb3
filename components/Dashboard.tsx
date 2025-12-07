import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [saldo, setSaldo] = useState(0);
  const [vendasHoje, setVendasHoje] = useState(0);
  const [countPedidos, setCountPedidos] = useState(0);

  // Simulate fetching data
  useEffect(() => {
    const loadData = () => {
      setSaldo(db.getSaldoCaixa());
      setVendasHoje(db.getVendasDoDia());
      setCountPedidos(db.getPedidos().length);
    };
    
    loadData();
    const interval = setInterval(loadData, 2000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: '08:00', vendas: 120 },
    { name: '10:00', vendas: 300 },
    { name: '12:00', vendas: 850 },
    { name: '14:00', vendas: 400 },
    { name: '16:00', vendas: 200 },
    { name: '18:00', vendas: 900 },
    { name: '20:00', vendas: 1200 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo em Caixa</p>
            <h3 className="text-2xl font-bold text-gray-800">R$ {saldo.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Vendas Hoje</p>
            <h3 className="text-2xl font-bold text-gray-800">R$ {vendasHoje.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Pedidos</p>
            <h3 className="text-2xl font-bold text-gray-800">{countPedidos}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
           <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <AlertCircle size={24} />
          </div>
           <div>
            <p className="text-sm text-gray-500">Status Sistema</p>
            <h3 className="text-lg font-bold text-green-600">Online</h3>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Fluxo de Vendas (Horário)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;