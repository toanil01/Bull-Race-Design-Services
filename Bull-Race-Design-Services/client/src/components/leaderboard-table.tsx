import { Medal, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatTime } from "./stopwatch";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@shared/schema";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  showLapDetails?: boolean;
  title?: string;
}

function getRankStyle(rank: number): { bg: string; text: string; icon: string } {
  switch (rank) {
    case 1:
      return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: "text-amber-500" };
    case 2:
      return { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-600 dark:text-slate-300", icon: "text-slate-400" };
    case 3:
      return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", icon: "text-orange-600" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground", icon: "" };
  }
}

function LeaderboardRow({ entry, showLapDetails }: { entry: LeaderboardEntry; showLapDetails: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const rankStyle = getRankStyle(entry.rank);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-md transition-colors",
          entry.isRacing && "border-2 border-primary animate-pulse",
          entry.rank <= 3 ? rankStyle.bg : "bg-muted/30"
        )}
        data-testid={`leaderboard-row-${entry.bullPairId}`}
      >
        <div className="flex items-center gap-3 flex-shrink-0">
          {entry.rank <= 3 ? (
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", rankStyle.bg)}>
              <Medal className={cn("h-5 w-5", rankStyle.icon)} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
              {entry.rank}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{entry.pairName}</span>
            {entry.isRacing && (
              <Badge variant="destructive" className="flex-shrink-0">
                <span className="animate-pulse mr-1">●</span> Racing
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {entry.ownerName1}
            {entry.ownerName2 && ` & ${entry.ownerName2}`}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-mono font-bold text-lg">{formatTime(entry.totalTimeMs)}</p>
          <p className="text-xs text-muted-foreground">{entry.totalDistance.toFixed(1)}m</p>
        </div>

        {showLapDetails && entry.laps.length > 0 && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-expand-${entry.bullPairId}`}>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        )}
      </div>

      {showLapDetails && (
        <CollapsibleContent>
          <div className="pl-14 pr-4 pb-4 pt-2 space-y-1">
            {entry.laps.map((lap) => (
              <div
                key={lap.id}
                className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
              >
                <span className="text-muted-foreground">Lap {lap.lapNumber}</span>
                <span className="font-mono">{formatTime(lap.lapTimeMs)}</span>
                <span className="text-muted-foreground">{lap.distanceCovered}m</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export function LeaderboardTable({
  entries,
  showLapDetails = true,
  title = "Leaderboard",
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Medal className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No race results yet</p>
          <p className="text-sm mt-1">Results will appear here once racing begins</p>
        </CardContent>
      </Card>
    );
  }

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string | number; direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: string | number) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedEntries = [...entries].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    let valA, valB;

    if (key === "rank") {
      valA = a.rank;
      valB = b.rank;
    } else if (key === "total") {
      // Primary sort by Distance (Desc), secondary by Time (Asc)
      // But if user clicks header, maybe they just want Time?
      // User said "Total Distance". Let's sort by Distance first.
      valA = a.totalDistance;
      valB = b.totalDistance;

      // For distance, "asc" means low to high (bad), "desc" means high to low (good)
      // Let's invert default sort for distance? 
      // Standard generic sort:
      if (valA === valB) {
        return direction === "asc" ? a.totalTimeMs - b.totalTimeMs : b.totalTimeMs - a.totalTimeMs;
      }
      // For distance, we usually want Descending. 
      // If direction is 'asc', return valA - valB.
      // But let's stick to standard handling and let user click twice.
    } else if (typeof key === "number") {
      // Sort by Lap N time
      // If lap doesn't exist, treat as infinity (slow)
      valA = a.laps[key]?.totalTimeMs ?? Number.MAX_SAFE_INTEGER;
      valB = b.laps[key]?.totalTimeMs ?? Number.MAX_SAFE_INTEGER;
    } else {
      return 0;
    }

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // Determine max laps
  const maxLaps = Math.max(...entries.map(e => e.laps.length), 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 border-b bg-muted/40">
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{title}</span>
          <Badge variant="outline">{entries.length} participants</Badge>
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th
                className="h-10 px-4 text-left font-medium text-muted-foreground w-16 cursor-pointer hover:text-foreground"
                onClick={() => handleSort("rank")}
              >
                Rank {sortConfig?.key === "rank" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground min-w-[200px]">Pair Details</th>
              {Array.from({ length: maxLaps }).map((_, i) => (
                <th
                  key={i}
                  className="h-10 px-4 text-center font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort(i)}
                >
                  Lap {i + 1} {sortConfig?.key === i && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              ))}
              <th
                className="h-10 px-4 text-right font-medium text-muted-foreground w-32 cursor-pointer hover:text-foreground"
                onClick={() => handleSort("total")}
              >
                Total Distance {sortConfig?.key === "total" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                {/* User reuested rename to "Total Distance" */}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => {
              const rankStyle = getRankStyle(entry.rank);
              return (
                <tr
                  key={entry.bullPairId}
                  // ... rest of row render
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    entry.isRacing && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                >
                  <td className="p-4 align-top">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                      entry.rank <= 3 ? rankStyle.bg : "bg-muted text-muted-foreground"
                    )}>
                      {entry.rank}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="font-semibold">{entry.pairName}</div>
                    <div className="text-muted-foreground text-xs">
                      {entry.ownerName1} {entry.ownerName2 && `& ${entry.ownerName2}`}
                    </div>
                    {entry.isRacing && (
                      <Badge variant="destructive" className="mt-1 h-5 px-1.5 text-[10px]">
                        <span className="animate-pulse mr-1">●</span> Racing
                      </Badge>
                    )}
                  </td>
                  {Array.from({ length: maxLaps }).map((_, i) => {
                    const lap = entry.laps[i];
                    return (
                      <td key={i} className="p-4 text-center align-top border-l border-dashed border-muted/50">
                        {lap ? (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-medium">{formatTime(lap.totalTimeMs, false)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-4 text-right align-top border-l bg-muted/20">
                    <div className="font-mono font-bold text-base">{formatTime(entry.totalTimeMs, false)}</div>
                    <div className="text-xs text-muted-foreground">{entry.totalDistance}m</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
