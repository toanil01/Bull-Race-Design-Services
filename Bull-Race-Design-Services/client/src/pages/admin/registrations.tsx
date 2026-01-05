import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RegistrationApproval } from "@/components/admin/registration-approval";
import type { Category } from "@shared/schema";

export default function RegistrationsPage() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Registration Approval</h1>
            <p className="text-muted-foreground">
              Review and approve bull pair registrations
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </div>
          ) : (
            <RegistrationApproval categories={categories} />
          )}
        </div>
      </main>
    </div>
  );
}
