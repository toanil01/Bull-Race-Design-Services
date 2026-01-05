import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CategoryForm } from "@/components/admin/category-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

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

function formatDateRange(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate);
  const startStr = start.toLocaleDateString();

  if (!endDate) return startStr;

  const end = new Date(endDate);
  if (start.toDateString() === end.toDateString()) return startStr;

  return `${startStr} - ${end.toLocaleDateString()}`;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Category Deleted", description: "The category has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeletingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const upcomingCategories = categories
    .filter((c) => new Date(c.raceDate) >= new Date())
    .sort((a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime());

  const pastCategories = categories
    .filter((c) => new Date(c.raceDate) < new Date())
    .sort((a, b) => new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime());

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Category Management</h1>
              <p className="text-muted-foreground">
                Create and manage race categories
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)} data-testid="button-add-category">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p className="text-lg font-medium">No categories yet</p>
                <p className="text-sm mt-1 mb-4">
                  Create your first race category to get started
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {upcomingCategories.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Upcoming Races</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingCategories.map((category) => (
                      <Card key={category.id} data-testid={`card-category-${category.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <Badge className={getCategoryColor(category.type)}>
                              {category.type}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(category)}
                                className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                title="Reschedule Race"
                                data-testid={`button-reschedule-${category.id}`}
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(category)}
                                title="Edit Category Details"
                                data-testid={`button-edit-${category.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(category)}
                                title="Delete Category"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-${category.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDateRange(category.raceDate, category.raceEndDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{Math.floor(category.categoryTime / 60)} min race time</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{category.categoryDistance}m per lap</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {pastCategories.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Past Races</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pastCategories.map((category) => (
                      <Card key={category.id} className="opacity-75" data-testid={`card-past-category-${category.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline">{category.type}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateRange(category.raceDate, category.raceEndDate)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <CategoryForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        category={editingCategory}
      />

      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deletingCategory?.type}" category
              scheduled for {deletingCategory?.raceDate && new Date(deletingCategory.raceDate).toLocaleDateString()}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
