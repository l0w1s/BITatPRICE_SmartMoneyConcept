import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface BiasCardProps {
  bias: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  lastEvent?: string;
  breakLevel?: number;
  timeframe: string;
  probability: number;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export const BiasCard: React.FC<BiasCardProps> = ({ 
  bias, 
  lastEvent, 
  breakLevel, 
  timeframe, 
  probability,
  strength 
}) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const biasConfig = {
    BULLISH: {
      color: 'bullish',
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-bullish/20 to-bullish/5',
      border: 'border-bullish/50'
    },
    BEARISH: {
      color: 'bearish',
      icon: TrendingDown,
      gradient: 'bg-gradient-to-br from-bearish/20 to-bearish/5',
      border: 'border-bearish/50'
    },
    SIDEWAYS: {
      color: 'neutral',
      icon: ArrowRight,
      gradient: 'bg-gradient-to-br from-neutral/20 to-neutral/5',
      border: 'border-neutral/50'
    }
  };

  const config = biasConfig[bias];
  const IconComponent = config.icon;

  return (
    <Card className={`p-6 ${config.gradient} border-2 ${config.border}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <IconComponent className={`w-8 h-8 text-${config.color}`} />
          <h2 className="text-2xl font-bold text-foreground">
            MARKET BIAS ({timeframe.toUpperCase()})
          </h2>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant="outline" className={`text-lg px-4 py-2 border-${config.color} text-${config.color}`}>
              {bias}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {probability}% probability
            </Badge>
            <Badge 
              variant={strength === 'STRONG' ? 'default' : strength === 'MODERATE' ? 'secondary' : 'outline'}
              className={`text-sm ${strength === 'STRONG' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Strength: {strength}
            </Badge>
          </div>
          
          {lastEvent && breakLevel && (
            <p className="text-sm text-muted-foreground">
              Last event: <span className={`text-${config.color} font-semibold`}>
                {lastEvent}
              </span> @ {formatPrice(breakLevel)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};