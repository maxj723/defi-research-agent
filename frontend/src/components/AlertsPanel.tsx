import { useState, useEffect } from 'react';
import { CheckCheck, ExternalLink, Loader2, Filter } from 'lucide-react';
import { api } from '../api';
import type { Alert } from '../types';

interface AlertsPanelProps {
  onUnreadCountChange: (count: number) => void;
}

export default function AlertsPanel({ onUnreadCountChange }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    loadAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts({
        limit: 50,
        unreadOnly: filter === 'unread',
      });
      setAlerts(data);
      const unreadCount = data.filter((a) => !a.readStatus).length;
      onUnreadCountChange(unreadCount);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAlertsRead(undefined, true);
      setAlerts((prev) => prev.map((a) => ({ ...a, readStatus: true })));
      onUnreadCountChange(0);
    } catch (error) {
      console.error('Error marking alerts read:', error);
    }
  };

  const handleMarkRead = async (alertId: number) => {
    try {
      await api.markAlertsRead([alertId]);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, readStatus: true } : a))
      );
      const unreadCount = alerts.filter((a) => !a.readStatus && a.id !== alertId).length;
      onUnreadCountChange(unreadCount);
    } catch (error) {
      console.error('Error marking alert read:', error);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alerts</h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time notifications from monitored wallets
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 bg-card border border-border rounded-lg focus:border-primary focus:outline-none"
          >
            <option value="unread">Unread</option>
            <option value="all">All</option>
          </select>
          {alerts.some((a) => !a.readStatus) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:border-primary transition-colors"
            >
              <CheckCheck size={18} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Filter size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No alerts</h3>
          <p className="text-gray-400">
            {filter === 'unread'
              ? 'All caught up! No unread alerts.'
              : 'Start monitoring wallets to receive alerts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkRead={() => handleMarkRead(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onMarkRead }: { alert: Alert; onMarkRead: () => void }) {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'NEW_BUY':
        return 'text-secondary border-secondary/30 bg-secondary/10';
      case 'NEW_SELL':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'LARGE_TRANSFER':
        return 'text-primary border-primary/30 bg-primary/10';
      default:
        return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`bg-card border rounded-xl p-4 transition-all ${
        alert.readStatus
          ? 'border-border opacity-60'
          : 'border-border hover:border-primary'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full border ${getAlertColor(
                alert.alertType
              )}`}
            >
              {alert.alertType.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(alert.timestamp)}
            </span>
            {!alert.readStatus && (
              <span className="w-2 h-2 bg-primary rounded-full"></span>
            )}
          </div>

          <p className="text-sm text-gray-300 mb-2">{alert.details.notes}</p>

          {alert.details.token && (
            <div className="flex items-center gap-4 text-sm">
              <span className="font-mono text-primary">
                {alert.details.token.symbol}
              </span>
              <span className="text-gray-400">
                ${alert.details.token.usdValue.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <a
              href={`https://etherscan.io/tx/${alert.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View on Etherscan <ExternalLink size={12} />
            </a>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500 font-mono">
              {alert.walletAddress.slice(0, 6)}...{alert.walletAddress.slice(-4)}
            </span>
          </div>
        </div>

        {!alert.readStatus && (
          <button
            onClick={onMarkRead}
            className="text-gray-400 hover:text-primary transition-colors flex-shrink-0"
            title="Mark as read"
          >
            <CheckCheck size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
