
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Produto, PedidoItem, Cliente, TipoAtendimento, PedidoStatus, Pedido, FormaPagamento, ConfiguracaoAdicional, PedidoItemAdicional, Pagamento, Usuario, Bairro } from '../types';
import { db } from '../services/mockDb';
import { 
  Search, Plus, Trash2, User, Truck, ShoppingBag, 
  ClipboardList, Zap, Save, X, Calculator, Calendar, CreditCard, Banknote, MapPin, Package, CheckSquare, Square, Edit, AlertCircle, RefreshCcw, Printer, Wallet, Minus, PlusCircle, MinusCircle
} from 'lucide-react';

// Helper for accent-insensitive search
const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// --- PRINTABLE RECEIPT COMPONENT ---
interface PrintableData {
    type: 'ORDER' | 'ITEM';
    orderId: string | number;
    date: string;
    clientName: string;
    clientAddress?: string;
    deliveryType: string;
    items: PedidoItem[]; // If ITEM type, this contains only the single item
    total: number;
    payments: Pagamento[];
    obs?: string;
}

const PrintableReceipt = ({ data }: { data: PrintableData | null }) => {
    if (!data) return null;

    // Use Portal to render outside #root, ensuring we can hide #root completely during print
    return createPortal(
        <div id="printable-content" className="fixed inset-0 bg-white z-[9999] p-4 text-black font-mono text-sm leading-tight">
            <style>{`
                @media print {
                    /* Hide the main application root */
                    #root { display: none !important; }
                    
                    /* Ensure this container is visible */
                    #printable-content { 
                        display: block !important; 
                        position: fixed; 
                        top: 0; 
                        left: 0; 
                        width: 100%; 
                        height: 100%; 
                        background: white; 
                        z-index: 9999;
                    }
                    
                    /* Reset page margins */
                    @page { margin: 0; size: auto; }
                }
                
                /* Hide this container on screen */
                @media screen {
                    #printable-content { display: none !important; }
                }
            `}</style>
            
            <div className="max-w-[80mm] mx-auto border-b-2 border-dashed border-black pb-2 mb-2 text-center pt-4">
                <h1 className="text-xl font-bold uppercase">DeliverySys</h1>
                <p className="text-xs">Rua Exemplo, 123 - Centro</p>
                <p className="text-xs">CNPJ: 00.000.000/0001-00</p>
                <p className="text-xs">{new Date(data.date).toLocaleString()}</p>
            </div>

            <div className="max-w-[80mm] mx-auto mb-2 border-b border-dashed border-black pb-2">
                <p className="font-bold text-lg">#{data.orderId} - {data.deliveryType.toUpperCase()}</p>
                <p>Cliente: {data.clientName}</p>
                {data.clientAddress && <p className="text-xs">{data.clientAddress}</p>}
                {data.type === 'ITEM' && <p className="font-bold mt-2 text-center text-lg border-2 border-black p-1">*** COZINHA / SEPARAÇÃO ***</p>}
            </div>

            <div className="max-w-[80mm] mx-auto mb-2 border-b border-dashed border-black pb-2">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs border-b border-black">
                            <th className="w-8">Qtd</th>
                            <th>Item</th>
                            {data.type === 'ORDER' && <th className="text-right">Total</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, idx) => {
                             const itemTotal = item.produto.preco * item.quantidade + (item.adicionais?.reduce((acc, a) => acc + (a.precoCobrado * item.quantidade), 0) || 0);
                             return (
                                <tr key={idx} className="align-top">
                                    <td className="py-1 font-bold align-top">{item.quantidade}x</td>
                                    <td className="py-1 align-top">
                                        <div className="font-bold">{item.produto.nome}</div>
                                        {item.adicionais && item.adicionais.length > 0 && (
                                            <div className="text-xs pl-2 mt-0.5">
                                                {item.adicionais.map((add, i) => (
                                                    <div key={i}>+ {add.nome}</div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    {data.type === 'ORDER' && (
                                        <td className="py-1 text-right whitespace-nowrap align-top">
                                            {itemTotal.toFixed(2)}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {data.type === 'ORDER' && (
                <div className="max-w-[80mm] mx-auto">
                    <div className="flex justify-between font-bold text-lg mb-2">
                        <span>TOTAL</span>
                        <span>R$ {data.total.toFixed(2)}</span>
                    </div>

                    <div className="border-t border-dashed border-black pt-2 mb-4">
                        <p className="font-bold text-xs uppercase mb-1">Pagamentos</p>
                        {data.payments.length > 0 ? (
                            data.payments.map((p, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span>{p.formaPagamentoNome}</span>
                                    <span>R$ {p.valor.toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs italic">Nenhum pagamento registrado.</p>
                        )}
                    </div>
                </div>
            )}
            
            {data.obs && (
                 <div className="max-w-[80mm] mx-auto border-t border-dashed border-black pt-2 mb-2">
                    <p className="font-bold text-xs">OBSERVAÇÕES:</p>
                    <p className="text-sm">{data.obs}</p>
                 </div>
            )}

            <div className="max-w-[80mm] mx-auto text-center text-xs mt-6 border-t border-black pt-2">
                <p>Obrigado pela preferência!</p>
                <p>www.deliverysys.com.br</p>
            </div>
        </div>,
        document.body
    );
};

interface POSProps {
    user: Usuario;
}

const POS: React.FC<POSProps> = ({ user }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [filterStatus, setFilterStatus] = useState<'Todos' | PedidoStatus>('Todos');
  
  // --- Data Source State ---
  const [availableProducts, setAvailableProducts] = useState<Produto[]>([]);
  const [availableClients, setAvailableClients] = useState<Cliente[]>([]);
  const [availableBairros, setAvailableBairros] = useState<Bairro[]>([]);
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
  
  // Print State
  const [printData, setPrintData] = useState<PrintableData | null>(null);

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
  const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [paymentInputValue, setPaymentInputValue] = useState<string>(''); 
  const [usingCredit, setUsingCredit] = useState(false);

  // --- Data Loading ---
  const refreshData = () => {
    setOrders(db.getPedidos());
    setAvailableProducts(db.getProdutos());
    setAvailableClients(db.getClientes());
    setAvailableBairros(db.getBairros());
    setPaymentMethods(db.getFormasPagamento().filter(f => f.ativo));
    setAddonConfigs(db.getConfiguracoesAdicionais());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Print Trigger
  useEffect(() => {
      if (printData) {
          // Small delay to allow React Portal to render the print component in DOM
          const timer = setTimeout(() => {
              window.print();
              setPrintData(null); // Reset after printing
          }, 300);
          return () => clearTimeout(timer);
      }
  }, [printData]);

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
           handleCancelForm();
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
    setAddonQuantities({});

    setSelectedPaymentMethodId(null);
    setPaymentInputValue('');
    setUsingCredit(false);
    
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
    setSelectedClient(client || (order.clienteId ? { id: order.clienteId, nome: order.clienteNome || 'Cliente', cpfCnpj: '', telefone: '', endereco: '', numero: '', complemento: '', bairro: '', tipoPessoa: 'Física', saldoCredito: 0 } : null));
    
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
      setAddonQuantities({});
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

    // Separate items into two groups: Premium (Always Paid) and Standard (Count towards free limit)
    let standardItemsCount = 0;
    
    // Reconstruct list of selected items based on quantities, prioritizing premium status if needed?
    // Actually, we just need to process them.
    // Iterating the config order ensures deterministic processing (e.g. menu order)
    
    const itemsToProcess: {product: Produto, rule: any}[] = [];

    config.itens.forEach(rule => {
        const qty = addonQuantities[rule.produtoComplementoId] || 0;
        for(let i=0; i<qty; i++) {
             const addonProduct = availableProducts.find(p => p.id === rule.produtoComplementoId);
             if (addonProduct) {
                 itemsToProcess.push({ product: addonProduct, rule });
             }
        }
    });
    
    // 1. Process Premium (Always Paid) items first
    itemsToProcess.forEach(item => {
        if (item.rule.cobrarSempre) {
             finalAddons.push({
                produtoId: item.product.id,
                nome: item.product.nome,
                precoOriginal: item.product.preco,
                precoCobrado: item.product.preco // Full price
             });
        }
    });

    // 2. Process Standard items (apply free limit)
    itemsToProcess.forEach(item => {
        if (!item.rule.cobrarSempre) {
             let price = item.product.preco;
             if (standardItemsCount < config.cobrarApartirDe) {
                price = 0; // Free
             }
             standardItemsCount++;
             
             finalAddons.push({
                produtoId: item.product.id,
                nome: item.product.nome,
                precoOriginal: item.product.preco,
                precoCobrado: price
             });
        }
    });

    addItemToCart(product, 1, finalAddons);
    setIsAddonModalOpen(false);
    setPendingAddonProduct(null);
    setAddonQuantities({});
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

    // --- AUTOMATIC DELIVERY FEE LOGIC ---
    if (currentOrderType === TipoAtendimento.Delivery && client.bairroId) {
        const bairro = availableBairros.find(b => b.id === client.bairroId);
        
        // Remove previous Fee if exists to update
        let newCart = cart.filter(item => item.produto.codigoInterno !== 'TAXA');

        if (bairro && bairro.taxaEntrega > 0) {
            // Create a virtual product for the Fee
            const feeProduct: Produto = {
                id: -999, // Special ID for fee
                ativo: true,
                tipo: 'Principal',
                codigoInterno: 'TAXA',
                codigoBarras: '',
                nome: `Taxa de Entrega - ${bairro.nome}`,
                preco: bairro.taxaEntrega,
                custo: 0,
                unidadeMedida: 'SV',
                grupoProdutoId: 0
            };
            
            // Add to cart
            newCart.push({
                produto: feeProduct,
                quantidade: 1
            });
            setCart(newCart);
        }
    }
  };

  // --- PRINTING HANDLERS ---
  const handlePrintOrder = () => {
      setPrintData({
          type: 'ORDER',
          orderId: editingOrderId || "NOVO",
          date: new Date().toISOString(),
          clientName: selectedClient?.nome || 'Consumidor Final',
          clientAddress: selectedClient ? `${selectedClient.endereco}, ${selectedClient.numero} - ${selectedClient.bairro}` : '',
          deliveryType: currentOrderType,
          items: cart,
          total: calculateCartTotal(),
          payments: existingPayments,
          obs: observation
      });
  };

  const handlePrintItem = (item: PedidoItem) => {
      setPrintData({
          type: 'ITEM',
          orderId: editingOrderId || "NOVO",
          date: new Date().toISOString(),
          clientName: selectedClient?.nome || 'Consumidor Final',
          deliveryType: currentOrderType,
          items: [item],
          total: 0,
          payments: [],
          obs: observation
      });
  };

  // --- ACTIONS ---

  // 1. Save as Pending (For Delivery/Encomenda)
  const handleSavePendingOrder = () => {
    if (cart.length === 0 && currentOrderStatus !== PedidoStatus.Cancelado) {
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
        status: existingPayments.length > 0 ? currentOrderStatus : PedidoStatus.Pendente, 
        itens: cart,
        pagamentos: existingPayments 
    };

    db.savePedido(pedido);
    setEditingOrderId(id); // Ensure we stay on edit mode with valid ID
    refreshData();
    
    // UI Update logic with delay to prevent modal/alert conflicts
    setTimeout(() => {
        alert(`Pedido #${id} salvo com sucesso!`);
        
        // Offer to print
        if(confirm("Deseja imprimir o pedido?")) {
            // We set print data based on the saved state
            setPrintData({
                type: 'ORDER',
                orderId: id,
                date: pedido.data,
                clientName: selectedClient?.nome || 'Consumidor Final',
                clientAddress: selectedClient ? `${selectedClient.endereco}, ${selectedClient.numero} - ${selectedClient.bairro}` : '',
                deliveryType: currentOrderType,
                items: cart,
                total: total,
                payments: existingPayments,
                obs: observation
            });
        }
        
        // Always return to list to ensure clean state
        setView('list');
    }, 100);
  };

  // 2. Open Payment Modal (For Finalizing)
  const handleInitiatePayment = () => {
    // 1. Security Check: Active Session
    if (!db.getSessaoAberta(user.id)) {
        alert("ATENÇÃO: Você não possui um caixa aberto.\nPor favor, abra o caixa no menu 'Gestão de Caixa' antes de realizar vendas.");
        return;
    }

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
    setUsingCredit(false);
    
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
            setExistingPayments([...freshOrder.pagamentos]); // Ensure copy
            setCurrentOrderStatus(freshOrder.status);
        }
    }
    setIsPaymentModalOpen(false);
  };

  // 3. Register Partial Payment
  const handleRegisterPayment = () => {
     if (!usingCredit && !selectedPaymentMethodId) {
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

     // === CREDIT PAYMENT FLOW ===
     if (usingCredit) {
         if (amountToPay > (remaining + 0.01)) {
            alert(`O valor não pode ser maior que o restante (R$ ${remaining.toFixed(2)}).`);
            return;
         }
         try {
             db.usarCreditoCliente(orderId, amountToPay, user.id);
             alert("Crédito utilizado com sucesso!");
         } catch(e: any) {
             alert(e.message);
             return;
         }
     } 
     // === STANDARD PAYMENT FLOW ===
     else {
        const selectedMethod = paymentMethods.find(p => p.id === selectedPaymentMethodId);
        const isCash = selectedMethod?.nome.toLowerCase().includes('dinheiro');
        
        let realPayment = amountToPay;
        let change = 0;
        
        if (amountToPay > (remaining + 0.01)) {
            if (isCash) {
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

        // Execute DB Operation with Error Handling for Session & Balance
        try {
            // Pass change and brute value for strict checking
            db.addPagamento(orderId, newPayment, user.id, change, isCash ? amountToPay : 0);
        } catch(e: any) {
            if (e.message && e.message.includes("ERR_SALDO_INSUFICIENTE")) {
                // Logic for Credit Conversion
                if (selectedClient && confirm(`SALDO INSUFICIENTE PARA O TROCO DE R$ ${change.toFixed(2)}.\n\nDeseja transformar este troco em CRÉDITO para o cliente ${selectedClient.nome}?`)) {
                    try {
                        db.converterTrocoEmCredito(orderId, newPayment, change, user.id, amountToPay);
                        alert(`Troco convertido em crédito com sucesso!`);
                        // Success - fallthrough to refresh
                    } catch (err: any) {
                        alert("Erro ao gerar crédito: " + err.message);
                        return;
                    }
                } else {
                    alert("Operação cancelada. Verifique o saldo do caixa.");
                    return;
                }
            } else {
                alert(e.message);
                return;
            }
        }
        
        // Show Feedback
        if (change > 0) {
             alert(`Pagamento registrado!\n\nTROCO: R$ ${change.toFixed(2)}`);
        }
     }
     
     refreshData(); // Refresh background list immediately

     // Refresh Local State
     const updatedOrder = db.getPedidoById(orderId);
     if (updatedOrder) {
        setExistingPayments([...updatedOrder.pagamentos]); // Force new array ref
        setCurrentOrderStatus(updatedOrder.status);
        
        // Check if finished
        const newTotalPaid = updatedOrder.pagamentos.reduce((acc, p) => acc + p.valor, 0);
        const newRemaining = updatedOrder.total - newTotalPaid;
        
        if (newRemaining <= 0.01) {
            // Fully Paid - Close Modal FIRST
            setIsPaymentModalOpen(false);

            // Use setTimeout to ensure the modal closes visually before blocking alerts/print
            setTimeout(() => {
                alert(`Atendimento #${orderId} finalizado com sucesso!`);
                
                // Offer to print
                if(confirm("Deseja imprimir o comprovante?")) {
                    setPrintData({
                        type: 'ORDER',
                        orderId: orderId,
                        date: updatedOrder.data,
                        clientName: selectedClient?.nome || 'Consumidor Final',
                        clientAddress: selectedClient ? `${selectedClient.endereco}, ${selectedClient.numero} - ${selectedClient.bairro}` : '',
                        deliveryType: currentOrderType,
                        items: cart,
                        total: total,
                        payments: updatedOrder.pagamentos,
                        obs: observation
                    });
                }
                
                // Always return to list to ensure clean state
                setView('list');
            }, 100);
        } else {
            // Still Partial - Reset input to new remaining
            setPaymentInputValue(newRemaining.toFixed(2));
            // If was using credit, reset toggle to allow mixing payments
            if (usingCredit) setUsingCredit(false); 
        }
     }
  };

  // 4. Void Payment (Estorno)
  const handleVoidPayment = (paymentId: string, amount: number) => {
      if (!editingOrderId) return;
      
      if (confirm(`ATENÇÃO: Deseja estornar/cancelar este recebimento de R$ ${amount.toFixed(2)}?\nIsso lançará uma saída no caixa e o pedido voltará a ficar pendente.`)) {
          try {
              db.cancelPagamento(editingOrderId, paymentId, user.id);
              
              // 1. Manually update local state to remove the item immediately
              const updatedPayments = existingPayments.filter(p => p.id !== paymentId);
              setExistingPayments(updatedPayments);
              
              // 2. Update status immediately based on local calc to unblock buttons
              if (updatedPayments.length === 0) {
                  setCurrentOrderStatus(PedidoStatus.Pendente);
              } else {
                  // Partial check
                  const newPaid = updatedPayments.reduce((acc, p) => acc + p.valor, 0);
                  const total = calculateCartTotal();
                  if (newPaid < (total - 0.01)) {
                      setCurrentOrderStatus(PedidoStatus.Pendente);
                  }
              }

              // 3. Refresh global list background
              refreshData(); 
              
              alert("Pagamento estornado com sucesso.");
          } catch (e: any) {
              console.error(e);
              alert(e.message || "Erro ao estornar pagamento.");
          }
      }
  };

  // 5. Cancel Full Order
  const handleCancelFullOrder = () => {
      if (!editingOrderId) return;

      // Business Rule: Cannot cancel if there are active payments
      if (existingPayments.length > 0) {
          alert("NÃO É POSSÍVEL CANCELAR: Existem pagamentos vinculados a este pedido.\n\nPor favor, estorne todos os pagamentos na lista 'Resumo Financeiro' antes de cancelar o atendimento totalmente.");
          return;
      }

      if (confirm("Deseja CANCELAR este atendimento totalmente?\nIsso mudará o status para Cancelado.")) {
          const currentOrder = db.getPedidoById(editingOrderId);
          if (currentOrder) {
              const pedido: Pedido = {
                  ...currentOrder,
                  status: PedidoStatus.Cancelado
              };
              db.savePedido(pedido);
              refreshData();
              setView('list');
              alert("Atendimento cancelado com sucesso.");
          }
      }
  };

  const handleCancelForm = () => {
    setView('list');
  };

  const handleUpdateAddonQuantity = (id: number, delta: number) => {
    setAddonQuantities(prev => {
        const current = prev[id] || 0;
        const next = Math.max(0, current + delta);
        const newMap = { ...prev };
        if (next === 0) {
            delete newMap[id];
        } else {
            newMap[id] = next;
        }
        return newMap;
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

  // List Filter Logic
  const ordersListFiltered = orders.filter(o => {
     if (filterStatus === 'Todos') return true;
     return o.status === filterStatus;
  });

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
  
  const inputValueFloat = parseFloat(paymentInputValue) || 0;
  const potentialChange = (!usingCredit && isCashPayment && inputValueFloat > remainingTotal) ? inputValueFloat - remainingTotal : 0;

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
     if (currentOrderStatus === PedidoStatus.Cancelado) {
        return (
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-bold flex items-center gap-2">
                <AlertCircle size={16}/> ATENDIMENTO CANCELADO
            </div>
        )
     }

     // Scenario 1: Quick Sale (Always Immediate)
     if (currentOrderType === TipoAtendimento.VendaRapida) {
         return (
            <div className="flex gap-2">
                 <button onClick={handlePrintOrder} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 flex items-center gap-2" title="Imprimir Pedido">
                    <Printer size={18} />
                 </button>
                 {editingOrderId && (
                     <button 
                        onClick={handleCancelFullOrder} 
                        className={`px-4 py-1.5 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm ${existingPayments.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                     >
                        <Trash2 size={18} /> Cancelar Pedido
                     </button>
                 )}
                 <button onClick={handleInitiatePayment} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                    <Banknote size={18} /> Finalizar / Pagamento (F5)
                </button>
            </div>
         )
     }

     // Scenario 2: Other Types
     if (editingOrderId && currentOrderStatus === PedidoStatus.Pendente) {
         return (
             <div className="flex gap-2">
                 <button onClick={handlePrintOrder} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 flex items-center gap-2" title="Imprimir Pedido">
                    <Printer size={18} />
                 </button>
                 <button 
                    onClick={handleCancelFullOrder} 
                    className={`px-4 py-1.5 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm ${existingPayments.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                 >
                    <Trash2 size={18} /> Cancelar Pedido
                 </button>
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
            <div className="flex gap-2 items-center">
                <button onClick={handlePrintOrder} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 flex items-center gap-2" title="Imprimir Pedido">
                    <Printer size={18} />
                </button>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-bold flex items-center gap-2">
                    <CheckSquare size={16}/> Pedido Pago / Fechado
                </div>
                <button 
                    onClick={handleCancelFullOrder} 
                    className={`px-3 py-1 text-xs font-bold rounded border ${existingPayments.length > 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200 border-red-200'}`}
                >
                     Cancelar
                 </button>
            </div>
         )
     }
  };

  const totalSelectedAddons = Object.values(addonQuantities).reduce((a: number, b: number) => a + b, 0);

  // Main Render using persistent PrintableReceipt
  return (
    <>
      <PrintableReceipt data={printData} />
      {/* ... Rest of existing JSX logic (no changes needed in layout, just state handling above) ... */}
      {view === 'list' ? (
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
                  {[
                      { label: 'Todos', status: 'Todos' },
                      { label: 'Pendentes / Abertos', status: PedidoStatus.Pendente },
                      { label: 'Pagos', status: PedidoStatus.Pago },
                      { label: 'Cancelados', status: PedidoStatus.Cancelado }
                  ].map(filter => (
                      <button 
                          key={filter.status}
                          onClick={() => setFilterStatus(filter.status as any)}
                          className={`px-3 py-1 text-xs rounded-full font-bold transition-colors ${
                              filterStatus === filter.status 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                      >
                          {filter.label}
                      </button>
                  ))}
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
                {ordersListFiltered.map(order => {
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
                {ordersListFiltered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400">Nenhum atendimento encontrado com este filtro.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-7rem)] bg-gray-100 -m-6 p-4 relative">
          {/* Addon Modal */}
          {isAddonModalOpen && pendingAddonProduct && (
            <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col animate-in zoom-in duration-200 max-h-[85vh]">
                  <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800">{pendingAddonProduct.product.nome}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Selecione a quantidade dos itens. <span className="text-green-600 font-bold">Grátis até {pendingAddonProduct.config.cobrarApartirDe} itens (exceto Premium).</span>
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {pendingAddonProduct.config.itens.map((rule) => {
                            const addon = availableProducts.find(x => x.id === rule.produtoComplementoId);
                            if (!addon) return null;
                            
                            const quantity = addonQuantities[addon.id] || 0;
                            
                            return (
                                <div 
                                    key={addon.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all select-none ${
                                        quantity > 0 
                                        ? 'bg-blue-50 border-blue-500 shadow-sm' 
                                        : 'bg-white border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${quantity > 0 ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {addon.nome}
                                            </span>
                                            {rule.cobrarSempre && (
                                                <span className="text-xs font-bold text-orange-600 uppercase">
                                                    Premium (Sempre Pago)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            {rule.cobrarSempre ? (
                                                <span className="text-orange-700 font-bold text-sm">+ R$ {addon.preco.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-gray-500 text-xs font-medium">+ R$ {addon.preco.toFixed(2)} (Se exceder)</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-0.5 shadow-sm">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleUpdateAddonQuantity(addon.id, -1); }}
                                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${quantity > 0 ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                                disabled={quantity === 0}
                                            >
                                                <Minus size={16} strokeWidth={3} />
                                            </button>
                                            
                                            <span className="w-8 text-center font-bold text-lg text-gray-800">{quantity}</span>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleUpdateAddonQuantity(addon.id, 1); }}
                                                className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center"
                                            >
                                                <Plus size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
                      <div className="text-sm font-medium text-gray-500">
                          Total de Itens: <span className="text-gray-900 font-bold text-lg">{totalSelectedAddons}</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setIsAddonModalOpen(false); setPendingAddonProduct(null); setAddonQuantities({}); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white">Cancelar</button>
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

          {/* Payment Modal Overlay */}
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

                        {/* Credit Tab */}
                        {selectedClient && (selectedClient.saldoCredito || 0) > 0 && (
                             <div 
                                onClick={() => {
                                    setUsingCredit(!usingCredit);
                                    if(!usingCredit) { // activating
                                        setSelectedPaymentMethodId(null);
                                    }
                                }}
                                className={`p-4 rounded-lg border-2 cursor-pointer flex justify-between items-center transition-all ${
                                    usingCredit
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                }`}
                             >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${usingCredit ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">Usar Crédito Cliente</div>
                                        <div className="text-xs text-gray-500">Saldo Disponível: R$ {selectedClient.saldoCredito?.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${usingCredit ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                                    {usingCredit && <CheckSquare size={12} className="text-white"/>}
                                </div>
                             </div>
                        )}

                        {!usingCredit && (
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
                        )}

                        {/* Value Input (Editable for ALL methods) */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Valor a Processar ({usingCredit ? 'Crédito' : (selectedMethodObj?.nome || '...')})
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
                            {isCashPayment && !usingCredit && (
                                <div className="mt-3 flex justify-between items-center text-sm">
                                    <span className="font-bold text-gray-500">Troco Estimado:</span>
                                    <span className={`font-bold text-xl ${potentialChange > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        R$ {potentialChange.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            
                            {/* Credit Limit Check */}
                            {usingCredit && selectedClient && parseFloat(paymentInputValue) > (selectedClient.saldoCredito || 0) && (
                                <div className="mt-2 text-xs text-red-500 font-bold">
                                    Atenção: Valor maior que o saldo de crédito disponível.
                                </div>
                            )}

                            {(!isCashPayment || usingCredit) && parseFloat(paymentInputValue) > remainingTotal && (
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
                    onClick={handleCancelForm} 
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2 border border-gray-200 transition-colors"
                >
                  <X size={18} /> Voltar
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
                            <input type="text" value={`${user.id} - ${user.nome.split(' ')[0]}`} disabled className="w-full bg-gray-100 border border-gray-300 rounded p-1.5 text-sm text-gray-700" />
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
                                    disabled={currentOrderStatus === PedidoStatus.Pago || currentOrderStatus === PedidoStatus.Cancelado}
                                    className={`w-full border border-gray-300 rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${selectedClient ? 'bg-blue-50 border-blue-400 font-bold text-blue-800' : 'bg-white'}`}
                                />
                                <button 
                                    onClick={() => setIsClientModalOpen(true)}
                                    disabled={currentOrderStatus === PedidoStatus.Pago || currentOrderStatus === PedidoStatus.Cancelado}
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
                            disabled={currentOrderStatus === PedidoStatus.Pago || currentOrderStatus === PedidoStatus.Cancelado}
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
                                autoFocus={currentOrderStatus !== PedidoStatus.Pago && currentOrderStatus !== PedidoStatus.Cancelado}
                                disabled={currentOrderStatus === PedidoStatus.Pago || currentOrderStatus === PedidoStatus.Cancelado}
                                placeholder="Adicionar Produto (Nome ou Código)..." 
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="flex-1 border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm disabled:bg-gray-100"
                            />
                            <button 
                                onClick={() => setIsProductModalOpen(true)}
                                disabled={currentOrderStatus === PedidoStatus.Pago || currentOrderStatus === PedidoStatus.Cancelado}
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
                                    <tr className="hover:bg-blue-50 transition-colors group">
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
                                                disabled={currentOrderStatus === PedidoStatus.Pago || currentOrderStatus === PedidoStatus.Cancelado}
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
                                        <td className="p-2 text-center flex items-center justify-center gap-1">
                                            <button 
                                                onClick={() => handlePrintItem(item)}
                                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Imprimir Etiqueta do Item"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            {currentOrderStatus !== PedidoStatus.Pago && currentOrderStatus !== PedidoStatus.Cancelado && (
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
                      <span className={`text-4xl font-extrabold ${currentOrderStatus === PedidoStatus.Cancelado ? 'text-gray-400 line-through' : 'text-blue-700'}`}>R$ {cartTotal.toFixed(2)}</span>
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
                                <div key={idx} className="flex justify-between items-center text-xs text-green-700 mb-2 group bg-green-50 p-1.5 rounded">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{p.formaPagamentoNome}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(p.data).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">R$ {p.valor.toFixed(2)}</span>
                                        {(currentOrderStatus !== PedidoStatus.Cancelado) && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleVoidPayment(p.id, p.valor); }}
                                                className="text-red-400 hover:text-red-600 transition-opacity"
                                                title="Estornar / Cancelar Pagamento"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
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
      )}
    </>
  );
};

export default POS;
