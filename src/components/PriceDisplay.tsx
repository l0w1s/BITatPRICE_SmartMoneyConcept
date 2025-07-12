import React from 'react';
import { Card } from '@/components/ui/card';

interface PriceDisplayProps {
  analysis: any;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ analysis }) => {
  const price = analysis.currentPrice;
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  return (
    <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Current BTC/USD Price</p>
        <p className="text-4xl md:text-5xl font-bold text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {formatPrice(price)}
        </p>
      </div>
    </Card>
  );
};