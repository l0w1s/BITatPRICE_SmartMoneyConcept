import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SMCAnalyzer, SMCAnalysis } from "@/services/smc";
import { BitcoinAPI } from "@/services/api";

interface TimeframeAnalysis {
  timeframe: string;
  analysis: SMCAnalysis | null;
  loading: boolean;
  error: string | null;
}

interface MultiTimeframeAnalysisProps {
  currentTimeframe: string;
}

const TIMEFRAMES = ['15m', '1h', '4h', '1d'];

export function MultiTimeframeAnalysis({ currentTimeframe }: MultiTimeframeAnalysisProps) {
  const [analyses, setAnalyses] = useState<TimeframeAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setAnalyses(TIMEFRAMES.map(tf => ({
      timeframe: tf,
      analysis: null,
      loading: false,
      error: null
    })));
  }, []);

  const analyzeAllTimeframes = async () => {
    setIsAnalyzing(true);
    
    const updatedAnalyses = await Promise.all(
      TIMEFRAMES.map(async (timeframe) => {
        try {
          setAnalyses(prev => prev.map(a => 
            a.timeframe === timeframe ? { ...a, loading: true, error: null } : a
          ));

          const candles = await BitcoinAPI.fetchCandles(timeframe);
          const result = SMCAnalyzer.analyze(candles, timeframe);
          
          if ('error' in result) {
            return {
              timeframe,
              analysis: null,
              loading: false,
              error: result.error
            };
          }

          return {
            timeframe,
            analysis: result,
            loading: false,
            error: null
          };
        } catch (error) {
          return {
            timeframe,
            analysis: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          };
        }
      })
    );

    setAnalyses(updatedAnalyses);
    setIsAnalyzing(false);
  };

  const getBiasIcon = (bias: string) => {
    switch (bias.toLowerCase()) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getBiasColor = (bias: string) => {
    switch (bias.toLowerCase()) {
      case 'bullish': return 'default';
      case 'bearish': return 'destructive';
      default: return 'secondary';
    }
  };

  const getConfluences = () => {
    const validAnalyses = analyses.filter(a => a.analysis).map(a => a.analysis!);
    if (validAnalyses.length < 2) return [];

    const confluences = [];
    const bullishCount = validAnalyses.filter(a => a.bias.toLowerCase() === 'bullish').length;
    const bearishCount = validAnalyses.filter(a => a.bias.toLowerCase() === 'bearish').length;

    if (bullishCount >= 2) {
      confluences.push({ type: 'bullish', count: bullishCount, strength: bullishCount >= 3 ? 'STRONG' : 'MODERATE' });
    }
    if (bearishCount >= 2) {
      confluences.push({ type: 'bearish', count: bearishCount, strength: bearishCount >= 3 ? 'STRONG' : 'MODERATE' });
    }

    return confluences;
  };

  const confluences = getConfluences();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Análise Multi-Timeframe</span>
          <Button
            onClick={analyzeAllTimeframes}
            disabled={isAnalyzing}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              'Analisar Todos'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {confluences.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2">🎯 Confluências Detectadas</h4>
            {confluences.map((confluence, index) => (
              <Badge
                key={index}
                variant={confluence.type === 'bullish' ? 'default' : 'destructive'}
                className="mr-2"
              >
                {confluence.type === 'bullish' ? '🟢' : '🔴'} {confluence.count} TFs {confluence.strength}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {analyses.map((tf) => (
            <div
              key={tf.timeframe}
              className={`p-3 border rounded-lg ${
                tf.timeframe === currentTimeframe 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{tf.timeframe}</span>
                {tf.timeframe === currentTimeframe && (
                  <Badge variant="outline" className="text-xs">Atual</Badge>
                )}
              </div>

              {tf.loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Carregando...
                </div>
              )}

              {tf.error && (
                <div className="text-xs text-red-500">
                  Erro: {tf.error}
                </div>
              )}

              {tf.analysis && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getBiasIcon(tf.analysis.bias)}
                    <Badge 
                      variant={getBiasColor(tf.analysis.bias) as any}
                      className="text-xs"
                    >
                      {tf.analysis.bias}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <div>Demanda: {tf.analysis.demandZones.length}</div>
                    <div>Oferta: {tf.analysis.supplyZones.length}</div>
                    <div>Planos: {tf.analysis.buyPlans.length + tf.analysis.sellPlans.length}</div>
                  </div>
                </div>
              )}

              {!tf.loading && !tf.error && !tf.analysis && (
                <div className="text-xs text-muted-foreground">
                  Clique em "Analisar Todos"
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}