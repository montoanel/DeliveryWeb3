
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/mockDb';
import { 
  Produto, GrupoProduto, Pedido, PedidoItem, 
  PedidoItemAdicional, ConfiguracaoAdicional, FormaPagamento,
  TipoAtendimento, PedidoStatus, StatusCozinha, Pagamento, Usuario, Cliente, Bairro 
} from '../types';
import { 
  Search, ShoppingCart, Minus, Plus, Trash2, X, 
  ChevronRight, CreditCard, User, CheckCircle, ArrowLeft,
  Image as ImageIcon, Utensils, Truck, ShoppingBag, Zap, UserPlus, Calculator, Banknote, Coins
} from 'lucide-react';

// --- Internal Component: Printable Receipt (Shared Logic with POS mostly) ---
const TouchReceipt = ({ data }: { data: any }) => {
    if (!data) return null;
    return createPortal(
        <div className="fixed inset-0 bg-white z-[9999] p-4 text-black font-mono text-sm leading-tight flex flex-col items-center justify-center">
            <style>{`@media print { #root { display: none !important; } .touch-print { display: block !important; width: 80mm; margin: 0 auto; } } @media screen { .touch-print { display: none; } }`}</style>
            <div className="touch-print">
                <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                    <h1 className="text-xl font-bold uppercase">DeliverySys</h1>
                    <p className="text-xs">{new Date().toLocaleString()}</p>
                    <h2 className="text-lg font-bold mt-2">PEDIDO #{data.orderId}</h2>
                    <p className="font-bold">{data.type.toUpperCase()}</p>
                </div>
                
                <div className="mb-2 border-b border-dashed border-black pb-2">
                    <p><b>Cliente:</b> {data.clientName}</p>
                    {data.clientAddress && <p className="text-xs">{data.clientAddress}</p>}
                </div>

                <table className="w-full text-left mb-2">
                    <tbody>
                    {data.items.map((item: any, idx: number) => (
                        <tr key={idx} className="align-top">
                            <td className="w-8 font-bold">{item.quantidade}x</td>
                            <td>
                                {item.produto.nome}
                                {item.adicionais?.map((add:any, i:number) => (
                                    <div key={i} className="text-xs ml-2">+ {add.nome}</div>
                                ))}
                            </td>
                            <td className="text-right">
                                {((item.produto.preco * item.quantidade) + (item.adicionais?.reduce((a:number,b:any)=>a+b.precoCobrado*item.quantidade,0)||0)).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="border-t border-dashed border-black pt-2 mb-2">
                    <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL</span>
                        <span>R$ {data.total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Delivery Payment Info Block */}
                {data.type === 'Delivery' && data.deliveryMethod && (
                    <div className="mb-4 border-2 border-black p-2 bg-gray-50 mt-2">
                        <p className="font-bold text-center uppercase border-b border-black mb-1">A Cobrar na Entrega</p>
                        <div className="flex justify-between text-sm mt-1">
                            <span>Forma:</span>
                            <span className="font-bold">{data.deliveryMethod}</span>
                        </div>
                        {data.deliveryChangeTo > 0 && (
                            <div className="flex justify-between text-sm mt-1 font-bold">
                                <span>LEVAR TROCO P/:</span>
                                <span>R$ {data.deliveryChangeTo.toFixed(2)}</span>
                            </div>
                        )}
                        {data.deliveryChangeTo > 0 && (
                            <div className="text-center text-xs mt-1">
                                (Troco: R$ {(data.deliveryChangeTo - data.total).toFixed(2)})
                            </div>
                        )}
                    </div>
                )}

                {/* Standard Payment Block (For non-delivery or prepaid) */}
                {data.type !== 'Delivery' && (
                    <div className="mb-4">
                        <p className="font-bold text-xs uppercase mb-1">Pagamento / Troco</p>
                        {data.payments.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span>{p.methodName}</span>
                                <span>R$ {p.value.toFixed(2)}</span>
                            </div>
                        ))}
                        {data.change > 0 && (
                            <div className="flex justify-between text-xs font-bold mt-1">
                                <span>TROCO ENTREGUE:</span>
                                <span>R$ {data.change.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )}

                <p className="text-center text-xs mt-4">Obrigado pela preferência!</p>
            </div>
        </div>,
        document.body
    );
};

interface TouchSalesProps {
    user: Usuario;
}

const TouchSales: React.FC<TouchSalesProps> = ({ user }) => {
    // --- Data ---
    const [products, setProducts] = useState<Produto[]>([]);
    const [groups, setGroups] = useState<GrupoProduto[]>([]);
    const [clients, setClients] = useState<Cliente[]>([]);
    const [bairros, setBairros] = useState<Bairro[]>([]);
    const [addonConfigs, setAddonConfigs] = useState<ConfiguracaoAdicional[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);

    // --- UI State ---
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'ALL'>('ALL');
    const [cart, setCart] = useState<PedidoItem[]>([]);
    
    // Header States
    const [orderType, setOrderType] = useState<TipoAtendimento>(TipoAtendimento.VendaRapida);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    
    // --- Modal States ---
    const [addonModalData, setAddonModalData] = useState<{product: Produto, config: ConfiguracaoAdicional} | null>(null);
    const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
    
    const [checkoutStep, setCheckoutStep] = useState<'NONE' | 'CLIENT_SEARCH' | 'PAYMENT' | 'SUCCESS'>('NONE');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    
    // Payment Logic State
    const [currentPayments, setCurrentPayments] = useState<{methodId: number, methodName: string, value: number}[]>([]);
    const [numpadValue, setNumpadValue] = useState('');
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
    const [changeAmount, setChangeAmount] = useState(0); // Troco calculado
    const [printData, setPrintData] = useState<any>(null);

    useEffect(() => {
        setProducts(db.getProdutos());
        setGroups(db.getGrupos());
        setClients(db.getClientes());
        setBairros(db.getBairros());
        setAddonConfigs(db.getConfiguracoesAdicionais());
        setPaymentMethods(db.getFormasPagamento().filter(p => p.ativo));
    }, []);

    // Print Trigger
    useEffect(() => {
        if (printData) {
            setTimeout(() => {
                window.print();
                setPrintData(null);
            }, 500);
        }
    }, [printData]);

    // --- Helpers ---
    const filteredProducts = products.filter(p => {
        if (!p.ativo || p.tipo !== 'Principal') return false;
        if (!p.disponivelTouch) return false;
        if (selectedGroupId !== 'ALL' && p.grupoProdutoId !== selectedGroupId) return false;
        return true;
    });

    const filteredClients = clients.filter(c => 
        c.nome.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
        c.cpfCnpj.includes(clientSearchTerm) ||
        c.telefone.includes(clientSearchTerm)
    );

    const cartTotal = cart.reduce((acc, item) => {
        let itemTotal = item.produto.preco * item.quantidade;
        if (item.adicionais) {
            item.adicionais.forEach(a => itemTotal += a.precoCobrado * item.quantidade);
        }
        return acc + itemTotal;
    }, 0);

    const totalPaid = currentPayments.reduce((acc, p) => acc + p.value, 0);
    const remaining = Math.max(0, cartTotal - totalPaid);

    // --- Actions ---

    const handleProductClick = (product: Produto) => {
        const config = addonConfigs.find(c => c.produtoPrincipalId === product.id);
        if (config) {
            setAddonModalData({ product, config });
            setAddonQuantities({});
        } else {
            addToCart(product, 1);
        }
    };

    const addToCart = (product: Produto, qty: number, addons?: PedidoItemAdicional[]) => {
        setCart(prev => {
            if (addons && addons.length > 0) {
                return [...prev, { produto: product, quantidade: qty, adicionais: addons }];
            }
            const existing = prev.find(i => i.produto.id === product.id && (!i.adicionais || i.adicionais.length === 0));
            if (existing) {
                return prev.map(i => i === existing ? { ...i, quantidade: i.quantidade + qty } : i);
            }
            return [...prev, { produto: product, quantidade: qty }];
        });
    };

    const handleConfirmAddons = () => {
        if (!addonModalData) return;
        const { product, config } = addonModalData;
        const finalAddons: PedidoItemAdicional[] = [];
        let standardCount = 0;

        const selection: {product: Produto, rule: any}[] = [];
        config.itens.forEach(rule => {
            const qty = addonQuantities[rule.produtoComplementoId] || 0;
            for(let i=0; i<qty; i++) {
                const p = products.find(prod => prod.id === rule.produtoComplementoId);
                if(p) selection.push({ product: p, rule });
            }
        });

        selection.forEach(item => {
            if (item.rule.cobrarSempre) {
                finalAddons.push({
                    produtoId: item.product.id,
                    nome: item.product.nome,
                    precoOriginal: item.product.preco,
                    precoCobrado: item.product.preco
                });
            } else {
                let price = item.product.preco;
                if (standardCount < config.cobrarApartirDe) price = 0;
                standardCount++;
                finalAddons.push({
                    produtoId: item.product.id,
                    nome: item.product.nome,
                    precoOriginal: item.product.preco,
                    precoCobrado: price
                });
            }
        });

        addToCart(product, 1, finalAddons);
        setAddonModalData(null);
    };

    const handleRemoveItem = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const handleSelectClient = (client: Cliente | null) => {
        setSelectedClient(client);
        setCheckoutStep('NONE');

        // Logic for Automatic Delivery Fee
        if (orderType === TipoAtendimento.Delivery && client && client.bairroId) {
            const bairro = bairros.find(b => b.id === client.bairroId);
            
            // Remove previous TAXA if exists
            let newCart = cart.filter(item => item.produto.codigoInterno !== 'TAXA');

            if (bairro && bairro.taxaEntrega > 0) {
                const feeProduct: Produto = {
                    id: -999,
                    ativo: true,
                    tipo: 'Principal',
                    setor: 'Nenhum',
                    codigoInterno: 'TAXA',
                    codigoBarras: '',
                    nome: `Taxa de Entrega - ${bairro.nome}`,
                    preco: bairro.taxaEntrega,
                    custo: 0,
                    unidadeMedida: 'SV',
                    grupoProdutoId: 0,
                    disponivelTouch: true
                };
                newCart.push({ produto: feeProduct, quantidade: 1 });
                setCart(newCart);
            }
        } else if (!client) {
            // If clearing client, remove tax
             setCart(prev => prev.filter(item => item.produto.codigoInterno !== 'TAXA'));
        }
    };

    // --- Payment Logic ---

    const handleNumpadClick = (val: string) => {
        if (val === 'back') {
            setNumpadValue(prev => prev.slice(0, -1));
        } else if (val === 'clear') {
            setNumpadValue('');
        } else {
            setNumpadValue(prev => prev + val);
        }
    };

    const handleAddPayment = () => {
        // --- DIFFERENTIATED LOGIC FOR DELIVERY ---
        if (orderType === TipoAtendimento.Delivery) {
            // In delivery, we just select ONE method as "Metadata"
            if (!selectedMethodId) { alert("Selecione a forma de pagamento prevista."); return; }
            const method = paymentMethods.find(m => m.id === selectedMethodId);
            if (!method) return;

            // Prepare Order Data
            const orderId = Math.floor(Math.random() * 100000) + 1000;
            const now = new Date().toISOString();
            
            const isCash = method.nome.toLowerCase().includes('dinheiro');
            let trocoPara = 0;
            
            if (isCash) {
                // Replace comma if present (phys keyboard)
                const sanitized = numpadValue.replace(',', '.');
                trocoPara = parseFloat(sanitized || '0');
                
                // If user typed something, check it. If empty, it's exact change (0) which is valid logic or we can treat as "Don't know"
                if (trocoPara > 0 && trocoPara < cartTotal) {
                    alert(`O valor para troco (R$ ${trocoPara.toFixed(2)}) não pode ser menor que o total (R$ ${cartTotal.toFixed(2)}).`);
                    return;
                }
            }

            // Create Order as PENDING (Not Paid)
            const pedido: Pedido = {
                id: orderId,
                data: now,
                tipoAtendimento: orderType,
                clienteNome: selectedClient?.nome || 'Consumidor Final',
                clienteId: selectedClient?.id,
                total: cartTotal,
                status: PedidoStatus.Pendente, // DELIVERY REMAINS PENDING
                statusCozinha: StatusCozinha.Aguardando,
                itens: cart,
                pagamentos: [], // No actual payments yet
                deliveryPagamentoMetodo: method.nome,
                deliveryTrocoPara: trocoPara > 0 ? trocoPara : undefined
            };

            db.savePedido(pedido);
            
            // Print Receipt with Special Delivery Info
            setPrintData({
                orderId,
                type: orderType,
                clientName: pedido.clienteNome,
                clientAddress: selectedClient ? `${selectedClient.endereco}, ${selectedClient.numero} - ${selectedClient.bairro}` : '',
                items: cart,
                total: cartTotal,
                payments: [],
                change: 0,
                deliveryMethod: method.nome,
                deliveryChangeTo: trocoPara
            });

            setCheckoutStep('SUCCESS');
            setTimeout(() => {
                setCart([]);
                setSelectedClient(null);
                setOrderType(TipoAtendimento.VendaRapida);
                setCurrentPayments([]);
                setChangeAmount(0);
                setNumpadValue('');
                setCheckoutStep('NONE');
            }, 3000);
            return;
        }

        // --- STANDARD LOGIC (Quick Sale / Takeaway) ---
        if (!selectedMethodId) {
            alert("Selecione a forma de pagamento.");
            return;
        }
        
        let value = parseFloat(numpadValue.replace(',', '.') || '0');

        if (!numpadValue || isNaN(value) || value <= 0) {
            value = remaining;
        }

        const method = paymentMethods.find(m => m.id === selectedMethodId);
        if (!method) return;

        let paymentEntryValue = value;
        let localChange = 0;

        if (method.nome.toLowerCase().includes('dinheiro')) {
            if (value > remaining) {
                localChange = value - remaining;
                paymentEntryValue = remaining; 
                setChangeAmount(localChange); 
            }
        } else {
            if (value > (remaining + 0.01)) {
                alert("Valor maior que o restante.");
                return;
            }
        }

        setCurrentPayments(prev => [...prev, {
            methodId: method.id,
            methodName: method.nome,
            value: paymentEntryValue
        }]);

        setNumpadValue('');
        setSelectedMethodId(null);
    };

    const handleRemovePayment = (idx: number) => {
        setCurrentPayments(prev => prev.filter((_, i) => i !== idx));
        setChangeAmount(0);
    };

    const handleFinalizeOrder = async () => {
        // Validate
        if (remaining > 0.01) {
            alert("Ainda há valor pendente para pagar.");
            return;
        }

        try {
            const sessao = db.getSessaoAberta(user.id);
            if (!sessao) throw new Error("Caixa Fechado. Abra o caixa no menu 'Gestão de Caixa'.");

            const orderId = Math.floor(Math.random() * 100000) + 1000;
            const now = new Date().toISOString();
            
            const finalPayments: Pagamento[] = currentPayments.map(p => ({
                id: Math.random().toString(36).substr(2, 9),
                data: now,
                formaPagamentoId: p.methodId,
                formaPagamentoNome: p.methodName,
                valor: p.value
            }));

            const pedido: Pedido = {
                id: orderId,
                data: now,
                tipoAtendimento: orderType,
                clienteNome: selectedClient?.nome || 'Consumidor Final',
                clienteId: selectedClient?.id,
                total: cartTotal,
                status: PedidoStatus.Pago,
                statusCozinha: StatusCozinha.Aguardando,
                itens: cart,
                pagamentos: finalPayments
            };

            db.savePedido(pedido);
            
            finalPayments.forEach(pay => {
                db.addPagamento(orderId, pay, user.id, 0, pay.valor);
            });

            setPrintData({
                orderId,
                type: orderType,
                clientName: pedido.clienteNome,
                clientAddress: selectedClient ? `${selectedClient.endereco}, ${selectedClient.numero} - ${selectedClient.bairro}` : '',
                items: cart,
                total: cartTotal,
                payments: currentPayments,
                change: changeAmount
            });

            setCheckoutStep('SUCCESS');
            
            setTimeout(() => {
                setCart([]);
                setSelectedClient(null);
                setOrderType(TipoAtendimento.VendaRapida);
                setCurrentPayments([]);
                setChangeAmount(0);
                setNumpadValue('');
                setCheckoutStep('NONE');
            }, 3000);

        } catch (e: any) {
            alert("Erro: " + e.message);
        }
    };

    // --- Renderers ---

    const isDelivery = orderType === TipoAtendimento.Delivery;
    const isCashSelected = selectedMethodId && paymentMethods.find(m => m.id === selectedMethodId)?.nome.toLowerCase().includes('dinheiro');

    return (
        // Main container uses viewport units relative to the available space to force fit
        // -m-8 undoes the parent padding, w-[100vw] forces full width relative to viewport
        <div className="flex h-[calc(100vh-4rem)] w-[calc(100vw-16rem)] -ml-8 -mt-8 -mb-8 overflow-hidden font-sans select-none bg-gray-100">
            <TouchReceipt data={printData} />
            
            {/* LEFT: Categories & Grid */}
            <div className="flex-1 flex flex-col min-w-0 h-full border-r border-gray-200">
                
                {/* Top Bar: Order Type Selector */}
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto shadow-sm z-20 shrink-0">
                    {[
                        { type: TipoAtendimento.VendaRapida, icon: Zap, label: 'Balcão' },
                        { type: TipoAtendimento.Retirada, icon: ShoppingBag, label: 'Retirada' },
                        { type: TipoAtendimento.Delivery, icon: Truck, label: 'Delivery' }
                    ].map(t => (
                        <button
                            key={t.type}
                            onClick={() => {
                                setOrderType(t.type);
                                if (t.type === TipoAtendimento.Delivery && selectedClient) {
                                    handleSelectClient(selectedClient);
                                }
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap border ${
                                orderType === t.type 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Categories */}
                <div className="bg-white shadow-sm z-10 shrink-0">
                    <div className="px-4 py-2 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar">
                        <button
                            onClick={() => setSelectedGroupId('ALL')}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm flex flex-col items-center min-w-[70px] ${
                                selectedGroupId === 'ALL' 
                                ? 'bg-gray-800 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Utensils size={18} className="mb-1" /> Todos
                        </button>
                        {groups.filter(g => g.ativo).map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroupId(g.id)}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm flex flex-col items-center min-w-[70px] ${
                                    selectedGroupId === g.id 
                                    ? 'bg-gray-800 text-white' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Utensils size={18} className="mb-1 opacity-50" /> {g.nome}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid - Responsive Grid Columns */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-20">
                        {filteredProducts.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => handleProductClick(p)}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform h-48 sm:h-56"
                            >
                                <div className="h-24 sm:h-28 bg-gray-200 relative overflow-hidden">
                                    {p.imagem ? (
                                        <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <ImageIcon size={28} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded px-1.5 py-0.5 font-bold text-gray-800 shadow-sm text-xs">
                                        R$ {p.preco.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-2 flex-1 flex flex-col justify-between">
                                    <h3 className="font-bold text-gray-800 leading-tight text-xs sm:text-sm line-clamp-2">{p.nome}</h3>
                                    <div className="mt-1 text-[10px] text-gray-500 line-clamp-1">{p.codigoInterno}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Cart & Client - Adjusted Width for smaller screens */}
            <div className={`w-80 lg:w-96 bg-white shadow-2xl flex flex-col z-20 transition-transform h-full shrink-0`}>
                {/* Client Header */}
                <div className="p-3 bg-gray-50 border-b border-gray-200 shrink-0">
                    <div 
                        onClick={() => setCheckoutStep('CLIENT_SEARCH')}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${selectedClient ? 'bg-blue-50 border-blue-200' : 'bg-white border-dashed border-gray-300 hover:border-gray-400'}`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`p-1.5 rounded-full ${selectedClient ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <User size={16} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Cliente</p>
                                <p className="font-bold text-gray-800 truncate text-sm">
                                    {selectedClient ? selectedClient.nome : 'Selecionar'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-400"/>
                    </div>
                </div>

                <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm shrink-0">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" size={20} /> Pedido
                    </h2>
                    <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-xs">
                        {cart.length} Itens
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <ShoppingCart size={40} className="mb-2" />
                            <p className="text-xs">Carrinho vazio</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="flex gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm relative group">
                                <div className="flex flex-col items-center justify-center gap-1 min-w-[2rem] bg-gray-50 rounded-md">
                                    <span className="font-bold text-sm text-gray-800">{item.quantidade}</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-gray-800 text-xs leading-tight truncate">{item.produto.nome}</div>
                                    <div className="text-blue-600 font-bold text-xs mt-0.5">R$ {(item.produto.preco * item.quantidade).toFixed(2)}</div>
                                    {item.adicionais && (
                                        <div className="mt-0.5 space-y-0.5">
                                            {item.adicionais.map((add, i) => (
                                                <div key={i} className="text-[10px] text-gray-500 bg-gray-50 px-1 rounded inline-block mr-1">
                                                    + {add.nome}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleRemoveItem(idx)} className="text-gray-300 hover:text-red-500 p-1 absolute top-1 right-1">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-200 shrink-0">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-gray-500 font-bold uppercase text-xs">Total</span>
                        <span className="text-2xl font-extrabold text-gray-900">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => {
                            if(cart.length === 0) return;
                            if(orderType === TipoAtendimento.Delivery && !selectedClient) {
                                alert("Selecione um cliente para Delivery.");
                                setCheckoutStep('CLIENT_SEARCH');
                                return;
                            }
                            setNumpadValue('');
                            setCurrentPayments([]);
                            setChangeAmount(0);
                            setCheckoutStep('PAYMENT');
                        }}
                        disabled={cart.length === 0}
                        className={`w-full py-3 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                            cart.length > 0 
                            ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isDelivery ? 'Avançar' : 'Pagamento'} <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Addon Modal */}
            {addonModalData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{addonModalData.product.nome}</h3>
                                <p className="text-xs text-gray-500">Personalize seu pedido</p>
                            </div>
                            <button onClick={() => setAddonModalData(null)} className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-xs font-medium flex items-center gap-2">
                                <CheckCircle size={14} /> 
                                Regra: {addonModalData.config.cobrarApartirDe} itens Padrão GRÁTIS.
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {addonModalData.config.itens.map(rule => {
                                    const p = products.find(x => x.id === rule.produtoComplementoId);
                                    if(!p) return null;
                                    const qty = addonQuantities[p.id] || 0;
                                    return (
                                        <div key={p.id} className={`p-3 rounded-lg border transition-all select-none flex justify-between items-center ${qty > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{p.nome}</div>
                                                <div className="text-xs text-gray-500">
                                                    {rule.cobrarSempre ? <span className="text-orange-600 font-bold">Premium +R$ {p.preco.toFixed(2)}</span> : `+R$ ${p.preco.toFixed(2)} (se exceder)`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: Math.max(0, qty - 1)}))} className={`w-8 h-8 rounded flex items-center justify-center ${qty > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-300'}`}><Minus size={16}/></button>
                                                <span className="text-lg font-bold w-6 text-center">{qty}</span>
                                                <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: qty + 1}))} className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200"><Plus size={16}/></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200">
                            <button onClick={handleConfirmAddons} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg">Adicionar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Client Search Modal - Responsive Size */}
            {checkoutStep === 'CLIENT_SEARCH' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-0 flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Selecionar Cliente</h3>
                            <button onClick={() => setCheckoutStep('NONE')} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={clientSearchTerm}
                                    onChange={e => setClientSearchTerm(e.target.value)}
                                    className="w-full pl-12 p-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none font-medium"
                                    placeholder="Nome, Telefone ou CPF/CNPJ..."
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <div 
                                onClick={() => handleSelectClient(null)}
                                className="p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-all"
                            >
                                <div className="bg-gray-200 p-2 rounded-full text-gray-600"><UserPlus size={20}/></div>
                                <div>
                                    <div className="font-bold text-base text-gray-800">Consumidor Final (Sem Cadastro)</div>
                                </div>
                            </div>

                            {filteredClients.map(client => (
                                <div 
                                    key={client.id}
                                    onClick={() => handleSelectClient(client)}
                                    className="p-3 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full text-blue-600 font-bold text-lg w-10 h-10 flex items-center justify-center">
                                            {client.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-base text-gray-800">{client.nome}</div>
                                            <div className="text-gray-500 text-xs flex gap-2">
                                                <span>{client.telefone}</span>
                                                {client.cpfCnpj && <span>• {client.cpfCnpj}</span>}
                                            </div>
                                            {client.endereco && (
                                                <div className="text-gray-400 text-[10px] mt-0.5">
                                                    {client.endereco}, {client.numero} - {client.bairro}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Payment Modal (ROBUST - Conditional Logic) - FIXED SIZING */}
            {checkoutStep === 'PAYMENT' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-[95%] max-w-4xl rounded-2xl shadow-2xl p-0 flex flex-col md:flex-row h-auto max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
                        {/* LEFT: Payment Methods & Numpad */}
                        <div className="flex-1 p-4 md:p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {isDelivery ? 'Forma Pagamento' : 'Pagamento'}
                                </h3>
                                <button onClick={() => setCheckoutStep('NONE')} className="text-gray-500 font-bold flex items-center gap-1 text-sm"><ArrowLeft size={16}/> Voltar</button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
                                {paymentMethods.map(method => (
                                    <button 
                                        key={method.id} 
                                        type="button"
                                        onClick={() => setSelectedMethodId(method.id)}
                                        className={`p-3 rounded-lg border-2 font-bold text-sm flex flex-col items-center gap-1 transition-all ${selectedMethodId === method.id ? 'border-blue-600 bg-blue-100 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'}`}
                                    >
                                        <CreditCard size={20}/> {method.nome}
                                    </button>
                                ))}
                            </div>

                            {/* Numpad Area - Flexible Height */}
                            <div className="flex-1 flex flex-col justify-end min-h-[300px]">
                                <div className="mb-2 text-right">
                                    <span className="text-xs text-gray-500 font-bold uppercase mr-2">
                                        {isDelivery 
                                            ? (isCashSelected ? "Troco para:" : "Valor Total:") 
                                            : "Valor a Pagar:"}
                                    </span>
                                    <div className="text-3xl font-mono font-bold bg-white border border-gray-300 rounded-lg p-2 text-right text-gray-800">
                                        {numpadValue 
                                            ? parseFloat(numpadValue.replace(',','.')).toFixed(2) 
                                            : (isDelivery && !isCashSelected ? cartTotal.toFixed(2) : remaining.toFixed(2))}
                                    </div>
                                    {isDelivery && isCashSelected && (
                                        <div className="text-xs text-red-500 text-right font-bold mt-1 h-4">
                                            {numpadValue && parseFloat(numpadValue.replace(',','.')) > 0 
                                                ? `Troco a devolver: R$ ${(parseFloat(numpadValue.replace(',','.')) - cartTotal).toFixed(2)}`
                                                : "Informe quanto o cliente vai entregar"}
                                        </div>
                                    )}
                                </div>
                                
                                {(!isDelivery || isCashSelected) && (
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        {[1,2,3,4,5,6,7,8,9,'.',0,'back'].map((key) => (
                                            <button 
                                                key={key}
                                                type="button"
                                                onClick={() => handleNumpadClick(key.toString())}
                                                className="bg-white border border-gray-300 rounded-lg text-xl font-bold text-gray-700 shadow-sm active:bg-gray-200 flex items-center justify-center select-none active:scale-95 transition-transform h-full min-h-[50px]"
                                            >
                                                {key === 'back' ? <ArrowLeft/> : key}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="mt-3 grid grid-cols-2 gap-2 h-12 shrink-0">
                                    <button type="button" onClick={() => { setNumpadValue(''); setSelectedMethodId(null); }} className="bg-gray-200 rounded-lg font-bold text-gray-700 text-sm">Limpar</button>
                                    <button 
                                        type="button"
                                        onClick={handleAddPayment} 
                                        disabled={!selectedMethodId} 
                                        className={`rounded-lg font-bold text-white shadow-md text-sm ${selectedMethodId ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                    >
                                        {isDelivery ? "Confirmar" : "Adicionar"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Summary & Confirm (Hidden logic for Delivery) */}
                        {!isDelivery && (
                            <div className="w-full md:w-80 p-4 md:p-6 flex flex-col bg-white shrink-0">
                                <div className="mb-4 pb-4 border-b border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Total do Pedido</p>
                                    <p className="text-4xl font-extrabold text-blue-600">R$ {cartTotal.toFixed(2)}</p>
                                </div>

                                <div className="flex-1 overflow-y-auto mb-4 min-h-[100px]">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Pagamentos</p>
                                    {currentPayments.length === 0 ? (
                                        <div className="text-center text-gray-400 py-4 italic text-sm">Nenhum pagamento</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {currentPayments.map((p, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 text-sm">
                                                    <div>
                                                        <div className="font-bold text-gray-800">{p.methodName}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold">R$ {p.value.toFixed(2)}</span>
                                                        <button onClick={() => handleRemovePayment(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    <div className="space-y-1 mb-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Pago</span>
                                            <span className="font-bold text-green-600">R$ {totalPaid.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-100 pt-1">
                                            <span className="text-gray-600">Restante</span>
                                            <span className={`font-bold ${remaining === 0 ? 'text-gray-400' : 'text-red-600'}`}>R$ {remaining.toFixed(2)}</span>
                                        </div>
                                        {changeAmount > 0 && (
                                            <div className="flex justify-between bg-yellow-50 p-1.5 rounded border border-yellow-200 mt-2">
                                                <span className="text-yellow-800 font-bold">TROCO</span>
                                                <span className="font-bold text-yellow-800">R$ {changeAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleFinalizeOrder}
                                        disabled={remaining > 0.01}
                                        className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                                            remaining <= 0.01 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 animate-pulse' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <CheckCircle size={20}/> Finalizar
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {isDelivery && (
                            <div className="w-full md:w-80 p-6 flex flex-col bg-white justify-center items-center text-center shrink-0">
                                <div className="bg-blue-50 p-4 rounded-full mb-4">
                                    <Truck size={48} className="text-blue-600"/>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Modo Delivery</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Neste modo, o pagamento não é processado agora. 
                                    <br/>Informe a forma de pagamento prevista.
                                </p>
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                                    O pedido ficará como <b>PENDENTE</b>.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. Success Modal */}
            {checkoutStep === 'SUCCESS' && (
                <div className="fixed inset-0 bg-green-500 z-50 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
                    <div className="bg-white text-green-500 p-8 rounded-full mb-6 shadow-xl animate-bounce">
                        <CheckCircle size={80} strokeWidth={3} />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-4">
                        {isDelivery ? 'Pedido Enviado!' : 'Venda Concluída!'}
                    </h1>
                    <p className="text-2xl opacity-90">Pedido enviado para produção.</p>
                </div>
            )}

        </div>
    );
};

export default TouchSales;