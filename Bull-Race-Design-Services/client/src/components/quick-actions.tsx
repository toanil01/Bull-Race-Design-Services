import { Link } from "wouter";
import { UserPlus, Trophy, History, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  {
    href: "/register",
    icon: UserPlus,
    title: "Register Bull Pair",
    description: "Sign up your bull pair for upcoming races",
    testId: "card-action-register",
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    title: "View Leaderboard",
    description: "Check current standings and live results",
    testId: "card-action-leaderboard",
  },
  {
    href: "/history",
    icon: History,
    title: "Historical Results",
    description: "Browse past race performances and winners",
    testId: "card-action-history",
  },
];

export function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card
            className="h-full hover-elevate transition-all duration-200 cursor-pointer group"
            data-testid={action.testId}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold flex items-center gap-2">
                    {action.title}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
