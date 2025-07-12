import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, Bitcoin } from "lucide-react";
import { calculatePositionSize, formatCurrency, formatBTC, PositionSizeInput } from "@/utils/positionSizing";
import { getSettings, saveSettings } from "@/utils/storage";
import { SMCAnalysis } from "@/services/smc";

interface PositionSizingCardProps {
  analysis: SMCAnalysis | null;
  currentPrice: number;
}

export function PositionSizingCard({ analysis, currentPrice }: PositionSizingCardProps) {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercentage, setRiskPercentage] = useState(2);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const settings = getSettings();
    setAccountSize(settings.accountSize);
    setRiskPercentage(settings.riskPercentage);
  }, []);

  const handleSettingsUpdate = (field: string, value: number) => {
    if (field === 'accountSize') {
      setAccountSize(value);
      saveSettings({ accountSize: value });
    } else if (field === 'riskPercentage') {
      setRiskPercentage(value);
      saveSettings({ riskPercentage: value });
    }
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Position Sizing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Execute uma análise para calcular tamanhos de posição.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allPlans = [
    ...analysis.buyPlans.map(plan => ({ ...plan, direction: 'buy' as const })),
    ...analysis.sellPlans.map(plan => ({ ...plan, direction: 'sell' as const }))
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Position Sizing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account-size">Capital da Conta (USD)</Label>
            <Input
              id="account-size"
              type="number"
              value={accountSize}
              onChange={(e) => handleSettingsUpdate('accountSize', Number(e.target.value))}
              placeholder="10000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-percentage">Risco por Trade (%)</Label>
            <Input
              id="risk-percentage"
              type="number"
              step="0.1"
              value={riskPercentage}
              onChange={(e) => handleSettingsUpdate('riskPercentage', Number(e.target.value))}
              placeholder="2"
            />
          </div>
        </div>

        <Separator />

        {/* Trade Plans */}
        <div className="space-y-3">
          <h4 className="font-medium">Selecione um Plano de Trade:</h4>
          {allPlans.map((plan, index) => {
            const planId = `${plan.direction}-${index}`;
            const isSelected = selectedPlan === planId;

            const positionInput: PositionSizeInput = {
              accountSize,
              riskPercentage,
              entryPrice: plan.entry,
              stopPrice: plan.stop,
              btcPrice: currentPrice
            };

            const calculation = calculatePositionSize(positionInput, plan.target);

            return (
              <div
                key={planId}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlan(isSelected ? null : planId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={plan.direction === 'buy' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {plan.direction === 'buy' ? '🟢 COMPRA' : '🔴 VENDA'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      R/R: {plan.riskReward.toFixed(1)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {plan.strength}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Entrada:</span>
                    <div className="font-medium">${plan.entry.toFixed(0)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stop:</span>
                    <div className="font-medium">${plan.stop.toFixed(0)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target:</span>
                    <div className="font-medium">${plan.target.toFixed(0)}</div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Valor em Risco</div>
                          <div className="font-medium text-sm">
                            {formatCurrency(calculation.riskAmount)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Tamanho da Posição</div>
                          <div className="font-medium text-sm">
                            {formatCurrency(calculation.positionSizeUSD)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bitcoin className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Em BTC</div>
                          <div className="font-medium text-sm">
                            {formatBTC(calculation.positionSizeBTC)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Stop Loss</div>
                          <div className="font-medium text-sm">
                            {calculation.stopLossPercentage.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allPlans.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            Nenhum plano de trade disponível para esta análise.
          </p>
        )}
      </CardContent>
    </Card>
  );
}