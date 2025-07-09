import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';

interface TradePlan {
  title: string;
  entry: number;
  target: number;
  stop: number;
  riskReward: number;
}

interface TradePlansProps {
  buyPlan?: TradePlan;
  sellPlan?: TradePlan;
}

export const TradePlans: React.FC<TradePlansProps> = ({ buyPlan, sellPlan }) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const PlanCard = ({ plan, type }: { plan: TradePlan; type: 'buy' | 'sell' }) => {
    const isBuy = type === 'buy';
    const colorClass = isBuy ? 'bullish' : 'bearish';
    const Icon = isBuy ? TrendingUp : TrendingDown;

    return (
      <Card className={`p-4 border-2 border-${colorClass}/30 bg-gradient-to-br from-${colorClass}/10 to-${colorClass}/5`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${colorClass}`} />
            <h3 className={`font-semibold text-${colorClass}`}>{plan.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              R/R: {plan.riskReward.toFixed(1)}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full bg-${colorClass}`} />
                Entrada:
              </span>
              <span className="font-mono font-bold">{formatPrice(plan.entry)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                Alvo:
              </span>
              <span className="font-mono font-bold text-primary">{formatPrice(plan.target)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Stop:
              </span>
              <span className="font-mono font-bold text-destructive">{formatPrice(plan.stop)}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (!buyPlan && !sellPlan) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Nenhum plano de trade identificado no momento</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Planos de Trade</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buyPlan && <PlanCard plan={buyPlan} type="buy" />}
        {sellPlan && <PlanCard plan={sellPlan} type="sell" />}
      </div>
    </div>
  );
};