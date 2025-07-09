import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Zone {
  low: number;
  high: number;
}

interface ZonesCardProps {
  demandZone?: Zone;
  supplyZone?: Zone;
  bullishFVG?: Zone;
  bearishFVG?: Zone;
}

export const ZonesCard: React.FC<ZonesCardProps> = ({
  demandZone,
  supplyZone,
  bullishFVG,
  bearishFVG
}) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const ZoneRow = ({ 
    label, 
    zone, 
    type 
  }: { 
    label: string; 
    zone?: Zone; 
    type: 'bullish' | 'bearish' 
  }) => {
    const colorClass = type === 'bullish' ? 'bullish' : 'bearish';
    
    return (
      <div className={`p-3 rounded-lg border-l-4 border-${colorClass}/50 bg-${colorClass}/5`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`border-${colorClass} text-${colorClass}`}>
              {label}
            </Badge>
          </div>
          <div className="text-right">
            {zone ? (
              <div className="space-y-1">
                <p className="text-sm font-mono">{formatPrice(zone.low)}</p>
                <p className="text-xs text-muted-foreground">to</p>
                <p className="text-sm font-mono">{formatPrice(zone.high)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
        Zones of Interest
      </h2>
      <div className="space-y-3">
        <ZoneRow label="Demand Zone" zone={demandZone} type="bullish" />
        <ZoneRow label="Supply Zone" zone={supplyZone} type="bearish" />
        <ZoneRow label="Bullish FVG" zone={bullishFVG} type="bullish" />
        <ZoneRow label="Bearish FVG" zone={bearishFVG} type="bearish" />
      </div>
    </Card>
  );
};