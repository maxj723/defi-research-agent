import { useState, useEffect } from 'react';
import { Settings, MessageSquare, Wallet, Bell, BarChart3, AlertCircle } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import WalletManager from './components/WalletManager';
import AlertsPanel from './components/AlertsPanel';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import SetupWizard from './components/SetupWizard';
import { api } from './api';
import './App.css';

type View = 'chat' | 'wallets' | 'alerts' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const checkBackendConnection = async () => {
    const connected = await api.healthCheck();
    setIsBackendConnected(connected);
  };

  return (
    <div className="app">
      {/* Connection Banner */}
      {!isBackendConnected && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>Backend not connected. Run <code className="bg-black/30 px-2 py-0.5 rounded font-mono">npm run dev</code> in the project directory.</span>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="text-xs px-3 py-1 bg-red-400 text-black rounded hover:bg-red-500 font-semibold"
          >
            Setup Guide
          </button>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">
            <span className="text-primary">DeFi</span> Intelligence Agent
          </h1>
          <div className="flex items-center gap-2">
            {isBackendConnected && (
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                Connected
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="icon-button"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <button
          onClick={() => setCurrentView('chat')}
          className={`nav-button ${currentView === 'chat' ? 'active' : ''}`}
        >
          <MessageSquare size={20} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setCurrentView('wallets')}
          className={`nav-button ${currentView === 'wallets' ? 'active' : ''}`}
        >
          <Wallet size={20} />
          <span>Wallets</span>
        </button>
        <button
          onClick={() => setCurrentView('alerts')}
          className={`nav-button ${currentView === 'alerts' ? 'active' : ''}`}
        >
          <Bell size={20} />
          <span>Alerts</span>
          {unreadAlerts > 0 && (
            <span className="badge">{unreadAlerts}</span>
          )}
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
        >
          <BarChart3 size={20} />
          <span>Dashboard</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'chat' && <ChatInterface />}
        {currentView === 'wallets' && <WalletManager />}
        {currentView === 'alerts' && (
          <AlertsPanel onUnreadCountChange={setUnreadAlerts} />
        )}
        {currentView === 'dashboard' && <Dashboard />}
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showSetup && (
        <SetupWizard onComplete={() => setShowSetup(false)} />
      )}
    </div>
  );
}

export default App;
