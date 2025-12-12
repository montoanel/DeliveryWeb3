
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/mockDb';
import { 
  Produto, GrupoProduto, Pedido, PedidoItem, 
  PedidoItemAdicional, ConfiguracaoAdicional, FormaPagamento,
  TipoAtendimento, PedidoStatus, StatusCozinha, Pagamento, Usuario 
} from '../types';
import { 
  ShoppingCart, Minus, Plus, Trash2, X, 
  ChevronRight, CreditCard, User, CheckCircle, ArrowLeft,
  Image as ImageIcon, Utensils, FileText, Printer
} from 'lucide-react';

// --- Internal Printable Ticket Component (similar to POS) ---
const KioskReceipt = ({ data }: { data: any }) => {
    if (!data) return null;
    return createPortal(
        <div className="fixed inset-0 bg-white z-[9999] p-4 text-black font-mono text-sm leading-tight flex flex-col items-center justify-center">
            <style>{`@media print { #root { display: none !important; } .kiosk-print { display: block !important; width: 80mm; margin: 0 auto; text-align: center; } }`}</style>
            <div className="kiosk-print max-w-[300px] text-center">
                <h1 className="text-xl font-bold uppercase mb-2">DeliverySys</h1>
                <p className="text-xs mb-4">{new Date().toLocaleString()}</p>
                
                <h2 className="text-4xl font-extrabold border-2 border-black p-2 mb-4">SENHA: {data.orderId.toString().slice(-3)}</h2>
                
                <div className="text-left mb-4 border-b border-black pb-2">
                    {data.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between mb-1">
                            <span>{item.quantidade}x {item.produto.nome}</span>
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-between font-bold text-lg mb-4">
                    <span>TOTAL</span>
                    <span>R$ {data.total.toFixed(2)}</span>
                </div>
                
                {data.cpf && <p className="text-xs mb-4">CPF: {data.cpf}</p>}
                
                <p className="text-xs">Obrigado pela preferência!</p>
                <p className="text-xs">Aguarde sua senha no painel.</p>
            </div>
        </div>,
        document.body
    );
};

interface TouchKioskProps {
    user: Usuario;
}

// Módulo 2: Touch Autoatendimento (Totem)
// Características: Fluxo Linear, Simplificado, CPF na Nota, Impressão Automática
const TouchKiosk: React.FC<TouchKioskProps> = ({ user }) => {
    const [products, setProducts] = useState<Produto[]>([]);
    const [groups, setGroups] = useState<GrupoProduto[]>([]);
    const [addonConfigs, setAddonConfigs] = useState<ConfiguracaoAdicional[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);

    const [selectedGroupId, setSelectedGroupId] = useState<number | 'ALL'>('ALL');
    const [cart, setCart] = useState<PedidoItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Kiosk Specific State
    const [cpf, setCpf] = useState('');
    const [wantsCpf, setWantsCpf] = useState<boolean | null>(null); // Null = not asked yet
    
    const [addonModalData, setAddonModalData] = useState<{product: Produto, config: ConfiguracaoAdicional} | null>(null);
    const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
    
    // Flow: NONE -> CART -> CPF_ASK -> CPF_INPUT -> PAYMENT -> SUCCESS/PRINT
    const [checkoutStep, setCheckoutStep] = useState<'NONE' | 'CPF_ASK' | 'CPF_INPUT' | 'PAYMENT' | 'SUCCESS'>('NONE');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [printData, setPrintData] = useState<any>(null);

    useEffect(() => {
        setProducts(db.getProdutos());
        setGroups(db.getGrupos());
        setAddonConfigs(db.getConfiguracoesAdicionais());
        setPaymentMethods(db.getFormasPagamento().filter(p => p.ativo));
    }, []);

    // Print Effect
    useEffect(() => {
        if(printData) {
            setTimeout(() => {
                window.print();
                setPrintData(null);
            }, 500);
        }
    }, [printData]);

    const filteredProducts = products.filter(p => {
        if (!p.ativo || p.tipo !== 'Principal') return false;
        if (!p.disponivelTouch) return false;
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
            if (addons && addons.length > 0) return [...prev, { produto: product, quantidade: qty, adicionais: addons }];
            const existing = prev.find(i => i.produto.id === product.id && (!i.adicionais || i.adicionais.length === 0));
            if (existing) return prev.map(i => i === existing ? { ...i, quantidade: i.quantidade + qty } : i);
            return [...prev, { produto: product, quantidade: qty }];
        });
    };

    const handleConfirmAddons = () => {
        if (!addonModalData) return;
        const { product, config } = addonModalData;
        const finalAddons: PedidoItemAdicional[] = [];
        let standardCount = 0;

        config.itens.forEach(rule => {
            const qty = addonQuantities[rule.produtoComplementoId] || 0;
            for(let i=0; i<qty; i++) {
                const p = products.find(prod => prod.id === rule.produtoComplementoId);
                if(p) {
                    let price = p.preco;
                    if (!rule.cobrarSempre) {
                        if (standardCount < config.cobrarApartirDe) price = 0;
                        standardCount++;
                    }
                    finalAddons.push({
                        produtoId: p.id,
                        nome: p.nome,
                        precoOriginal: p.preco,
                        precoCobrado: price
                    });
                }
            }
        });

        addToCart(product, 1, finalAddons);
        setAddonModalData(null);
    };

    const handleCheckout = async (methodId: number) => {
        setProcessingPayment(true);
        try {
            const sessao = db.getSessaoAberta(user.id);
            if (!sessao) throw new Error("Terminal Fechado. Solicite ajuda.");

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
                tipoAtendimento: TipoAtendimento.VendaRapida,
                clienteNome: 'Totem Autoatendimento',
                total: cartTotal,
                status: PedidoStatus.Pago,
                statusCozinha: StatusCozinha.Aguardando,
                itens: cart,
                pagamentos: [paymentObj],
                cpfNaNota: cpf || undefined
            };

            db.savePedido(pedido);
            db.addPagamento(orderId, paymentObj, user.id, 0, cartTotal);

            // Trigger Print and Success Screen
            setPrintData({
                orderId,
                total: cartTotal,
                items: cart,
                cpf: cpf
            });
            setCheckoutStep('SUCCESS');
            
            setTimeout(() => {
                setCart([]);
                setCpf('');
                setWantsCpf(null);
                setCheckoutStep('NONE');
                setProcessingPayment(false);
            }, 5000);

        } catch (e: any) {
            alert("Erro: " + e.message);
            setProcessingPayment(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden font-sans select-none -m-8">
            <KioskReceipt data={printData} />
            
            {/* Left: Product Grid (Same as original Touch) */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white shadow-sm z-10">
                    <div className="p-4 overflow-x-auto whitespace-nowrap flex gap-3 no-scrollbar">
                        <button onClick={() => setSelectedGroupId('ALL')} className={`px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex flex-col items-center min-w-[100px] ${selectedGroupId === 'ALL' ? 'bg-orange-600 text-white scale-105' : 'bg-gray-100 text-gray-600'}`}>
                            <Utensils size={24} className="mb-1" /> Todos
                        </button>
                        {groups.filter(g => g.ativo).map(g => (
                            <button key={g.id} onClick={() => setSelectedGroupId(g.id)} className={`px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex flex-col items-center min-w-[100px] ${selectedGroupId === g.id ? 'bg-orange-600 text-white scale-105' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                <Utensils size={24} className="mb-1 opacity-50" /> {g.nome}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredProducts.map(p => (
                            <div key={p.id} onClick={() => handleProductClick(p)} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform h-64">
                                <div className="h-32 bg-gray-200 relative overflow-hidden">
                                    {p.imagem ? <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={48} /></div>}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg px-2 py-1 font-bold text-gray-800 shadow-sm text-sm">R$ {p.preco.toFixed(2)}</div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <h3 className="font-bold text-gray-800 leading-tight text-lg line-clamp-2">{p.nome}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-20">
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-orange-600" /> Seu Pedido</h2>
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold text-sm">{cart.length} Itens</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex flex-col items-center justify-center min-w-[3rem]"><span className="font-bold text-lg text-gray-800">{item.quantidade}x</span></div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800">{item.produto.nome}</div>
                                <div className="text-orange-600 font-bold text-sm">R$ {(item.produto.preco * item.quantidade).toFixed(2)}</div>
                                {item.adicionais && <div className="mt-1 space-y-0.5">{item.adicionais.map((add, i) => <div key={i} className="text-xs text-gray-500 bg-gray-50 px-1 rounded inline-block mr-1">+ {add.nome}</div>)}</div>}
                            </div>
                            <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 p-2"><Trash2 size={20} /></button>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-end mb-4"><span className="text-gray-500 font-bold uppercase text-sm">Total</span><span className="text-4xl font-extrabold text-gray-900">R$ {cartTotal.toFixed(2)}</span></div>
                    <button onClick={() => cart.length > 0 && setCheckoutStep('CPF_ASK')} disabled={cart.length === 0} className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2 ${cart.length > 0 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500'}`}>Finalizar <ChevronRight size={24} /></button>
                </div>
            </div>

            {/* --- MODALS --- */}
            
            {/* Addon Modal */}
            {addonModalData && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="text-2xl font-bold">{addonModalData.product.nome}</h3>
                            <button onClick={() => setAddonModalData(null)}><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {addonModalData.config.itens.map(rule => {
                                const p = products.find(x => x.id === rule.produtoComplementoId);
                                if(!p) return null;
                                const qty = addonQuantities[p.id] || 0;
                                return (
                                    <div key={p.id} className="p-4 rounded-xl border-2 flex justify-between items-center mb-2">
                                        <span className="font-bold text-lg">{p.nome}</span>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: Math.max(0, qty - 1)}))} className="w-10 h-10 rounded-lg bg-gray-100"><Minus/></button>
                                            <span className="text-xl font-bold">{qty}</span>
                                            <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: qty + 1}))} className="w-10 h-10 rounded-lg bg-blue-100"><Plus/></button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="p-6 border-t"><button onClick={handleConfirmAddons} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-xl">Confirmar</button></div>
                    </div>
                </div>
            )}

            {/* CPF Question Modal */}
            {checkoutStep === 'CPF_ASK' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in zoom-in">
                        <h3 className="text-3xl font-bold text-center mb-8">CPF na Nota?</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={() => setCheckoutStep('CPF_INPUT')} className="py-4 bg-blue-600 text-white rounded-xl font-bold text-xl hover:bg-blue-700">Sim, inserir CPF</button>
                            <button onClick={() => setCheckoutStep('PAYMENT')} className="py-4 bg-gray-200 text-gray-800 rounded-xl font-bold text-xl hover:bg-gray-300">Não, obrigado</button>
                        </div>
                        <button onClick={() => setCheckoutStep('NONE')} className="mt-6 text-gray-500 font-bold w-full text-center">Voltar</button>
                    </div>
                </div>
            )}

            {/* CPF Input Modal */}
            {checkoutStep === 'CPF_INPUT' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in zoom-in">
                        <h3 className="text-2xl font-bold text-center mb-6">Digite seu CPF</h3>
                        <input type="text" autoFocus value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full p-4 text-2xl text-center border-2 border-gray-300 rounded-xl mb-6 font-bold tracking-widest focus:border-blue-600 outline-none"/>
                        <div className="flex gap-4">
                            <button onClick={() => setCheckoutStep('CPF_ASK')} className="flex-1 py-4 bg-gray-200 rounded-xl font-bold text-lg">Voltar</button>
                            <button onClick={() => setCheckoutStep('PAYMENT')} className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold text-lg">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {checkoutStep === 'PAYMENT' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-8 animate-in zoom-in">
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={() => setCheckoutStep('CPF_ASK')} className="text-gray-500 font-bold flex items-center gap-2"><ArrowLeft/> Voltar</button>
                            <h3 className="text-3xl font-bold">Pagamento</h3>
                            <div className="w-20"></div>
                        </div>
                        <div className="text-center mb-10"><p className="text-gray-500 uppercase font-bold text-sm">Valor Total</p><p className="text-5xl font-extrabold text-blue-600 mt-2">R$ {cartTotal.toFixed(2)}</p></div>
                        <div className="grid grid-cols-2 gap-4">
                            {paymentMethods.map(method => (
                                <button key={method.id} onClick={() => handleCheckout(method.id)} disabled={processingPayment} className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center gap-3">
                                    <CreditCard size={32} className="text-blue-600"/>
                                    <span className="font-bold text-xl">{method.nome}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Success */}
            {checkoutStep === 'SUCCESS' && (
                <div className="fixed inset-0 bg-green-500 z-50 flex flex-col items-center justify-center text-white animate-in zoom-in">
                    <div className="bg-white text-green-500 p-8 rounded-full mb-6 shadow-xl animate-bounce"><CheckCircle size={80} strokeWidth={3} /></div>
                    <h1 className="text-5xl font-extrabold mb-4">Sucesso!</h1>
                    <p className="text-2xl opacity-90 text-center">Retire sua senha impressa<br/>e aguarde ser chamado.</p>
                    <div className="mt-8 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg"><Printer className="animate-pulse"/> Imprimindo Comprovante...</div>
                </div>
            )}
        </div>
    );
};

export default TouchKiosk;
