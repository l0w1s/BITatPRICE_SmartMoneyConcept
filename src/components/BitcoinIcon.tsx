import React from 'react';
import bitcoinIcon from '@/assets/bitcoin-icon.png';

export const BitcoinIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src={bitcoinIcon} alt="Bitcoin" className={className} />
);