import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categoryTypes } from "@shared/schema";
import type { Category } from "@shared/schema";

const categoryFormSchema = z.object({
  type: z.string().min(1, "Category type is required"),
  raceDate: z.string().min(1, "Race date is required"),
  raceEndDate: z.string().optional(),
  categoryTime: z.number().min(60, "Minimum 1 minute").max(3600, "Maximum 60 minutes"),
  categoryDistance: z.number().min(10, "Minimum 10 meters").max(1000, "Maximum 1000 meters"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const { toast } = useToast();
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      type: category?.type || "Juniors",
      raceDate: category?.raceDate?.split("T")[0] || new Date().toISOString().split("T")[0],
      raceEndDate: category?.raceEndDate?.split("T")[0],
      categoryTime: category?.categoryTime || 300,
      categoryDistance: category?.categoryDistance || 100,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/categories/${category.id}`, data);
      }
      return apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Category Updated" : "Category Created",
        description: `The category has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details below."
              : "Fill in the details to create a new race category."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => {
                // Check if the current value is NOT one of the predefined types
                // We don't check for truthiness of field.value because empty string (during custom typing) 
                // should still be considered "custom" mode
                const isCustom = !categoryTypes.includes(field.value as any);
                const selectValue = isCustom ? "custom" : field.value;

                return (
                  <FormItem>
                    <FormLabel>Category Type</FormLabel>
                    <Select
                      value={selectValue}
                      onValueChange={(val) => {
                        if (val === "custom") {
                          field.onChange(""); // Clear value to start fresh for custom input
                        } else {
                          field.onChange(val); // Set the selected standard type
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category-type">
                          <SelectValue placeholder="Select category type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom / Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {selectValue === "custom" && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <Input
                          placeholder="Enter custom category name"
                          value={field.value}
                          onChange={field.onChange}
                          className="mt-2"
                          data-testid="input-custom-category-type"
                          autoFocus
                        />
                        <p className="text-[0.8rem] text-muted-foreground mt-1">
                          Type a new category name above.
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="raceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-race-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="raceEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-race-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="categoryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race Time (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={3600}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-category-time"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(field.value / 60)} min {field.value % 60} sec
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryDistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distance per Lap (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={10}
                        max={1000}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-category-distance"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-category-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-category-submit"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Update" : "Create"} Category
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
