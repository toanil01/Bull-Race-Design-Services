import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Calendar, Trophy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/navigation";
import { formatTime } from "@/components/stopwatch";
import type { Category, LeaderboardEntry } from "@shared/schema";
import { cn } from "@/lib/utils";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

function getRankStyle(rank: number): { bg: string; text: string } {
  switch (rank) {
    case 1:
      return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" };
    case 2:
      return { bg: "bg-slate-100 dark:bg-slate-800/50", text: "text-slate-600 dark:text-slate-300" };
    case 3:
      return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground" };
  }
}

export default function HistoryPage() {
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: historicalResults = [], isLoading: resultsLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/history", selectedYear, selectedCategory],
  });

  const pastCategories = categories.filter(
    (c) => new Date(c.raceDate) < new Date()
  );

  const yearCategories = pastCategories.filter(
    (c) => new Date(c.raceDate).getFullYear() === Number(selectedYear)
  );

  const filteredResults = historicalResults.filter(
    (result) =>
      result.pairName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.ownerName1.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = filteredResults.slice(0, 3);
  const remaining = filteredResults.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Historical Results</h1>
            <p className="text-muted-foreground">
              Browse past race performances and winners
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger data-testid="select-history-year">
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
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-history-category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {yearCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.type} - {new Date(cat.raceDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-history"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {resultsLoading || categoriesLoading ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm mt-1">
                  Try adjusting your filters or search criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {topThree.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  {topThree.map((result) => {
                    const style = getRankStyle(result.rank);
                    return (
                      <Card
                        key={result.bullPairId}
                        className={cn("relative overflow-hidden", style.bg)}
                        data-testid={`card-winner-${result.rank}`}
                      >
                        <div className="absolute top-4 right-4">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl", style.text, "bg-white/50 dark:bg-black/20")}>
                            {result.rank}
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <div className="mb-4">
                            <Badge className={style.text}>
                              {result.rank === 1 && "Champion"}
                              {result.rank === 2 && "Runner-up"}
                              {result.rank === 3 && "Third Place"}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold mb-1">{result.pairName}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {result.ownerName1}
                            {result.ownerName2 && ` & ${result.ownerName2}`}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-mono font-bold">
                              {formatTime(result.totalTimeMs)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{result.laps.length} laps</span>
                            <span>{result.totalDistance.toFixed(0)}m</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {remaining.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>All Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {remaining.map((result) => (
                        <div
                          key={result.bullPairId}
                          className="flex items-center gap-4 p-4 rounded-md bg-muted/30"
                          data-testid={`row-result-${result.rank}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
                            {result.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.pairName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.ownerName1}
                              {result.ownerName2 && ` & ${result.ownerName2}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold">{formatTime(result.totalTimeMs)}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.laps.length} laps • {result.totalDistance.toFixed(0)}m
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
