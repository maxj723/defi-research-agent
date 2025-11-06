// Configuration management
const STORAGE_KEY = 'defi-agent-settings';

// Default to localhost - users run `wrangler dev` locally
export const DEFAULT_SETTINGS = {
  backendUrl: 'http://localhost:8787',
  userId: 'user-' + Math.random().toString(36).substr(2, 9),
  autoConnect: true,
  soundEnabled: true,
  desktopNotifications: true,
};

export function getSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export function isBackendConfigured() {
  // Always return true since we default to localhost
  return true;
}

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_SETTINGS;
}
