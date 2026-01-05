import { Link } from "wouter";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Category, Race } from "@shared/schema";

interface UpcomingRacesProps {
  categories: Category[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCategoryColor(type: string): string {
  switch (type) {
    case "Sub-Juniors":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "Juniors":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "Seniors":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "Super Seniors":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function UpcomingRaces({ categories }: UpcomingRacesProps) {
  const { data: races = [] } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  const upcomingCategories = categories
    .filter((c) => {
      const race = races.find(r => r.categoryId === c.id);

      // Normalize dates to midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const raceDate = new Date(c.raceDate);
      raceDate.setHours(0, 0, 0, 0);

      const isDateValid = raceDate >= today;
      // Only show if no race exists or it's still upcoming
      const isRaceAvailable = !race || race.status === "upcoming";
      return isDateValid && isRaceAvailable;
    })
    .sort((a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime())
    .slice(0, 4);

  if (upcomingCategories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No upcoming races scheduled</p>
          <p className="text-sm text-muted-foreground mt-1">
            Check back soon for new race announcements
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Upcoming Races</h2>
        <Link href="/history">
          <Button variant="ghost" size="sm" data-testid="link-view-all-races">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {upcomingCategories.map((category) => (
          <Card key={category.id} className="hover-elevate transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Badge className={getCategoryColor(category.type)}>{category.type}</Badge>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(category.raceDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{Math.floor(category.categoryTime / 60)} min race time</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{category.categoryDistance}m per lap</span>
                    </div>
                  </div>
                </div>
                <Link href={`/register?category=${category.id}`}>
                  <Button size="sm" data-testid={`button-register-${category.id}`}>
                    Register
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
