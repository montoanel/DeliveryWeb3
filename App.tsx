import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, DollarSign, Menu, X, Store, Package, Users, Folder, CreditCard, Layers, UserCog, LogOut, User as UserIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import CashControl from './components/CashControl';
import Products from './components/Products';
import Clients from './components/Clients';
import PaymentMethods from './components/PaymentMethods';
import AddonConfig from './components/AddonConfig';
import UsersComponent from './components/Users';
import Login from './components/Login';
import { Usuario } from './types';

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

interface LayoutProps {
  children: React.ReactNode;
  user: Usuario | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
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
            <SidebarLink to="/usuarios" icon={UserCog} label={sidebarOpen ? "Usuários" : ""} />
          </div>
        </nav>

        {/* User / Logout Section in Sidebar Bottom */}
        <div className="p-4 border-t border-gray-100">
            <button 
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
            >
               <LogOut size={20} />
               {sidebarOpen && <span className="font-medium">Sair do Sistema</span>}
            </button>
            {sidebarOpen && <p className="text-xs text-gray-400 text-center mt-4">Version 1.0 (React Migration)</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
           <h2 className="text-gray-700 font-medium">
             Bem vindo, <b>{user?.nome || 'Usuário'}</b>
           </h2>
           <div className="flex items-center gap-4">
             <div className="flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-gray-500 uppercase">{user?.perfil}</span>
                <span className="text-sm text-gray-800 font-medium">{user?.login}</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                <UserIcon size={20} />
             </div>
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
  const [user, setUser] = useState<Usuario | null>(null);

  const handleLoginSuccess = (loggedInUser: Usuario) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendas" element={<POS />} />
          <Route path="/caixa" element={<CashControl />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/config-adicionais" element={<AddonConfig />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/formas-pagamento" element={<PaymentMethods />} />
          <Route path="/usuarios" element={<UsersComponent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;