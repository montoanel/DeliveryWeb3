
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { 
  Produto, GrupoProduto, Pedido, PedidoItem, 
  PedidoItemAdicional, ConfiguracaoAdicional, FormaPagamento,
  TipoAtendimento, PedidoStatus, StatusCozinha, Pagamento, Usuario, Cliente 
} from '../types';
import { 
  Search, ShoppingCart, Minus, Plus, Trash2, X, 
  ChevronRight, CreditCard, User, CheckCircle, ArrowLeft,
  Image as ImageIcon, Utensils, Truck, ShoppingBag, Zap, UserPlus
} from 'lucide-react';

interface TouchSalesProps {
    user: Usuario;
}

// Módulo 1: Touch Vendas (Para Operador/Garçom)
// Características: Seleção de Tipo de Venda, Seleção de Cliente
const TouchSales: React.FC<TouchSalesProps> = ({ user }) => {
    // --- Data ---
    const [products, setProducts] = useState<Produto[]>([]);
    const [groups, setGroups] = useState<GrupoProduto[]>([]);
    const [clients, setClients] = useState<Cliente[]>([]);
    const [addonConfigs, setAddonConfigs] = useState<ConfiguracaoAdicional[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);

    // --- UI State ---
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'ALL'>('ALL');
    const [cart, setCart] = useState<PedidoItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Header States
    const [orderType, setOrderType] = useState<TipoAtendimento>(TipoAtendimento.VendaRapida);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    
    // --- Modal States ---
    const [addonModalData, setAddonModalData] = useState<{product: Produto, config: ConfiguracaoAdicional} | null>(null);
    const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
    
    const [checkoutStep, setCheckoutStep] = useState<'NONE' | 'CLIENT_SEARCH' | 'PAYMENT' | 'SUCCESS'>('NONE');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        setProducts(db.getProdutos());
        setGroups(db.getGrupos());
        setClients(db.getClientes());
        setAddonConfigs(db.getConfiguracoesAdicionais());
        setPaymentMethods(db.getFormasPagamento().filter(p => p.ativo));
    }, []);

    // --- Helpers ---
    const filteredProducts = products.filter(p => {
        if (!p.ativo || p.tipo !== 'Principal') return false;
        // Show Touch-enabled products AND all others? 
        // For "Staff Touch", usually we show all or maybe just touch ones. 
        // The prompt says "duplicar o atendimento touch", implying visual style.
        // Let's adhere to "disponivelTouch" for visual consistency, or show all if needed.
        // For now, using touch flag to keep the grid clean.
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

    const handleCheckout = async (methodId: number) => {
        if (orderType === TipoAtendimento.Delivery && !selectedClient) {
            alert("Para Delivery, é obrigatório selecionar um cliente.");
            setCheckoutStep('CLIENT_SEARCH');
            return;
        }

        setProcessingPayment(true);
        
        try {
            const sessao = db.getSessaoAberta(user.id);
            if (!sessao) throw new Error("Caixa Fechado. Abra o caixa no menu 'Gestão de Caixa'.");

            const method = paymentMethods.find(m => m.id === methodId);
            if (!method) throw new Error("Método inválido");

            const orderId = Math.floor(Math.random() * 100000) + 1000;
            const now = new Date().toISOString();
            
            const paymentObj: Pagamento = {
                id: Math.random().toString(36).substr(2, 9),
                data: now,
                formaPagamentoId: method.id,
                formaPagamentoNome: method.nome,
                valor: cartTotal
            };

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
                pagamentos: [paymentObj]
            };

            db.savePedido(pedido);
            db.addPagamento(orderId, paymentObj, user.id, 0, cartTotal);

            setCheckoutStep('SUCCESS');
            
            setTimeout(() => {
                setCart([]);
                setSelectedClient(null);
                setOrderType(TipoAtendimento.VendaRapida);
                setCheckoutStep('NONE');
                setProcessingPayment(false);
            }, 2000);

        } catch (e: any) {
            alert("Erro: " + e.message);
            setProcessingPayment(false);
        }
    };

    // --- Renderers ---

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden font-sans select-none -m-8">
            
            {/* LEFT: Categories & Grid */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Top Bar: Order Type Selector */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-2 overflow-x-auto shadow-sm z-20">
                    {[
                        { type: TipoAtendimento.VendaRapida, icon: Zap, label: 'Balcão / Rápida' },
                        { type: TipoAtendimento.Retirada, icon: ShoppingBag, label: 'Retirada' },
                        { type: TipoAtendimento.Delivery, icon: Truck, label: 'Delivery' }
                    ].map(t => (
                        <button
                            key={t.type}
                            onClick={() => setOrderType(t.type)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                                orderType === t.type 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <t.icon size={18} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Categories */}
                <div className="bg-white shadow-sm z-10">
                    <div className="px-6 py-4 overflow-x-auto whitespace-nowrap flex gap-3 no-scrollbar">
                        <button
                            onClick={() => setSelectedGroupId('ALL')}
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex flex-col items-center min-w-[80px] ${
                                selectedGroupId === 'ALL' 
                                ? 'bg-gray-800 text-white scale-105' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Utensils size={20} className="mb-1" /> Todos
                        </button>
                        {groups.filter(g => g.ativo).map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroupId(g.id)}
                                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex flex-col items-center min-w-[80px] ${
                                    selectedGroupId === g.id 
                                    ? 'bg-gray-800 text-white scale-105' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Utensils size={20} className="mb-1 opacity-50" /> {g.nome}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredProducts.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => handleProductClick(p)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform h-56"
                            >
                                <div className="h-28 bg-gray-200 relative overflow-hidden">
                                    {p.imagem ? (
                                        <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg px-2 py-1 font-bold text-gray-800 shadow-sm text-xs">
                                        R$ {p.preco.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <h3 className="font-bold text-gray-800 leading-tight text-sm line-clamp-2">{p.nome}</h3>
                                    <div className="mt-1 text-[10px] text-gray-500 line-clamp-1">{p.codigoInterno}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Cart & Client */}
            <div className={`w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-20 transition-transform`}>
                {/* Client Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div 
                        onClick={() => setCheckoutStep('CLIENT_SEARCH')}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${selectedClient ? 'bg-blue-50 border-blue-200' : 'bg-white border-dashed border-gray-300 hover:border-gray-400'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${selectedClient ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <User size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-gray-500 uppercase">Cliente</p>
                                <p className="font-bold text-gray-800 truncate max-w-[150px]">
                                    {selectedClient ? selectedClient.nome : 'Selecionar Cliente'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-400"/>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" /> Pedido
                    </h2>
                    <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-xs">
                        {cart.length} Itens
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <ShoppingCart size={48} className="mb-4" />
                            <p className="text-sm">Carrinho vazio</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="flex gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm relative group">
                                <div className="flex flex-col items-center justify-center gap-1 min-w-[2.5rem] bg-gray-50 rounded-lg">
                                    <span className="font-bold text-base text-gray-800">{item.quantidade}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800 text-sm leading-tight">{item.produto.nome}</div>
                                    <div className="text-blue-600 font-bold text-xs mt-1">R$ {(item.produto.preco * item.quantidade).toFixed(2)}</div>
                                    {item.adicionais && (
                                        <div className="mt-1 space-y-0.5">
                                            {item.adicionais.map((add, i) => (
                                                <div key={i} className="text-[10px] text-gray-500 bg-gray-50 px-1 rounded inline-block mr-1">
                                                    + {add.nome}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleRemoveItem(idx)} className="text-gray-300 hover:text-red-500 p-1 absolute top-1 right-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-gray-500 font-bold uppercase text-xs">Total a Pagar</span>
                        <span className="text-3xl font-extrabold text-gray-900">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => {
                            if(cart.length === 0) return;
                            setCheckoutStep('PAYMENT');
                        }}
                        disabled={cart.length === 0}
                        className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                            cart.length > 0 
                            ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Pagamento <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Addon Modal (Same as TouchPOS) */}
            {addonModalData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{addonModalData.product.nome}</h3>
                                <p className="text-gray-500">Personalize seu pedido</p>
                            </div>
                            <button onClick={() => setAddonModalData(null)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm font-medium flex items-center gap-2">
                                <CheckCircle size={18} /> 
                                Regra: {addonModalData.config.cobrarApartirDe} itens Padrão GRÁTIS. Excedentes cobrados.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addonModalData.config.itens.map(rule => {
                                    const p = products.find(x => x.id === rule.produtoComplementoId);
                                    if(!p) return null;
                                    const qty = addonQuantities[p.id] || 0;
                                    return (
                                        <div key={p.id} className={`p-4 rounded-xl border-2 transition-all select-none flex justify-between items-center ${qty > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                                            <div>
                                                <div className="font-bold text-gray-800 text-lg">{p.nome}</div>
                                                <div className="text-sm text-gray-500">
                                                    {rule.cobrarSempre ? <span className="text-orange-600 font-bold">Premium +R$ {p.preco.toFixed(2)}</span> : `+R$ ${p.preco.toFixed(2)} (se exceder)`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: Math.max(0, qty - 1)}))} className={`w-10 h-10 rounded-lg flex items-center justify-center ${qty > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-300'}`}><Minus size={20} strokeWidth={3} /></button>
                                                <span className="text-xl font-bold w-6 text-center">{qty}</span>
                                                <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: qty + 1}))} className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200"><Plus size={20} strokeWidth={3} /></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200">
                            <button onClick={handleConfirmAddons} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-xl hover:bg-green-700 shadow-lg">Confirmar e Adicionar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Client Search Modal */}
            {checkoutStep === 'CLIENT_SEARCH' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-0 flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-800">Selecionar Cliente</h3>
                            <button onClick={() => setCheckoutStep('NONE')} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                        </div>
                        
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-4 top-4 text-gray-400" size={24}/>
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={clientSearchTerm}
                                    onChange={e => setClientSearchTerm(e.target.value)}
                                    className="w-full pl-12 p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none font-medium"
                                    placeholder="Nome, Telefone ou CPF/CNPJ..."
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {/* Option to create anonymous/new */}
                            <div 
                                onClick={() => { setSelectedClient(null); setCheckoutStep('NONE'); }}
                                className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex items-center gap-4 transition-all"
                            >
                                <div className="bg-gray-200 p-3 rounded-full text-gray-600"><UserPlus size={24}/></div>
                                <div>
                                    <div className="font-bold text-lg text-gray-800">Consumidor Final (Sem Cadastro)</div>
                                    <div className="text-gray-500 text-sm">Seguir sem identificar cliente</div>
                                </div>
                            </div>

                            {filteredClients.map(client => (
                                <div 
                                    key={client.id}
                                    onClick={() => { setSelectedClient(client); setCheckoutStep('NONE'); }}
                                    className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 font-bold text-lg w-12 h-12 flex items-center justify-center">
                                            {client.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-gray-800">{client.nome}</div>
                                            <div className="text-gray-500 text-sm flex gap-3">
                                                <span>{client.telefone}</span>
                                                {client.cpfCnpj && <span>• {client.cpfCnpj}</span>}
                                            </div>
                                            {client.endereco && (
                                                <div className="text-gray-400 text-xs mt-1">
                                                    {client.endereco}, {client.numero} - {client.bairro}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={24} className="text-gray-300"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Payment Modal */}
            {checkoutStep === 'PAYMENT' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-8 animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={() => setCheckoutStep('NONE')} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 font-bold">
                                <ArrowLeft /> Voltar
                            </button>
                            <h3 className="text-3xl font-bold text-gray-800">Pagamento</h3>
                            <div className="w-20"></div> 
                        </div>

                        <div className="text-center mb-10">
                            <p className="text-gray-500 uppercase font-bold text-sm">Valor Total</p>
                            <p className="text-5xl font-extrabold text-blue-600 mt-2">R$ {cartTotal.toFixed(2)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {paymentMethods.map(method => (
                                <button 
                                    key={method.id}
                                    onClick={() => handleCheckout(method.id)}
                                    disabled={processingPayment}
                                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3 group"
                                >
                                    <div className="bg-gray-100 p-4 rounded-full group-hover:bg-blue-200 text-blue-600 transition-colors">
                                        <CreditCard size={32} />
                                    </div>
                                    <span className="font-bold text-xl text-gray-700">{method.nome}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Success Modal */}
            {checkoutStep === 'SUCCESS' && (
                <div className="fixed inset-0 bg-green-500 z-50 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
                    <div className="bg-white text-green-500 p-8 rounded-full mb-6 shadow-xl animate-bounce">
                        <CheckCircle size={80} strokeWidth={3} />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-4">Venda Concluída!</h1>
                    <p className="text-2xl opacity-90">Pedido enviado para produção.</p>
                </div>
            )}

        </div>
    );
};

export default TouchSales;
