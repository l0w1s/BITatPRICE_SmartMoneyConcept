import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnhancedZone {
  low: number;
  high: number;
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  age: 'FRESH' | 'RECENT' | 'OLD';
  distance: number;
  tested: boolean;
}

interface ZonesCardProps {
  analysis: any;
}

export const ZonesCard: React.FC<ZonesCardProps> = ({ analysis }) => {
  const { demandZones, supplyZones, bullishFVGs, bearishFVGs } = analysis;
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

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

  const ZoneSection = ({ 
    title, 
    zones, 
    type 
  }: { 
    title: string; 
    zones: EnhancedZone[]; 
    type: 'bullish' | 'bearish' 
  }) => {
    const colorClass = type === 'bullish' ? 'bullish' : 'bearish';
    
    if (zones.length === 0) {
      return (
        <div className={`p-3 rounded-lg border-l-4 border-${colorClass}/30 bg-${colorClass}/5`}>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`border-${colorClass}/50 text-${colorClass}/70`}>
              {title}
            </Badge>
            <span className="text-sm text-muted-foreground">No zones identified</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h3 className={`text-sm font-semibold text-${colorClass} flex items-center gap-2`}>
          <Badge variant="outline" className={`border-${colorClass} text-${colorClass}`}>
            {title}
          </Badge>
        </h3>
        {zones.map((zone, index) => (
          <div key={index} className={`p-3 rounded-lg border-l-4 border-${colorClass}/50 bg-${colorClass}/5`}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs" title={`Strength: ${zone.strength}`}>
                    {getStrengthEmoji(zone.strength)} {zone.strength}
                  </Badge>
                  <Badge variant="secondary" className="text-xs" title={`Age: ${zone.age}`}>
                    {getAgeEmoji(zone.age)} {zone.age}
                  </Badge>
                  <Badge variant={zone.tested ? "destructive" : "default"} className="text-xs">
                    {zone.tested ? "⚠️ TESTED" : "✅ UNTESTED"}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <p className="text-sm font-mono">{formatPrice(zone.low)}</p>
                    <p className="text-xs text-muted-foreground">to</p>
                    <p className="text-sm font-mono">{formatPrice(zone.high)}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Distance: {zone.distance.toFixed(1)}% from current price
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
        <h2 className="text-xl font-bold text-foreground">Zones of Interest</h2>
        <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
          📍 Multiple zones ranked by strength and proximity
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ZoneSection title="Demand Zones" zones={demandZones} type="bullish" />
        <ZoneSection title="Supply Zones" zones={supplyZones} type="bearish" />
        <ZoneSection title="Bullish FVGs" zones={bullishFVGs} type="bullish" />
        <ZoneSection title="Bearish FVGs" zones={bearishFVGs} type="bearish" />
      </div>
    </Card>
  );
};