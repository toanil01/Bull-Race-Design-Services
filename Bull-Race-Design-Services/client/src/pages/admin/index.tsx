import { useQuery } from "@tanstack/react-query";
import { Users, FolderKanban, Timer, Trophy, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { Category, BullPair, Race } from "@shared/schema";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<BullPair[]>({
    queryKey: ["/api/bull-pairs"],
  });

  const { data: races = [], isLoading: racesLoading } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  const isLoading = categoriesLoading || registrationsLoading || racesLoading;

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const approvedCount = registrations.filter((r) => r.status === "approved").length;
  const upcomingCategories = categories.filter(
    (c) => new Date(c.raceDate) >= new Date()
  );
  const liveRaces = races.filter((r) => r.status === "in_progress");

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your bull race management system
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard
                  title="Total Categories"
                  value={categories.length}
                  description={`${upcomingCategories.length} upcoming`}
                  icon={FolderKanban}
                />
                <StatCard
                  title="Registrations"
                  value={registrations.length}
                  description={`${pendingCount} pending approval`}
                  icon={Users}
                />
                <StatCard
                  title="Approved Pairs"
                  value={approvedCount}
                  description="Ready to race"
                  icon={Trophy}
                />
                <StatCard
                  title="Live Races"
                  value={liveRaces.length}
                  description={liveRaces.length > 0 ? "In progress" : "None active"}
                  icon={Timer}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming Races
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingCategories.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No upcoming races scheduled
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingCategories.slice(0, 5).map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                          >
                            <div>
                              <p className="font-medium">{category.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(category.raceDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {registrations.filter(
                                (r) => r.categoryId === category.id && r.status === "approved"
                              ).length} pairs
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Registrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {registrations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No registrations yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {registrations
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 5)
                          .map((reg) => (
                            <div
                              key={reg.id}
                              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                            >
                              <div className="min-w-0">
                                <p className="font-medium truncate">{reg.pairName}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {reg.ownerName1}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  reg.status === "approved"
                                    ? "default"
                                    : reg.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {reg.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
