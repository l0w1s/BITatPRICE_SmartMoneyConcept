import React from 'react';
import { Card } from '@/components/ui/card';

interface PriceDisplayProps {
  price: number;
  change24h?: number;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, change24h }) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const isPositive = change24h && change24h > 0;

  return (
    <Card className="p-4 bg-gradient-to-r from-card to-background border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Preço BTC/USD</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(price)}</p>
        </div>
        {change24h && (
          <div className={`text-right ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
            <p className="text-sm">24h</p>
            <p className="text-lg font-semibold">
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};