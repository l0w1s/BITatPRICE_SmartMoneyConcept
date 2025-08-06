import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Activity, BarChart3 } from 'lucide-react';
import { WyckoffAnalysis as WyckoffAnalysisType } from '@/services/smc';

interface WyckoffAnalysisProps {
  analysis: WyckoffAnalysisType;
  currentPrice: number;
}

export const WyckoffAnalysis: React.FC<WyckoffAnalysisProps> = ({ analysis, currentPrice }) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'A': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'B': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'C': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'D': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'E': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEventEmoji = (eventType: string) => {
    switch (eventType) {
      case 'SC': return '💥'; // Selling Climax
      case 'BC': return '🚀'; // Buying Climax
      case 'Spring': return '🌱'; // Spring
      case 'UpThrust': return '⬆️'; // UpThrust
      case 'LPS': return '✅'; // Last Point of Support
      case 'LPSY': return '❌'; // Last Point of Supply
      case 'PS': return '⚠️'; // Preliminary Support
      case 'PSY': return '🔴'; // Preliminary Supply
      case 'ST': return '🔄'; // Secondary Test
      default: return '📊';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'STRONG': return 'text-primary border-primary/30 bg-primary/10';
      case 'MODERATE': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'WEAK': return 'text-muted-foreground border-muted/30 bg-muted/10';
      case 'DEVELOPING': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      default: return 'text-muted-foreground';
    }
  };

  if (!analysis.isWyckoffPattern) {
    const { rangeAnalysis } = analysis;
    const isDeveloping = rangeAnalysis.strength === 'DEVELOPING';
    
    return (
      <Card className="p-6 text-center border-dashed">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isDeveloping ? 'Wyckoff Range Developing' : 'No Wyckoff Pattern Detected'}
          </span>
        </div>
        
        {isDeveloping && rangeAnalysis.debugInfo ? (
          <div className="space-y-3 mt-4">
            <Badge variant="outline" className={getStrengthColor('DEVELOPING')}>
              Range in Formation
            </Badge>
            
            <div className="text-left p-3 bg-muted/30 rounded-md border">
              <h4 className="text-sm font-semibold mb-2">Progress Status:</h4>
              <p className="text-xs text-muted-foreground mb-2">
                {rangeAnalysis.debugInfo.status}
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-mono">
                    {rangeAnalysis.debugInfo.currentDuration}/{rangeAnalysis.debugInfo.requiredDuration}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Range Size: </span>
                  <span className="font-mono">
                    {rangeAnalysis.debugInfo.currentRangeSize}%/{rangeAnalysis.debugInfo.requiredRangeSize}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">S/R Touches: </span>
                  <span className="font-mono">{rangeAnalysis.debugInfo.touchCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Range: </span>
                  <span className="font-mono">
                    {formatPrice(rangeAnalysis.rangeLow)} - {formatPrice(rangeAnalysis.rangeHigh)}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              💡 The range is forming but needs more time or volatility for full Wyckoff analysis
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Market range too small or insufficient duration for Wyckoff analysis
          </p>
        )}
      </Card>
    );
  }

  const { currentPhase, rangeAnalysis } = analysis;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Wyckoff Analysis
        </h2>
        <Badge variant="outline" className={getStrengthColor(rangeAnalysis.strength)}>
          {rangeAnalysis.strength} Range
        </Badge>
      </div>

      {/* Range Analysis Card */}
      <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary">Range Analysis</h3>
            <Badge variant="secondary" className="text-xs">
              {rangeAnalysis.duration} candles
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Range High:</span>
                <span className="font-mono font-bold text-primary">
                  {formatPrice(rangeAnalysis.rangeHigh)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Range Low:</span>
                <span className="font-mono font-bold text-destructive">
                  {formatPrice(rangeAnalysis.rangeLow)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Price:</span>
                <span className="font-mono font-bold">
                  {formatPrice(currentPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Range Size:</span>
                <span className="font-mono font-bold">
                  {(((rangeAnalysis.rangeHigh - rangeAnalysis.rangeLow) / currentPrice) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Phase Card */}
      {currentPhase && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {currentPhase.type === 'accumulation' ? 
                    <TrendingUp className="w-4 h-4 text-primary" /> : 
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  }
                  <h3 className="font-semibold capitalize">
                    {currentPhase.type}
                  </h3>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getPhaseColor(currentPhase.phase)} text-xs`}
                >
                  Phase {currentPhase.phase}
                </Badge>
              </div>
              
              <div className="flex gap-2 ml-auto">
                <Badge variant="secondary" className="text-xs">
                  Confidence: {(currentPhase.confidence * 100).toFixed(0)}%
                </Badge>
                {currentPhase.tradingOpportunity && (
                  <Badge variant="default" className="text-xs bg-primary/20 text-primary border-primary/30">
                    🎯 Trading Opportunity
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-md border-l-2 border-primary/30">
              <p className="text-sm text-muted-foreground">
                {currentPhase.currentPhaseDescription}
              </p>
            </div>
            
            {/* Events Timeline */}
            {currentPhase.events.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Wyckoff Events Detected:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPhase.events.slice(-4).map((event, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <span className="text-lg">{getEventEmoji(event.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{event.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {(event.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatPrice(event.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Trade Plans Summary */}
      {analysis.tradePlans.length > 0 && (
        <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-primary">
              Wyckoff Trade Opportunities ({analysis.tradePlans.length})
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on current Wyckoff phase, {analysis.tradePlans.length} trade plan(s) have been generated. 
            See the Trade Plans section for detailed entries, stops, and targets.
          </p>
        </Card>
      )}
    </div>
  );
};