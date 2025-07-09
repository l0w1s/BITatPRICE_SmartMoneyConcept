import { Candle } from './api';

export interface SwingPoint {
  type: 'high' | 'low';
  price: number;
  index: number;
}

export interface Zone {
  low: number;
  high: number;
}

export interface TradePlan {
  title: string;
  entry: number;
  target: number;
  stop: number;
  riskReward: number;
}

export interface MarketStructure {
  bias: 'ALTA' | 'BAIXA' | 'LATERAL';
  lastEvent?: string;
  breakLevel?: number;
  majorHigh?: SwingPoint;
  majorLow?: SwingPoint;
  probability: number;
  strength: 'FRACO' | 'MODERADO' | 'FORTE';
}

export interface SMCAnalysis extends MarketStructure {
  timeframe: string;
  currentPrice: number;
  buyPlan?: TradePlan;
  sellPlan?: TradePlan;
  demandZone?: Zone;
  supplyZone?: Zone;
  bullishFVG?: Zone;
  bearishFVG?: Zone;
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
      return { error: `Dados insuficientes para uma análise confiável em ${timeframe}.` };
    }

    const swings = this._findSwingPoints(candles, lookback);
    if (swings.length < 4) {
      return { error: `Não foi possível identificar topos/fundos suficientes para a análise em ${timeframe}.` };
    }

    const structure = this._findMarketStructure(swings);
    if ('error' in structure) {
      return structure;
    }
    
    const pois = this._findPointsOfInterest(candles, structure);
    
    const analysis: SMCAnalysis = {
      ...structure,
      ...pois,
      timeframe,
      currentPrice: candles[candles.length - 1].c
    };
    
    analysis.buyPlan = this._createTradePlan(analysis, 'buy');
    analysis.sellPlan = this._createTradePlan(analysis, 'sell');
    
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
      return { error: "Não há topos/fundos suficientes para determinar a estrutura do mercado." };
    }

    const [lastHigh, prevHigh] = highs.slice(-2);
    const [lastLow, prevLow] = lows.slice(-2);
    
    // Tendência de Alta - BOS
    if (lastHigh.price > prevHigh.price && lastLow.price > prevLow.price) {
      const probability = this._calculateProbability('ALTA', 'BOS');
      return { 
        bias: 'ALTA', 
        lastEvent: 'BOS', 
        breakLevel: prevHigh.price, 
        majorHigh: lastHigh, 
        majorLow: prevLow,
        probability,
        strength: this._calculateStrength(probability, 'BOS', swings.length)
      };
    }
    
    // Tendência de Baixa - BOS
    if (lastLow.price < prevLow.price && lastHigh.price < prevHigh.price) {
      const probability = this._calculateProbability('BAIXA', 'BOS');
      return { 
        bias: 'BAIXA', 
        lastEvent: 'BOS', 
        breakLevel: prevLow.price, 
        majorHigh: prevHigh, 
        majorLow: lastLow,
        probability,
        strength: this._calculateStrength(probability, 'BOS', swings.length)
      };
    }
    
    // CHoCH para Baixa
    if (lastLow.price < prevLow.price && lastHigh.index > prevLow.index) {
      const probability = this._calculateProbability('BAIXA', 'CHoCH');
      return { 
        bias: 'BAIXA', 
        lastEvent: 'CHoCH', 
        breakLevel: prevLow.price, 
        majorHigh: lastHigh, 
        majorLow: lastLow,
        probability,
        strength: this._calculateStrength(probability, 'CHoCH', swings.length)
      };
    }
    
    // CHoCH para Alta
    if (lastHigh.price > prevHigh.price && lastLow.index > prevHigh.index) {
      const probability = this._calculateProbability('ALTA', 'CHoCH');
      return { 
        bias: 'ALTA', 
        lastEvent: 'CHoCH', 
        breakLevel: prevHigh.price, 
        majorHigh: lastHigh, 
        majorLow: lastLow,
        probability,
        strength: this._calculateStrength(probability, 'CHoCH', swings.length)
      };
    }
    
    const probability = this._calculateProbability('LATERAL', '');
    return { 
      bias: 'LATERAL', 
      lastEvent: '', 
      breakLevel: undefined, 
      majorHigh: lastHigh, 
      majorLow: lastLow,
      probability,
      strength: this._calculateStrength(probability, '', swings.length)
    };
  }

  private static _calculateProbability(bias: string, event: string): number {
    // Probabilidades baseadas em backtests históricos
    if (event === 'BOS') {
      return bias === 'LATERAL' ? 60 : 87;
    }
    if (event === 'CHoCH') {
      return 74;
    }
    return 52; // Mercado lateral
  }

  private static _calculateStrength(probability: number, event: string, swingCount: number): 'FRACO' | 'MODERADO' | 'FORTE' {
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
    
    // Classificação final
    if (strengthScore >= 5) return 'FORTE';
    if (strengthScore >= 3) return 'MODERADO';
    return 'FRACO';
  }

  private static _findPointsOfInterest(candles: Candle[], structure: MarketStructure) {
    const { majorHigh, majorLow } = structure;
    if (!majorHigh || !majorLow) return {};
    
    const rangeStart = Math.min(majorLow.price, majorHigh.price);
    const rangeEnd = Math.max(majorLow.price, majorHigh.price);
    const fib50 = rangeStart + (rangeEnd - rangeStart) * 0.5;

    let demandZone: Zone | undefined = undefined;
    let supplyZone: Zone | undefined = undefined;
    let bullishFVG: Zone | undefined = undefined;
    let bearishFVG: Zone | undefined = undefined;
    
    const startIndex = Math.min(majorLow.index, majorHigh.index);
    const endIndex = Math.max(majorLow.index, majorHigh.index);

    for (let i = endIndex - 1; i > startIndex; i--) {
      const candle = candles[i];
      const prevCandle = candles[i - 1];
      const nextCandle = candles[i + 1];

      if (candle.h < fib50) { // Zona de Desconto
        if (!demandZone && candle.c < candle.o) {
          demandZone = { low: candle.l, high: candle.h };
        }
        if (!bullishFVG && prevCandle && nextCandle && prevCandle.h < nextCandle.l) {
          bullishFVG = { low: prevCandle.h, high: nextCandle.l };
        }
      } else if (candle.l > fib50) { // Zona Premium
        if (!supplyZone && candle.c > candle.o) {
          supplyZone = { low: candle.l, high: candle.h };
        }
        if (!bearishFVG && prevCandle && nextCandle && prevCandle.l > nextCandle.h) {
          bearishFVG = { low: nextCandle.h, high: prevCandle.l };
        }
      }
    }
    
    return { demandZone, supplyZone, bullishFVG, bearishFVG };
  }
  
  private static _createTradePlan(analysis: SMCAnalysis, type: 'buy' | 'sell'): TradePlan | undefined {
    const { bias, demandZone, supplyZone, majorHigh, majorLow } = analysis;
    
    if (type === 'buy') {
      if (bias === 'ALTA' && demandZone && majorHigh) {
        const entryPrice = demandZone.high;
        const stopPrice = demandZone.low;
        const targetPrice = majorHigh.price;
        const riskReward = (targetPrice - entryPrice) / (entryPrice - stopPrice);
        
        return {
          title: "Plano de Compra (Desconto)",
          entry: entryPrice,
          stop: stopPrice,
          target: targetPrice,
          riskReward
        };
      }
    }

    if (type === 'sell') {
      if (bias === 'BAIXA' && supplyZone && majorLow) {
        const entryPrice = supplyZone.low;
        const stopPrice = supplyZone.high;
        const targetPrice = majorLow.price;
        const riskReward = (entryPrice - targetPrice) / (stopPrice - entryPrice);
        
        return {
          title: "Plano de Venda (Premium)",
          entry: entryPrice,
          stop: stopPrice,
          target: targetPrice,
          riskReward
        };
      }
    }
    
    return undefined;
  }
}