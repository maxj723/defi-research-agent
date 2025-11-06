import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';
import { api } from '../api';
import type { WalletMonitor } from '../types';

export default function WalletManager() {
  const [wallets, setWallets] = useState<WalletMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const data = await api.getWallets();
      setWallets(data);
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (address: string) => {
    if (!confirm('Remove this wallet from monitoring?')) return;

    try {
      await api.removeWallet(address);
      setWallets((prev) => prev.filter((w) => w.address !== address));
    } catch (error) {
      alert('Error removing wallet: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitored Wallets</h2>
          <p className="text-gray-400 text-sm mt-1">
            Track profitable traders and get real-time alerts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 font-semibold transition-colors"
        >
          <Plus size={20} />
          Add Wallet
        </button>
      </div>

      {/* Wallets Grid */}
      {wallets.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Activity size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No wallets monitored yet</h3>
          <p className="text-gray-400 mb-6">
            Add a wallet to start receiving real-time trade alerts
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 font-semibold transition-colors"
          >
            <Plus size={20} />
            Add Your First Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.address}
              wallet={wallet}
              onRemove={() => handleRemove(wallet.address)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddWalletModal
          onClose={() => setShowAddModal(false)}
          onAdd={(wallet) => {
            setWallets((prev) => [...prev, wallet]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function WalletCard({
  wallet,
  onRemove,
}: {
  wallet: WalletMonitor;
  onRemove: () => void;
}) {
  const profit = wallet.profitHistory?.total || 0;
  const roi = wallet.profitHistory?.roi || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">
            {wallet.nickname || 'Unknown Wallet'}
          </h3>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-400 transition-colors"
          title="Remove wallet"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {wallet.profitHistory ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Profit</span>
            <span
              className={`font-semibold ${
                profit >= 0 ? 'text-secondary' : 'text-red-400'
              }`}
            >
              {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">ROI</span>
            <span
              className={`flex items-center gap-1 font-semibold ${
                roi >= 0 ? 'text-secondary' : 'text-red-400'
              }`}
            >
              {roi >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {roi.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Win Rate</span>
            <span className="font-semibold">
              {wallet.profitHistory.winRate.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Trades</span>
            <span className="font-semibold">{wallet.profitHistory.trades}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          Analyzing wallet...
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Alerts: {wallet.alertPreferences.enabled ? '✓ On' : '✗ Off'}
          </span>
          <span>Min: ${wallet.alertPreferences.minTradeSize}</span>
        </div>
      </div>
    </div>
  );
}

function AddWalletModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (wallet: WalletMonitor) => void;
}) {
  const [address, setAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [minTradeSize, setMinTradeSize] = useState(100);
  const [alertTypes, setAlertTypes] = useState(['NEW_BUY', 'NEW_SELL']);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.addWallet({
        walletAddress: address,
        nickname: nickname || undefined,
        alertPreferences: {
          enabled: true,
          minTradeSize,
          specificTokens: [],
          alertTypes,
        },
      });

      // Fetch the added wallet
      const wallets = await api.getWallets();
      const addedWallet = wallets.find((w) => w.address.toLowerCase() === address.toLowerCase());

      if (addedWallet) {
        onAdd(addedWallet);
      }
    } catch (error) {
      alert('Error adding wallet: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Add Wallet to Monitor</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Wallet Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              required
              pattern="^0x[a-fA-F0-9]{40}$"
              className="w-full px-3 py-2 bg-darker border border-border rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Nickname (optional)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Vitalik"
              className="w-full px-3 py-2 bg-darker border border-border rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Trade Size ($)
            </label>
            <input
              type="number"
              value={minTradeSize}
              onChange={(e) => setMinTradeSize(Number(e.target.value))}
              min="0"
              className="w-full px-3 py-2 bg-darker border border-border rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alert Types</label>
            <div className="space-y-2">
              {['NEW_BUY', 'NEW_SELL', 'LARGE_TRANSFER', 'CONTRACT_INTERACTION'].map(
                (type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={alertTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAlertTypes([...alertTypes, type]);
                        } else {
                          setAlertTypes(alertTypes.filter((t) => t !== type));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{type.replace('_', ' ')}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-darker border border-border rounded-lg hover:bg-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !address}
              className="flex-1 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? 'Adding...' : 'Add Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
