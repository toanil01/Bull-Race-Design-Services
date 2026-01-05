import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Download } from "lucide-react";
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

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function AdminHistoryPage() {
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: historicalResults = [], isLoading: resultsLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/history", selectedYear, selectedCategoryId],
  });

  const pastCategories = categories.filter(
    (c) => new Date(c.raceDate) < new Date() && 
           new Date(c.raceDate).getFullYear() === Number(selectedYear)
  );

  const handleExport = () => {
    const csvContent = [
      ["Rank", "Pair Name", "Owner", "Total Time", "Laps", "Distance"].join(","),
      ...historicalResults.map((r) =>
        [
          r.rank,
          `"${r.pairName}"`,
          `"${r.ownerName1}${r.ownerName2 ? ` & ${r.ownerName2}` : ""}"`,
          r.totalTimeMs,
          r.laps.length,
          r.totalDistance,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `race-results-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Historical Data</h1>
              <p className="text-muted-foreground">
                Browse and export past race results
              </p>
            </div>
            <Button variant="outline" onClick={handleExport} disabled={historicalResults.length === 0} data-testid="button-export-results">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger data-testid="select-admin-history-year">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  {categoriesLoading ? (
                    <Skeleton className="h-10" />
                  ) : (
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger data-testid="select-admin-history-category">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {pastCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.type} - {new Date(cat.raceDate).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {resultsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <LeaderboardTable 
              entries={historicalResults} 
              showLapDetails={true}
              title={`Results ${selectedYear}`}
            />
          )}
        </div>
      </main>
    </div>
  );
}
