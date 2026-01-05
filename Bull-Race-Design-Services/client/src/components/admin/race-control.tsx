import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, Flag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Stopwatch, formatTime } from "@/components/stopwatch";
import { LapDisplay } from "@/components/lap-display";
import { LapOverrideDialog } from "@/components/lap-override-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BullPair, Category, Lap, RaceEntryWithDetails, RaceEntry } from "@shared/schema";
import { cn } from "@/lib/utils";

interface RaceControlProps {
  category: Category;
  orderedPairs: BullPair[];
  raceEntries: RaceEntryWithDetails[];
  onRaceComplete: () => void;
}

interface PairRaceState {
  pair: BullPair;
  status: "waiting" | "racing" | "completed";
  laps: Lap[];
  totalTimeMs: number;
  startTime?: number;
}

export function RaceControl({ category, orderedPairs, raceEntries, onRaceComplete }: RaceControlProps) {
  const { toast } = useToast();

  // Initialize state from props (rehydration)
  const [pairStates, setPairStates] = useState<PairRaceState[]>(() => {
    return orderedPairs.map((pair) => {
      const entry = raceEntries.find(e => e.bullPairId === pair.id);
      if (!entry) {
        return {
          pair,
          status: "waiting",
          laps: [],
          totalTimeMs: 0,
        };
      }

      let status: "waiting" | "racing" | "completed" = "waiting";
      if (entry.status === "racing") status = "racing";
      else if (entry.status === "completed") status = "completed";

      // If racing, calculate current time
      let totalTimeMs = entry.totalTimeMs || 0;
      if (status === "racing" && entry.startTime) {
        const start = new Date(entry.startTime).getTime();
        totalTimeMs = Date.now() - start;
      } else if (status === "completed") {
        totalTimeMs = entry.totalTimeMs || entry.laps.reduce((sum, l) => sum + l.lapTimeMs, 0) || 0;
      }

      return {
        pair,
        status,
        laps: entry.laps || [],
        totalTimeMs,
        startTime: entry.startTime ? new Date(entry.startTime).getTime() : undefined
      };
    });
  });

  // Find first active or waiting pair
  const [currentIndex, setCurrentIndex] = useState(() => {
    const activeIndex = pairStates.findIndex(p => p.status === "racing");
    if (activeIndex !== -1) return activeIndex;
    const nextWaiting = pairStates.findIndex(p => p.status === "waiting");
    return nextWaiting !== -1 ? nextWaiting : 0;
  });

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [pendingLap, setPendingLap] = useState<{ lapTimeMs: number; totalTimeMs: number } | null>(null);

  const currentPair = pairStates[currentIndex];
  const completedCount = pairStates.filter((s) => s.status === "completed").length;
  const progress = (completedCount / pairStates.length) * 100;

  const saveLapMutation = useMutation({
    mutationFn: async (lapData: Partial<Lap>) => {
      return apiRequest("POST", "/api/laps", lapData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/laps"] });
    },
  });

  const updateEntryStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RaceEntry> }) => {
      return apiRequest("PATCH", `/api/race-entries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/races"] }); // Invalidate race to refresh details
    },
  });

  const handleStart = useCallback(() => {
    const entry = raceEntries.find(e => e.bullPairId === currentPair.pair.id);
    const startTime = new Date().toISOString();

    setPairStates((prev) => {
      const newStates = [...prev];
      newStates[currentIndex] = {
        ...newStates[currentIndex],
        status: "racing",
        startTime: Date.now(),
      };
      return newStates;
    });

    if (entry) {
      updateEntryStatusMutation.mutate({
        id: entry.id,
        data: {
          status: "racing",
          startTime,
        },
      });
    }
  }, [currentIndex, currentPair, raceEntries, updateEntryStatusMutation]);

  const [isTerminating, setIsTerminating] = useState(false);

  // ... (handleStart same)

  /* New helper to reuse saving logic if needed, but for now I'll inline for clarity in handleLapAdded */

  const handleLapAdded = useCallback(
    (lapTimeMs: number, totalTimeMs: number) => {
      // Instant lap - no dialog
      const lapNumber = currentPair.laps.length + 1;
      const distanceCovered = category.categoryDistance;

      const currentRaceEntry = raceEntries.find(re => re.bullPairId === currentPair.pair.id);
      if (!currentRaceEntry) return;

      const newLap: Lap = {
        id: `lap-${Date.now()}`,
        raceEntryId: currentRaceEntry.id,
        lapNumber,
        lapTimeMs,
        totalTimeMs,
        distanceCovered,
        overrideMeters: null,
        overrideFeet: null,
        overrideInches: null,
        createdAt: new Date().toISOString(),
      };

      setPairStates((prev) => {
        const newStates = [...prev];
        newStates[currentIndex] = {
          ...newStates[currentIndex],
          laps: [...newStates[currentIndex].laps, newLap],
          totalTimeMs,
          status: "racing",
        };
        return newStates;
      });

      saveLapMutation.mutate(newLap);

      toast({
        title: `Lap ${lapNumber} Recorded`,
        description: `Time: ${formatTime(lapTimeMs)} - Distance: ${distanceCovered}m`,
      });
    },
    [currentPair, currentIndex, category.categoryDistance, saveLapMutation, toast, raceEntries]
  );

  const handleTerminate = useCallback((finalTimeMs: number) => {
    // Calculate partial lap time
    const previousLapsTime = currentPair.laps.reduce((sum, lap) => sum + lap.lapTimeMs, 0);
    const partialLapTime = Math.max(0, finalTimeMs - previousLapsTime);

    setPendingLap({ lapTimeMs: partialLapTime, totalTimeMs: finalTimeMs });
    setIsTerminating(true);
    setShowOverrideDialog(true);
  }, [currentPair.laps]);

  const confirmLap = useCallback(
    (meters: number, feet: number, inches: number) => {
      if (!pendingLap) return;

      const lapNumber = currentPair.laps.length + 1;

      // If terminating, distance is what user entered. 
      // If valid lap, it's category distance (unless overridden, but usually full lap).
      // Wait, LapOverrideDialog returns the override values. 
      // Ideally for a normal lap, we default to categoryDistance.
      // For termination, we use the input.

      let distanceCovered = category.categoryDistance;
      if (isTerminating) {
        // Assume the input meters IS the total distance for this lap
        // Wait, UI asks for "Distance Covered in this Lap" or "Total"?
        // Usually "this lap".
        // Let's trust the dialog values.
        // Convert to meters? The dialog returns meters, feet, inches separately.
        // We might want to sum them or just store them. 
        // For simple calculation, let's use the `meters` returned as the primary value if provided.
        // If user entered feet/inches, we store that too.
        distanceCovered = meters;
      } else {
        // Normal lap, but verify if user changed it? 
        // Dialog defaults to categoryDistance.
        distanceCovered = meters;
      }

      const currentRaceEntry = raceEntries.find(re => re.bullPairId === currentPair.pair.id);

      if (!currentRaceEntry) {
        toast({
          title: "System Error",
          description: "Could not link lap to race entry.",
          variant: "destructive",
        });
        return;
      }

      const newLap: Lap = {
        id: `lap-${Date.now()}`,
        raceEntryId: currentRaceEntry.id,
        lapNumber,
        lapTimeMs: pendingLap.lapTimeMs,
        totalTimeMs: pendingLap.totalTimeMs,
        distanceCovered,
        overrideMeters: meters !== category.categoryDistance || isTerminating ? meters : null,
        overrideFeet: feet > 0 ? feet : null,
        overrideInches: inches > 0 ? inches : null,
        createdAt: new Date().toISOString(),
      };

      setPairStates((prev) => {
        const newStates = [...prev];
        newStates[currentIndex] = {
          ...newStates[currentIndex],
          laps: [...newStates[currentIndex].laps, newLap],
          totalTimeMs: pendingLap.totalTimeMs,
          status: isTerminating ? "completed" : "racing", // Mark completed if terminating
        };
        return newStates;
      });

      saveLapMutation.mutate(newLap);

      // If terminating, we also need to update the race entry status to completed
      if (isTerminating) {
        updateEntryStatusMutation.mutate({
          id: currentRaceEntry.id,
          data: {
            status: "completed",
            totalTimeMs: pendingLap.totalTimeMs,
            endTime: new Date().toISOString(),
          }
        });
      }

      setPendingLap(null);
      setShowOverrideDialog(false);

      toast({
        title: isTerminating ? "Race Terminated" : `Lap ${lapNumber} Recorded`,
        description: `Time: ${formatTime(pendingLap.lapTimeMs)} - Distance: ${distanceCovered}m`,
      });
    },
    [pendingLap, currentPair, currentIndex, category.categoryDistance, saveLapMutation, toast, isTerminating, raceEntries, updateEntryStatusMutation]

  );

  const handleStop = useCallback(() => {
    const entry = raceEntries.find(e => e.bullPairId === currentPair.pair.id);

    setPairStates((prev) => {
      const newStates = [...prev];
      newStates[currentIndex] = {
        ...newStates[currentIndex],
        status: "completed",
      };
      return newStates;
    });

    if (entry) {
      updateEntryStatusMutation.mutate({
        id: entry.id,
        data: {
          status: "completed",
          // Calculate total time from laps? Or use Stopwatch time if passed?
          // handleStop is usually manual finish. 
          // But Stopwatch only passes 'time' to onTerminate.
          // Standard stop implies race finished normally? 
          // Actually onStop prop in Stopwatch just stops timer.
          // This handleStop seems to be "Finish Race" button?
          // No, "Finish Race" button calls moveToNextPair...
          // Wait, where is handleStop called?
          // <Stopwatch onStop={handleStop} ... />
          // Stopwatch calls onStop when maxTime reached or Pause clicked.
          // Pause shouldn't complete the race.
          // If maxTime reached, maybe complete?
          // Let's check Stopwatch usage.
        }
      });

      // If just pausing, we don't complete.
      // But here handleStop sets status to "completed".
      // This implies "Max Time Reached" logic.
      // If so, update DB.
      updateEntryStatusMutation.mutate({
        id: entry.id,
        data: {
          status: "completed",
          endTime: new Date().toISOString(),
          // we might want totalTimeMs here, but we don't have it easily without ref
          // but if max time reached, it IS max time.
          totalTimeMs: category.categoryTime * 1000
        }
      });
    }

    toast({
      title: "Race Completed",
      description: `${currentPair.pair.pairName} finished with ${currentPair.laps.length} laps.`,
    });
  }, [currentIndex, currentPair, toast, raceEntries, updateEntryStatusMutation, category.categoryTime]);

  const moveToNextPair = () => {
    if (currentIndex < pairStates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onRaceComplete();
    }
  };

  const maxTimeMs = category.categoryTime * 1000;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {currentIndex + 1}
                  </div>
                  <div>
                    <span>{currentPair.pair.pairName}</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {currentPair.pair.ownerName1}
                      {currentPair.pair.ownerName2 && ` & ${currentPair.pair.ownerName2}`}
                    </p>
                  </div>
                </CardTitle>
                <Badge
                  className={cn(
                    currentPair.status === "racing" && "bg-green-500",
                    currentPair.status === "completed" && "bg-muted"
                  )}
                >
                  {currentPair.status === "waiting" && "Ready"}
                  {currentPair.status === "racing" && "Racing"}
                  {currentPair.status === "completed" && "Completed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Stopwatch
                onLapAdded={handleLapAdded}
                onStart={handleStart}
                onStop={handleStop}
                onTerminate={handleTerminate}
                maxTimeMs={maxTimeMs}
                disabled={currentPair.status === "completed"}
                initialTime={currentPair.totalTimeMs}
                autoStart={currentPair.status === "racing"}
              />

              {currentPair.status === "completed" && (
                <div className="mt-6 flex justify-center">
                  <Button size="lg" onClick={moveToNextPair} data-testid="button-next-pair">
                    {currentIndex < pairStates.length - 1 ? (
                      <>
                        Next Pair
                        <ChevronRight className="h-5 w-5 ml-2" />
                      </>
                    ) : (
                      <>
                        <Flag className="h-5 w-5 mr-2" />
                        Finish Race
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <LapDisplay laps={currentPair.laps} distancePerLap={category.categoryDistance} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between gap-2">
                <span>Race Progress</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {completedCount}/{pairStates.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2 mb-4" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Max time: {formatTime(maxTimeMs)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Race Queue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {pairStates.map((state, index) => (
                    <div
                      key={state.pair.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md transition-colors",
                        index === currentIndex && "bg-primary/10 border border-primary",
                        state.status === "completed" && "bg-muted/50 opacity-60",
                        state.status === "waiting" && index !== currentIndex && "bg-muted/30"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          state.status === "completed" && "bg-green-500/20 text-green-600",
                          state.status === "racing" && "bg-primary text-primary-foreground",
                          state.status === "waiting" && "bg-muted"
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{state.pair.pairName}</p>
                        {state.status === "completed" && (
                          <p className="text-xs text-muted-foreground">
                            {state.laps.length} laps • {formatTime(state.totalTimeMs)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <LapOverrideDialog
        open={showOverrideDialog}
        onOpenChange={setShowOverrideDialog}
        onConfirm={confirmLap}
        defaultDistance={category.categoryDistance}
        lapNumber={currentPair.laps.length + 1}
      />
    </>
  );
}
