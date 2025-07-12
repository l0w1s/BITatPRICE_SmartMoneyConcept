import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart3, TrendingUp, Clock, Trash2 } from "lucide-react";
import { usePerformance } from "@/hooks/usePerformance";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PerformanceHistory() {
  const { getStats, clearHistory } = usePerformance();
  const stats = getStats();

  const getBiasColor = (bias: string) => {
    switch (bias.toLowerCase()) {
      case 'bullish': return 'default';
      case 'bearish': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBiasIcon = (bias: string) => {
    switch (bias.toLowerCase()) {
      case 'bullish': return '🟢';
      case 'bearish': return '🔴';
      default: return '🟡';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Histórico de Performance
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={stats.totalAnalyses === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.totalAnalyses === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma análise registrada ainda. Execute algumas análises para ver o histórico.
          </p>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
                <div className="text-xs text-muted-foreground">Total de Análises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.avgZonesPerAnalysis}</div>
                <div className="text-xs text-muted-foreground">Zonas/Análise</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.mostActiveTimeframe}</div>
                <div className="text-xs text-muted-foreground">TF Mais Usado</div>
              </div>
            </div>

            <Separator />

            {/* Recent Analysis History */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Análises Recentes
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {stats.analysisHistory.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2 rounded border bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {record.timeframe}
                      </Badge>
                      <Badge 
                        variant={getBiasColor(record.bias) as any}
                        className="text-xs"
                      >
                        {getBiasIcon(record.bias)} {record.bias}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        ${record.currentPrice.toFixed(0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium">
                        {record.zones.demand + record.zones.supply} zonas
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(record.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bias Distribution */}
            {stats.analysisHistory.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Distribuição de Bias
                  </h4>
                  <div className="flex gap-2">
                    {Object.entries(
                      stats.analysisHistory.reduce((acc, record) => {
                        acc[record.bias] = (acc[record.bias] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([bias, count]) => (
                      <Badge
                        key={bias}
                        variant={getBiasColor(bias) as any}
                        className="text-xs"
                      >
                        {getBiasIcon(bias)} {bias}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}