import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime } from "./stopwatch";
import type { Lap } from "@shared/schema";
import { cn } from "@/lib/utils";

interface LapDisplayProps {
  laps: Lap[];
  distancePerLap: number;
  maxHeight?: string;
}

export function LapDisplay({ laps, distancePerLap, maxHeight = "300px" }: LapDisplayProps) {
  if (laps.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No laps recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between gap-4">
          <span>Lap Times</span>
          <Badge variant="secondary">{laps.length} laps</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-2">
            {laps.map((lap, index) => {
              const hasOverride = lap.overrideMeters !== null || lap.overrideFeet !== null || lap.overrideInches !== null;
              let displayDistance = lap.distanceCovered;
              
              if (hasOverride) {
                displayDistance = (lap.overrideMeters || 0) + 
                  ((lap.overrideFeet || 0) * 0.3048) + 
                  ((lap.overrideInches || 0) * 0.0254);
              }

              return (
                <div
                  key={lap.id}
                  className={cn(
                    "flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50",
                    index === laps.length - 1 && "bg-primary/10 border border-primary/20"
                  )}
                  data-testid={`lap-row-${lap.lapNumber}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {lap.lapNumber}
                    </div>
                    <div>
                      <p className="font-mono font-medium">{formatTime(lap.lapTimeMs)}</p>
                      <p className="text-xs text-muted-foreground">
                        {displayDistance.toFixed(1)}m covered
                        {hasOverride && " (adjusted)"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-muted-foreground">
                      Total: {formatTime(lap.totalTimeMs)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
