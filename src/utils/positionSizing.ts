export interface PositionSizeInput {
  accountSize: number;
  riskPercentage: number;
  entryPrice: number;
  stopPrice: number;
  btcPrice: number;
}

export interface PositionSizeResult {
  riskAmount: number;
  positionSizeUSD: number;
  positionSizeBTC: number;
  riskRewardRatio: number;
  stopLossDistance: number;
  stopLossPercentage: number;
}

export const calculatePositionSize = (input: PositionSizeInput, targetPrice?: number): PositionSizeResult => {
  const { accountSize, riskPercentage, entryPrice, stopPrice, btcPrice } = input;
  
  const riskAmount = accountSize * (riskPercentage / 100);
  const stopLossDistance = Math.abs(entryPrice - stopPrice);
  const stopLossPercentage = (stopLossDistance / entryPrice) * 100;
  
  const positionSizeUSD = riskAmount / (stopLossDistance / entryPrice);
  const positionSizeBTC = positionSizeUSD / btcPrice;
  
  let riskRewardRatio = 1;
  if (targetPrice) {
    const profitDistance = Math.abs(targetPrice - entryPrice);
    riskRewardRatio = profitDistance / stopLossDistance;
  }

  return {
    riskAmount,
    positionSizeUSD,
    positionSizeBTC,
    riskRewardRatio,
    stopLossDistance,
    stopLossPercentage
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatBTC = (value: number): string => {
  return value.toFixed(6) + ' BTC';
};