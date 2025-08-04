import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Download, RotateCcw } from "lucide-react";
import { getSettings, saveSettings, resetSettings, exportData, UserSettings } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  onSettingsChange?: (settings: UserSettings) => void;
}

export function SettingsModal({ onSettingsChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings(settings);
    onSettingsChange?.(settings);
    toast({
      title: "✅ Settings Saved",
      description: "Your preferences have been successfully updated.",
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    resetSettings();
    const defaultSettings = getSettings();
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
    toast({
      title: "🔄 Settings Reset",
      description: "All settings have been restored to default.",
    });
  };

  const handleExport = () => {
    exportData();
    toast({
      title: "📊 Data Exported",
      description: "Backup download started.",
    });
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Analysis Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Analysis Parameters</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lookback">Lookback Period</Label>
                <Input
                  id="lookback"
                  type="number"
                  min="10"
                  max="50"
                  value={settings.lookbackPeriod}
                  onChange={(e) => updateSetting('lookbackPeriod', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  How many candles to use for swing identification (10-50)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sensitivity">Zone Sensitivity</Label>
                <Select 
                  value={settings.zoneSensitivity} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => updateSetting('zoneSensitivity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (fewer zones)</SelectItem>
                    <SelectItem value="medium">Medium (balanced)</SelectItem>
                    <SelectItem value="high">High (more zones)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trading-profile">Trading Profile</Label>
              <Select 
                value={settings.tradingProfile} 
                onValueChange={(value: 'scalp' | 'balanced' | 'swing') => updateSetting('tradingProfile', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scalp">🔥 Scalp/Aggressive (R/R: 0.3-1.5, Close zones)</SelectItem>
                  <SelectItem value="balanced">⚖️ Balanced/Medium (R/R: 1.0-3.0, Mixed zones)</SelectItem>
                  <SelectItem value="swing">🛡️ Swing/Conservative (R/R: 2.0+, Quality zones)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Scalp: Fast trades, close zones, accepts tested zones. 
                Swing: High probability, distant zones, avoids tested zones.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-timeframe">Default Timeframe</Label>
              <Select 
                value={settings.defaultTimeframe} 
                onValueChange={(value) => updateSetting('defaultTimeframe', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="4h">4 hours</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Trading Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Trading Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account-size">Account Capital (USD)</Label>
                <Input
                  id="account-size"
                  type="number"
                  min="100"
                  value={settings.accountSize}
                  onChange={(e) => updateSetting('accountSize', Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="risk-percentage">Risk per Trade (%)</Label>
                <Input
                  id="risk-percentage"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={settings.riskPercentage}
                  onChange={(e) => updateSetting('riskPercentage', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* App Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">App Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alerts">Zone Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications when price approaches zones
                </p>
              </div>
              <Switch
                id="alerts"
                checked={settings.alertsEnabled}
                onCheckedChange={(checked) => updateSetting('alertsEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Update analysis automatically
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
              />
            </div>

            {settings.autoRefresh && (
              <div className="space-y-2">
                <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  min="30"
                  max="300"
                  value={settings.refreshInterval}
                  onChange={(e) => updateSetting('refreshInterval', Number(e.target.value))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="font-medium">Data Management</h3>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export Backup
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Settings
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}