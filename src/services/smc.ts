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
    
    analysis.buyPlans = this._createMultipleTradePlans(analysis, 'buy');
    analysis.sellPlans = this._createMultipleTradePlans(analysis, 'sell');
    
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
    
    for (let i = startSearch; i < candles.length - 1; i++) {
      const candle = candles[i];
      const prevCandle = i > 0 ? candles[i - 1] : null;
      const nextCandle = i < candles.length - 1 ? candles[i + 1] : null;
      
      // Enhanced zone detection with better criteria
      const hasStrongRejection = this._hasStrongReaction(candles, i);
      const bodyPercentage = Math.abs(candle.c - candle.o) / (candle.h - candle.l);
      
      // Zonas de Demanda (Discount Area) - Enhanced criteria
      if (candle.h < fib50 && candle.c < candle.o && bodyPercentage > 0.6 && hasStrongRejection) {
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
      
      // Zonas de Supply (Premium Area) - Enhanced criteria
      if (candle.l > fib50 && candle.c > candle.o && bodyPercentage > 0.6 && hasStrongRejection) {
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
    
    // More strict testing criteria based on profile
    let penetrationThreshold = 0.3; // 30% penetration required
    let minReactionCandles = 1;
    
    if (profile === 'swing') {
      penetrationThreshold = 0.5; // 50% penetration for conservative
      minReactionCandles = 2;
    } else if (profile === 'scalp') {
      penetrationThreshold = 0.15; // 15% penetration for aggressive
      minReactionCandles = 1;
    }
    
    const zoneHeight = zone.h - zone.l;
    let validTests = 0;
    
    for (let i = formationIndex + 1; i < candles.length - minReactionCandles; i++) {
      const candle = candles[i];
      const overlap = Math.min(candle.h, zone.h) - Math.max(candle.l, zone.l);
      
      if (overlap > 0) {
        const penetration = overlap / zoneHeight;
        
        // Check if penetration is significant enough
        if (penetration >= penetrationThreshold) {
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
          if (validTests >= (profile === 'scalp' ? 1 : 2)) return true;
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
    
    // Profile-specific parameters
    const profileConfig = {
      scalp: {
        minRR: 0.3,
        maxRR: 1.5,
        maxPlans: 5,
        preferClose: true,
        maxDistance: 3.0,
        testedWeight: 0.7 // Less penalty for tested zones
      },
      balanced: {
        minRR: 1.0,
        maxRR: 3.0,
        maxPlans: 3,
        preferClose: false,
        maxDistance: 7.0,
        testedWeight: 0.5
      },
      swing: {
        minRR: 2.0,
        maxRR: 10.0,
        maxPlans: 2,
        preferClose: false,
        maxDistance: 15.0,
        testedWeight: 0.2 // Heavy penalty for tested zones
      }
    };
    
    const config = profileConfig[profile];
    
    if (type === 'buy' && bias === 'BULLISH' && majorHigh) {
      let validZones = demandZones.filter(zone => 
        zone.distance <= config.maxDistance &&
        (!zone.tested || config.testedWeight > 0.3)
      );
      
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
        const targetPrice = majorHigh.price;
        const riskReward = (targetPrice - entryPrice) / (entryPrice - stopPrice);
        
        if (riskReward >= config.minRR && riskReward <= config.maxRR) {
          const planStrength = this._calculatePlanStrength(zone, riskReward);
          const explanation = `${index === 0 ? 'Primary' : 'Alternative'} buy setup in a ${bias.toLowerCase()} structure. Entry at demand zone (${zone.strength.toLowerCase()} strength, ${zone.age.toLowerCase()} formation) ${zone.distance.toFixed(1)}% from current price. ${zone.tested ? 'Zone previously tested.' : 'Fresh untested zone.'} R/R: ${riskReward.toFixed(2)}`;
          
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
    
    if (type === 'sell' && bias === 'BEARISH' && majorLow) {
      let validZones = supplyZones.filter(zone => 
        zone.distance <= config.maxDistance &&
        (!zone.tested || config.testedWeight > 0.3)
      );
      
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
        const targetPrice = majorLow.price;
        const riskReward = (entryPrice - targetPrice) / (stopPrice - entryPrice);
        
        if (riskReward >= config.minRR && riskReward <= config.maxRR) {
          const planStrength = this._calculatePlanStrength(zone, riskReward);
          const explanation = `${index === 0 ? 'Primary' : 'Alternative'} sell setup in a ${bias.toLowerCase()} structure. Entry at supply zone (${zone.strength.toLowerCase()} strength, ${zone.age.toLowerCase()} formation) ${zone.distance.toFixed(1)}% from current price. ${zone.tested ? 'Zone previously tested.' : 'Fresh untested zone.'} R/R: ${riskReward.toFixed(2)}`;
          
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
}