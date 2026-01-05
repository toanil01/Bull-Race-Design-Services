import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { LeaderboardTable } from "@/components/leaderboard-table";
import type { Category, LeaderboardEntry } from "@shared/schema";
import { useState } from "react";

export default function AdminLeaderboardPage() {
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

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
              <p className="text-muted-foreground">
                View and monitor race standings
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh} data-testid="button-admin-refresh-leaderboard">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <Skeleton className="h-10 w-64" />
              ) : (
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="w-full max-w-md" data-testid="select-admin-leaderboard-category">
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
            </CardContent>
          </Card>

          {leaderboardLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <LeaderboardTable entries={leaderboard} showLapDetails={true} />
          )}
        </div>
      </main>
    </div>
  );
}
