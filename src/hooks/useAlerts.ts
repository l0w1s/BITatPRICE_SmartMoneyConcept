import { useState, useEffect } from 'react';
import { SMCAnalysis } from '@/services/smc';
import { useToast } from '@/hooks/use-toast';

export interface Alert {
  id: string;
  zonePrice: number;
  zoneName: string;
  type: 'demand' | 'supply';
  isActive: boolean;
  triggered: boolean;
}

export const useAlerts = (analysis: SMCAnalysis | null, currentPrice: number) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!analysis) return;

    const newAlerts: Alert[] = [];
    
    // Create alerts for demand zones
    analysis.demandZones.forEach((zone, index) => {
      if (zone.strength !== 'WEAK') {
        newAlerts.push({
          id: `demand-${index}`,
          zonePrice: (zone.low + zone.high) / 2,
          zoneName: `Demand Zone ${((zone.low + zone.high) / 2).toFixed(0)}`,
          type: 'demand',
          isActive: true,
          triggered: false
        });
      }
    });

    // Create alerts for supply zones
    analysis.supplyZones.forEach((zone, index) => {
      if (zone.strength !== 'WEAK') {
        newAlerts.push({
          id: `supply-${index}`,
          zonePrice: (zone.low + zone.high) / 2,
          zoneName: `Supply Zone ${((zone.low + zone.high) / 2).toFixed(0)}`,
          type: 'supply',
          isActive: true,
          triggered: false
        });
      }
    });

    setAlerts(newAlerts);
  }, [analysis]);

  useEffect(() => {
    if (!currentPrice) return;

    const triggeredAlerts: Alert[] = [];
    
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => {
        if (alert.isActive && !alert.triggered) {
          const distance = Math.abs(currentPrice - alert.zonePrice) / alert.zonePrice * 100;
          
          if (distance <= 0.5) { // 0.5% threshold
            triggeredAlerts.push(alert);
            return { ...alert, triggered: true };
          }
        }
        return alert;
      })
    );

    // Show toast notifications after state update
    triggeredAlerts.forEach(alert => {
      toast({
        title: "🚨 Critical Zone Reached!",
        description: `Price approached ${alert.zoneName} (${alert.zonePrice.toFixed(0)})`,
      });
    });
  }, [currentPrice, toast]);

  const toggleAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isActive: !alert.isActive, triggered: false }
          : alert
      )
    );
  };

  const resetAlerts = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, triggered: false })));
  };

  return { alerts, toggleAlert, resetAlerts };
};