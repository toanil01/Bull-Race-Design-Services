import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import type { Category, LeaderboardEntry } from "@shared/schema";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

export default function LeaderboardPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading, refetch } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", selectedCategoryId],
  });

  const handleRefresh = () => {
    refetch();
  };

  const hasLiveRace = leaderboard.some((entry) => entry.isRacing);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
              <p className="text-muted-foreground">
                View current standings and race results
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasLiveRace && (
                <Badge variant="destructive" className="animate-pulse">
                  <span className="mr-1">●</span> Live Race
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh} data-testid="button-refresh-leaderboard">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Race Category
                </CardTitle>
                {categoriesLoading ? (
                  <Skeleton className="h-10 w-48" />
                ) : (
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="w-48" data-testid="select-leaderboard-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.type} - {new Date(cat.raceDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : (
                <LeaderboardTable entries={leaderboard} showLapDetails={true} title="" />
              )}
            </CardContent>
          </Card>

          {hasLiveRace && (
            <p className="text-center text-sm text-muted-foreground">
              This leaderboard updates automatically during live races.
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                Manual Refresh
              </Button>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
