
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { 
  Produto, GrupoProduto, Pedido, PedidoItem, 
  PedidoItemAdicional, ConfiguracaoAdicional, FormaPagamento,
  TipoAtendimento, PedidoStatus, StatusCozinha, Pagamento, Usuario 
} from '../types';
import { 
  Search, ShoppingCart, Minus, Plus, Trash2, X, 
  ChevronRight, CreditCard, User, CheckCircle, ArrowLeft,
  Image as ImageIcon, Utensils
} from 'lucide-react';

interface TouchPOSProps {
    user: Usuario;
}

const TouchPOS: React.FC<TouchPOSProps> = ({ user }) => {
    // --- Data ---
    const [products, setProducts] = useState<Produto[]>([]);
    const [groups, setGroups] = useState<GrupoProduto[]>([]);
    const [addonConfigs, setAddonConfigs] = useState<ConfiguracaoAdicional[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);

    // --- UI State ---
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'ALL'>('ALL');
    const [cart, setCart] = useState<PedidoItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false); // Mobile/Tablet Drawer
    const [customerName, setCustomerName] = useState('');
    
    // --- Modal States ---
    const [addonModalData, setAddonModalData] = useState<{product: Produto, config: ConfiguracaoAdicional} | null>(null);
    const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
    
    const [checkoutStep, setCheckoutStep] = useState<'NONE' | 'NAME' | 'PAYMENT' | 'SUCCESS'>('NONE');
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        setProducts(db.getProdutos());
        setGroups(db.getGrupos());
        setAddonConfigs(db.getConfiguracoesAdicionais());
        setPaymentMethods(db.getFormasPagamento().filter(p => p.ativo));
    }, []);

    // --- Helpers ---
    const filteredProducts = products.filter(p => {
        if (!p.ativo || p.tipo !== 'Principal') return false;
        if (selectedGroupId !== 'ALL' && p.grupoProdutoId !== selectedGroupId) return false;
        return true;
    });

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
            // Always separate line for items with addons
            if (addons && addons.length > 0) {
                return [...prev, { produto: product, quantidade: qty, adicionais: addons }];
            }
            // Merge simple items
            const existing = prev.find(i => i.produto.id === product.id && (!i.adicionais || i.adicionais.length === 0));
            if (existing) {
                return prev.map(i => i === existing ? { ...i, quantidade: i.quantidade + qty } : i);
            }
            return [...prev, { produto: product, quantidade: qty }];
        });
        
        // Visual feedback
        // (Optional: Toast or animation)
    };

    const handleConfirmAddons = () => {
        if (!addonModalData) return;
        const { product, config } = addonModalData;
        
        const finalAddons: PedidoItemAdicional[] = [];
        let standardCount = 0;

        // Flatten selection
        const selection: {product: Produto, rule: any}[] = [];
        config.itens.forEach(rule => {
            const qty = addonQuantities[rule.produtoComplementoId] || 0;
            for(let i=0; i<qty; i++) {
                const p = products.find(prod => prod.id === rule.produtoComplementoId);
                if(p) selection.push({ product: p, rule });
            }
        });

        // Calc prices
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
        setProcessingPayment(true);
        
        try {
            // 1. Validate Session
            const sessao = db.getSessaoAberta(user.id);
            if (!sessao) throw new Error("Caixa Fechado. Abra o caixa no menu 'Gestão de Caixa'.");

            const method = paymentMethods.find(m => m.id === methodId);
            if (!method) throw new Error("Método inválido");

            // 2. Create Order
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
                tipoAtendimento: TipoAtendimento.VendaRapida, // Kiosk is usually fast food/takeaway
                clienteNome: customerName || 'Cliente Balcão',
                clienteId: undefined, // Anonymous for Kiosk usually
                total: cartTotal,
                status: PedidoStatus.Pago, // Assuming immediate payment at kiosk
                statusCozinha: StatusCozinha.Aguardando,
                itens: cart,
                pagamentos: [paymentObj]
            };

            // 3. Persist
            db.savePedido(pedido);
            db.addPagamento(orderId, paymentObj, user.id, 0, cartTotal); // Registers money movement

            // 4. Success State
            setCheckoutStep('SUCCESS');
            
            // Auto Reset after 3s
            setTimeout(() => {
                setCart([]);
                setCustomerName('');
                setCheckoutStep('NONE');
                setProcessingPayment(false);
            }, 3000);

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
                
                {/* Header / Categories */}
                <div className="bg-white shadow-sm z-10">
                    <div className="p-4 overflow-x-auto whitespace-nowrap flex gap-3 no-scrollbar">
                        <button
                            onClick={() => setSelectedGroupId('ALL')}
                            className={`px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex flex-col items-center min-w-[100px] ${
                                selectedGroupId === 'ALL' 
                                ? 'bg-blue-600 text-white scale-105' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Utensils size={24} className="mb-1" /> Todos
                        </button>
                        {groups.filter(g => g.ativo).map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroupId(g.id)}
                                className={`px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex flex-col items-center min-w-[100px] ${
                                    selectedGroupId === g.id 
                                    ? 'bg-blue-600 text-white scale-105' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {/* Icons would be better here if mapped, using Utensils as placeholder */}
                                <Utensils size={24} className="mb-1 opacity-50" /> {g.nome}
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
                                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform h-64"
                            >
                                <div className="h-32 bg-gray-200 relative overflow-hidden">
                                    {p.imagem ? (
                                        <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg px-2 py-1 font-bold text-gray-800 shadow-sm text-sm">
                                        R$ {p.preco.toFixed(2)}
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <h3 className="font-bold text-gray-800 leading-tight text-lg line-clamp-2">{p.nome}</h3>
                                    <div className="mt-2 text-xs text-gray-500 line-clamp-1">{p.codigoInterno}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Cart (Drawer on Mobile, Fixed on Desktop) */}
            <div className={`w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-20 transition-transform ${isCartOpen ? 'translate-x-0' : 'translate-x-0'}`}>
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" /> Pedido
                    </h2>
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-sm">
                        {cart.length} Itens
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <ShoppingCart size={64} className="mb-4" />
                            <p className="text-lg">Seu carrinho está vazio</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex flex-col items-center justify-center gap-2 min-w-[3rem]">
                                    <span className="font-bold text-lg text-gray-800">{item.quantidade}x</span>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{item.produto.nome}</div>
                                    <div className="text-blue-600 font-bold text-sm">R$ {(item.produto.preco * item.quantidade).toFixed(2)}</div>
                                    {item.adicionais && (
                                        <div className="mt-1 space-y-0.5">
                                            {item.adicionais.map((add, i) => (
                                                <div key={i} className="text-xs text-gray-500 bg-gray-50 px-1 rounded inline-block mr-1">
                                                    + {add.nome}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-2">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-gray-500 font-bold uppercase text-sm">Total a Pagar</span>
                        <span className="text-4xl font-extrabold text-gray-900">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => {
                            if(cart.length === 0) return;
                            setCheckoutStep('NAME');
                        }}
                        disabled={cart.length === 0}
                        className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                            cart.length > 0 
                            ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Finalizar <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. Addon Modal */}
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
                                                <button 
                                                    onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: Math.max(0, qty - 1)}))}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${qty > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-300'}`}
                                                >
                                                    <Minus size={20} strokeWidth={3} />
                                                </button>
                                                <span className="text-xl font-bold w-6 text-center">{qty}</span>
                                                <button 
                                                    onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: qty + 1}))}
                                                    className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200"
                                                >
                                                    <Plus size={20} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button onClick={handleConfirmAddons} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-xl hover:bg-green-700 shadow-lg">
                                Confirmar e Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Identification Modal */}
            {checkoutStep === 'NAME' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Como devemos te chamar?</h3>
                        
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase">Nome do Cliente (Opcional)</label>
                            <div className="relative">
                                <User className="absolute left-4 top-4 text-gray-400" size={24}/>
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="w-full pl-12 p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none font-medium"
                                    placeholder="Digite seu nome..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setCheckoutStep('NONE')} className="flex-1 py-4 bg-gray-200 rounded-xl font-bold text-gray-600 text-lg">Voltar</button>
                            <button onClick={() => setCheckoutStep('PAYMENT')} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700">
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Payment Modal */}
            {checkoutStep === 'PAYMENT' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-8 animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={() => setCheckoutStep('NAME')} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 font-bold">
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
                    <h1 className="text-5xl font-extrabold mb-4">Pedido Confirmado!</h1>
                    <p className="text-2xl opacity-90">Por favor, aguarde a senha no painel.</p>
                    <p className="mt-12 text-sm opacity-70">Redirecionando em instantes...</p>
                </div>
            )}

        </div>
    );
};

export default TouchPOS;
