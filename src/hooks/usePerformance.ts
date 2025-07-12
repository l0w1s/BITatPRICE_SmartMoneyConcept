import { useState, useEffect } from 'react';
import { SMCAnalysis } from '@/services/smc';

export interface PerformanceRecord {
  id: string;
  timestamp: number;
  timeframe: string;
  bias: string;
  zones: {
    demand: number;
    supply: number;
  };
  tradePlans: number;
  currentPrice: number;
}

export interface PerformanceStats {
  totalAnalyses: number;
  avgZonesPerAnalysis: number;
  mostActiveTimeframe: string;
  analysisHistory: PerformanceRecord[];
}

export const usePerformance = () => {
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('btc-smc-performance');
    if (saved) {
      setPerformanceHistory(JSON.parse(saved));
    }
  }, []);

  const addRecord = (analysis: SMCAnalysis, timeframe: string, currentPrice: number) => {
    const record: PerformanceRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      timeframe,
      bias: analysis.bias,
      zones: {
        demand: analysis.demandZones.length,
        supply: analysis.supplyZones.length
      },
      tradePlans: analysis.buyPlans.length + analysis.sellPlans.length,
      currentPrice
    };

    const updated = [record, ...performanceHistory].slice(0, 50); // Keep last 50 records
    setPerformanceHistory(updated);
    localStorage.setItem('btc-smc-performance', JSON.stringify(updated));
  };

  const getStats = (): PerformanceStats => {
    const totalAnalyses = performanceHistory.length;
    const avgZones = performanceHistory.reduce((acc, record) => 
      acc + record.zones.demand + record.zones.supply, 0) / (totalAnalyses || 1);
    
    const timeframeCount = performanceHistory.reduce((acc, record) => {
      acc[record.timeframe] = (acc[record.timeframe] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveTimeframe = Object.entries(timeframeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '1h';

    return {
      totalAnalyses,
      avgZonesPerAnalysis: Math.round(avgZones * 10) / 10,
      mostActiveTimeframe,
      analysisHistory: performanceHistory
    };
  };

  const clearHistory = () => {
    setPerformanceHistory([]);
    localStorage.removeItem('btc-smc-performance');
  };

  return { addRecord, getStats, clearHistory };
};