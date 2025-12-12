
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { 
  Produto, GrupoProduto, Pedido, PedidoItem, 
  PedidoItemAdicional, ConfiguracaoAdicional, FormaPagamento,
  TipoAtendimento, PedidoStatus, StatusCozinha, Pagamento, Cliente, Bairro 
} from '../types';
import { 
  ShoppingCart, Minus, Plus, X, ChevronRight, 
  MapPin, User, Phone, CheckCircle, Store, Truck, Utensils, 
  ArrowLeft, Banknote, CreditCard, Clock, Map, Navigation, AlertCircle, FileText
} from 'lucide-react';

// --- Types for Local State ---
type AppView = 'LOGIN' | 'SERVICE_SELECT' | 'MENU' | 'CART' | 'WAITING_ACCEPTANCE' | 'TRACKING';

// --- Map Simulation Component ---
const TrackingMap = ({ order, status }: { order: Pedido, status: StatusCozinha }) => {
    // This is a visual simulation since we can't use Google Maps API easily without a key.
    // Logic: Store is at 10%, 10%. Client is at 90%, 90%.
    // Motoboy position interpolates based on status.
    
    const getMotoboyPosition = () => {
        if (status === StatusCozinha.Aguardando || status === StatusCozinha.Preparando) {
            return { top: '10%', left: '10%' }; // At store
        }
        if (status === StatusCozinha.Pronto) {
            return { top: '20%', left: '20%' }; // Just leaving
        }
        if (status === StatusCozinha.Entregue) {
            return { top: '85%', left: '85%' }; // Arrived (Visual approximation)
        }
        // Simulation of movement for "Entregue/Saindo" could be random or time based
        // For static demo:
        return { top: '50%', left: '50%' }; 
    };

    const motoboyPos = getMotoboyPosition();

    return (
        <div className="w-full h-64 bg-gray-200 rounded-xl relative overflow-hidden border-4 border-white shadow-lg">
            {/* Background Grid (Simulating Streets) */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>
            
            {/* Store Marker */}
            <div className="absolute top-[10%] left-[10%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-blue-600 p-2 rounded-full text-white shadow-lg">
                    <Store size={20} />
                </div>
                <span className="text-[10px] font-bold bg-white px-1 rounded mt-1 shadow">Loja</span>
            </div>

            {/* Client Marker */}
            <div className="absolute top-[90%] left-[90%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-green-600 p-2 rounded-full text-white shadow-lg">
                    <User size={20} />
                </div>
                <span className="text-[10px] font-bold bg-white px-1 rounded mt-1 shadow">Você</span>
            </div>

            {/* Path Line (Dashed) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
            </svg>

            {/* Motoboy Marker (Moving) */}
            <div 
                className="absolute transition-all duration-[2000ms] ease-in-out z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                style={motoboyPos}
            >
                <div className="bg-orange-500 p-2 rounded-full text-white shadow-xl animate-bounce">
                    <Truck size={24} />
                </div>
                <span className="text-[10px] font-bold bg-white px-1 rounded mt-1 shadow text-orange-600">Entregador</span>
            </div>
        </div>
    );
};

const CustomerApp: React.FC = () => {
    // --- Data Sources ---
    const [products, setProducts] = useState<Produto[]>([]);
    const [groups, setGroups] = useState<GrupoProduto[]>([]);
    const [addonConfigs, setAddonConfigs] = useState<ConfiguracaoAdicional[]>([]);
    const [bairros, setBairros] = useState<Bairro[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<FormaPagamento[]>([]);

    // --- Session State ---
    const [view, setView] = useState<AppView>('LOGIN');
    const [currentUser, setCurrentUser] = useState<Cliente | null>(null);
    const [serviceType, setServiceType] = useState<TipoAtendimento>(TipoAtendimento.Delivery);
    
    // --- Cart State ---
    const [cart, setCart] = useState<PedidoItem[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<number | 'ALL'>('ALL');
    
    // --- Order Details State ---
    const [deliveryAddress, setDeliveryAddress] = useState({
        bairroId: 0,
        endereco: '',
        numero: '',
        complemento: '',
        latitude: 0,
        longitude: 0
    });
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
    const [changeFor, setChangeFor] = useState('');
    const [obs, setObs] = useState('');

    // --- Modal States ---
    const [itemModal, setItemModal] = useState<{product: Produto, config?: ConfiguracaoAdicional} | null>(null);
    const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});

    // --- Login Form State ---
    const [loginName, setLoginName] = useState('');
    const [loginPhone, setLoginPhone] = useState('');

    // --- Tracking State ---
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
    const [trackedOrder, setTrackedOrder] = useState<Pedido | null>(null);
    const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);

    useEffect(() => {
        setProducts(db.getProdutos());
        setGroups(db.getGrupos());
        setAddonConfigs(db.getConfiguracoesAdicionais());
        setBairros(db.getBairros());
        setPaymentMethods(db.getFormasPagamento().filter(p => p.ativo));
        
        // Try get geolocation on load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setDeliveryAddress(prev => ({...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude}));
                },
                (err) => console.log("Geo access denied or failed", err)
            );
        }
    }, []);

    // Polling for Order Status
    useEffect(() => {
        let interval: any;
        if ((view === 'WAITING_ACCEPTANCE' || view === 'TRACKING') && activeOrderId) {
            interval = setInterval(() => {
                const order = db.getPedidoById(activeOrderId);
                if (order) {
                    setTrackedOrder(order);
                    
                    // Logic: Transition from Waiting to Tracking Flow
                    if (view === 'WAITING_ACCEPTANCE') {
                        if (order.status === PedidoStatus.Cancelado) {
                            alert("Seu pedido foi recusado pela loja. Por favor, entre em contato.");
                            setView('MENU');
                            setActiveOrderId(null);
                        } else if (order.status !== PedidoStatus.AguardandoAprovacao) {
                            // Accepted!
                            setShowAcceptanceModal(true);
                        }
                    }
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [view, activeOrderId]);

    // --- Helpers ---
    const getCartTotal = () => {
        const itemsTotal = cart.reduce((acc, item) => {
            let sub = item.produto.preco * item.quantidade;
            if(item.adicionais) item.adicionais.forEach(a => sub += a.precoCobrado * item.quantidade);
            return acc + sub;
        }, 0);

        let deliveryFee = 0;
        if (serviceType === TipoAtendimento.Delivery && deliveryAddress.bairroId) {
            const bairro = bairros.find(b => b.id === deliveryAddress.bairroId);
            if (bairro) deliveryFee = bairro.taxaEntrega;
        }

        return itemsTotal + deliveryFee;
    };

    // --- Handlers ---

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginName || !loginPhone) return alert("Preencha todos os campos.");

        const existingClient = db.getClientes().find(c => c.telefone === loginPhone);
        
        if (existingClient) {
            setCurrentUser(existingClient);
            if (existingClient.bairroId) {
                setDeliveryAddress(prev => ({
                    ...prev,
                    bairroId: existingClient.bairroId!,
                    endereco: existingClient.endereco,
                    numero: existingClient.numero,
                    complemento: existingClient.complemento
                }));
            }
        } else {
            const newClient: Cliente = {
                id: 0, 
                nome: loginName,
                telefone: loginPhone,
                tipoPessoa: 'Física',
                cpfCnpj: '',
                endereco: '',
                numero: '',
                complemento: '',
                bairro: '',
                cep: '',
                cidade: ''
            };
            db.saveCliente(newClient);
            const saved = db.getClientes().find(c => c.telefone === loginPhone);
            setCurrentUser(saved || newClient);
        }
        setView('SERVICE_SELECT');
    };

    const openProductModal = (product: Produto) => {
        const config = addonConfigs.find(c => c.produtoPrincipalId === product.id);
        if (config) {
            setItemModal({ product, config });
            setAddonQuantities({});
        } else {
            addToCart(product, 1);
        }
    };

    const addToCart = (product: Produto, qty: number, addons: PedidoItemAdicional[] = []) => {
        setCart(prev => [...prev, { produto: product, quantidade: qty, adicionais: addons }]);
        setItemModal(null);
    };

    const confirmAddons = () => {
        if (!itemModal || !itemModal.config) return;
        const { product, config } = itemModal;
        
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
    };

    const handlePlaceOrder = () => {
        if (!currentUser) return;
        if (cart.length === 0) return alert("Carrinho vazio.");
        
        if (serviceType === TipoAtendimento.Delivery) {
            if (!deliveryAddress.bairroId || !deliveryAddress.endereco || !deliveryAddress.numero) {
                return alert("Por favor, preencha o endereço de entrega completo.");
            }
        }

        if (!selectedPaymentId) return alert("Selecione a forma de pagamento.");

        // Update Client Address
        if (serviceType === TipoAtendimento.Delivery) {
            const bairro = bairros.find(b => b.id === deliveryAddress.bairroId);
            const updatedClient = {
                ...currentUser,
                endereco: deliveryAddress.endereco,
                numero: deliveryAddress.numero,
                complemento: deliveryAddress.complemento,
                bairroId: deliveryAddress.bairroId,
                bairro: bairro?.nome || '',
                latitude: deliveryAddress.latitude,
                longitude: deliveryAddress.longitude
            };
            db.saveCliente(updatedClient);
        }

        const orderId = Math.floor(Math.random() * 100000) + 1000;
        const total = getCartTotal();
        const method = paymentMethods.find(p => p.id === selectedPaymentId);

        const finalItems = [...cart];
        if (serviceType === TipoAtendimento.Delivery && deliveryAddress.bairroId) {
            const bairro = bairros.find(b => b.id === deliveryAddress.bairroId);
            if (bairro && bairro.taxaEntrega > 0) {
                finalItems.push({
                    produto: {
                        id: -999,
                        ativo: true,
                        tipo: 'Principal',
                        setor: 'Nenhum',
                        codigoInterno: 'TAXA',
                        codigoBarras: '',
                        nome: 'Taxa de Entrega',
                        preco: bairro.taxaEntrega,
                        custo: 0,
                        unidadeMedida: 'SV',
                        grupoProdutoId: 0
                    },
                    quantidade: 1
                });
            }
        }

        const pedido: Pedido = {
            id: orderId,
            data: new Date().toISOString(),
            tipoAtendimento: serviceType,
            clienteId: currentUser.id,
            clienteNome: currentUser.nome,
            total: total,
            status: PedidoStatus.AguardandoAprovacao, // IMPORTANT: New initial status
            statusCozinha: StatusCozinha.Aguardando,
            itens: finalItems,
            pagamentos: [],
            deliveryPagamentoMetodo: method?.nome,
            deliveryTrocoPara: changeFor ? parseFloat(changeFor) : undefined,
            enderecoEntrega: serviceType === 'Delivery' ? {
                logradouro: `${deliveryAddress.endereco}, ${deliveryAddress.numero}`,
                latitude: deliveryAddress.latitude,
                longitude: deliveryAddress.longitude
            } : undefined
        };

        db.savePedido(pedido);
        setActiveOrderId(orderId);
        setTrackedOrder(pedido);
        setView('WAITING_ACCEPTANCE');
    };

    // --- VIEWS ---

    if (view === 'LOGIN') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                    <Store size={40} className="text-white"/>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo(a)!</h1>
                <p className="text-gray-500 mb-8 text-center">Identifique-se para fazer seu pedido.</p>
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Seu Nome</label>
                        <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={20}/><input type="text" required value={loginName} onChange={e => setLoginName(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-xl outline-none" placeholder="Seu nome..."/></div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Seu Celular</label>
                        <div className="relative"><Phone className="absolute left-3 top-3 text-gray-400" size={20}/><input type="tel" required value={loginPhone} onChange={e => setLoginPhone(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-xl outline-none" placeholder="(00) 00000-0000"/></div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-transform">Acessar Cardápio</button>
                </form>
            </div>
        );
    }

    if (view === 'SERVICE_SELECT') {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Como deseja receber?</h2>
                <div className="space-y-4 max-w-sm mx-auto w-full">
                    <button onClick={() => { setServiceType(TipoAtendimento.Delivery); setView('MENU'); }} className="w-full p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 flex items-center justify-between group">
                        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Truck size={24} /></div><div className="text-left"><span className="block font-bold text-lg text-gray-800">Entrega</span><span className="text-sm text-gray-500">Receba em casa</span></div></div><ChevronRight className="text-gray-300 group-hover:text-blue-500"/>
                    </button>
                    <button onClick={() => { setServiceType(TipoAtendimento.Retirada); setView('MENU'); }} className="w-full p-6 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-orange-500 flex items-center justify-between group">
                        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><Store size={24} /></div><div className="text-left"><span className="block font-bold text-lg text-gray-800">Retirada</span><span className="text-sm text-gray-500">Busque no balcão</span></div></div><ChevronRight className="text-gray-300 group-hover:text-orange-500"/>
                    </button>
                </div>
            </div>
        );
    }

    // --- WAITING & TRACKING VIEWS ---

    if (view === 'WAITING_ACCEPTANCE' && trackedOrder) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                {showAcceptanceModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-sm animate-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32}/></div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido Aceito!</h2>
                            <p className="text-gray-500 mb-6">A loja confirmou seu pedido. Deseja acompanhar o preparo e a entrega em tempo real?</p>
                            <div className="space-y-3">
                                <button onClick={() => { setShowAcceptanceModal(false); setView('TRACKING'); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Sim, acompanhar agora</button>
                                <button onClick={() => { setShowAcceptanceModal(false); setCart([]); setView('MENU'); }} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Não, voltar ao início</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Clock size={48} className="text-blue-600"/>
                    </div>
                    {/* Spinner Ring */}
                    <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Aguardando Confirmação...</h1>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Enviamos seu pedido para a loja. Assim que eles aceitarem, você será notificado.</p>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Pedido</span>
                        <span className="text-sm font-bold text-gray-800">#{trackedOrder.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Total</span>
                        <span className="text-lg font-bold text-blue-600">R$ {trackedOrder.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'TRACKING' && trackedOrder) {
        const steps = [
            { status: StatusCozinha.Aguardando, label: 'Recebido', icon: FileText },
            { status: StatusCozinha.Preparando, label: 'Preparando', icon: Utensils },
            { status: StatusCozinha.Pronto, label: 'Pronto', icon: CheckCircle },
            { status: StatusCozinha.Entregue, label: 'Saiu p/ Entrega', icon: Truck }
        ];

        // Find current step index
        let currentStepIndex = 0;
        if (trackedOrder.statusCozinha === StatusCozinha.Preparando) currentStepIndex = 1;
        if (trackedOrder.statusCozinha === StatusCozinha.Pronto) currentStepIndex = 2;
        if (trackedOrder.statusCozinha === StatusCozinha.Entregue) currentStepIndex = 3;

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
                    <button onClick={() => { setCart([]); setView('MENU'); }} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button>
                    <h2 className="font-bold text-lg text-gray-800">Acompanhar Pedido #{trackedOrder.id}</h2>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Status Stepper */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between relative">
                            {/* Progress Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                            <div 
                                className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-1000"
                                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                            ></div>

                            {steps.map((step, idx) => {
                                const isActive = idx <= currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-green-500 text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-400'}`}>
                                            <step.icon size={18} />
                                        </div>
                                        <span className={`text-[10px] mt-2 font-bold ${isCurrent ? 'text-green-600' : 'text-gray-400'}`}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-gray-500 text-sm">Status Atual:</p>
                            <p className="text-xl font-bold text-gray-800 uppercase animate-pulse">{trackedOrder.statusCozinha}</p>
                        </div>
                    </div>

                    {/* Live Map */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><Map size={18}/> Localização em Tempo Real</h3>
                        <TrackingMap order={trackedOrder} status={trackedOrder.statusCozinha} />
                        {trackedOrder.statusCozinha === StatusCozinha.Entregue ? (
                            <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                                <AlertCircle size={16} /> O entregador está próximo!
                            </div>
                        ) : (
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-center gap-2">
                                <Clock size={16} /> Previsão de entrega: 30-40 min
                            </div>
                        )}
                    </div>

                    {/* Order Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-100 p-3 text-xs font-bold text-gray-500 uppercase">Resumo do Pedido</div>
                        <div className="p-4 space-y-2">
                            {trackedOrder.itens.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.quantidade}x {item.produto.nome}</span>
                                    <span className="font-bold">R$ {((item.produto.preco * item.quantidade) + (item.adicionais?.reduce((a,b)=>a+b.precoCobrado*item.quantidade,0)||0)).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>R$ {trackedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MENU VIEW (Same as before but filtered) ---
    const filteredProducts = products.filter(p => {
        if (!p.ativo || !p.disponivelTouch || p.tipo !== 'Principal') return false;
        if (activeGroupId !== 'ALL' && p.grupoProdutoId !== activeGroupId) return false;
        return true;
    });

    if (view === 'MENU') {
        return (
            <div className="min-h-screen bg-gray-50 pb-24">
                {/* Header */}
                <div className="bg-white sticky top-0 z-10 shadow-sm">
                    <div className="p-4 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg">Olá, {currentUser?.nome.split(' ')[0]}</h2>
                            <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" onClick={() => setView('SERVICE_SELECT')}>
                                {serviceType === TipoAtendimento.Delivery ? <Truck size={12}/> : <Store size={12}/>}
                                <span className="uppercase font-bold">{serviceType}</span>
                                <span className="underline ml-1">Alterar</span>
                            </div>
                        </div>
                        {cart.length > 0 && (
                            <div className="relative cursor-pointer" onClick={() => setView('CART')}>
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                    <ShoppingCart size={24}/>
                                </div>
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                    {cart.length}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
                        <button 
                            onClick={() => setActiveGroupId('ALL')}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeGroupId === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            Todos
                        </button>
                        {groups.filter(g => g.ativo).map(g => (
                            <button 
                                key={g.id} 
                                onClick={() => setActiveGroupId(g.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeGroupId === g.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                {g.nome}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products List */}
                <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4" onClick={() => openProductModal(product)}>
                            <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0 overflow-hidden">
                                {product.imagem ? (
                                    <img src={product.imagem} alt={product.nome} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Utensils size={24}/>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">{product.nome}</h3>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">Delicioso e preparado na hora.</p>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-bold text-lg text-blue-600">R$ {product.preco.toFixed(2)}</span>
                                    <button className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                        <Plus size={18}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Floating Cart Summary if items exist */}
                {cart.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20">
                        <div className="max-w-md mx-auto flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Total (Estimado)</p>
                                <p className="text-xl font-extrabold text-gray-800">R$ {getCartTotal().toFixed(2)}</p>
                            </div>
                            <button onClick={() => setView('CART')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 flex items-center gap-2">
                                Ver Carrinho <ChevronRight size={20}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* Addon Modal */}
                {itemModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
                        <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{itemModal.product.nome}</h3>
                                    <p className="text-xs text-gray-500">R$ {itemModal.product.preco.toFixed(2)}</p>
                                </div>
                                <button onClick={() => setItemModal(null)} className="bg-gray-200 p-1.5 rounded-full"><X size={20}/></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4">
                                {itemModal.config ? (
                                    <>
                                        <div className="bg-blue-50 text-blue-800 text-xs font-bold p-3 rounded-lg mb-4">
                                            Escolha seus complementos. Até {itemModal.config.cobrarApartirDe} itens padrão grátis!
                                        </div>
                                        <div className="space-y-2">
                                            {itemModal.config.itens.map(rule => {
                                                const p = products.find(x => x.id === rule.produtoComplementoId);
                                                if(!p) return null;
                                                const qty = addonQuantities[p.id] || 0;
                                                return (
                                                    <div key={p.id} className={`flex justify-between items-center p-3 rounded-xl border ${qty > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                                        <div>
                                                            <div className="font-bold text-sm text-gray-800">{p.nome}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {rule.cobrarSempre ? `+ R$ ${p.preco.toFixed(2)}` : 'Grátis*'}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {qty > 0 && (
                                                                <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: qty - 1}))} className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><Minus size={16}/></button>
                                                            )}
                                                            {qty > 0 && <span className="font-bold w-4 text-center">{qty}</span>}
                                                            <button onClick={() => setAddonQuantities(prev => ({...prev, [p.id]: qty + 1}))} className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Plus size={16}/></button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-10 text-gray-400">Sem opcionais para este item.</div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100">
                                <button onClick={confirmAddons} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-md">Adicionar ao Pedido</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- CART / CHECKOUT VIEW ---
    if (view === 'CART') {
        const total = getCartTotal();
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                    <button onClick={() => setView('MENU')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24}/></button>
                    <h2 className="font-bold text-xl text-gray-800">Finalizar Pedido</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-100 p-3 text-xs font-bold text-gray-500 uppercase">Itens do Pedido</div>
                        <div className="divide-y divide-gray-100">
                            {cart.map((item, idx) => (
                                <div key={idx} className="p-3 flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="font-bold text-gray-400 text-sm mt-0.5">{item.quantidade}x</div>
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{item.produto.nome}</div>
                                            {item.adicionais && item.adicionais.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {item.adicionais.map(a => `+ ${a.nome}`).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="font-bold text-sm text-gray-800">
                                            R$ {((item.produto.preco * item.quantidade) + (item.adicionais?.reduce((a,b) => a + b.precoCobrado * item.quantidade, 0) || 0)).toFixed(2)}
                                        </span>
                                        <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 text-xs underline">Remover</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery Info */}
                    {serviceType === TipoAtendimento.Delivery && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-100 p-3 text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                <MapPin size={14}/> Endereço de Entrega
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Bairro / Taxa</label>
                                    <select 
                                        value={deliveryAddress.bairroId} 
                                        onChange={e => setDeliveryAddress({...deliveryAddress, bairroId: Number(e.target.value)})}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                                    >
                                        <option value={0}>Selecione...</option>
                                        {bairros.filter(b => b.ativo).map(b => (
                                            <option key={b.id} value={b.id}>{b.nome} (+ R$ {b.taxaEntrega.toFixed(2)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="col-span-3">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Rua / Logradouro</label>
                                        <input type="text" value={deliveryAddress.endereco} onChange={e => setDeliveryAddress({...deliveryAddress, endereco: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: Av. Brasil"/>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Nº</label>
                                        <input type="text" value={deliveryAddress.numero} onChange={e => setDeliveryAddress({...deliveryAddress, numero: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="123"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Complemento</label>
                                    <input type="text" value={deliveryAddress.complemento} onChange={e => setDeliveryAddress({...deliveryAddress, complemento: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Apto 101..."/>
                                </div>
                                <div className="flex gap-2 items-center text-xs text-gray-500 mt-2">
                                    <Navigation size={12} />
                                    <span>
                                        Localização: {deliveryAddress.latitude ? 'Detectada' : 'Não detectada'} 
                                        ({deliveryAddress.latitude.toFixed(4)}, {deliveryAddress.longitude.toFixed(4)})
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-100 p-3 text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                            <Banknote size={14}/> Pagamento
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {paymentMethods.map(method => (
                                    <button 
                                        key={method.id}
                                        onClick={() => setSelectedPaymentId(method.id)}
                                        className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-1 transition-all ${selectedPaymentId === method.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        {method.nome.includes('Dinheiro') ? <Banknote size={20}/> : <CreditCard size={20}/>}
                                        {method.nome}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Change logic */}
                            {selectedPaymentId && paymentMethods.find(p => p.id === selectedPaymentId)?.nome.toLowerCase().includes('dinheiro') && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Troco para quanto? (Deixe vazio se não precisar)</label>
                                    <input type="number" value={changeFor} onChange={e => setChangeFor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ex: 50.00"/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Total & Action */}
                <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
                    <div className="flex justify-between items-center mb-4 text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-bold text-gray-800">R$ {cart.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0).toFixed(2)}</span>
                    </div>
                    {serviceType === TipoAtendimento.Delivery && (
                        <div className="flex justify-between items-center mb-4 text-sm">
                            <span className="text-gray-500">Taxa Entrega</span>
                            <span className="font-bold text-gray-800">R$ {bairros.find(b => b.id === deliveryAddress.bairroId)?.taxaEntrega.toFixed(2) || '0.00'}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-6 text-xl">
                        <span className="font-extrabold text-gray-800">Total Final</span>
                        <span className="font-extrabold text-blue-600">R$ {total.toFixed(2)}</span>
                    </div>
                    
                    <button 
                        onClick={handlePlaceOrder}
                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-colors"
                    >
                        Enviar Pedido
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default CustomerApp;
