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
      title: "✅ Configurações Salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    resetSettings();
    const defaultSettings = getSettings();
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
    toast({
      title: "🔄 Configurações Resetadas",
      description: "Todas as configurações foram restauradas ao padrão.",
    });
  };

  const handleExport = () => {
    exportData();
    toast({
      title: "📊 Dados Exportados",
      description: "Download do backup iniciado.",
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
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Avançadas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Analysis Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Parâmetros de Análise</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lookback">Período de Lookback</Label>
                <Input
                  id="lookback"
                  type="number"
                  min="10"
                  max="50"
                  value={settings.lookbackPeriod}
                  onChange={(e) => updateSetting('lookbackPeriod', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Quantos candles usar para identificar swings (10-50)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sensitivity">Sensibilidade das Zonas</Label>
                <Select 
                  value={settings.zoneSensitivity} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => updateSetting('zoneSensitivity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (menos zonas)</SelectItem>
                    <SelectItem value="medium">Média (balanceado)</SelectItem>
                    <SelectItem value="high">Alta (mais zonas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-timeframe">Timeframe Padrão</Label>
              <Select 
                value={settings.defaultTimeframe} 
                onValueChange={(value) => updateSetting('defaultTimeframe', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15 minutos</SelectItem>
                  <SelectItem value="30m">30 minutos</SelectItem>
                  <SelectItem value="1h">1 hora</SelectItem>
                  <SelectItem value="4h">4 horas</SelectItem>
                  <SelectItem value="1d">1 dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Trading Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Configurações de Trading</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account-size">Capital da Conta (USD)</Label>
                <Input
                  id="account-size"
                  type="number"
                  min="100"
                  value={settings.accountSize}
                  onChange={(e) => updateSetting('accountSize', Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="risk-percentage">Risco por Trade (%)</Label>
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
            <h3 className="font-medium">Configurações do App</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alerts">Alertas de Zonas</Label>
                <p className="text-xs text-muted-foreground">
                  Receber notificações quando preço se aproxima de zonas
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
                  Atualizar análise automaticamente
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
                <Label htmlFor="refresh-interval">Intervalo de Refresh (segundos)</Label>
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
              <Label htmlFor="theme">Tema</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="font-medium">Gerenciamento de Dados</h3>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Exportar Backup
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar Tudo
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Salvar Configurações
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}