import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RaceSetup } from "@/components/admin/race-setup";
import { RaceControl } from "@/components/admin/race-control";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, BullPair, Race, RaceEntry, RaceWithDetails } from "@shared/schema";

type RacePhase = "select" | "setup" | "racing" | "completed";

export default function RacePage() {
  const { toast } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [phase, setPhase] = useState<RacePhase>("select");
  const [orderedPairs, setOrderedPairs] = useState<BullPair[]>([]);
  const [activeRaceId, setActiveRaceId] = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allRegistrations = [], isLoading: registrationsLoading } = useQuery<BullPair[]>({
    queryKey: ["/api/bull-pairs"],
  });

  const { data: allRaces = [] } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  // Auto-load in-progress race
  useEffect(() => {
    // Only run if we have data and haven't selected a race yet
    if (allRaces.length > 0 && categories.length > 0 && !activeRaceId) {
      const activeRace = allRaces.find(r => r.status === "in_progress");

      if (activeRace) {
        // Verify category still exists
        const categoryExists = categories.some(c => c.id === activeRace.categoryId);

        if (categoryExists) {
          console.log("[RacePage] Auto-loading active race:", activeRace.id);
          // Batch updates
          setSelectedCategoryId(activeRace.categoryId);
          setActiveRaceId(activeRace.id);
          setPhase("racing");

          toast({
            title: "Race Resumed",
            description: `Found active race for category. Resuming...`,
          });
        } else {
          console.warn("[RacePage] Active race found but category missing:", activeRace);
        }
      }
    }
  }, [allRaces, categories, activeRaceId, toast]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const approvedPairs = allRegistrations.filter(
    (r) => r.categoryId === selectedCategoryId && r.status === "approved"
  );

  // Filter categories to show today and future
  // We compare against the start of today to include races happening today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingCategories = categories.filter(
    (c) => new Date(c.raceDate) >= today
  );

  const {
    data: raceDetails,
    isError: isEntriesError,
    error: entriesError,
    isLoading: isEntriesLoading
  } = useQuery<RaceWithDetails>({
    queryKey: [`/api/races/${activeRaceId}/details`],
    enabled: !!activeRaceId,
  });

  const raceEntries = raceDetails?.entries || [];

  const createRaceMutation = useMutation({
    mutationFn: async (pairs: BullPair[]) => {
      const res = await apiRequest("POST", "/api/races", {
        categoryId: selectedCategoryId,
        orderedPairIds: pairs.map((p) => p.id),
      });
      return await res.json();
    },
    onSuccess: (race: Race) => {
      console.log("[Mutation] onSuccess fired. Received race:", race);
      if (!race || !race.id) {
        console.error("[Mutation] CRITICAL: Race ID is missing completely!", race);
        toast({ title: "Error", description: "Server returned invalid race data", variant: "destructive" });
        return;
      }
      setActiveRaceId(race.id);
      setPhase("racing");
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
    },
    onError: (error: Error) => {
      console.error("[Mutation] onError fired:", error);
      setPhase("setup");
      toast({
        title: "Failed to Start Race",
        description: error.message || "An error occurred while creating the race.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/races/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
    },
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);

    // Check for existing race for this category
    const existingRace = allRaces.find(r => r.categoryId === categoryId);

    if (existingRace) {
      setActiveRaceId(existingRace.id);
      if (existingRace.status === "completed") {
        setPhase("completed");
      } else {
        // Assume active/racing if it exists and not completed
        setPhase("racing");
      }
    } else if (categoryId) {
      setPhase("setup");
      setActiveRaceId(null);
    } else {
      setPhase("select");
      setActiveRaceId(null);
    }
  };

  const handleStartRace = (pairs: BullPair[]) => {
    setOrderedPairs(pairs);
    createRaceMutation.mutate(pairs);
    toast({
      title: "Starting Race...",
      description: "Creating race entries and locking order.",
    });
  };

  const handleRaceComplete = () => {
    if (activeRaceId) {
      updateStatusMutation.mutate({ id: activeRaceId, status: "completed" });
    }
    setPhase("completed");
    toast({
      title: "Race Completed",
      description: "All pairs have finished. View the leaderboard for final results.",
    });
  };

  // Sync orderedPairs with raceEntries if we loaded strings but lost state (e.g. refresh)
  if (phase === "racing" && raceEntries.length > 0 && orderedPairs.length === 0) {
    // We need to reconstruct orderedPairs from raceEntries
    // We have approvedPairs (which are all registrations for this category)
    // Map raceEntry -> bullPairId -> approvedPair
    const reconstructedPairs: BullPair[] = raceEntries
      .sort((a, b) => a.raceOrder - b.raceOrder)
      .map(entry => approvedPairs.find(p => p.id === entry.bullPairId))
      .filter((p): p is BullPair => !!p);

    if (reconstructedPairs.length > 0 && reconstructedPairs.length === raceEntries.length) {
      setOrderedPairs(reconstructedPairs);
    }
  }

  const isLoading = categoriesLoading || registrationsLoading;

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Race Control</h1>
            <p className="text-muted-foreground">
              Manage and conduct live races
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Race Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={handleCategorySelect}
                    disabled={phase === "racing"}
                  >
                    <SelectTrigger className="w-full max-w-md" data-testid="select-race-category">
                      <SelectValue placeholder="Choose a category to manage" />
                    </SelectTrigger>
                    <SelectContent>
                      {upcomingCategories.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No upcoming categories
                        </SelectItem>
                      ) : (
                        upcomingCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.type} - {new Date(cat.raceDate).toLocaleDateString()}
                            ({approvedPairs.filter((p) => p.categoryId === cat.id).length} pairs)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {phase === "setup" && selectedCategory && (
                <RaceSetup
                  category={selectedCategory}
                  approvedPairs={approvedPairs}
                  onStartRace={handleStartRace}
                  isLocked={false}
                />
              )}

              {phase === "racing" && selectedCategory && (
                raceEntries.length > 0 ? (
                  <RaceControl
                    category={selectedCategory}
                    orderedPairs={orderedPairs}
                    raceEntries={raceEntries}
                    onRaceComplete={handleRaceComplete}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    {isEntriesError ? (
                      <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-lg font-bold text-red-600 mb-2">Failed to Load Race</h3>
                        <p className="text-muted-foreground mb-4">
                          {entriesError instanceof Error ? entriesError.message : "Could not fetch race entries."}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/races/${activeRaceId}/details`] })}
                        >
                          Retry Loading
                        </Button>
                      </>
                    ) : isEntriesLoading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Initializing race...</p>
                        <p className="text-xs text-muted-foreground mt-2">Connecting to race {activeRaceId?.slice(0, 8)}...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl">🚫</span>
                        </div>
                        <h3 className="text-lg font-bold text-yellow-600 mb-2">No Participants Found</h3>
                        <p className="text-muted-foreground mb-4">
                          The race was created but no participants were linked.
                          <br />
                          <span className="text-xs font-mono text-gray-400">Race ID: {activeRaceId}</span>
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setPhase("setup")}
                        >
                          Return to Setup
                        </Button>
                      </>
                    )}
                  </div>
                )
              )}

              {phase === "completed" && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Race Completed!</h2>
                    <p className="text-muted-foreground mb-6">
                      The {selectedCategory?.type} race has been completed successfully.
                      View the leaderboard for final standings.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Debug Info - Temporary */}
          <div className="mt-8 p-4 bg-gray-100 rounded text-xs font-mono">
            <p>debug_phase: {phase}</p>
            <p>debug_selectedCategoryId: {selectedCategoryId || "empty"}</p>
            <p>debug_activeRaceId: {activeRaceId || "null"}</p>
            <p>debug_categories_count: {categories.length}</p>
            <p>debug_allRaces_count: {allRaces.length}</p>
            <p>debug_has_in_progress: {allRaces.some(r => r.status === "in_progress") ? "yes" : "no"}</p>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p>Active Race Cat ID: {allRaces.find(r => r.status === "in_progress")?.categoryId || "N/A"}</p>
              <p>Available Cat IDs: {categories.map(c => c.id).join(", ")}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
