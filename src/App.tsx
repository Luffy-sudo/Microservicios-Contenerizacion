import React, { useState, useEffect } from 'react';
import { CurrencyList } from './components/CurrencyList';
import { ExchangeRatesView } from './components/ExchangeRatesView';
import { CountryList } from './components/CountryList';
import { CurrencyConverter } from './components/CurrencyConverter';
import { ApiExplorer } from './components/ApiExplorer';
import { LoginModal } from './components/LoginModal';
import { SqlViewer } from './components/SqlViewer';
import { MicroservicesDelivery } from './components/MicroservicesDelivery';
import {
  Coins,
  TrendingUp,
  Globe,
  Calculator,
  Terminal,
  Database,
  Lock,
  LogOut,
  Shield,
  Server,
  Activity,
  Layers,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'microservicios' | 'monedas' | 'historico' | 'paises' | 'conversor' | 'api' | 'sql'>('microservicios');
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [selectedCurrencyForHistory, setSelectedCurrencyForHistory] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');

  // Check API health on start
  useEffect(() => {
    fetch('/api/info')
      .then((res) => {
        if (res.ok) setApiStatus('online');
        else setApiStatus('offline');
      })
      .catch(() => setApiStatus('offline'));

    // Check localStorage for saved session
    const savedToken = localStorage.getItem('moneda_jwt_token');
    const savedUser = localStorage.getItem('moneda_jwt_user');
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {}
    }
  }, []);

  const handleLoginSuccess = (newToken: string, user: any) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem('moneda_jwt_token', newToken);
    if (user) {
      localStorage.setItem('moneda_jwt_user', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('moneda_jwt_token');
    localStorage.removeItem('moneda_jwt_user');
  };

  const navigateToHistory = (id: number) => {
    setSelectedCurrencyForHistory(id);
    setActiveTab('historico');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  API Cambio de Monedas
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  {apiStatus === 'online' ? 'API Online' : 'API Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Servicios REST de Divisas, Tasas Históricas y Países
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white">{currentUser.nombre || currentUser.usuario}</p>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
                    <Shield className="w-3 h-3" />
                    {currentUser.roles || 'Usuario'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-950/40"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Iniciar Sesión (JWT)</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('microservicios')}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'microservicios'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Entrega Microservicios (Festivos & Calendario)
          </button>

          <button
            onClick={() => setActiveTab('monedas')}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'monedas'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            Monedas (177)
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'historico'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Histórico por Periodo
          </button>

          <button
            onClick={() => setActiveTab('paises')}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'paises'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Países & Capitales (249)
          </button>

          <button
            onClick={() => setActiveTab('conversor')}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'conversor'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Conversor de Divisas
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'api'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            API Explorer (20+ Endpoints)
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'sql'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Scripts SQL (DDL & DML)
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'microservicios' && <MicroservicesDelivery />}
        {activeTab === 'monedas' && (
          <CurrencyList token={token} onSelectCurrencyForHistory={navigateToHistory} />
        )}
        {activeTab === 'historico' && (
          <ExchangeRatesView selectedCurrencyId={selectedCurrencyForHistory} />
        )}
        {activeTab === 'paises' && <CountryList token={token} />}
        {activeTab === 'conversor' && <CurrencyConverter />}
        {activeTab === 'api' && (
          <ApiExplorer
            token={token}
            onSetToken={(newToken) => {
              setToken(newToken);
              localStorage.setItem('moneda_jwt_token', newToken);
            }}
          />
        )}
        {activeTab === 'sql' && <SqlViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            ITM - Proyecto API Cambio de Monedas • Migrado exitosamente a Node.js Runtime (Express + React)
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Port: 3000</span>
            <span>Host: 0.0.0.0</span>
            <span>Auth: JWT HS256</span>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
