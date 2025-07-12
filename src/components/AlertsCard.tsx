import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { SMCAnalysis } from "@/services/smc";

interface AlertsCardProps {
  analysis: SMCAnalysis | null;
  currentPrice: number;
}

export function AlertsCard({ analysis, currentPrice }: AlertsCardProps) {
  const { alerts, toggleAlert, resetAlerts } = useAlerts(analysis, currentPrice);

  if (!analysis || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Zonas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum alerta ativo. Execute uma análise para configurar alertas automáticos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const triggeredAlerts = alerts.filter(alert => alert.triggered);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Zonas
            <Badge variant="secondary">{activeAlerts.length} ativos</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAlerts}
            disabled={triggeredAlerts.length === 0}
          >
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const distance = Math.abs(currentPrice - alert.zonePrice) / alert.zonePrice * 100;
          const isNear = distance <= 1; // Within 1%
          
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                alert.triggered
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                  : isNear && alert.isActive
                  ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={alert.type === 'demand' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {alert.type === 'demand' ? 'Demanda' : 'Oferta'}
                  </Badge>
                  {alert.triggered && (
                    <Badge variant="secondary" className="text-xs">
                      ⚠️ Ativado
                    </Badge>
                  )}
                  {isNear && alert.isActive && !alert.triggered && (
                    <Badge variant="outline" className="text-xs">
                      🎯 Próximo
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">
                  ${alert.zonePrice.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Distância: {distance.toFixed(2)}%
                </p>
              </div>
              <Switch
                checked={alert.isActive}
                onCheckedChange={() => toggleAlert(alert.id)}
                className="ml-2"
              />
            </div>
          );
        })}
        
        {triggeredAlerts.length > 0 && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              {triggeredAlerts.length} alerta(s) foi(ram) ativado(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}