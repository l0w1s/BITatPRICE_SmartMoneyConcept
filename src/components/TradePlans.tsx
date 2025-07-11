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
  explanation: string;
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  age: 'FRESH' | 'RECENT' | 'OLD';
}

interface TradePlansProps {
  buyPlans: TradePlan[];
  sellPlans: TradePlan[];
}

export const TradePlans: React.FC<TradePlansProps> = ({ buyPlans, sellPlans }) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const PlanCard = ({ plan, type }: { plan: TradePlan; type: 'buy' | 'sell' }) => {
    const isBuy = type === 'buy';
    const colorClass = isBuy ? 'bullish' : 'bearish';
    const Icon = isBuy ? TrendingUp : TrendingDown;

    const getStrengthEmoji = (strength: string) => {
      switch(strength) {
        case 'STRONG': return '🔥';
        case 'MODERATE': return '⚡';
        case 'WEAK': return '📊';
        default: return '';
      }
    };

    const getAgeEmoji = (age: string) => {
      switch(age) {
        case 'FRESH': return '🆕';
        case 'RECENT': return '📅';
        case 'OLD': return '⏰';
        default: return '';
      }
    };

    return (
      <Card className={`p-4 border-2 border-${colorClass}/30 bg-gradient-to-br from-${colorClass}/10 to-${colorClass}/5`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className={`w-5 h-5 text-${colorClass}`} />
            <h3 className={`font-semibold text-${colorClass}`}>{plan.title}</h3>
            <div className="flex gap-1 ml-auto">
              <Badge variant="outline" className="text-xs" title={`Strength: ${plan.strength}`}>
                {getStrengthEmoji(plan.strength)} {plan.strength}
              </Badge>
              <Badge variant="secondary" className="text-xs" title={`Age: ${plan.age}`}>
                {getAgeEmoji(plan.age)} {plan.age}
              </Badge>
              <Badge variant="secondary" className="text-xs" title="Risk/Reward Ratio">
                R/R: {plan.riskReward.toFixed(1)}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full bg-${colorClass}`} />
                Entry:
              </span>
              <span className="font-mono font-bold">{formatPrice(plan.entry)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" />
                Target:
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
          
          <div className="mt-4 p-3 bg-muted/30 rounded-md border-l-2 border-muted-foreground/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold">Why this trade:</span> {plan.explanation}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  if (buyPlans.length === 0 && sellPlans.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No trade plans identified at the moment</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Trade Plans</h2>
        <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
          💡 Multiple plans ranked by strength • R/R = Risk/Reward Ratio
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {buyPlans.map((plan, index) => (
          <PlanCard key={`buy-${index}`} plan={plan} type="buy" />
        ))}
        {sellPlans.map((plan, index) => (
          <PlanCard key={`sell-${index}`} plan={plan} type="sell" />
        ))}
      </div>
    </div>
  );
};