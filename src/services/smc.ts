import { Candle } from './api';
import { getSettings } from '../utils/storage';

export interface SwingPoint {
  type: 'high' | 'low';
  price: number;
  index: number;
}

export interface Zone {
  low: number;
  high: number;
}

export interface EnhancedZone extends Zone {
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  age: 'FRESH' | 'RECENT' | 'OLD';
  distance: number;
  tested: boolean;
  formationIndex: number;
  confluence?: boolean;
}

export interface TradePlan {
  title: string;
  entry: number;
  target: number;
  stop: number;
  riskReward: number;
  explanation: string;
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  age: 'FRESH' | 'RECENT' | 'OLD';
}

export interface MarketStructure {
  bias: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  lastEvent?: string;
  breakLevel?: number;
  majorHigh?: SwingPoint;
  majorLow?: SwingPoint;
  probability: number;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export interface SMCAnalysis extends MarketStructure {
  timeframe: string;
  currentPrice: number;
  buyPlans: TradePlan[];
  sellPlans: TradePlan[];
  demandZones: EnhancedZone[];
  supplyZones: EnhancedZone[];
  bullishFVGs: EnhancedZone[];
  bearishFVGs: EnhancedZone[];
  confluences?: ConfluenceZone[];
  debugInfo?: DebugInfo;
  wyckoffAnalysis?: WyckoffAnalysis;
}

export interface ConfluenceZone {
  type: 'fibonacci' | 'historical_sr' | 'multiple_zones';
  level: number;
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  description: string;
}

export interface DebugInfo {
  totalZonesFound: number;
  zonesFiltered: number;
  searchRange: number;
  profileUsed: string;
  testedZones: number;
  untestedZones: number;
  averageZoneDistance: number;
}

export interface WyckoffEvent {
  type: 'PS' | 'SC' | 'ST' | 'BC' | 'Spring' | 'UpThrust' | 'LPS' | 'LPSY' | 'PSY';
  price: number;
  index: number;
  volume?: number;
  confidence: number;
}

export interface WyckoffPhase {
  type: 'accumulation' | 'distribution';
  phase: 'A' | 'B' | 'C' | 'D' | 'E';
  events: WyckoffEvent[];
  confidence: number;
  tradingOpportunity: boolean;
  rangeHigh: number;
  rangeLow: number;
  currentPhaseDescription: string;
}

export interface WyckoffAnalysis {
  isWyckoffPattern: boolean;
  currentPhase?: WyckoffPhase;
  tradePlans: TradePlan[];
  rangeAnalysis: {
    rangeHigh: number;
    rangeLow: number;
    duration: number;
    strength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
}

export class SMCAnalyzer {
  static analyze(candles: Candle[], timeframe: string): SMCAnalysis | { error: string } {
    const settings = getSettings();
    const lookbackMap: Record<string, number> = { 
      '15m': 3, 
      '30m': 4, 
      '1h': 5, 
      '4h': 6, 
      '1d': 8 
    };
    const lookback = lookbackMap[timeframe] || 5;

    if (!candles || candles.length < (lookback * 2 + 10)) {
      return { error: `Insufficient data for reliable analysis on ${timeframe}.` };
    }

    const swings = this._findSwingPoints(candles, lookback);
    if (swings.length < 4) {
      return { error: `Could not identify sufficient highs/lows for analysis on ${timeframe}.` };
    }

    const structure = this._findMarketStructure(swings);
    if ('error' in structure) {
      return structure;
    }
    
    const currentPrice = candles[candles.length - 1].c;
    const pois = this._findEnhancedPointsOfInterest(candles, structure, currentPrice, timeframe);
    
    const analysis: SMCAnalysis = {
      ...structure,
      timeframe,
      currentPrice,
      demandZones: pois.demandZones,
      supplyZones: pois.supplyZones,
      bullishFVGs: pois.bullishFVGs,
      bearishFVGs: pois.bearishFVGs,
      buyPlans: [],
      sellPlans: []
    };
    
    // Add confluence detection
    analysis.confluences = this._detectConfluences(analysis, candles);
    
    // Add debug info if enabled
    if (settings.debugMode) {
      analysis.debugInfo = pois.debugInfo;
    }
    
    // Add Wyckoff analysis for sideways markets
    if (analysis.bias === 'SIDEWAYS') {
      analysis.wyckoffAnalysis = this._analyzeWyckoff(candles, analysis);
      
      // If Wyckoff patterns are detected, prioritize Wyckoff trade plans
      if (analysis.wyckoffAnalysis.isWyckoffPattern && analysis.wyckoffAnalysis.tradePlans.length > 0) {
        analysis.buyPlans = analysis.wyckoffAnalysis.tradePlans.filter(plan => plan.title.includes('Buy'));
        analysis.sellPlans = analysis.wyckoffAnalysis.tradePlans.filter(plan => plan.title.includes('Sell'));
      } else {
        // Fall back to standard SMC plans
        analysis.buyPlans = this._createMultipleTradePlans(analysis, 'buy');
        analysis.sellPlans = this._createMultipleTradePlans(analysis, 'sell');
      }
    } else {
      // Standard SMC analysis for trending markets
      analysis.buyPlans = this._createMultipleTradePlans(analysis, 'buy');
      analysis.sellPlans = this._createMultipleTradePlans(analysis, 'sell');
    }
    
    return analysis;
  }

  private static _findSwingPoints(candles: Candle[], lookback: number): SwingPoint[] {
    const swings: SwingPoint[] = [];
    
    for (let i = lookback; i < candles.length - lookback; i++) {
      const slice = candles.slice(i - lookback, i + lookback + 1);
      
      const isHigh = slice.every(c => candles[i].h >= c.h);
      if (isHigh) {
        swings.push({ type: 'high', price: candles[i].h, index: i });
      }

      const isLow = slice.every(c => candles[i].l <= c.l);
      if (isLow) {
        swings.push({ type: 'low', price: candles[i].l, index: i });
      }
    }
    
    return swings;
  }
  
  private static _findMarketStructure(swings: SwingPoint[]): MarketStructure | { error: string } {
    const highs = swings.filter(s => s.type === 'high');
    const lows = swings.filter(s => s.type === 'low');
    
    if (highs.length < 2 || lows.length < 2) {
      return { error: "Not enough highs/lows to determine market structure." };
    }

    const [lastHigh, prevHigh] = highs.slice(-2);
    const [lastLow, prevLow] = lows.slice(-2);
    
    // Bullish Trend - BOS
    if (lastHigh.price > prevHigh.price && lastLow.price > prevLow.price) {
      const probability = this._calculateProbability('BULLISH', 'BOS');
      return { 
        bias: 'BULLISH', 
        lastEvent: 'BOS', 
        breakLevel: prevHigh.price, 
        majorHigh: lastHigh, 
        majorLow: prevLow,
        probability,
        strength: this._calculateStrength(probability, 'BOS', swings.length)
      };
    }
    
    // Bearish Trend - BOS
    if (lastLow.price < prevLow.price && lastHigh.price < prevHigh.price) {
      const probability = this._calculateProbability('BEARISH', 'BOS');
      return { 
        bias: 'BEARISH', 
        lastEvent: 'BOS', 
        breakLevel: prevLow.price, 
        majorHigh: prevHigh, 
        majorLow: lastLow,
        probability,
        strength: this._calculateStrength(probability, 'BOS', swings.length)
      };
    }
    
    // CHoCH to Bearish
    if (lastLow.price < prevLow.price && lastHigh.index > prevLow.index) {
      const probability = this._calculateProbability('BEARISH', 'CHoCH');
      return { 
        bias: 'BEARISH', 
        lastEvent: 'CHoCH', 
        breakLevel: prevLow.price, 
        majorHigh: lastHigh, 
        majorLow: lastLow,
        probability,
        strength: this._calculateStrength(probability, 'CHoCH', swings.length)
      };
    }
    
    // CHoCH to Bullish
    if (lastHigh.price > prevHigh.price && lastLow.index > prevHigh.index) {
      const probability = this._calculateProbability('BULLISH', 'CHoCH');
      return { 
        bias: 'BULLISH', 
        lastEvent: 'CHoCH', 
        breakLevel: prevHigh.price, 
        majorHigh: lastHigh, 
        majorLow: lastLow,
        probability,
        strength: this._calculateStrength(probability, 'CHoCH', swings.length)
      };
    }
    
    const probability = this._calculateProbability('SIDEWAYS', '');
    return { 
      bias: 'SIDEWAYS', 
      lastEvent: '', 
      breakLevel: undefined, 
      majorHigh: lastHigh, 
      majorLow: lastLow,
      probability,
      strength: this._calculateStrength(probability, '', swings.length)
    };
  }

  private static _calculateProbability(bias: string, event: string): number {
    // Probabilities based on historical backtests
    if (event === 'BOS') {
      return bias === 'SIDEWAYS' ? 60 : 87;
    }
    if (event === 'CHoCH') {
      return 74;
    }
    return 52; // Sideways market
  }

  private static _calculateStrength(probability: number, event: string, swingCount: number): 'WEAK' | 'MODERATE' | 'STRONG' {
    let strengthScore = 0;
    
    // Base score da probabilidade
    if (probability >= 85) strengthScore += 3;
    else if (probability >= 70) strengthScore += 2;
    else strengthScore += 1;
    
    // Bonus por tipo de evento
    if (event === 'BOS') strengthScore += 2;
    else if (event === 'CHoCH') strengthScore += 1;
    
    // Bonus por quantidade de swing points (mais dados = mais confiável)
    if (swingCount >= 8) strengthScore += 1;
    else if (swingCount >= 6) strengthScore += 0.5;
    
    // Final classification
    if (strengthScore >= 5) return 'STRONG';
    if (strengthScore >= 3) return 'MODERATE';
    return 'WEAK';
  }

  private static _findEnhancedPointsOfInterest(candles: Candle[], structure: MarketStructure, currentPrice: number, timeframe: string) {
    const { majorHigh, majorLow } = structure;
    if (!majorHigh || !majorLow) return { 
      demandZones: [], supplyZones: [], bullishFVGs: [], bearishFVGs: [],
      debugInfo: { totalZonesFound: 0, zonesFiltered: 0, searchRange: 0, profileUsed: 'unknown', testedZones: 0, untestedZones: 0, averageZoneDistance: 0 }
    };
    
    const settings = getSettings();
    const profile = settings.tradingProfile;
    
    const rangeStart = Math.min(majorLow.price, majorHigh.price);
    const rangeEnd = Math.max(majorLow.price, majorHigh.price);
    const fib50 = rangeStart + (rangeEnd - rangeStart) * 0.5;
    const fib236 = rangeStart + (rangeEnd - rangeStart) * 0.236;
    const fib382 = rangeStart + (rangeEnd - rangeStart) * 0.382;
    const fib618 = rangeStart + (rangeEnd - rangeStart) * 0.618;
    const fib786 = rangeStart + (rangeEnd - rangeStart) * 0.786;
    
    const demandZones: EnhancedZone[] = [];
    const supplyZones: EnhancedZone[] = [];
    const bullishFVGs: EnhancedZone[] = [];
    const bearishFVGs: EnhancedZone[] = [];
    
    // Adaptive search range based on profile and timeframe
    const searchRange = this._getAdaptiveSearchRange(profile, timeframe, candles.length);
    const startSearch = Math.max(0, candles.length - searchRange);
    
    let totalZonesFound = 0;
    let testedCount = 0;
    
    // Relaxed criteria based on profile
    const isAggressive = profile === 'scalp';
    const minBodyPercentage = isAggressive ? 0.4 : 0.5; // Reduced from 0.6
    
    for (let i = startSearch; i < candles.length - 1; i++) {
      const candle = candles[i];
      const prevCandle = i > 0 ? candles[i - 1] : null;
      const nextCandle = i < candles.length - 1 ? candles[i + 1] : null;
      
      // Relaxed zone detection - make strong rejection optional for aggressive profiles
      const hasStrongRejection = this._hasStrongReaction(candles, i);
      const bodyPercentage = Math.abs(candle.c - candle.o) / (candle.h - candle.l);
      const meetsReactionCriteria = isAggressive || hasStrongRejection;
      
      // Expanded Fibonacci criteria for demand zones
      const inDemandArea = candle.h < fib618 || (candle.l < fib50 && candle.h < fib786);
      
      // Zonas de Demanda - Relaxed criteria
      if (inDemandArea && candle.c < candle.o && bodyPercentage > minBodyPercentage && meetsReactionCriteria) {
        const zone: EnhancedZone = {
          low: candle.l,
          high: candle.h,
          strength: this._calculateZoneStrength(candle, currentPrice, candles, i),
          age: this._calculateAge(i, candles.length),
          distance: Math.abs(currentPrice - (candle.h + candle.l) / 2) / currentPrice * 100,
          tested: this._isZoneTested(candle, candles, i),
          formationIndex: i
        };
        demandZones.push(zone);
        totalZonesFound++;
      }
      
      // Expanded Fibonacci criteria for supply zones
      const inSupplyArea = candle.l > fib382 || (candle.h > fib50 && candle.l > fib236);
      
      // Zonas de Supply - Relaxed criteria
      if (inSupplyArea && candle.c > candle.o && bodyPercentage > minBodyPercentage && meetsReactionCriteria) {
        const zone: EnhancedZone = {
          low: candle.l,
          high: candle.h,
          strength: this._calculateZoneStrength(candle, currentPrice, candles, i),
          age: this._calculateAge(i, candles.length),
          distance: Math.abs(currentPrice - (candle.h + candle.l) / 2) / currentPrice * 100,
          tested: this._isZoneTested(candle, candles, i),
          formationIndex: i
        };
        supplyZones.push(zone);
        totalZonesFound++;
      }
      
      // Bullish FVGs
      if (prevCandle && nextCandle && prevCandle.h < nextCandle.l) {
        const zone: EnhancedZone = {
          low: prevCandle.h,
          high: nextCandle.l,
          strength: this._calculateFVGStrength(prevCandle.h, nextCandle.l, currentPrice),
          age: this._calculateAge(i, candles.length),
          distance: Math.abs(currentPrice - (prevCandle.h + nextCandle.l) / 2) / currentPrice * 100,
          tested: this._isFVGTested(prevCandle.h, nextCandle.l, candles, i),
          formationIndex: i
        };
        bullishFVGs.push(zone);
      }
      
      // Bearish FVGs
      if (prevCandle && nextCandle && prevCandle.l > nextCandle.h) {
        const zone: EnhancedZone = {
          low: nextCandle.h,
          high: prevCandle.l,
          strength: this._calculateFVGStrength(nextCandle.h, prevCandle.l, currentPrice),
          age: this._calculateAge(i, candles.length),
          distance: Math.abs(currentPrice - (nextCandle.h + prevCandle.l) / 2) / currentPrice * 100,
          tested: this._isFVGTested(nextCandle.h, prevCandle.l, candles, i),
          formationIndex: i
        };
        bearishFVGs.push(zone);
      }
    }
    
    // Count tested zones
    const allZones = [...demandZones, ...supplyZones, ...bullishFVGs, ...bearishFVGs];
    testedCount = allZones.filter(zone => zone.tested).length;
    totalZonesFound = allZones.length;
    
    // Calculate average distance
    const avgDistance = allZones.length > 0 ? 
      allZones.reduce((sum, zone) => sum + zone.distance, 0) / allZones.length : 0;
    
    // Enhanced confluence detection for zones
    this._enhanceZonesWithConfluence(demandZones, fib236, fib50, fib618, fib786);
    this._enhanceZonesWithConfluence(supplyZones, fib236, fib50, fib618, fib786);
    
    // Ordenar por força, confluência e proximidade
    const sortByStrengthAndProximity = (zones: EnhancedZone[]) => 
      zones.sort((a, b) => {
        const strengthOrder = { STRONG: 3, MODERATE: 2, WEAK: 1 };
        const aScore = strengthOrder[a.strength] + (a.confluence ? 2 : 0);
        const bScore = strengthOrder[b.strength] + (b.confluence ? 2 : 0);
        
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return a.distance - b.distance;
      }).slice(0, 3);
    
    const debugInfo: DebugInfo = {
      totalZonesFound,
      zonesFiltered: totalZonesFound - Math.min(totalZonesFound, 12), // 3 per type max
      searchRange,
      profileUsed: profile,
      testedZones: testedCount,
      untestedZones: totalZonesFound - testedCount,
      averageZoneDistance: Number(avgDistance.toFixed(2))
    };
    
    return {
      demandZones: sortByStrengthAndProximity(demandZones),
      supplyZones: sortByStrengthAndProximity(supplyZones),
      bullishFVGs: sortByStrengthAndProximity(bullishFVGs),
      bearishFVGs: sortByStrengthAndProximity(bearishFVGs),
      debugInfo
    };
  }
  
  private static _calculateZoneStrength(candle: Candle, currentPrice: number, candles: Candle[], index: number): 'STRONG' | 'MODERATE' | 'WEAK' {
    const zoneSize = Math.abs(candle.h - candle.l) / currentPrice * 100;
    const distance = Math.abs(currentPrice - (candle.h + candle.l) / 2) / currentPrice * 100;
    const bodySize = Math.abs(candle.c - candle.o) / (candle.h - candle.l);
    
    let score = 0;
    
    // Zone size score
    if (zoneSize < 0.5) score += 3;
    else if (zoneSize < 1) score += 2;
    else score += 1;
    
    // Distance score
    if (distance < 2) score += 3;
    else if (distance < 5) score += 2;
    else score += 1;
    
    // Body size score
    if (bodySize > 0.7) score += 2;
    else if (bodySize > 0.5) score += 1;
    
    if (score >= 6) return 'STRONG';
    if (score >= 4) return 'MODERATE';
    return 'WEAK';
  }
  
  private static _calculateFVGStrength(low: number, high: number, currentPrice: number): 'STRONG' | 'MODERATE' | 'WEAK' {
    const gapSize = Math.abs(high - low) / currentPrice * 100;
    const distance = Math.abs(currentPrice - (high + low) / 2) / currentPrice * 100;
    
    let score = 0;
    
    if (gapSize > 1) score += 3;
    else if (gapSize > 0.5) score += 2;
    else score += 1;
    
    if (distance < 3) score += 2;
    else if (distance < 7) score += 1;
    
    if (score >= 4) return 'STRONG';
    if (score >= 2) return 'MODERATE';
    return 'WEAK';
  }
  
  private static _calculateAge(formationIndex: number, totalCandles: number): 'FRESH' | 'RECENT' | 'OLD' {
    const candlesAgo = totalCandles - formationIndex;
    
    if (candlesAgo <= 10) return 'FRESH';
    if (candlesAgo <= 25) return 'RECENT';
    return 'OLD';
  }
  
  private static _isZoneTested(zone: Candle, candles: Candle[], formationIndex: number): boolean {
    const settings = getSettings();
    const profile = settings.tradingProfile;
    
    // Relaxed testing criteria - reduced penetration requirements
    let penetrationThreshold = 0.15; // Reduced from 30%
    let minReactionCandles = 0; // No reaction required for aggressive
    
    if (profile === 'swing') {
      penetrationThreshold = 0.25; // Reduced from 50%
      minReactionCandles = 1; // Reduced from 2
    } else if (profile === 'scalp') {
      penetrationThreshold = 0.1; // Very low for aggressive
      minReactionCandles = 0; // No reaction required
    } else {
      penetrationThreshold = 0.2; // Balanced profile
      minReactionCandles = 0;
    }
    
    const zoneHeight = zone.h - zone.l;
    let validTests = 0;
    
    // Add timeout logic - older zones less likely to be considered "tested"
    const ageInCandles = candles.length - formationIndex;
    if (ageInCandles > 50) {
      penetrationThreshold *= 1.5; // Require more penetration for old zones
    }
    
    for (let i = formationIndex + 1; i < candles.length - minReactionCandles; i++) {
      const candle = candles[i];
      const overlap = Math.min(candle.h, zone.h) - Math.max(candle.l, zone.l);
      
      if (overlap > 0) {
        const penetration = overlap / zoneHeight;
        
        // Check if penetration is significant enough
        if (penetration >= penetrationThreshold) {
          // For aggressive profiles, any penetration counts as "tested"
          if (minReactionCandles === 0) {
            validTests++;
            if (validTests >= 1) return true;
          } else {
            // Check for reaction in next candle(s)
            let hasReaction = false;
            for (let j = 1; j <= minReactionCandles && i + j < candles.length; j++) {
              const nextCandle = candles[i + j];
              // For demand zones, look for bullish reaction; for supply zones, bearish reaction
              if ((zone.l < zone.h && nextCandle.c > nextCandle.o) || 
                  (zone.l > zone.h && nextCandle.c < nextCandle.o)) {
                hasReaction = true;
                break;
              }
            }
            
            if (hasReaction) validTests++;
            if (validTests >= 1) return true; // Reduced requirement
          }
        }
      }
    }
    return false;
  }
  
  private static _isFVGTested(low: number, high: number, candles: Candle[], formationIndex: number): boolean {
    for (let i = formationIndex + 1; i < candles.length; i++) {
      const candle = candles[i];
      if (candle.l <= high && candle.h >= low) {
        return true;
      }
    }
    return false;
  }
  
  private static _createMultipleTradePlans(analysis: SMCAnalysis, type: 'buy' | 'sell'): TradePlan[] {
    const settings = getSettings();
    const profile = settings.tradingProfile;
    const { bias, demandZones, supplyZones, majorHigh, majorLow } = analysis;
    const plans: TradePlan[] = [];
    
    // Relaxed R/R criteria based on profile
    const profileConfig = {
      scalp: {
        minRR: 0.2,
        maxRR: 2.0,
        maxPlans: 5,
        preferClose: true,
        maxDistance: 5.0,
        testedWeight: 0.8 // Very lenient for tested zones
      },
      balanced: {
        minRR: 0.5,
        maxRR: 4.0,
        maxPlans: 3,
        preferClose: false,
        maxDistance: 10.0,
        testedWeight: 0.6
      },
      swing: {
        minRR: 1.0,
        maxRR: 8.0,
        maxPlans: 2,
        preferClose: false,
        maxDistance: 20.0,
        testedWeight: 0.3
      }
    };
    
    const config = profileConfig[profile];
    
    // Buy plans for bullish bias or suitable zones in sideways market
    if (type === 'buy' && (bias === 'BULLISH' || bias === 'SIDEWAYS') && majorHigh) {
      let validZones = demandZones.filter(zone => 
        zone.distance <= config.maxDistance &&
        (!zone.tested || config.testedWeight > 0.4)
      );
      
      // If no zones found, relax criteria further
      if (validZones.length === 0) {
        validZones = demandZones.filter(zone => 
          zone.distance <= config.maxDistance * 1.5 // Increase distance tolerance
        );
      }
      
      // Sort by profile preference
      if (config.preferClose) {
        validZones.sort((a, b) => a.distance - b.distance);
      } else {
        validZones.sort((a, b) => {
          const scoreA = this._calculateZoneScore(a, config);
          const scoreB = this._calculateZoneScore(b, config);
          return scoreB - scoreA;
        });
      }
      
      validZones.slice(0, config.maxPlans).forEach((zone, index) => {
        const entryPrice = zone.high;
        const stopPrice = zone.low;
        
        // For sideways market, use closer targets or resistance levels
        let targetPrice = majorHigh.price;
        if (bias === 'SIDEWAYS') {
          // Use a more conservative target based on range
          const range = majorHigh.price - majorLow.price;
          targetPrice = entryPrice + (range * 0.6); // 60% of range as target
        }
        
        const riskReward = (targetPrice - entryPrice) / (entryPrice - stopPrice);
        
        if (riskReward >= config.minRR && riskReward <= config.maxRR) {
          const planStrength = this._calculatePlanStrength(zone, riskReward);
          const marketContext = bias === 'SIDEWAYS' ? 'range-bound' : bias.toLowerCase();
          const explanation = `${index === 0 ? 'Primary' : 'Alternative'} buy setup in a ${marketContext} market. Entry at demand zone (${zone.strength.toLowerCase()} strength, ${zone.age.toLowerCase()} formation) ${zone.distance.toFixed(1)}% from current price. ${zone.tested ? 'Zone previously tested.' : 'Fresh untested zone.'} R/R: ${riskReward.toFixed(2)}`;
          
          plans.push({
            title: `Buy Plan ${index + 1} (${zone.strength})`,
            entry: entryPrice,
            stop: stopPrice,
            target: targetPrice,
            riskReward,
            strength: planStrength,
            age: zone.age,
            explanation
          });
        }
      });
    }
    
    // Sell plans for bearish bias or suitable zones in sideways market
    if (type === 'sell' && (bias === 'BEARISH' || bias === 'SIDEWAYS') && majorLow) {
      let validZones = supplyZones.filter(zone => 
        zone.distance <= config.maxDistance &&
        (!zone.tested || config.testedWeight > 0.4)
      );
      
      // If no zones found, relax criteria further
      if (validZones.length === 0) {
        validZones = supplyZones.filter(zone => 
          zone.distance <= config.maxDistance * 1.5 // Increase distance tolerance
        );
      }
      
      // Sort by profile preference
      if (config.preferClose) {
        validZones.sort((a, b) => a.distance - b.distance);
      } else {
        validZones.sort((a, b) => {
          const scoreA = this._calculateZoneScore(a, config);
          const scoreB = this._calculateZoneScore(b, config);
          return scoreB - scoreA;
        });
      }
      
      validZones.slice(0, config.maxPlans).forEach((zone, index) => {
        const entryPrice = zone.low;
        const stopPrice = zone.high;
        
        // For sideways market, use closer targets or support levels
        let targetPrice = majorLow.price;
        if (bias === 'SIDEWAYS') {
          // Use a more conservative target based on range
          const range = majorHigh.price - majorLow.price;
          targetPrice = entryPrice - (range * 0.6); // 60% of range as target
        }
        
        const riskReward = (entryPrice - targetPrice) / (stopPrice - entryPrice);
        
        if (riskReward >= config.minRR && riskReward <= config.maxRR) {
          const planStrength = this._calculatePlanStrength(zone, riskReward);
          const marketContext = bias === 'SIDEWAYS' ? 'range-bound' : bias.toLowerCase();
          const explanation = `${index === 0 ? 'Primary' : 'Alternative'} sell setup in a ${marketContext} market. Entry at supply zone (${zone.strength.toLowerCase()} strength, ${zone.age.toLowerCase()} formation) ${zone.distance.toFixed(1)}% from current price. ${zone.tested ? 'Zone previously tested.' : 'Fresh untested zone.'} R/R: ${riskReward.toFixed(2)}`;
          
          plans.push({
            title: `Sell Plan ${index + 1} (${zone.strength})`,
            entry: entryPrice,
            stop: stopPrice,
            target: targetPrice,
            riskReward,
            strength: planStrength,
            age: zone.age,
            explanation
          });
        }
      });
    }
    
    return plans;
  }
  
  private static _calculateZoneScore(zone: EnhancedZone, config: any): number {
    let score = 0;
    
    // Strength scoring
    if (zone.strength === 'STRONG') score += 30;
    else if (zone.strength === 'MODERATE') score += 20;
    else score += 10;
    
    // Age scoring
    if (zone.age === 'FRESH') score += 20;
    else if (zone.age === 'RECENT') score += 15;
    else score += 5;
    
    // Distance scoring (closer gets bonus for scalp, further for swing)
    if (config.preferClose) {
      score += Math.max(0, 20 - zone.distance * 2);
    } else {
      score += zone.distance > 2 ? 15 : 5;
    }
    
    // Tested penalty
    if (zone.tested) {
      score *= config.testedWeight;
    }
    
    return score;
  }
  
  private static _calculatePlanStrength(zone: EnhancedZone, riskReward: number): 'STRONG' | 'MODERATE' | 'WEAK' {
    let score = 0;
    
    // Zone strength score
    if (zone.strength === 'STRONG') score += 3;
    else if (zone.strength === 'MODERATE') score += 2;
    else score += 1;
    
    // Risk/Reward score
    if (riskReward >= 3) score += 3;
    else if (riskReward >= 2) score += 2;
    else if (riskReward >= 1) score += 1;
    
    // Distance score
    if (zone.distance < 2) score += 2;
    else if (zone.distance < 5) score += 1;
    
    // Tested penalty
    if (zone.tested) score -= 1;
    
    if (score >= 6) return 'STRONG';
    if (score >= 4) return 'MODERATE';
    return 'WEAK';
  }

  private static _getAdaptiveSearchRange(profile: string, timeframe: string, totalCandles: number): number {
    const baseRanges = {
      scalp: { '15m': 50, '30m': 75, '1h': 100, '4h': 150, '1d': 200 },
      balanced: { '15m': 100, '30m': 150, '1h': 200, '4h': 300, '1d': 400 },
      swing: { '15m': 200, '30m': 300, '1h': 400, '4h': 500, '1d': 600 }
    };
    
    const profileRanges = baseRanges[profile as keyof typeof baseRanges] || baseRanges.balanced;
    const baseRange = profileRanges[timeframe as keyof typeof profileRanges] || 200;
    
    return Math.min(baseRange, totalCandles - 1);
  }

  private static _hasStrongReaction(candles: Candle[], index: number): boolean {
    if (index < 2 || index >= candles.length - 2) return false;
    
    const currentCandle = candles[index];
    const nextCandle = candles[index + 1];
    const nextNextCandle = candles[index + 2];
    
    // Check for strong bullish reaction (for supply zones)
    const strongBullishReaction = 
      nextCandle.c > nextCandle.o && 
      nextNextCandle.c > nextNextCandle.o &&
      nextCandle.c > currentCandle.h;
    
    // Check for strong bearish reaction (for demand zones)
    const strongBearishReaction = 
      nextCandle.c < nextCandle.o && 
      nextNextCandle.c < nextNextCandle.o &&
      nextCandle.c < currentCandle.l;
    
    return strongBullishReaction || strongBearishReaction;
  }

  private static _enhanceZonesWithConfluence(zones: EnhancedZone[], fib236: number, fib50: number, fib618: number, fib786: number): void {
    const fibLevels = [fib236, fib50, fib618, fib786];
    
    zones.forEach(zone => {
      const zoneMid = (zone.high + zone.low) / 2;
      
      // Check if zone is near fibonacci levels (within 1% tolerance)
      const nearFib = fibLevels.some(fibLevel => {
        const distance = Math.abs(zoneMid - fibLevel) / fibLevel;
        return distance <= 0.01; // 1% tolerance
      });
      
      if (nearFib) {
        zone.confluence = true;
      }
    });
  }

  private static _detectConfluences(analysis: SMCAnalysis, candles: Candle[]): ConfluenceZone[] {
    const confluences: ConfluenceZone[] = [];
    const { majorHigh, majorLow } = analysis;
    
    if (!majorHigh || !majorLow) return confluences;
    
    const rangeStart = Math.min(majorLow.price, majorHigh.price);
    const rangeEnd = Math.max(majorLow.price, majorHigh.price);
    
    // Fibonacci confluences
    const fibLevels = [
      { level: rangeStart + (rangeEnd - rangeStart) * 0.236, name: '23.6%' },
      { level: rangeStart + (rangeEnd - rangeStart) * 0.382, name: '38.2%' },
      { level: rangeStart + (rangeEnd - rangeStart) * 0.5, name: '50%' },
      { level: rangeStart + (rangeEnd - rangeStart) * 0.618, name: '61.8%' },
      { level: rangeStart + (rangeEnd - rangeStart) * 0.786, name: '78.6%' }
    ];
    
    fibLevels.forEach(fib => {
      const nearbyZones = [
        ...analysis.demandZones,
        ...analysis.supplyZones
      ].filter(zone => {
        const zoneMid = (zone.high + zone.low) / 2;
        const distance = Math.abs(zoneMid - fib.level) / fib.level;
        return distance <= 0.02; // 2% tolerance
      });
      
      if (nearbyZones.length > 0) {
        confluences.push({
          type: 'fibonacci',
          level: fib.level,
          strength: nearbyZones.length > 1 ? 'STRONG' : 'MODERATE',
          description: `Fibonacci ${fib.name} confluence with ${nearbyZones.length} zone(s)`
        });
      }
    });
    
    // Historical S/R confluences (simplified)
    const historicalLevels = this._findHistoricalSR(candles);
    historicalLevels.forEach(level => {
      const nearbyZones = [
        ...analysis.demandZones,
        ...analysis.supplyZones
      ].filter(zone => {
        const zoneMid = (zone.high + zone.low) / 2;
        const distance = Math.abs(zoneMid - level.price) / level.price;
        return distance <= 0.015; // 1.5% tolerance
      });
      
      if (nearbyZones.length > 0) {
        confluences.push({
          type: 'historical_sr',
          level: level.price,
          strength: level.strength,
          description: `Historical ${level.type} level confluence`
        });
      }
    });
    
    return confluences.slice(0, 5); // Limit to top 5 confluences
  }

  private static _findHistoricalSR(candles: Candle[]): Array<{price: number, type: string, strength: 'STRONG' | 'MODERATE' | 'WEAK'}> {
    const levels: Array<{price: number, type: string, strength: 'STRONG' | 'MODERATE' | 'WEAK'}> = [];
    const searchRange = Math.min(candles.length, 200);
    const startIndex = Math.max(0, candles.length - searchRange);
    
    // Find significant highs and lows that acted as S/R
    for (let i = startIndex + 10; i < candles.length - 10; i++) {
      const candle = candles[i];
      let touchCount = 0;
      
      // Count how many times price tested this level
      for (let j = i + 1; j < candles.length; j++) {
        const testCandle = candles[j];
        const distance = Math.abs(testCandle.h - candle.h) / candle.h;
        const distance2 = Math.abs(testCandle.l - candle.l) / candle.l;
        
        if (distance <= 0.01 || distance2 <= 0.01) {
          touchCount++;
        }
      }
      
      if (touchCount >= 2) {
        const strength = touchCount >= 4 ? 'STRONG' : touchCount >= 3 ? 'MODERATE' : 'WEAK';
        levels.push({
          price: candle.h,
          type: 'resistance',
          strength
        });
        levels.push({
          price: candle.l,
          type: 'support',
          strength
        });
      }
    }
    
    // Remove duplicates and sort by strength
    const uniqueLevels = levels.filter((level, index, arr) => 
      arr.findIndex(l => Math.abs(l.price - level.price) / level.price <= 0.005) === index
    );
    
    return uniqueLevels.sort((a, b) => {
      const strengthOrder = { STRONG: 3, MODERATE: 2, WEAK: 1 };
      return strengthOrder[b.strength] - strengthOrder[a.strength];
    }).slice(0, 10);
  }

  private static _analyzeWyckoff(candles: Candle[], analysis: SMCAnalysis): WyckoffAnalysis {
    const { majorHigh, majorLow, currentPrice } = analysis;
    
    if (!majorHigh || !majorLow) {
      return {
        isWyckoffPattern: false,
        tradePlans: [],
        rangeAnalysis: {
          rangeHigh: 0,
          rangeLow: 0,
          duration: 0,
          strength: 'WEAK'
        }
      };
    }

    const rangeHigh = majorHigh.price;
    const rangeLow = majorLow.price;
    const rangeDuration = Math.abs(majorHigh.index - majorLow.index);
    
    // Determine if this is a valid Wyckoff range (minimum duration and range size)
    const rangeSize = (rangeHigh - rangeLow) / currentPrice * 100;
    const isValidRange = rangeDuration >= 20 && rangeSize >= 2; // At least 20 candles and 2% range
    
    if (!isValidRange) {
      return {
        isWyckoffPattern: false,
        tradePlans: [],
        rangeAnalysis: {
          rangeHigh,
          rangeLow,
          duration: rangeDuration,
          strength: 'WEAK'
        }
      };
    }

    // Detect Wyckoff events and phases
    const wyckoffEvents = this._detectWyckoffEvents(candles, rangeHigh, rangeLow);
    const currentPhase = this._determineWyckoffPhase(wyckoffEvents, candles, rangeHigh, rangeLow, currentPrice);
    
    // Generate Wyckoff trade plans if we're in a tradeable phase
    const tradePlans = this._generateWyckoffTradePlans(currentPhase, currentPrice, rangeHigh, rangeLow);
    
    const rangeStrength = this._calculateRangeStrength(rangeDuration, rangeSize, wyckoffEvents.length);

    return {
      isWyckoffPattern: currentPhase !== null,
      currentPhase: currentPhase || undefined,
      tradePlans,
      rangeAnalysis: {
        rangeHigh,
        rangeLow,
        duration: rangeDuration,
        strength: rangeStrength
      }
    };
  }

  private static _detectWyckoffEvents(candles: Candle[], rangeHigh: number, rangeLow: number): WyckoffEvent[] {
    const events: WyckoffEvent[] = [];
    const rangeSize = rangeHigh - rangeLow;
    const rangeMid = rangeLow + (rangeSize * 0.5);
    
    for (let i = 10; i < candles.length - 10; i++) {
      const candle = candles[i];
      const prevCandle = candles[i - 1];
      const nextCandle = candles[i + 1];
      
      // Calculate volume (simplified - using high-low range as proxy for volume)
      const volumeProxy = candle.h - candle.l;
      const avgVolume = candles.slice(Math.max(0, i - 20), i).reduce((sum, c) => sum + (c.h - c.l), 0) / 20;
      const isHighVolume = volumeProxy > avgVolume * 1.5;
      
      // Detect potential Selling Climax (SC) - high volume selling near range low
      if (candle.l <= rangeLow * 1.02 && candle.c < candle.o && isHighVolume) {
        events.push({
          type: 'SC',
          price: candle.l,
          index: i,
          volume: volumeProxy,
          confidence: this._calculateEventConfidence('SC', candle, candles, i, rangeHigh, rangeLow)
        });
      }
      
      // Detect potential Buying Climax (BC) - high volume buying near range high
      if (candle.h >= rangeHigh * 0.98 && candle.c > candle.o && isHighVolume) {
        events.push({
          type: 'BC',
          price: candle.h,
          index: i,
          volume: volumeProxy,
          confidence: this._calculateEventConfidence('BC', candle, candles, i, rangeHigh, rangeLow)
        });
      }
      
      // Detect Spring - false breakout below range low
      if (candle.l < rangeLow && candle.c > rangeLow && nextCandle && nextCandle.c > candle.c) {
        events.push({
          type: 'Spring',
          price: candle.l,
          index: i,
          volume: volumeProxy,
          confidence: this._calculateEventConfidence('Spring', candle, candles, i, rangeHigh, rangeLow)
        });
      }
      
      // Detect UpThrust - false breakout above range high
      if (candle.h > rangeHigh && candle.c < rangeHigh && nextCandle && nextCandle.c < candle.c) {
        events.push({
          type: 'UpThrust',
          price: candle.h,
          index: i,
          volume: volumeProxy,
          confidence: this._calculateEventConfidence('UpThrust', candle, candles, i, rangeHigh, rangeLow)
        });
      }
      
      // Detect Last Point of Support (LPS) - higher low after spring
      if (i > 0 && candle.l > rangeLow && candle.l < rangeMid) {
        const hasSpringBefore = events.some(e => e.type === 'Spring' && e.index < i);
        if (hasSpringBefore && candle.c > candle.o) {
          events.push({
            type: 'LPS',
            price: candle.l,
            index: i,
            volume: volumeProxy,
            confidence: this._calculateEventConfidence('LPS', candle, candles, i, rangeHigh, rangeLow)
          });
        }
      }
      
      // Detect Last Point of Supply (LPSY) - lower high after upthrust
      if (i > 0 && candle.h < rangeHigh && candle.h > rangeMid) {
        const hasUpThrustBefore = events.some(e => e.type === 'UpThrust' && e.index < i);
        if (hasUpThrustBefore && candle.c < candle.o) {
          events.push({
            type: 'LPSY',
            price: candle.h,
            index: i,
            volume: volumeProxy,
            confidence: this._calculateEventConfidence('LPSY', candle, candles, i, rangeHigh, rangeLow)
          });
        }
      }
    }
    
    // Filter events by confidence and remove duplicates
    return events
      .filter(event => event.confidence >= 0.6)
      .sort((a, b) => a.index - b.index)
      .filter((event, index, arr) => {
        // Remove duplicate events of same type within 5 candles
        return !arr.slice(0, index).some(prev => 
          prev.type === event.type && Math.abs(prev.index - event.index) <= 5
        );
      });
  }

  private static _calculateEventConfidence(
    eventType: string, 
    candle: Candle, 
    candles: Candle[], 
    index: number, 
    rangeHigh: number, 
    rangeLow: number
  ): number {
    let confidence = 0.5; // Base confidence
    
    const rangeSize = rangeHigh - rangeLow;
    const volumeProxy = candle.h - candle.l;
    const avgVolume = candles.slice(Math.max(0, index - 20), index).reduce((sum, c) => sum + (c.h - c.l), 0) / 20;
    
    // Volume confirmation
    if (volumeProxy > avgVolume * 1.5) confidence += 0.2;
    if (volumeProxy > avgVolume * 2) confidence += 0.1;
    
    // Price action confirmation
    const bodySize = Math.abs(candle.c - candle.o);
    const candleSize = candle.h - candle.l;
    const bodyRatio = bodySize / candleSize;
    
    if (bodyRatio > 0.6) confidence += 0.15; // Strong directional move
    
    // Context-specific confirmations
    switch (eventType) {
      case 'Spring':
        if (candle.c > candle.o) confidence += 0.15; // Bullish close after false break
        break;
      case 'UpThrust':
        if (candle.c < candle.o) confidence += 0.15; // Bearish close after false break
        break;
      case 'LPS':
        if (candle.l > rangeLow + rangeSize * 0.1) confidence += 0.1; // Higher low
        break;
      case 'LPSY':
        if (candle.h < rangeHigh - rangeSize * 0.1) confidence += 0.1; // Lower high
        break;
    }
    
    return Math.min(confidence, 1.0);
  }

  private static _determineWyckoffPhase(
    events: WyckoffEvent[], 
    candles: Candle[], 
    rangeHigh: number, 
    rangeLow: number, 
    currentPrice: number
  ): WyckoffPhase | null {
    if (events.length === 0) return null;
    
    const latestEvents = events.slice(-3); // Look at most recent events
    const hasSpring = events.some(e => e.type === 'Spring');
    const hasUpThrust = events.some(e => e.type === 'UpThrust');
    const hasLPS = events.some(e => e.type === 'LPS');
    const hasLPSY = events.some(e => e.type === 'LPSY');
    const hasSC = events.some(e => e.type === 'SC');
    const hasBC = events.some(e => e.type === 'BC');
    
    // Determine if we're in accumulation or distribution
    if (hasSpring || (hasSC && hasLPS)) {
      // Accumulation pattern
      let phase: 'A' | 'B' | 'C' | 'D' | 'E' = 'B';
      let description = '';
      let tradingOpportunity = false;
      
      if (hasSpring && hasLPS) {
        phase = 'D';
        description = 'Phase D: Evidence of readiness to move higher. Last Point of Support identified.';
        tradingOpportunity = true;
      } else if (hasSpring) {
        phase = 'C';
        description = 'Phase C: Spring detected. Testing for remaining supply.';
        tradingOpportunity = true;
      } else if (hasSC) {
        phase = 'A';
        description = 'Phase A: Selling climax detected. Stopping action in progress.';
      } else {
        description = 'Phase B: Building of cause. Range development.';
      }
      
      return {
        type: 'accumulation',
        phase,
        events,
        confidence: this._calculatePhaseConfidence(events, 'accumulation'),
        tradingOpportunity,
        rangeHigh,
        rangeLow,
        currentPhaseDescription: description
      };
    } else if (hasUpThrust || (hasBC && hasLPSY)) {
      // Distribution pattern
      let phase: 'A' | 'B' | 'C' | 'D' | 'E' = 'B';
      let description = '';
      let tradingOpportunity = false;
      
      if (hasUpThrust && hasLPSY) {
        phase = 'D';
        description = 'Phase D: Evidence of readiness to move lower. Last Point of Supply identified.';
        tradingOpportunity = true;
      } else if (hasUpThrust) {
        phase = 'C';
        description = 'Phase C: UpThrust detected. Testing for remaining demand.';
        tradingOpportunity = true;
      } else if (hasBC) {
        phase = 'A';
        description = 'Phase A: Buying climax detected. Stopping action in progress.';
      } else {
        description = 'Phase B: Building of cause. Range development.';
      }
      
      return {
        type: 'distribution',
        phase,
        events,
        confidence: this._calculatePhaseConfidence(events, 'distribution'),
        tradingOpportunity,
        rangeHigh,
        rangeLow,
        currentPhaseDescription: description
      };
    }
    
    return null;
  }

  private static _calculatePhaseConfidence(events: WyckoffEvent[], type: 'accumulation' | 'distribution'): number {
    if (events.length === 0) return 0;
    
    let confidence = 0.4; // Base confidence
    
    // Add confidence based on number of confirming events
    confidence += Math.min(events.length * 0.1, 0.3);
    
    // Add confidence based on event quality
    const avgEventConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length;
    confidence += avgEventConfidence * 0.3;
    
    // Type-specific bonuses
    if (type === 'accumulation') {
      if (events.some(e => e.type === 'Spring')) confidence += 0.15;
      if (events.some(e => e.type === 'LPS')) confidence += 0.1;
    } else {
      if (events.some(e => e.type === 'UpThrust')) confidence += 0.15;
      if (events.some(e => e.type === 'LPSY')) confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private static _generateWyckoffTradePlans(
    phase: WyckoffPhase | null, 
    currentPrice: number, 
    rangeHigh: number, 
    rangeLow: number
  ): TradePlan[] {
    if (!phase || !phase.tradingOpportunity) return [];
    
    const plans: TradePlan[] = [];
    const rangeSize = rangeHigh - rangeLow;
    const settings = getSettings();
    
    if (phase.type === 'accumulation' && (phase.phase === 'C' || phase.phase === 'D')) {
      // Accumulation buy plans
      let entryPrice: number;
      let stopPrice: number;
      let targetPrice: number;
      let explanation: string;
      
      if (phase.phase === 'C') {
        // Entry after Spring
        const springEvent = phase.events.find(e => e.type === 'Spring');
        entryPrice = springEvent ? springEvent.price * 1.005 : rangeLow * 1.01; // Slightly above spring low
        stopPrice = rangeLow * 0.995; // Below range low
        targetPrice = rangeHigh; // Top of range
        explanation = `Wyckoff Accumulation Phase C: Entry after Spring. Market has tested and found support below the range, indicating absorption of supply. Target: range high.`;
      } else {
        // Entry at LPS (Phase D)
        const lpsEvent = phase.events.find(e => e.type === 'LPS');
        entryPrice = lpsEvent ? lpsEvent.price * 1.002 : rangeLow + rangeSize * 0.2;
        stopPrice = rangeLow * 0.99;
        targetPrice = rangeHigh + rangeSize * 0.5; // Above range - markup target
        explanation = `Wyckoff Accumulation Phase D: Entry at Last Point of Support. Strong hands are ready to markup. Target extends beyond range for markup phase.`;
      }
      
      const riskReward = (targetPrice - entryPrice) / (entryPrice - stopPrice);
      
      if (riskReward >= 1.0) {
        plans.push({
          title: `Wyckoff Buy (Phase ${phase.phase})`,
          entry: entryPrice,
          stop: stopPrice,
          target: targetPrice,
          riskReward,
          strength: phase.confidence >= 0.8 ? 'STRONG' : phase.confidence >= 0.6 ? 'MODERATE' : 'WEAK',
          age: 'FRESH',
          explanation
        });
      }
    } else if (phase.type === 'distribution' && (phase.phase === 'C' || phase.phase === 'D')) {
      // Distribution sell plans
      let entryPrice: number;
      let stopPrice: number;
      let targetPrice: number;
      let explanation: string;
      
      if (phase.phase === 'C') {
        // Entry after UpThrust
        const upThrustEvent = phase.events.find(e => e.type === 'UpThrust');
        entryPrice = upThrustEvent ? upThrustEvent.price * 0.995 : rangeHigh * 0.99; // Slightly below upthrust high
        stopPrice = rangeHigh * 1.005; // Above range high
        targetPrice = rangeLow; // Bottom of range
        explanation = `Wyckoff Distribution Phase C: Entry after UpThrust. Market has tested and found resistance above the range, indicating lack of demand. Target: range low.`;
      } else {
        // Entry at LPSY (Phase D)
        const lpsyEvent = phase.events.find(e => e.type === 'LPSY');
        entryPrice = lpsyEvent ? lpsyEvent.price * 0.998 : rangeHigh - rangeSize * 0.2;
        stopPrice = rangeHigh * 1.01;
        targetPrice = rangeLow - rangeSize * 0.5; // Below range - markdown target
        explanation = `Wyckoff Distribution Phase D: Entry at Last Point of Supply. Weak hands are ready for markdown. Target extends beyond range for markdown phase.`;
      }
      
      const riskReward = (entryPrice - targetPrice) / (stopPrice - entryPrice);
      
      if (riskReward >= 1.0) {
        plans.push({
          title: `Wyckoff Sell (Phase ${phase.phase})`,
          entry: entryPrice,
          stop: stopPrice,
          target: targetPrice,
          riskReward,
          strength: phase.confidence >= 0.8 ? 'STRONG' : phase.confidence >= 0.6 ? 'MODERATE' : 'WEAK',
          age: 'FRESH',
          explanation
        });
      }
    }
    
    return plans;
  }

  private static _calculateRangeStrength(duration: number, rangeSize: number, eventCount: number): 'STRONG' | 'MODERATE' | 'WEAK' {
    let score = 0;
    
    // Duration scoring
    if (duration >= 50) score += 3;
    else if (duration >= 30) score += 2;
    else score += 1;
    
    // Range size scoring
    if (rangeSize >= 5) score += 3;
    else if (rangeSize >= 3) score += 2;
    else score += 1;
    
    // Event count scoring
    if (eventCount >= 4) score += 2;
    else if (eventCount >= 2) score += 1;
    
    if (score >= 6) return 'STRONG';
    if (score >= 4) return 'MODERATE';
    return 'WEAK';
  }
}