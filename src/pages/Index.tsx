import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, Heart } from 'lucide-react';
import { BitcoinIcon } from '@/components/BitcoinIcon';
import { PriceDisplay } from '@/components/PriceDisplay';
import { BiasCard } from '@/components/BiasCard';
import { TradePlans } from '@/components/TradePlans';
import { ZonesCard } from '@/components/ZonesCard';
import { AboutModal } from '@/components/AboutModal';
import { DonateModal } from '@/components/DonateModal';
import { BitcoinAPI } from '@/services/api';
import { SMCAnalyzer, SMCAnalysis } from '@/services/smc';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [timeframe, setTimeframe] = useState('1h');
  const [analysis, setAnalysis] = useState<SMCAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const { toast } = useToast();

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
      
      setAnalysis(result);
      toast({
        title: "Analysis completed!",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-card pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BitcoinIcon className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Sir BAP AI
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Smart Money Concepts Analysis for Bitcoin (BTC)
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              SMC v2.3
            </Badge>
            <Badge variant="secondary">
              Live Data
            </Badge>
          </div>
        </header>

        {/* Controls */}
        <Card className="p-6 bg-gradient-to-r from-card to-background border border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Timeframe
                </label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-40">
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
              
              <Button onClick={handleAnalyze} disabled={loading} className="mt-6">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Update Analysis'
                )}
              </Button>
            </div>

            <div className="flex gap-2">
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
          </div>
        </Card>

        {/* Price Display */}
        {analysis && (
          <PriceDisplay price={analysis.currentPrice} />
        )}

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
            <BiasCard
              bias={analysis.bias}
              lastEvent={analysis.lastEvent}
              breakLevel={analysis.breakLevel}
              timeframe={analysis.timeframe}
              probability={analysis.probability}
              strength={analysis.strength}
            />

            <TradePlans
              buyPlan={analysis.buyPlan}
              sellPlan={analysis.sellPlan}
            />

            <ZonesCard
              demandZone={analysis.demandZone}
              supplyZone={analysis.supplyZone}
              bullishFVG={analysis.bullishFVG}
              bearishFVG={analysis.bearishFVG}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 pb-4">
          <p className="text-xs text-muted-foreground">
            Sir BAP AI - Educational Technical Analysis Tool
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ⚠️ Trading involves risks. Do your own analysis.
          </p>
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