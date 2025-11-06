import { useState, useEffect } from 'react';
import { TrendingUp, Wallet, Bell, Activity, Loader2 } from 'lucide-react';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalAlerts: 0,
    unreadAlerts: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [wallets, alerts] = await Promise.all([
        api.getWallets(),
        api.getAlerts({ limit: 100 }),
      ]);

      const unread = alerts.filter((a) => !a.readStatus).length;
      const totalProfit = wallets.reduce(
        (sum, w) => sum + (w.profitHistory?.total || 0),
        0
      );

      setStats({
        totalWallets: wallets.length,
        totalAlerts: alerts.length,
        unreadAlerts: unread,
        totalProfit,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Monitored Wallets',
      value: stats.totalWallets,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Alerts',
      value: stats.totalAlerts,
      icon: Bell,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Unread Alerts',
      value: stats.unreadAlerts,
      icon: Activity,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      label: 'Combined Profit',
      value: `$${stats.totalProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">
          Overview of your monitored wallets and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 bg-darker hover:bg-black rounded-lg transition-colors text-sm">
              → Add new wallet to monitor
            </button>
            <button className="w-full text-left px-4 py-2 bg-darker hover:bg-black rounded-lg transition-colors text-sm">
              → Analyze a project
            </button>
            <button className="w-full text-left px-4 py-2 bg-darker hover:bg-black rounded-lg transition-colors text-sm">
              → Search profitable wallets
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-3">Getting Started</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              <span>Add wallets you want to monitor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              <span>Configure alert preferences for each wallet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              <span>Use the chat to analyze projects and contracts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">4.</span>
              <span>Receive real-time alerts when wallets trade</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
