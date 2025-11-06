import { useState } from 'react';
import { Rocket, Terminal, CheckCircle, AlertCircle } from 'lucide-react';
import { saveSettings, DEFAULT_SETTINGS } from '../config';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('http://localhost:8787/health');
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

  const handleComplete = () => {
    saveSettings(DEFAULT_SETTINGS);
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-darker flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Rocket className="text-primary" size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome to <span className="text-primary">DeFi</span> Intelligence Agent
          </h1>
          <p className="text-gray-400">
            Quick 2-step setup to get started
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            {/* Step 1: Clone & Setup */}
            <div className="bg-darker p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full text-sm">
                  1
                </span>
                Clone Repository & Setup
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Clone the repo and set up your API keys:
              </p>
              <div className="bg-black/30 p-4 rounded font-mono text-sm space-y-2 text-secondary">
                <div className="flex items-start gap-2">
                  <Terminal size={16} className="mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <div>$ git clone https://github.com/maxj723/defi-research-agent.git</div>
                    <div>$ cd defi-research-agent</div>
                    <div>$ npm install</div>
                    <div className="text-gray-400"># Copy example env file</div>
                    <div>$ cp .dev.vars.example .dev.vars</div>
                    <div className="text-gray-400"># Edit .dev.vars with your API keys</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-primary/10 border border-primary/30 rounded-lg p-4">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  API Keys Needed (Free Tier OK)
                </h4>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li>• <strong>Etherscan:</strong> <a href="https://etherscan.io/apis" target="_blank" className="text-primary hover:underline">etherscan.io/apis</a></li>
                  <li>• <strong>CoinGecko:</strong> <a href="https://www.coingecko.com/en/api" target="_blank" className="text-primary hover:underline">coingecko.com/en/api</a></li>
                  <li className="text-xs text-gray-500 mt-2">All keys stay LOCAL in your .dev.vars file - never shared!</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full px-6 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 font-semibold transition-colors"
            >
              Continue to Step 2 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Step 2: Start Backend */}
            <div className="bg-darker p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full text-sm">
                  2
                </span>
                Start Your Local Backend
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Run your backend locally (keeps API keys secure):
              </p>
              <div className="bg-black/30 p-4 rounded font-mono text-sm space-y-2 text-secondary">
                <div className="flex items-start gap-2">
                  <Terminal size={16} className="mt-1 flex-shrink-0" />
                  <div>$ npm run dev</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-400">
                  Your backend will be available at <code className="text-primary bg-primary/10 px-2 py-1 rounded">http://localhost:8787</code>
                </p>

                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg hover:border-primary disabled:opacity-50 transition-colors font-semibold"
                >
                  {testing ? 'Testing Connection...' : 'Test Backend Connection'}
                </button>

                {testResult === 'success' && (
                  <div className="flex items-center gap-2 text-secondary text-sm bg-secondary/10 px-4 py-3 rounded-lg">
                    <CheckCircle size={18} />
                    <div>
                      <div className="font-semibold">Connected successfully!</div>
                      <div className="text-xs text-gray-400 mt-1">Your local backend is running</div>
                    </div>
                  </div>
                )}

                {testResult === 'error' && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-lg">
                    <AlertCircle size={18} />
                    <div>
                      <div className="font-semibold">Connection failed</div>
                      <div className="text-xs text-gray-400 mt-1">Make sure you've run "npm run dev" in the project directory</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {testResult === 'success' && (
              <button
                onClick={handleComplete}
                className="w-full px-6 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Start Using the Agent
              </button>
            )}

            <button
              onClick={() => setStep(1)}
              className="w-full px-4 py-2 bg-darker border border-border rounded-lg hover:bg-black transition-colors"
            >
              ← Back to Step 1
            </button>
          </div>
        )}

        {/* Help Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-gray-500">
            Need help? Check the{' '}
            <a
              href="https://github.com/maxj723/defi-research-agent#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              README
            </a>
            {' '}or{' '}
            <a
              href="https://github.com/maxj723/defi-research-agent/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              open an issue
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
