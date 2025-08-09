import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, Heart, Activity, Bitcoin, TrendingUp } from 'lucide-react';
import { BitcoinIcon } from '@/components/BitcoinIcon';
import { PriceDisplay } from '@/components/PriceDisplay';
import { BiasCard } from '@/components/BiasCard';
import { TradePlans } from '@/components/TradePlans';
import { ZonesCard } from '@/components/ZonesCard';
import { DebugCard } from '@/components/DebugCard';
import { WyckoffAnalysis } from '@/components/WyckoffAnalysis';
import { AboutModal } from '@/components/AboutModal';
import { DonateModal } from '@/components/DonateModal';
import { AlertsCard } from '@/components/AlertsCard';
import { MultiTimeframeAnalysis } from '@/components/MultiTimeframeAnalysis';
import { PositionSizingCard } from '@/components/PositionSizingCard';
import { PerformanceHistory } from '@/components/PerformanceHistory';
import { SettingsModal } from '@/components/SettingsModal';
import { BitcoinAPI } from '@/services/api';
import { SMCAnalyzer, SMCAnalysis } from '@/services/smc';
import { useToast } from '@/hooks/use-toast';
import { usePerformance } from '@/hooks/usePerformance';
import { getSettings, UserSettings } from '@/utils/storage';

const Index = () => {
  const [timeframe, setTimeframe] = useState('1h');
  const [analysis, setAnalysis] = useState<SMCAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const { toast } = useToast();
  const { addRecord } = usePerformance();

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    
    try {
      const candles = await BitcoinAPI.fetchCandles(timeframe);
      const result = SMCAnalyzer.analyze(candles, timeframe);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Get current price from latest candle
      const latestPrice = candles[candles.length - 1]?.c || 0;
      setCurrentPrice(latestPrice);
      
      setAnalysis(result);
      
      // Add to performance history
      addRecord(result, timeframe, latestPrice);
      
      toast({
        title: "✅ Análise Concluída",
        description: `Market analyzed on ${timeframe.toUpperCase()} timeframe`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: "Analysis error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAnalyze();
  }, [timeframe]);

  useEffect(() => {
    const currentSettings = getSettings();
    setTimeframe(currentSettings.defaultTimeframe);
  }, []);

  // Auto refresh if enabled
  useEffect(() => {
    if (!settings.autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading) {
        handleAnalyze();
      }
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval, loading]);

  const handleSettingsChange = (newSettings: UserSettings) => {
    setSettings(newSettings);
    if (newSettings.defaultTimeframe !== timeframe) {
      setTimeframe(newSettings.defaultTimeframe);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-card pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <header className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <BitcoinIcon className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Sir BAP AI
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Smart Money Concepts Analysis for Bitcoin (BTC)
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              SMC v2.3
            </Badge>
            <Badge variant="secondary">Live Data</Badge>
          </div>
        </header>

        {/* Price Display */}
        {analysis && (
          <PriceDisplay analysis={analysis} />
        )}

        {/* Controls */}
        <Card className="p-6 bg-gradient-to-r from-card to-background border border-border">
          <div className="flex flex-col gap-6 md:gap-4">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Select Timeframe
                  </label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-40 md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="30m">30 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleAnalyze} disabled={loading} size="lg" className="px-8">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Market...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Update Analysis
                    </>
                  )}
                </Button>

                <SettingsModal onSettingsChange={handleSettingsChange} />
              </div>

              <div className="flex items-center justify-center gap-3">
                {settings.autoRefresh && (
                  <Badge variant="secondary" className="text-xs">
                    🔄 Auto: {settings.refreshInterval}s
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              📊 Real-time data powered by <span className="font-semibold">Hyperliquid</span>
            </p>
          </div>
        </Card>


        {/* Loading State */}
        {loading && (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-primary font-semibold">🧠 Analyzing the market...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Processing {timeframe.toUpperCase()} timeframe data
            </p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-destructive/50 bg-destructive/10">
            <div className="text-center">
              <h3 className="font-semibold text-destructive mb-2">❌ Analysis Error</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAnalyze}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <div className="space-y-6">
            <BiasCard analysis={analysis} />

            <ZonesCard analysis={analysis} />

            {/* Wyckoff Analysis for Sideways Markets */}
            {analysis.wyckoffAnalysis && (
              <WyckoffAnalysis 
                analysis={analysis.wyckoffAnalysis} 
                currentPrice={currentPrice} 
              />
            )}

            <TradePlans analysis={analysis} />

            {/* New Enhanced Features */}
            <div className="grid gap-6 lg:grid-cols-2">
              <AlertsCard analysis={analysis} currentPrice={currentPrice} />
              <PositionSizingCard analysis={analysis} currentPrice={currentPrice} />
            </div>

            {/* Debug Information */}
            {(settings.debugMode && (analysis.debugInfo || analysis.confluences)) && (
              <DebugCard analysis={analysis} />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <MultiTimeframeAnalysis currentTimeframe={timeframe} />
              <PerformanceHistory />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 pb-4 space-y-4">
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAboutModalOpen(true)}
            >
              <Info className="w-4 h-4 mr-2" />
              About
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDonateModalOpen(true)}
              className="text-primary border-primary hover:bg-primary/10"
            >
              <Heart className="w-4 h-4 mr-2" />
              Donate BTC
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Sir BAP AI - Educational Technical Analysis Tool
            </p>
            <p className="text-xs text-muted-foreground">
              ⚠️ Trading involves risks. Do your own analysis.
            </p>
          </div>
        </footer>

        {/* Modals */}
        <AboutModal 
          isOpen={aboutModalOpen} 
          onClose={() => setAboutModalOpen(false)} 
        />
        <DonateModal 
          isOpen={donateModalOpen} 
          onClose={() => setDonateModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default Index;