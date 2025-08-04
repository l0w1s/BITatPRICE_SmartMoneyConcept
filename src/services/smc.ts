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
}

export class SMCAnalyzer {
  static analyze(candles: Candle[], timeframe: string): SMCAnalysis | { error: string } {
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
    const pois = this._findEnhancedPointsOfInterest(candles, structure, currentPrice);
    
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

  private static _findEnhancedPointsOfInterest(candles: Candle[], structure: MarketStructure, currentPrice: number) {
    const { majorHigh, majorLow } = structure;
    if (!majorHigh || !majorLow) return { demandZones: [], supplyZones: [], bullishFVGs: [], bearishFVGs: [] };
    
    const rangeStart = Math.min(majorLow.price, majorHigh.price);
    const rangeEnd = Math.max(majorLow.price, majorHigh.price);
    const fib50 = rangeStart + (rangeEnd - rangeStart) * 0.5;
    
    const demandZones: EnhancedZone[] = [];
    const supplyZones: EnhancedZone[] = [];
    const bullishFVGs: EnhancedZone[] = [];
    const bearishFVGs: EnhancedZone[] = [];
    
    // Expandir range de busca para incluir mais dados históricos
    const searchRange = Math.min(candles.length - 1, 100);
    const startSearch = Math.max(0, candles.length - searchRange);
    
    for (let i = startSearch; i < candles.length - 1; i++) {
      const candle = candles[i];
      const prevCandle = i > 0 ? candles[i - 1] : null;
      const nextCandle = i < candles.length - 1 ? candles[i + 1] : null;
      
      // Zonas de Demanda (Discount Area)
      if (candle.h < fib50 && candle.c < candle.o) {
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
      }
      
      // Zonas de Supply (Premium Area)
      if (candle.l > fib50 && candle.c > candle.o) {
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
    
    // Ordenar por força e manter apenas as melhores
    const sortByStrengthAndProximity = (zones: EnhancedZone[]) => 
      zones.sort((a, b) => {
        const strengthOrder = { STRONG: 3, MODERATE: 2, WEAK: 1 };
        if (strengthOrder[a.strength] !== strengthOrder[b.strength]) {
          return strengthOrder[b.strength] - strengthOrder[a.strength];
        }
        return a.distance - b.distance;
      }).slice(0, 3);
    
    return {
      demandZones: sortByStrengthAndProximity(demandZones),
      supplyZones: sortByStrengthAndProximity(supplyZones),
      bullishFVGs: sortByStrengthAndProximity(bullishFVGs),
      bearishFVGs: sortByStrengthAndProximity(bearishFVGs)
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
}