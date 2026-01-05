import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, Race } from "@shared/schema";

const registrationSchema = z.object({
  pairName: z.string().min(2, "Bull pair name must be at least 2 characters"),
  ownerName1: z.string().min(2, "Owner name must be at least 2 characters"),
  ownerName2: z.string().optional(),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Please select a category"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  defaultCategoryId?: string;
  onSuccess?: () => void;
}

export function RegistrationForm({ defaultCategoryId, onSuccess }: RegistrationFormProps) {
  const { toast } = useToast();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: races = [] } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      pairName: "",
      ownerName1: "",
      ownerName2: "",
      phoneNumber: "",
      email: "",
      categoryId: defaultCategoryId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      return apiRequest("POST", "/api/bull-pairs", data);
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted",
        description: "Your bull pair has been registered successfully. Await admin approval.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/bull-pairs"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    mutation.mutate(data);
  };

  const upcomingCategories = categories.filter(
    (c) => {
      const race = races.find(r => r.categoryId === c.id);

      // Normalize dates to midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const raceDate = new Date(c.raceDate);
      raceDate.setHours(0, 0, 0, 0);

      const isDateValid = raceDate >= today;
      // If race exists, it must be 'upcoming'. If 'in_progress' or 'completed', it's not available.
      const isRaceAvailable = !race || race.status === "upcoming";
      return isDateValid && isRaceAvailable;
    }
  );

  if (mutation.isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your bull pair has been registered and is pending approval.
            You will be notified once it's approved.
          </p>
          <Button onClick={() => mutation.reset()} data-testid="button-register-another">
            Register Another Pair
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Register Your Bull Pair</CardTitle>
        <CardDescription>
          Fill in the details below to register your bull pair for an upcoming race.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="pairName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bull Pair Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your bull pair name"
                      {...field}
                      data-testid="input-pair-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="ownerName1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Owner Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Owner's full name"
                        {...field}
                        data-testid="input-owner-name-1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerName2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Owner Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Co-owner's name (optional)"
                        {...field}
                        data-testid="input-owner-name-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com (optional)"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Race Category *</FormLabel>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading categories...
                    </div>
                  ) : upcomingCategories.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No upcoming races available for registration.
                    </p>
                  ) : (
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3 md:grid-cols-2"
                      >
                        {upcomingCategories.map((category) => (
                          <Label
                            key={category.id}
                            htmlFor={category.id}
                            className="flex items-start gap-3 p-4 rounded-md border cursor-pointer hover-elevate transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                          >
                            <RadioGroupItem
                              value={category.id}
                              id={category.id}
                              className="mt-1"
                              data-testid={`radio-category-${category.id}`}
                            />
                            <div>
                              <p className="font-medium">{category.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(category.raceDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {category.categoryDistance}m laps • {Math.floor(category.categoryTime / 60)} min
                              </p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={mutation.isPending || upcomingCategories.length === 0}
              data-testid="button-submit-registration"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mutation.isPending ? "Submitting..." : "Register Bull Pair"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
