
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Pedido, StatusCozinha, PedidoStatus, SetorProducao } from '../types';
import { Clock, CheckCircle, Flame, ChefHat, AlertTriangle, Truck, Wine } from 'lucide-react';

const getElapsedTime = (dateStr: string) => {
    const start = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - start) / 60000);
    return diffMins;
};

interface OrderCardProps {
    order: Pedido;
    activeSector: SetorProducao;
    onUpdateStatus: (id: number, status: StatusCozinha) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, activeSector, onUpdateStatus }) => {
    const mins = getElapsedTime(order.data);
    const isLate = mins > 20; // 20 mins alert

    // FILTER ITEMS based on Active Sector
    const relevantItems = order.itens.filter(item => {
        const itemSector = item.produto.setor || 'Cozinha';
        return itemSector === activeSector;
    });

    // If no items for this sector, don't render the card
    if (relevantItems.length === 0) return null;

    // Determine the "Dominant Status" of this card for this sector
    // Logic: 
    // If any item is Preparing -> Preparing
    // Else if any item is Waiting -> Waiting
    // Else if all items are Ready -> Ready
    
    // Actually, we are already filtered by the column in the parent component.
    // So we just need to know what button to show.
    
    // Check status of items to decide button
    const anyWaiting = relevantItems.some(i => i.status === StatusCozinha.Aguardando || !i.status);
    const anyPreparing = relevantItems.some(i => i.status === StatusCozinha.Preparando);
    const allReady = relevantItems.every(i => i.status === StatusCozinha.Pronto || i.status === StatusCozinha.Entregue);
    const allDelivered = relevantItems.every(i => i.status === StatusCozinha.Entregue);

    let displayStatus = StatusCozinha.Aguardando;
    if (allDelivered) displayStatus = StatusCozinha.Entregue; // Should not appear usually
    else if (allReady) displayStatus = StatusCozinha.Pronto;
    else if (anyPreparing) displayStatus = StatusCozinha.Preparando;
    else displayStatus = StatusCozinha.Aguardando;

    return (
        <div className={`bg-white rounded-xl shadow-md border-l-8 flex flex-col mb-4 overflow-hidden animate-in zoom-in duration-300 ${
            displayStatus === StatusCozinha.Aguardando ? 'border-gray-400' :
            displayStatus === StatusCozinha.Preparando ? 'border-yellow-400' :
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
                {relevantItems.map((item, idx) => (
                    <div key={idx} className="mb-3 border-b border-dashed border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                            <span className="font-extrabold text-lg text-gray-800">{item.quantidade}x</span>
                            <div>
                                <span className="text-lg font-medium text-gray-800 leading-tight block">
                                    {item.produto.nome}
                                </span>
                                {/* Optional: Show item status icon */}
                                <div className="flex items-center gap-2 mt-1">
                                    {item.status === StatusCozinha.Pronto && <span className="text-xs bg-green-100 text-green-700 px-1 rounded font-bold">Pronto</span>}
                                    {item.status === StatusCozinha.Entregue && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded font-bold">Entregue</span>}
                                </div>

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
                onClick={() => onUpdateStatus(order.id, displayStatus)}
                className={`w-full py-4 font-bold text-white text-lg flex items-center justify-center gap-2 transition-colors active:scale-95 ${
                    displayStatus === StatusCozinha.Aguardando ? 'bg-gray-700 hover:bg-gray-800' :
                    displayStatus === StatusCozinha.Preparando ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                    'bg-green-600 hover:bg-green-700'
                }`}
            >
                {displayStatus === StatusCozinha.Aguardando && <><Flame /> INICIAR PREPARO</>}
                {displayStatus === StatusCozinha.Preparando && <><CheckCircle /> MARCAR PRONTO</>}
                {displayStatus === StatusCozinha.Pronto && <><Truck /> SAIU P/ ENTREGA</>}
            </button>
        </div>
    );
};

const Kitchen: React.FC = () => {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [activeSector, setActiveSector] = useState<SetorProducao>('Cozinha');

  const loadOrders = () => {
    // Load active orders. We filter logic inside the columns.
    const all = db.getPedidos().filter(p => p.status !== PedidoStatus.Cancelado);
    setOrders(all.sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()));
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (id: number, currentStatus: StatusCozinha) => {
      let nextStatus = currentStatus;
      
      if (currentStatus === StatusCozinha.Aguardando) nextStatus = StatusCozinha.Preparando;
      else if (currentStatus === StatusCozinha.Preparando) nextStatus = StatusCozinha.Pronto;
      else if (currentStatus === StatusCozinha.Pronto) nextStatus = StatusCozinha.Entregue;

      db.updateKitchenStatus(id, nextStatus, activeSector);
      loadOrders();
  };

  // Helper to filter orders for a column based on ACTIVE SECTOR items
  const filterBySectorStatus = (statusList: StatusCozinha[]) => {
      return orders.filter(order => {
          // Find items for this sector
          const sectorItems = order.itens.filter(i => (i.produto.setor || 'Cozinha') === activeSector);
          if (sectorItems.length === 0) return false;

          // Check if ANY item in this sector is in the target status list
          // But we need to prioritize "lowest" status to avoid duplication across columns if mixed.
          // Rule:
          // Waiting Column: If any item is Waiting.
          // Prep Column: If no Waiting, but any Preparing.
          // Ready Column: If no Waiting/Preparing, but any Ready.
          
          const hasWaiting = sectorItems.some(i => i.status === StatusCozinha.Aguardando || !i.status);
          const hasPrep = sectorItems.some(i => i.status === StatusCozinha.Preparando);
          const hasReady = sectorItems.some(i => i.status === StatusCozinha.Pronto);
          const allDelivered = sectorItems.every(i => i.status === StatusCozinha.Entregue);

          if (allDelivered) return false; // Don't show completed sector orders

          if (statusList.includes(StatusCozinha.Aguardando)) {
              return hasWaiting;
          }
          if (statusList.includes(StatusCozinha.Preparando)) {
              return !hasWaiting && hasPrep;
          }
          if (statusList.includes(StatusCozinha.Pronto)) {
              return !hasWaiting && !hasPrep && hasReady;
          }
          return false;
      });
  };

  const waitingOrders = filterBySectorStatus([StatusCozinha.Aguardando]);
  const prepOrders = filterBySectorStatus([StatusCozinha.Preparando]);
  const readyOrders = filterBySectorStatus([StatusCozinha.Pronto]);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
       <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
               <ChefHat size={32} className="text-orange-600" /> 
               KDS - Monitor de {activeSector}
           </h1>
           
           <div className="flex gap-4 items-center">
                {/* Sector Selector */}
                <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mr-4">
                    <button 
                        onClick={() => setActiveSector('Cozinha')}
                        className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
                            activeSector === 'Cozinha' 
                            ? 'bg-white text-orange-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <ChefHat size={18} /> Cozinha
                    </button>
                    <button 
                        onClick={() => setActiveSector('Bar')}
                        className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
                            activeSector === 'Bar' 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Wine size={18} /> Bar / Copa
                    </button>
                </div>

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
                       {waitingOrders.map(o => <OrderCard key={o.id} order={o} activeSector={activeSector} onUpdateStatus={handleUpdateStatus} />)}
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
                       {prepOrders.map(o => <OrderCard key={o.id} order={o} activeSector={activeSector} onUpdateStatus={handleUpdateStatus} />)}
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
                       {readyOrders.map(o => <OrderCard key={o.id} order={o} activeSector={activeSector} onUpdateStatus={handleUpdateStatus} />)}
                       {readyOrders.length === 0 && <div className="text-center text-gray-400 mt-10 opacity-50">Balcão limpo</div>}
                   </div>
               </div>

           </div>
       </div>
    </div>
  );
};

export default Kitchen;
