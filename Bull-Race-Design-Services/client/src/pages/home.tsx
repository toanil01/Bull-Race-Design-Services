import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, ArrowRight, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/navigation";
import { PhotoGallery } from "@/components/photo-gallery";
import { LiveRaceBanner } from "@/components/live-race-banner";
import { UpcomingRaces } from "@/components/upcoming-races";
import { QuickActions } from "@/components/quick-actions";
import type { Category, Race } from "@shared/schema";

export default function HomePage() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: races = [] } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  const liveRace = races.find((r) => r.status === "in_progress");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-6">
            <Trophy className="h-4 w-4" />
            <span>Traditional Bull Racing Events</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
            Experience the Thrill of
            <span className="block text-primary">Bull Racing</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Register your bull pairs, compete in thrilling races, and climb the leaderboard.
            Join the tradition that brings communities together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-6 text-lg" data-testid="button-hero-register">
                Register Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg bg-white/10 backdrop-blur-sm border-white/30 text-white"
                data-testid="button-hero-leaderboard"
              >
                View Leaderboard
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{categories.length} Events</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Join the Competition</span>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <section>
          <h2 className="text-2xl font-bold mb-6">Photo Gallery</h2>
          <PhotoGallery />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Live Race</h2>
          <LiveRaceBanner race={undefined} />
        </section>

        <section>
          {categoriesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </div>
          ) : (
            <UpcomingRaces categories={categories} />
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <QuickActions />
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Bull Race Management</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Celebrating tradition through competition
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
