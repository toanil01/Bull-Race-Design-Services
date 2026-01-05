import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StopwatchProps {
  onLapAdded?: (lapTimeMs: number, totalTimeMs: number) => void;
  onStart?: () => void;
  onStop?: () => void;
  onTerminate?: (finalTimeMs: number) => void;
  maxTimeMs?: number;
  disabled?: boolean;
  initialTime?: number;
  autoStart?: boolean;
}

export function formatTime(ms: number, showMs = true): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);

  if (!showMs) {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
}

export function Stopwatch({
  onLapAdded,
  onStart,
  onStop,
  onTerminate,
  maxTimeMs,
  disabled = false,
  initialTime = 0,
  autoStart = false,
}: StopwatchProps) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [lastLapTime, setLastLapTime] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now() - initialTime);

  const start = useCallback(() => {
    if (disabled) return;
    setIsRunning(true);
    startTimeRef.current = Date.now() - time;
    onStart?.();
  }, [disabled, time, onStart]);

  const stop = useCallback(() => {
    setIsRunning(false);
    onStop?.();
  }, [onStop]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setLastLapTime(0);
  }, []);

  const addLap = useCallback(() => {
    if (!isRunning) return;
    const lapTimeMs = time - lastLapTime;
    setLastLapTime(time);
    onLapAdded?.(lapTimeMs, time);
  }, [isRunning, time, lastLapTime, onLapAdded]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        const newTime = Date.now() - startTimeRef.current;

        if (maxTimeMs && newTime >= maxTimeMs) {
          setTime(maxTimeMs);
          setIsRunning(false);
          onTerminate?.(maxTimeMs);
        } else {
          setTime(newTime);
        }
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, maxTimeMs, stop]);

  const remainingTime = maxTimeMs ? Math.max(0, maxTimeMs - time) : null;
  const isOvertime = maxTimeMs && time > maxTimeMs;

  return (
    <Card className={cn("border-2", isRunning && "border-primary")}>
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <p
            className={cn(
              "text-6xl md:text-7xl font-mono font-bold tracking-tight transition-colors",
              isOvertime && "text-destructive"
            )}
            data-testid="text-timer-display"
          >
            {formatTime(time)}
          </p>
          {remainingTime !== null && (
            <p className={cn("text-sm mt-2", isOvertime ? "text-destructive" : "text-muted-foreground")}>
              {isOvertime ? "Overtime" : `Remaining: ${formatTime(remainingTime)}`}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {!isRunning ? (
            <Button
              size="lg"
              onClick={start}
              disabled={disabled}
              className="w-20 h-20 rounded-full"
              data-testid="button-timer-start"
            >
              <Play className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              disabled={true}
              className="w-20 h-20 rounded-full opacity-50 cursor-not-allowed"
              data-testid="button-timer-pause-disabled"
            >
              <Pause className="h-8 w-8" />
            </Button>
          )}

          <Button
            size="lg"
            variant="secondary"
            onClick={addLap}
            disabled={!isRunning}
            className="w-20 h-20 rounded-full"
            data-testid="button-timer-lap"
          >
            <Flag className="h-8 w-8" />
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={() => {
              setIsRunning(false);
              onTerminate?.(time);
            }}
            disabled={!isRunning && time === 0}
            className="w-20 h-20 rounded-full bg-red-600 text-white hover:bg-red-700 border-2 border-red-200"
            data-testid="button-timer-finish"
            title="Finish Race"
          >
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase">Finish</span>
            </div>
          </Button>
        </div>

        {lastLapTime > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Last lap: {formatTime(time - lastLapTime)} | Total: {formatTime(time)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
