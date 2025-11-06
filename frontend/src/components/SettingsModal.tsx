import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { getSettings, saveSettings } from '../config';
import { api } from '../api';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const currentSettings = getSettings();
  const [backendUrl, setBackendUrl] = useState(currentSettings.backendUrl);
  const [userId, setUserId] = useState(currentSettings.userId);
  const [autoConnect, setAutoConnect] = useState(currentSettings.autoConnect);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const url = backendUrl.replace(/\/$/, '');
      const response = await fetch(`${url}/health`);

      if (response.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const newSettings = {
      ...currentSettings,
      backendUrl: backendUrl.replace(/\/$/, ''),
      userId,
      autoConnect,
    };
    saveSettings(newSettings);
    api.updateConfig();
    alert('Settings saved! Refresh the page to apply changes.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Backend Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Backend Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Backend URL *
                </label>
                <input
                  type="url"
                  value={backendUrl}
                  onChange={(e) => {
                    setBackendUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="https://your-agent.your-subdomain.workers.dev"
                  className="w-full px-4 py-2 bg-darker border border-border rounded-lg focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your deployed Cloudflare Worker URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-4 py-2 bg-darker border border-border rounded-lg focus:border-primary focus:outline-none font-mono"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your unique identifier (automatically generated)
                </p>
              </div>

              <button
                onClick={handleTest}
                disabled={!backendUrl || testing}
                className="w-full px-4 py-2 bg-darker border border-border rounded-lg hover:border-primary disabled:opacity-50 transition-colors"
              >
                {testing ? 'Testing Connection...' : 'Test Connection'}
              </button>

              {testResult === 'success' && (
                <div className="flex items-center gap-2 text-secondary text-sm bg-secondary/10 px-3 py-2 rounded-lg">
                  <AlertCircle size={16} />
                  Connection successful!
                </div>
              )}

              {testResult === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
                  <AlertCircle size={16} />
                  Connection failed. Check the URL and try again.
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoConnect}
                  onChange={(e) => setAutoConnect(e.target.checked)}
                  className="w-4 h-4"
                />
                <div>
                  <span className="text-sm font-medium">Auto-connect to WebSocket</span>
                  <p className="text-xs text-gray-500">
                    Automatically connect for real-time alerts
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* About */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <div className="text-sm text-gray-400 space-y-2">
              <p>
                <strong>DeFi Intelligence Agent</strong> v1.0.0
              </p>
              <p>
                A comprehensive DeFi/NFT research platform built on Cloudflare Agents.
              </p>
              <p className="pt-2">
                <a
                  href="https://github.com/YOUR-USERNAME/cf_ai_defiresearch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View on GitHub
                </a>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-darker border border-border rounded-lg hover:bg-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
