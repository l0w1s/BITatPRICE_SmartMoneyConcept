export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  lookbackPeriod: number;
  zoneSensitivity: 'low' | 'medium' | 'high';
  alertsEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultTimeframe: string;
  riskPercentage: number;
  accountSize: number;
  tradingProfile: 'scalp' | 'balanced' | 'swing';
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  lookbackPeriod: 20,
  zoneSensitivity: 'medium',
  alertsEnabled: true,
  autoRefresh: false,
  refreshInterval: 60,
  defaultTimeframe: '1h',
  riskPercentage: 2,
  accountSize: 10000,
  tradingProfile: 'balanced'
};

export const getSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem('btc-smc-settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: Partial<UserSettings>): void => {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('btc-smc-settings', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const resetSettings = (): void => {
  localStorage.removeItem('btc-smc-settings');
};

export const exportData = () => {
  const settings = getSettings();
  const performance = localStorage.getItem('btc-smc-performance');
  
  const exportData = {
    settings,
    performance: performance ? JSON.parse(performance) : [],
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `btc-smc-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};