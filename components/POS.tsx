import React, { useState, useEffect } from 'react';
import { Produto, PedidoItem, Cliente, TipoAtendimento, PedidoStatus, Pedido, FormaPagamento, ConfiguracaoAdicional, PedidoItemAdicional, Pagamento } from '../types';
import { db } from '../services/mockDb';
import { 
  Search, Plus, Trash2, User, Truck, ShoppingBag, 
  ClipboardList, Zap, Save, X, Calculator, Calendar, CreditCard, Banknote, MapPin, Package, CheckSquare, Square, Edit
} from 'lucide-react';

// Helper for accent-insensitive search
const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const POS: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [orders, setOrders] = useState<Pedido[]>([]);
  
  // --- Data Source State ---
  const [availableProducts, setAvailableProducts] = useState<Produto[]>([]);
  const [availableClients, setAvailableClients] = useState<Cliente[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);
  const [addonConfigs, setAddonConfigs] = useState<ConfiguracaoAdicional[]>([]);

  // --- Form State ---
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [currentOrderStatus, setCurrentOrderStatus] = useState<PedidoStatus>(PedidoStatus.Pendente);
  const [existingPayments, setExistingPayments] = useState<Pagamento[]>([]);
  
  const [currentOrderType, setCurrentOrderType] = useState<TipoAtendimento>(TipoAtendimento.VendaRapida);
  const [cart, setCart] = useState<PedidoItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [observation, setObservation] = useState('');
  
  // Search States
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // --- Modals State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false); 
  const [isProductModalOpen, setIsProductModalOpen] = useState(false); 
  
  // Addon Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [pendingAddonProduct, setPendingAddonProduct] = useState<{product: Produto, config: ConfiguracaoAdicional} | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [paymentInputValue, setPaymentInputValue] = useState<string>(''); 

  // --- Data Loading ---
  const refreshData = () => {
    setOrders(db.getPedidos());
    setAvailableProducts(db.getProdutos());
    setAvailableClients(db.getClientes());
    setPaymentMethods(db.getFormasPagamento().filter(f => f.ativo));
    setAddonConfigs(db.getConfiguracoesAdicionais());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view === 'form') {
        if (e.key === 'F1') {
           e.preventDefault();
           setIsProductModalOpen(true);
        }
        if (e.key === 'F2') {
          e.preventDefault();
          setIsClientModalOpen(true);
        }
        if (e.key === 'F5') {
          e.preventDefault();
          // Logic for F5 depends on type
          if (currentOrderType === TipoAtendimento.VendaRapida || (editingOrderId && currentOrderStatus === PedidoStatus.Pendente)) {
             handleInitiatePayment();
          }
        }
        if (e.key === 'Escape' && !isPaymentModalOpen && !isClientModalOpen && !isProductModalOpen && !isAddonModalOpen) {
           handleCancelOrder();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, cart, currentOrderType, selectedClient, isPaymentModalOpen, isClientModalOpen, isProductModalOpen, isAddonModalOpen, editingOrderId, currentOrderStatus]); 

  // --- Handlers ---

  const handleNewOrder = (type: TipoAtendimento) => {
    refreshData(); 
    setCurrentOrderType(type);
    setCurrentOrderStatus(PedidoStatus.Pendente);
    setEditingOrderId(null);
    setCart([]);
    setExistingPayments([]);
    setSelectedClient(null);
    setObservation('');
    setProductSearch('');
    setClientSearch('');
    
    setIsPaymentModalOpen(false);
    setIsClientModalOpen(false);
    setIsProductModalOpen(false);
    setIsAddonModalOpen(false);
    setPendingAddonProduct(null);
    setSelectedAddons([]);

    setSelectedPaymentMethodId(null);
    setPaymentInputValue('');
    
    setView('form');
  };

  const handleEditOrder = (order: Pedido) => {
    refreshData();
    setEditingOrderId(order.id);
    setCurrentOrderType(order.tipoAtendimento);
    setCurrentOrderStatus(order.status);
    setExistingPayments(order.pagamentos || []);
    
    // Deep copy items to avoid mutating ref until save
    setCart(order.itens.map(i => ({
        ...i,
        adicionais: i.adicionais ? [...i.adicionais] : undefined
    })));
    
    const client = availableClients.find(c => c.id === order.clienteId);
    setSelectedClient(client || (order.clienteId ? { id: order.clienteId, nome: order.clienteNome || 'Cliente', cpfCnpj: '', telefone: '', endereco: '', numero: '', complemento: '', bairro: '', tipoPessoa: 'Física' } : null));
    
    setObservation(''); // Obs not currently in Pedido model, skipping restore
    
    setView('form');
  };

  const addItemToCart = (product: Produto, quantity: number, addons?: PedidoItemAdicional[]) => {
    setCart(prev => {
      // If it has addons, we always add as a new item line
      if (addons && addons.length > 0) {
        return [...prev, { produto: product, quantidade: quantity, adicionais: addons }];
      }

      // If simple product, we can stack quantities
      const existing = prev.find(item => item.produto.id === product.id && (!item.adicionais || item.adicionais.length === 0));
      if (existing) {
        return prev.map(item => 
          (item.produto.id === product.id && (!item.adicionais || item.adicionais.length === 0))
            ? { ...item, quantidade: item.quantidade + 1 } 
            : item
        );
      }
      return [...prev, { produto: product, quantidade: 1 }];
    });
  };

  const handleAddItem = (product: Produto) => {
    const config = addonConfigs.find(c => c.produtoPrincipalId === product.id);
    if (config) {
      setPendingAddonProduct({ product, config });
      setSelectedAddons([]);
      setIsAddonModalOpen(true);
      setProductSearch('');
      setIsProductModalOpen(false);
      return;
    }

    addItemToCart(product, 1);
    setProductSearch('');
    setIsProductModalOpen(false);
  };

  const handleConfirmAddons = () => {
    if (!pendingAddonProduct) return;

    const { product, config } = pendingAddonProduct;
    const finalAddons: PedidoItemAdicional[] = [];

    // Calculate free vs paid logic
    selectedAddons.forEach((addonId, index) => {
      const addonProduct = availableProducts.find(p => p.id === addonId);
      if (addonProduct) {
        const isFree = index < config.cobrarApartirDe;
        finalAddons.push({
          produtoId: addonProduct.id,
          nome: addonProduct.nome,
          precoOriginal: addonProduct.preco,
          precoCobrado: isFree ? 0 : addonProduct.preco
        });
      }
    });

    addItemToCart(product, 1, finalAddons);
    setIsAddonModalOpen(false);
    setPendingAddonProduct(null);
    setSelectedAddons([]);
  };

  const handleSelectProductFromModal = (product: Produto) => {
    handleAddItem(product);
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectClient = (client: Cliente) => {
    setSelectedClient(client);
    setClientSearch('');
    setIsClientModalOpen(false);
  };

  // --- SAVE ACTIONS ---

  // 1. Save as Pending (For Delivery/Encomenda)
  const handleSavePendingOrder = () => {
    if (cart.length === 0) {
        alert("O pedido precisa ter pelo menos um item.");
        return;
    }
    if ((currentOrderType === TipoAtendimento.Delivery || currentOrderType === TipoAtendimento.Encomenda) && !selectedClient) {
        alert("Para este tipo de atendimento, o Cliente é obrigatório.");
        return;
    }

    const total = calculateCartTotal();
    const id = editingOrderId || (Math.floor(Math.random() * 10000) + 1000);

    const pedido: Pedido = {
        id,
        data: editingOrderId ? orders.find(o => o.id === editingOrderId)?.data || new Date().toISOString() : new Date().toISOString(),
        tipoAtendimento: currentOrderType,
        clienteId: selectedClient?.id,
        clienteNome: selectedClient?.nome || 'Consumidor Final',
        total: total,
        status: existingPayments.length > 0 ? currentOrderStatus : PedidoStatus.Pendente, // Trust current calculated status or keep pendente
        itens: cart,
        pagamentos: existingPayments // preserve payments
    };

    db.savePedido(pedido);
    refreshData();
    setView('list');
    alert(`Pedido #${id} salvo com sucesso!`);
  };

  // 2. Open Payment Modal (For Finalizing)
  const handleInitiatePayment = () => {
    if (cart.length === 0) {
      alert("O pedido precisa ter pelo menos um item.");
      return;
    }

    if ((currentOrderType === TipoAtendimento.Delivery || currentOrderType === TipoAtendimento.Encomenda) && !selectedClient) {
      alert("Para este tipo de atendimento, o Cliente é obrigatório.");
      return;
    }

    // Default to Cash
    const moneyMethod = paymentMethods.find(p => p.nome.toLowerCase().includes('dinheiro'));
    setSelectedPaymentMethodId(moneyMethod ? moneyMethod.id : (paymentMethods[0]?.id || null));
    
    // Set default value to remaining
    const total = calculateCartTotal();
    const paid = calculateTotalPaid();
    const remaining = total - paid;
    setPaymentInputValue(remaining > 0 ? remaining.toFixed(2) : '0.00');
    
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    // Sync state with DB in case partial payments were made
    if (editingOrderId) {
        const freshOrder = db.getPedidoById(editingOrderId);
        if (freshOrder) {
            setExistingPayments(freshOrder.pagamentos);
            setCurrentOrderStatus(freshOrder.status);
        }
    }
    setIsPaymentModalOpen(false);
  };

  // 3. Register Partial Payment
  const handleRegisterPayment = () => {
     if (!selectedPaymentMethodId) {
       alert("Selecione uma forma de pagamento.");
       return;
     }

     const amountToPay = parseFloat(paymentInputValue.replace(',', '.'));
     const total = calculateCartTotal();
     const paid = calculateTotalPaid();
     const remaining = total - paid;

     if (isNaN(amountToPay) || amountToPay <= 0) {
       alert("Valor inválido.");
       return;
     }

     // Ensure order exists before adding payment
     let orderId = editingOrderId;
     if (!orderId) {
        // Create order first
        orderId = (Math.floor(Math.random() * 10000) + 1000);
        const pedido: Pedido = {
            id: orderId,
            data: new Date().toISOString(),
            tipoAtendimento: currentOrderType,
            clienteId: selectedClient?.id,
            clienteNome: selectedClient?.nome || 'Consumidor Final',
            total: total,
            status: PedidoStatus.Pendente,
            itens: cart,
            pagamentos: []
        };
        db.savePedido(pedido);
        setEditingOrderId(orderId);
     } else {
        // Update order total/items before payment just in case
        const pedido: Pedido = {
            id: orderId,
            data: orders.find(o => o.id === orderId)?.data || new Date().toISOString(),
            tipoAtendimento: currentOrderType,
            clienteId: selectedClient?.id,
            clienteNome: selectedClient?.nome || 'Consumidor Final',
            total: total,
            status: currentOrderStatus,
            itens: cart,
            pagamentos: existingPayments
        };
        db.savePedido(pedido);
     }

     const selectedMethod = paymentMethods.find(p => p.id === selectedPaymentMethodId);
     
     let realPayment = amountToPay;
     let change = 0;
     
     if (amountToPay > (remaining + 0.01)) {
        if (selectedMethod?.nome.toLowerCase().includes('dinheiro')) {
            change = amountToPay - remaining;
            realPayment = remaining;
        } else {
            alert(`O valor não pode ser maior que o restante (R$ ${remaining.toFixed(2)}).`);
            return;
        }
     }

     const newPayment: Pagamento = {
       id: Math.random().toString(36).substr(2, 9),
       data: new Date().toISOString(),
       formaPagamentoId: selectedMethod!.id,
       formaPagamentoNome: selectedMethod!.nome,
       valor: realPayment
     };

     // Execute DB Operation
     db.addPagamento(orderId, newPayment);
     
     refreshData(); // Refresh background list immediately

     // Refresh Local State
     const updatedOrder = db.getPedidoById(orderId);
     if (updatedOrder) {
        setExistingPayments(updatedOrder.pagamentos);
        setCurrentOrderStatus(updatedOrder.status);
        
        // Show Feedback
        if (change > 0) {
             alert(`Pagamento registrado!\n\nTROCO: R$ ${change.toFixed(2)}`);
        }
        
        // Check if finished
        const newTotalPaid = updatedOrder.pagamentos.reduce((acc, p) => acc + p.valor, 0);
        const newRemaining = updatedOrder.total - newTotalPaid;
        
        if (newRemaining <= 0.01) {
            // Fully Paid
            setIsPaymentModalOpen(false);
            setView('list');
            alert(`Atendimento #${orderId} finalizado com sucesso!`);
        } else {
            // Still Partial - Reset input to new remaining
            setPaymentInputValue(newRemaining.toFixed(2));
        }
     }
  };

  const handleCancelOrder = () => {
    setView('list');
  };

  const handleToggleAddon = (id: number) => {
    setSelectedAddons(prev => {
        if (prev.includes(id)) {
            return prev.filter(x => x !== id);
        } else {
            return [...prev, id];
        }
    });
  };

  // --- Derived State ---
  
  const filteredProducts = productSearch.length > 0 
    ? availableProducts.filter(p => 
        p.ativo && 
        p.tipo === 'Principal' &&
        (
          normalizeText(p.nome).includes(normalizeText(productSearch)) || 
          p.codigoBarras.includes(productSearch) || 
          normalizeText(p.codigoInterno).includes(normalizeText(productSearch))
        )
      )
    : [];

  const [modalProductSearch, setModalProductSearch] = useState('');
  const modalFilteredProducts = availableProducts.filter(p => 
      p.ativo && 
      p.tipo === 'Principal' &&
      (
        normalizeText(p.nome).includes(normalizeText(modalProductSearch)) || 
        p.codigoBarras.includes(modalProductSearch) || 
        normalizeText(p.codigoInterno).includes(normalizeText(modalProductSearch))
      )
  );

  const filteredClients = availableClients.filter(c => 
    normalizeText(c.nome).includes(normalizeText(clientSearch)) || 
    c.id.toString() === clientSearch ||
    c.cpfCnpj.includes(clientSearch)
  );

  const [modalClientSearch, setModalClientSearch] = useState('');
  const modalFilteredClients = availableClients.filter(c => 
    normalizeText(c.nome).includes(normalizeText(modalClientSearch)) || 
    c.id.toString() === modalClientSearch ||
    c.cpfCnpj.includes(modalClientSearch) ||
    normalizeText(c.telefone).includes(normalizeText(modalClientSearch))
  );

  const calculateCartTotal = () => {
    return cart.reduce((acc, item) => {
        let itemTotal = item.produto.preco * item.quantidade;
        if (item.adicionais) {
            item.adicionais.forEach(add => {
                itemTotal += add.precoCobrado * item.quantidade;
            });
        }
        return acc + itemTotal;
    }, 0);
  };
  
  const calculateTotalPaid = () => {
      return existingPayments.reduce((acc, p) => acc + p.valor, 0);
  };
  
  const cartTotal = calculateCartTotal();
  const totalPaid = calculateTotalPaid();
  const remainingTotal = Math.max(0, cartTotal - totalPaid);
  
  const selectedMethodObj = paymentMethods.find(p => p.id === selectedPaymentMethodId);
  const isCashPayment = selectedMethodObj?.nome.toLowerCase().includes('dinheiro');
  
  // Change calculation purely for visual aid in the modal
  const inputValueFloat = parseFloat(paymentInputValue) || 0;
  const potentialChange = (isCashPayment && inputValueFloat > remainingTotal) ? inputValueFloat - remainingTotal : 0;

  const getStatusColor = (status: PedidoStatus) => {
    switch(status) {
      case PedidoStatus.Pago: return 'bg-green-100 text-green-700';
      case PedidoStatus.Pendente: return 'bg-yellow-100 text-yellow-700';
      case PedidoStatus.Cancelado: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Render Action Buttons based on Logic
  const renderActionButtons = () => {
     // Scenario 1: Quick Sale (Always Immediate)
     if (currentOrderType === TipoAtendimento.VendaRapida) {
         return (
            <button onClick={handleInitiatePayment} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                <Banknote size={18} /> Finalizar / Pagamento (F5)
            </button>
         )
     }

     // Scenario 2: Other Types
     if (editingOrderId && currentOrderStatus === PedidoStatus.Pendente) {
         return (
             <div className="flex gap-2">
                 <button onClick={handleSavePendingOrder} className="px-4 py-1.5 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow-sm">
                    <Save size={18} /> Salvar Alterações
                 </button>
                 <button onClick={handleInitiatePayment} className="px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm">
                    <Banknote size={18} /> Receber (Baixar)
                 </button>
             </div>
         )
     }

     if (!editingOrderId) {
        return (
            <div className="flex gap-2">
                 <button onClick={handleSavePendingOrder} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                    <Save size={18} /> Salvar Pedido
                 </button>
             </div>
        )
     }

     if (currentOrderStatus === PedidoStatus.Pago) {
         return (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-bold flex items-center gap-2">
                <CheckSquare size={16}/> Pedido Pago / Fechado
            </div>
         )
     }
  };

  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4 tracking-wider">Novo Atendimento</h2>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleNewOrder(TipoAtendimento.Encomenda)} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-bold shadow-sm transition-transform active:scale-95">
              <ClipboardList size={24} /> <span>Encomenda</span>
            </button>
            <button onClick={() => handleNewOrder(TipoAtendimento.Retirada)} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-bold shadow-sm transition-transform active:scale-95">
              <ShoppingBag size={24} /> <span>Retirada</span>
            </button>
            <button onClick={() => handleNewOrder(TipoAtendimento.Delivery)} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-bold shadow-sm transition-transform active:scale-95">
              <Truck size={24} /> <span>Delivery</span>
            </button>
            <button onClick={() => handleNewOrder(TipoAtendimento.VendaRapida)} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-transform active:scale-95">
              <Zap size={24} /> <span>V. Rápida</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
             <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-bold">Todos</span>
                <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-bold cursor-pointer hover:bg-gray-300">Abertos</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={16} /> <span>Hoje</span>
             </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Tipo</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">ID</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Data/Hora</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Cliente</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase">Pagamentos</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase text-right">Total (R$)</th>
                <th className="p-3 text-xs font-bold text-gray-600 uppercase text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => {
                  const paid = order.pagamentos?.reduce((acc, p) => acc + p.valor, 0) || 0;
                  return (
                <tr key={order.id} onClick={() => handleEditOrder(order)} className="hover:bg-blue-50 transition-colors cursor-pointer group">
                  <td className="p-3 text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        {order.status === PedidoStatus.Pendente && <Edit size={14} className="text-blue-400 opacity-0 group-hover:opacity-100"/>}
                        {order.tipoAtendimento}
                      </div>
                  </td>
                  <td className="p-3 text-sm text-gray-500">{order.id}</td>
                  <td className="p-3 text-sm text-gray-500">{new Date(order.data).toLocaleString()}</td>
                  <td className="p-3 text-sm text-gray-700">{order.clienteNome}</td>
                   <td className="p-3 text-sm text-gray-600">
                     {order.pagamentos && order.pagamentos.length > 0 
                        ? `${order.pagamentos.length}x (${paid.toFixed(2)})`
                        : '-'
                     }
                   </td>
                  <td className="p-3 text-sm font-bold text-gray-800 text-right">{order.total.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              )})}
              {orders.length === 0 && (
                <tr>
                   <td colSpan={7} className="p-10 text-center text-gray-400">Nenhum atendimento encontrado hoje.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-gray-100 -m-6 p-4 relative">
      
      {/* Addon Modal */}
      {isAddonModalOpen && pendingAddonProduct && (
        <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           {/* ... existing addon modal code ... */}
           <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col animate-in zoom-in duration-200 max-h-[85vh]">
              <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                 <h3 className="text-xl font-bold text-gray-800">{pendingAddonProduct.product.nome}</h3>
                 <p className="text-sm text-gray-500 mt-1">
                   Selecione os itens desejados. <span className="text-green-600 font-bold">Grátis até {pendingAddonProduct.config.cobrarApartirDe} itens.</span>
                 </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                 <div className="space-y-2">
                     {pendingAddonProduct.config.complementosIds.map((addonId) => {
                         const addon = availableProducts.find(x => x.id === addonId);
                         if (!addon) return null;
                         
                         const isSelected = selectedAddons.includes(addonId);
                         const selectionIndex = selectedAddons.indexOf(addonId);
                         const isFree = isSelected && (selectionIndex < pendingAddonProduct.config.cobrarApartirDe);
                         
                         return (
                             <div 
                                key={addonId} 
                                onClick={() => handleToggleAddon(addonId)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none ${
                                    isSelected 
                                    ? 'bg-blue-50 border-blue-500 shadow-sm' 
                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                }`}
                             >
                                <div className="flex items-center gap-3">
                                    <div className={isSelected ? 'text-blue-600' : 'text-gray-300'}>
                                        {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {addon.nome}
                                        </span>
                                        {isSelected && (
                                            <span className="text-xs font-medium text-gray-500">
                                                {isFree ? 'Item Gratuito' : 'Item Adicional'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {isSelected ? (
                                        isFree 
                                        ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Grátis</span>
                                        : <span className="text-blue-700 font-bold text-sm">+ R$ {addon.preco.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-gray-400 text-sm font-medium">+ R$ {addon.preco.toFixed(2)}</span>
                                    )}
                                </div>
                             </div>
                         )
                     })}
                 </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-500">
                      Selecionados: <span className="text-gray-900 font-bold">{selectedAddons.length}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setIsAddonModalOpen(false); setPendingAddonProduct(null); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white">Cancelar</button>
                    <button onClick={handleConfirmAddons} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200">
                        Confirmar
                    </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Product Search Modal */}
      {isProductModalOpen && (
        <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           {/* ... existing product modal code ... */}
           <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                 <h3 className="font-bold text-gray-700 flex items-center gap-2"><Package size={20}/> Buscar Produto</h3>
                 <button onClick={() => setIsProductModalOpen(false)} className="hover:bg-gray-200 p-1 rounded"><X size={20}/></button>
              </div>
              <div className="p-4 border-b border-gray-100">
                 <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">
                    <Search className="text-gray-400"/>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Digite nome, código interno ou código de barras..."
                      className="flex-1 outline-none"
                      value={modalProductSearch}
                      onChange={(e) => setModalProductSearch(e.target.value)}
                    />
                 </div>
              </div>
              <div className="flex-1 overflow-auto p-0">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0">
                       <tr>
                         <th className="p-3 text-xs font-bold text-gray-500 w-24">Cód.</th>
                         <th className="p-3 text-xs font-bold text-gray-500">Produto</th>
                         <th className="p-3 text-xs font-bold text-gray-500 text-center w-20">Un.</th>
                         <th className="p-3 text-xs font-bold text-gray-500 text-right w-28">Preço (R$)</th>
                         <th className="p-3"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {modalFilteredProducts.map(p => (
                         <tr key={p.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => handleSelectProductFromModal(p)}>
                            <td className="p-3 text-sm text-gray-500 font-mono">
                                {p.codigoInterno}
                                <div className="text-[10px] text-gray-400">{p.codigoBarras}</div>
                            </td>
                            <td className="p-3 text-sm font-bold text-gray-800">{p.nome}</td>
                            <td className="p-3 text-sm text-gray-600 text-center">{p.unidadeMedida}</td>
                            <td className="p-3 text-sm font-bold text-blue-700 text-right">{p.preco.toFixed(2)}</td>
                            <td className="p-3 text-right">
                               <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 shadow-sm font-bold">Adicionar</button>
                            </td>
                         </tr>
                       ))}
                       {modalFilteredProducts.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum produto encontrado</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Client Search Modal */}
      {isClientModalOpen && (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           {/* ... existing client modal code ... */}
           <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                 <h3 className="font-bold text-gray-700 flex items-center gap-2"><User size={20}/> Buscar Cliente</h3>
                 <button onClick={() => setIsClientModalOpen(false)} className="hover:bg-gray-200 p-1 rounded"><X size={20}/></button>
              </div>
              <div className="p-4 border-b border-gray-100">
                 <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">
                    <Search className="text-gray-400"/>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Digite nome, CPF, telefone..."
                      className="flex-1 outline-none"
                      value={modalClientSearch}
                      onChange={(e) => setModalClientSearch(e.target.value)}
                    />
                 </div>
              </div>
              <div className="flex-1 overflow-auto p-0">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0">
                       <tr>
                         <th className="p-3 text-xs font-bold text-gray-500">ID</th>
                         <th className="p-3 text-xs font-bold text-gray-500">Nome</th>
                         <th className="p-3 text-xs font-bold text-gray-500">CPF/CNPJ</th>
                         <th className="p-3 text-xs font-bold text-gray-500">Telefone</th>
                         <th className="p-3"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {modalFilteredClients.map(c => (
                         <tr key={c.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => handleSelectClient(c)}>
                            <td className="p-3 text-sm text-gray-500">{c.id}</td>
                            <td className="p-3 text-sm font-bold text-gray-800">{c.nome}</td>
                            <td className="p-3 text-sm text-gray-600">{c.cpfCnpj}</td>
                            <td className="p-3 text-sm text-gray-600">{c.telefone}</td>
                            <td className="p-3 text-right">
                               <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Selecionar</button>
                            </td>
                         </tr>
                       ))}
                       {modalFilteredClients.length === 0 && (
                         <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum cliente encontrado</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Payment Modal Overlay (UPDATED FOR PARTIAL PAYMENTS) */}
      {isPaymentModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><CreditCard /> Recebimento</h2>
                    <button onClick={handleClosePaymentModal} className="hover:bg-blue-700 p-1 rounded"><X /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Totals Summary */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
                            <p className="text-lg font-bold text-gray-800">R$ {cartTotal.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Já Pago</p>
                            <p className="text-lg font-bold text-green-600">R$ {totalPaid.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Restante</p>
                            <p className="text-lg font-bold text-blue-600">R$ {remainingTotal.toFixed(2)}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Selecione a Forma</label>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedPaymentMethodId(method.id)}
                                    className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${
                                        selectedPaymentMethodId === method.id 
                                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                    }`}
                                >
                                    {method.nome}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Value Input (Editable for ALL methods) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                             Valor a Processar ({selectedMethodObj?.nome || '...'})
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                            <input 
                                type="number" 
                                autoFocus
                                value={paymentInputValue}
                                onChange={(e) => setPaymentInputValue(e.target.value)}
                                className="w-full pl-10 p-3 text-lg font-bold border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        
                        {/* Change Preview */}
                        {isCashPayment && (
                            <div className="mt-3 flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-500">Troco Estimado:</span>
                                <span className={`font-bold text-xl ${potentialChange > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    R$ {potentialChange.toFixed(2)}
                                </span>
                            </div>
                        )}
                        
                        {!isCashPayment && parseFloat(paymentInputValue) > remainingTotal && (
                             <div className="mt-2 text-xs text-red-500 font-bold">
                                Atenção: Valor maior que o restante.
                             </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                    <button onClick={handleClosePaymentModal} className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300">
                        Fechar / Cancelar
                    </button>
                    <button onClick={handleRegisterPayment} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-200">
                        REGISTRAR PAGAMENTO
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white px-4 py-2 rounded-t-lg shadow-sm border-b border-gray-200 flex justify-between items-center h-14">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
           <span className="text-blue-600">#{editingOrderId || 'Novo'}</span> 
           {editingOrderId ? 'Editando Atendimento' : 'Novo Atendimento'}
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={handleCancelOrder} 
                className="px-4 py-1.5 bg-red-100 text-red-700 text-sm font-bold rounded-lg hover:bg-red-200 flex items-center gap-2 border border-red-200 transition-colors"
            >
               <X size={18} /> Cancelar Atendimento
            </button>
            {renderActionButtons()}
        </div>
      </div>

      <div className="flex-1 flex gap-4 mt-2 overflow-hidden">
        
        {/* Main Form Area */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
             {/* ... Form Inputs (Client, Search, etc) ... */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Tipo</label>
                        <input type="text" value={currentOrderType} disabled className="w-full bg-gray-100 border border-gray-300 rounded p-1.5 text-sm text-gray-700 font-bold" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Atendente</label>
                        <input type="text" value="2 - Admin" disabled className="w-full bg-gray-100 border border-gray-300 rounded p-1.5 text-sm text-gray-700" />
                    </div>
                     <div className="md:col-span-7 relative">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Cliente (F2)</label>
                        <div className="flex gap-1">
                             <input 
                                type="text" 
                                placeholder="Buscar Cliente..." 
                                value={selectedClient ? selectedClient.nome : clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    setSelectedClient(null);
                                }}
                                disabled={currentOrderStatus === PedidoStatus.Pago}
                                className={`w-full border border-gray-300 rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${selectedClient ? 'bg-blue-50 border-blue-400 font-bold text-blue-800' : 'bg-white'}`}
                             />
                             <button 
                                onClick={() => setIsClientModalOpen(true)}
                                disabled={currentOrderStatus === PedidoStatus.Pago}
                                className="px-3 bg-gray-200 rounded border border-gray-300 text-gray-600 hover:bg-gray-300 active:bg-gray-400 transition-colors disabled:opacity-50"
                                title="Abrir busca avançada (F2)"
                             >
                                <Search size={16}/>
                             </button>
                        </div>
                        {clientSearch && !selectedClient && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg max-h-40 overflow-auto z-40">
                                {filteredClients.map(c => (
                                    <div 
                                        key={c.id} 
                                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50"
                                        onClick={() => handleSelectClient(c)}
                                    >
                                        <b>{c.id}</b> - {c.nome}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Obs:</label>
                    <input 
                        type="text" 
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                        disabled={currentOrderStatus === PedidoStatus.Pago}
                        className="w-full border border-gray-300 rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" 
                        placeholder="Observações do pedido..."
                    />
                </div>
            </div>

            {/* Product Section */}
            <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col min-h-0 border border-gray-200 overflow-hidden">
                <div className="p-2 border-b border-gray-200 bg-gray-50 flex gap-2 items-center relative z-20">
                     <div className="flex-1 flex gap-2">
                        <input 
                            type="text" 
                            autoFocus={currentOrderStatus !== PedidoStatus.Pago}
                            disabled={currentOrderStatus === PedidoStatus.Pago}
                            placeholder="Adicionar Produto (Nome ou Código)..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="flex-1 border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm disabled:bg-gray-100"
                        />
                        <button 
                            onClick={() => setIsProductModalOpen(true)}
                            disabled={currentOrderStatus === PedidoStatus.Pago}
                            className="px-4 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            <Search size={16} /> Buscar
                        </button>
                     </div>
                     
                     {productSearch && (
                        <div className="absolute top-full left-2 right-2 bg-white border border-gray-200 shadow-xl max-h-60 overflow-auto z-40 mt-1 rounded-md">
                            {filteredProducts.map(p => (
                                <div 
                                    key={p.id} 
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between items-center group"
                                    onClick={() => handleAddItem(p)}
                                >
                                    <div>
                                        <div className="font-bold text-gray-800">{p.nome}</div>
                                        <div className="text-xs text-gray-500">Cód: {p.codigoInterno} | Estoque: 99 {p.unidadeMedida}</div>
                                    </div>
                                    <div className="text-blue-600 font-bold">R$ {p.preco.toFixed(2)}</div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm">Nenhum produto encontrado</div>
                            )}
                        </div>
                     )}
                </div>

                {/* Data Grid */}
                <div className="flex-1 overflow-auto bg-white">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 sticky top-0 shadow-sm z-10 border-b border-gray-200">
                            <tr>
                                <th className="p-2 text-xs font-bold text-gray-600 uppercase w-20">Código</th>
                                <th className="p-2 text-xs font-bold text-gray-600 uppercase">Produto</th>
                                <th className="p-2 text-xs font-bold text-gray-600 uppercase w-20 text-center">Qtd</th>
                                <th className="p-2 text-xs font-bold text-gray-600 uppercase w-28 text-right">Preço Unit.</th>
                                <th className="p-2 text-xs font-bold text-gray-600 uppercase w-28 text-right">Total</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((item, index) => {
                                const mainItemTotal = item.produto.preco * item.quantidade;
                                let addonsTotal = 0;
                                if(item.adicionais) {
                                  item.adicionais.forEach(a => addonsTotal += a.precoCobrado * item.quantidade);
                                }
                                const lineTotal = mainItemTotal + addonsTotal;

                                return (
                                <React.Fragment key={`${item.produto.id}-${index}`}>
                                <tr className="hover:bg-blue-50 transition-colors">
                                    <td className="p-2 text-sm text-gray-500">{item.produto.codigoInterno}</td>
                                    <td className="p-2 text-sm font-medium text-gray-800">
                                      {item.produto.nome}
                                      {item.adicionais && item.adicionais.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                          {item.adicionais.map((addon, idx) => (
                                            <div key={idx} className="text-xs text-gray-500 flex items-center gap-1.5 ml-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 block"></span>
                                              <span>{addon.nome}</span>
                                              <span className="text-gray-400 font-mono">
                                                {addon.precoCobrado === 0 ? "(Grátis)" : `(+ R$ ${addon.precoCobrado.toFixed(2)})`}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2 text-sm text-center">
                                        <input 
                                            type="number" 
                                            value={item.quantidade} 
                                            disabled={currentOrderStatus === PedidoStatus.Pago}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if(val > 0) {
                                                    setCart(prev => prev.map((it, i) => i === index ? {...it, quantidade: val} : it));
                                                }
                                            }}
                                            className="w-16 border rounded text-center p-1 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                                        />
                                    </td>
                                    <td className="p-2 text-sm text-right text-gray-600">R$ {item.produto.preco.toFixed(2)}</td>
                                    <td className="p-2 text-sm font-bold text-right text-blue-700">R$ {lineTotal.toFixed(2)}</td>
                                    <td className="p-2 text-center">
                                        {currentOrderStatus !== PedidoStatus.Pago && (
                                            <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                </React.Fragment>
                            )})}
                             {cart.length === 0 && (
                                <tr>
                                   <td colSpan={6} className="p-12 text-center text-gray-300 flex flex-col items-center justify-center h-48 w-full absolute">
                                      <ShoppingBag size={48} className="mb-2 opacity-20"/>
                                      Use a busca acima para adicionar produtos
                                   </td>
                                </tr>
                             )}
                             <tr className="h-2"></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Right Sidebar Totals */}
        <div className="w-80 flex flex-col gap-4">
             <div className="bg-white p-6 rounded-lg shadow-sm h-32 flex flex-col justify-center items-end border border-gray-200">
                  <span className="text-gray-500 font-medium uppercase text-xs mb-1">Total Líquido</span>
                  <span className="text-4xl font-extrabold text-blue-700">R$ {cartTotal.toFixed(2)}</span>
             </div>

             <div className="bg-white p-4 rounded-lg shadow-sm flex-1 border border-gray-200 space-y-2 flex flex-col">
                 <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Calculator size={18} /> Resumo Financeiro
                 </h3>
                 <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Subtotal</span>
                     <span className="font-medium">R$ {cartTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Descontos</span>
                     <span className="font-medium text-red-500">R$ 0,00</span>
                 </div>
                 <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Acrescimos</span>
                     <span className="font-medium text-green-500">R$ 0,00</span>
                 </div>
                 
                 {/* Payments List (If any exist) */}
                 {existingPayments.length > 0 && (
                    <div className="border-t border-gray-100 mt-2 pt-2">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Pagamentos Efetuados</p>
                        {existingPayments.map((p, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-green-700 mb-1">
                                <span>{p.formaPagamentoNome}</span>
                                <span>R$ {p.valor.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                 )}

                 <div className="flex-1"></div>

                 <div className="border-t border-gray-100 mt-2 pt-4">
                     <div className="flex justify-between font-bold text-lg">
                         <span>Total</span>
                         <span>R$ {cartTotal.toFixed(2)}</span>
                     </div>
                     {totalPaid > 0 && (
                        <div className="flex justify-between text-sm font-medium text-green-600 mt-1">
                            <span>Pago</span>
                            <span>- R$ {totalPaid.toFixed(2)}</span>
                        </div>
                     )}
                     {totalPaid > 0 && remainingTotal > 0 && (
                        <div className="flex justify-between text-lg font-bold text-blue-600 mt-2 pt-2 border-t border-dashed">
                            <span>Falta</span>
                            <span>R$ {remainingTotal.toFixed(2)}</span>
                        </div>
                     )}
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default POS;