export interface Candle {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

export class BitcoinAPI {
  private static readonly BASE_URL = 'https://api.hyperliquid.xyz/info';

  static async fetchCandles(timeframe: string): Promise<Candle[]> {
    const now = Date.now();
    const daysToFetchMap: Record<string, number> = { 
      '15m': 5, 
      '30m': 10, 
      '1h': 15, 
      '4h': 60, 
      '1d': 365 
    };
    const daysToFetch = daysToFetchMap[timeframe] || 30;
    const startTime = now - (daysToFetch * 24 * 60 * 60 * 1000);

    const requestBody = {
      type: "candleSnapshot",
      req: { 
        coin: "BTC", 
        interval: timeframe, 
        startTime: startTime, 
        endTime: now 
      }
    };

    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Falha na API da Hyperliquid (status: ${response.status}). Tente novamente.`);
      }
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("A API não retornou dados de candles válidos.");
      }
      
      return data.map((c: any) => ({
        t: parseInt(c.t), 
        o: parseFloat(c.o), 
        h: parseFloat(c.h),
        l: parseFloat(c.l), 
        c: parseFloat(c.c)
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido ao buscar dados da API');
    }
  }
}