
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Pedido, StatusCozinha, PedidoStatus } from '../types';
import { Clock, CheckCircle, Flame, ChefHat, AlertTriangle, Truck } from 'lucide-react';

const getElapsedTime = (dateStr: string) => {
    const start = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - start) / 60000);
    return diffMins;
};

interface OrderCardProps {
    order: Pedido;
    onUpdateStatus: (id: number, status: StatusCozinha) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus }) => {
    const mins = getElapsedTime(order.data);
    const isLate = mins > 20; // 20 mins alert

    return (
        <div className={`bg-white rounded-xl shadow-md border-l-8 flex flex-col mb-4 overflow-hidden animate-in zoom-in duration-300 ${
            order.statusCozinha === StatusCozinha.Aguardando ? 'border-gray-400' :
            order.statusCozinha === StatusCozinha.Preparando ? 'border-yellow-400' :
            'border-green-500'
        }`}>
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-800">#{order.id}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold uppercase text-gray-500 mt-1">
                        {order.tipoAtendimento === 'Delivery' && <Truck size={12}/>}
                        {order.tipoAtendimento}
                    </div>
                    <div className="text-sm text-gray-600 font-bold truncate max-w-[150px]">{order.clienteNome}</div>
                </div>
                <div className={`flex flex-col items-end ${isLate ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                    <Clock size={20} />
                    <span className="font-bold text-lg">{mins}'</span>
                </div>
            </div>

            {/* Items */}
            <div className="p-3 flex-1 overflow-y-auto max-h-[300px]">
                {order.itens.map((item, idx) => (
                    <div key={idx} className="mb-3 border-b border-dashed border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                            <span className="font-extrabold text-lg text-gray-800">{item.quantidade}x</span>
                            <div>
                                <span className="text-lg font-medium text-gray-800 leading-tight block">{item.produto.nome}</span>
                                {item.adicionais && item.adicionais.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                        {item.adicionais.map((add, i) => (
                                            <div key={i} className="text-sm font-bold text-green-700 bg-green-50 px-1 rounded inline-block mr-1">
                                                + {add.nome}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <button 
                onClick={() => onUpdateStatus(order.id, order.statusCozinha)}
                className={`w-full py-4 font-bold text-white text-lg flex items-center justify-center gap-2 transition-colors active:scale-95 ${
                    order.statusCozinha === StatusCozinha.Aguardando ? 'bg-gray-700 hover:bg-gray-800' :
                    order.statusCozinha === StatusCozinha.Preparando ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                    'bg-green-600 hover:bg-green-700'
                }`}
            >
                {order.statusCozinha === StatusCozinha.Aguardando && <><Flame /> INICIAR PREPARO</>}
                {order.statusCozinha === StatusCozinha.Preparando && <><CheckCircle /> MARCAR PRONTO</>}
                {order.statusCozinha === StatusCozinha.Pronto && <><Truck /> SAIU P/ ENTREGA</>}
            </button>
        </div>
    );
};

const Kitchen: React.FC = () => {
  const [orders, setOrders] = useState<Pedido[]>([]);

  const loadOrders = () => {
    // Carrega pedidos que NÃO estão cancelados e NÃO estão Entregues (finalizados na cozinha)
    const all = db.getPedidos().filter(p => 
        p.status !== PedidoStatus.Cancelado && 
        p.statusCozinha !== StatusCozinha.Entregue
    );
    // Ordena por data (mais antigos primeiro)
    setOrders(all.sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()));
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000); // Polling a cada 3s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (id: number, currentStatus: StatusCozinha) => {
      let nextStatus = currentStatus;
      
      if (currentStatus === StatusCozinha.Aguardando) nextStatus = StatusCozinha.Preparando;
      else if (currentStatus === StatusCozinha.Preparando) nextStatus = StatusCozinha.Pronto;
      else if (currentStatus === StatusCozinha.Pronto) nextStatus = StatusCozinha.Entregue;

      db.updateKitchenStatus(id, nextStatus);
      loadOrders();
  };

  // Divide orders into columns
  const waitingOrders = orders.filter(o => o.statusCozinha === StatusCozinha.Aguardando);
  const prepOrders = orders.filter(o => o.statusCozinha === StatusCozinha.Preparando);
  const readyOrders = orders.filter(o => o.statusCozinha === StatusCozinha.Pronto);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
       <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
               <ChefHat size={32} className="text-orange-600" /> 
               KDS - Monitor de Cozinha
           </h1>
           <div className="flex gap-4">
               <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                   <span className="block text-xs font-bold text-gray-500 uppercase">Aguardando</span>
                   <span className="text-2xl font-bold text-gray-800">{waitingOrders.length}</span>
               </div>
               <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                   <span className="block text-xs font-bold text-gray-500 uppercase">Em Preparo</span>
                   <span className="text-2xl font-bold text-yellow-600">{prepOrders.length}</span>
               </div>
           </div>
       </div>

       <div className="flex-1 overflow-x-auto overflow-y-hidden">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[1000px] h-full pb-4">
               
               {/* Column 1: Aguardando */}
               <div className="bg-gray-100 rounded-xl p-4 flex flex-col h-full border border-gray-200">
                   <div className="flex items-center gap-2 mb-4 pb-2 border-b-4 border-gray-400">
                       <AlertTriangle className="text-gray-600" />
                       <h2 className="text-lg font-bold text-gray-700 uppercase">Aguardando</h2>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                       {waitingOrders.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} />)}
                       {waitingOrders.length === 0 && <div className="text-center text-gray-400 mt-10">Sem pedidos na fila</div>}
                   </div>
               </div>

               {/* Column 2: Preparando */}
               <div className="bg-yellow-50 rounded-xl p-4 flex flex-col h-full border border-yellow-200">
                   <div className="flex items-center gap-2 mb-4 pb-2 border-b-4 border-yellow-400">
                       <Flame className="text-yellow-600" />
                       <h2 className="text-lg font-bold text-yellow-800 uppercase">Em Preparo</h2>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                       {prepOrders.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} />)}
                        {prepOrders.length === 0 && <div className="text-center text-gray-400 mt-10 opacity-50">Fogão livre</div>}
                   </div>
               </div>

               {/* Column 3: Pronto */}
               <div className="bg-green-50 rounded-xl p-4 flex flex-col h-full border border-green-200">
                   <div className="flex items-center gap-2 mb-4 pb-2 border-b-4 border-green-500">
                       <CheckCircle className="text-green-600" />
                       <h2 className="text-lg font-bold text-green-800 uppercase">Pronto / Entrega</h2>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                       {readyOrders.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} />)}
                       {readyOrders.length === 0 && <div className="text-center text-gray-400 mt-10 opacity-50">Balcão limpo</div>}
                   </div>
               </div>

           </div>
       </div>
    </div>
  );
};

export default Kitchen;
