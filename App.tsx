import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, DollarSign, Menu, X, Store, Package, Users, Folder, CreditCard, Layers } from 'lucide-react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import CashControl from './components/CashControl';
import Products from './components/Products';
import Clients from './components/Clients';
import PaymentMethods from './components/PaymentMethods';
import AddonConfig from './components/AddonConfig';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
           {sidebarOpen && <div className="flex items-center gap-2 text-blue-700 font-bold text-lg"><Store /> <span>DeliverySys</span></div>}
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-md text-gray-500">
             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink to="/" icon={LayoutDashboard} label={sidebarOpen ? "Dashboard" : ""} />
          <SidebarLink to="/vendas" icon={ShoppingCart} label={sidebarOpen ? "PDV / Vendas" : ""} />
          <SidebarLink to="/caixa" icon={DollarSign} label={sidebarOpen ? "Gestão de Caixa" : ""} />
          
          {/* Cadastros Section */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            {sidebarOpen && <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cadastros</h3>}
            <SidebarLink to="/produtos" icon={Package} label={sidebarOpen ? "Produtos" : ""} />
            <SidebarLink to="/config-adicionais" icon={Layers} label={sidebarOpen ? "Config. Adicionais" : ""} />
            <SidebarLink to="/clientes" icon={Users} label={sidebarOpen ? "Clientes" : ""} />
            <SidebarLink to="/formas-pagamento" icon={CreditCard} label={sidebarOpen ? "Formas de Pagamento" : ""} />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
            {sidebarOpen && <p className="text-xs text-gray-400 text-center">Version 1.0 (React Migration)</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
           <h2 className="text-gray-700 font-medium">Bem vindo, <b>Admin</b></h2>
           <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">A</div>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
           {children}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendas" element={<POS />} />
          <Route path="/caixa" element={<CashControl />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/config-adicionais" element={<AddonConfig />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/formas-pagamento" element={<PaymentMethods />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;