import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Timer,
  Trophy,
  History,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories", icon: FolderKanban },
  { href: "/admin/registrations", label: "Registrations", icon: Users },
  { href: "/admin/race", label: "Race Control", icon: Timer },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
];

export function AdminSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 h-screen bg-sidebar border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Admin Panel</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = location === item.href ||
            (item.href !== "/admin" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-sidebar-accent border-l-4 border-l-primary rounded-l-none"
                )}
                data-testid={`admin-nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Link href="/">
          <Button variant="outline" className="w-full gap-2" data-testid="button-back-to-site">
            <ArrowLeft className="h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>
    </aside>
  );
}
