import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bug, TrendingUp, Crosshair, Eye } from "lucide-react";
import { SMCAnalysis } from "@/services/smc";

interface DebugCardProps {
  analysis: SMCAnalysis;
}

export const DebugCard: React.FC<DebugCardProps> = ({ analysis }) => {
  const { debugInfo, confluences } = analysis;

  if (!debugInfo && !confluences) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bug className="h-5 w-5" />
          Debug Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {debugInfo && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Zone Analysis Statistics
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile Used:</span>
                  <Badge variant="outline" className="text-xs">
                    {debugInfo.profileUsed.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Search Range:</span>
                  <Badge variant="secondary" className="text-xs">
                    {debugInfo.searchRange} candles
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Zones Found:</span>
                  <Badge variant="default" className="text-xs">
                    {debugInfo.totalZonesFound}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Untested Zones:</span>
                  <Badge variant="default" className="text-xs bg-green-500">
                    {debugInfo.untestedZones}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tested Zones:</span>
                  <Badge variant="destructive" className="text-xs">
                    {debugInfo.testedZones}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zones Filtered:</span>
                  <Badge variant="outline" className="text-xs">
                    {debugInfo.zonesFiltered}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Zone Distance:</span>
              <Badge variant="secondary">
                {debugInfo.averageZoneDistance}%
              </Badge>
            </div>
          </div>
        )}

        {confluences && confluences.length > 0 && (
          <>
            {debugInfo && <Separator />}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Crosshair className="h-4 w-4" />
                Confluence Zones ({confluences.length})
              </h4>
              
              <div className="space-y-2">
                {confluences.map((confluence, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={confluence.strength === 'STRONG' ? 'default' : 
                                  confluence.strength === 'MODERATE' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {confluence.strength}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {confluence.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {confluence.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">
                        ${confluence.level.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {(!debugInfo && !confluences?.length) && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>No debug information available.</p>
            <p>Enable Debug Mode in settings to see detailed analysis.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};