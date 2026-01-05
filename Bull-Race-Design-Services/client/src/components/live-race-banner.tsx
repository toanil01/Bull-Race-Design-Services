import { Link } from "wouter";
import { Timer, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Category, BullPair } from "@shared/schema";

interface LiveRaceBannerProps {
  race?: {
    category: Category;
    currentPair?: BullPair;
    elapsedTime: number;
    totalPairs: number;
    completedPairs: number;
  };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
}

export function LiveRaceBanner({ race }: LiveRaceBannerProps) {
  if (!race) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Timer className="h-5 w-5" />
            <span>No live race at the moment</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Check out the upcoming races schedule below
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="destructive">LIVE</Badge>
                <span className="font-semibold">{race.category.type}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {race.currentPair ? `Racing: ${race.currentPair.pairName}` : "Getting ready..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-mono font-bold">{formatTime(race.elapsedTime)}</p>
              <p className="text-xs text-muted-foreground">Current Time</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{race.completedPairs}/{race.totalPairs} completed</span>
            </div>

            <Link href="/leaderboard">
              <Button data-testid="button-view-live">
                Watch Live
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
