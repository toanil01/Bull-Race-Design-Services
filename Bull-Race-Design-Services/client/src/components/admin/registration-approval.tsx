import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, X, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BullPair, Category, RegistrationStatus } from "@shared/schema";

interface RegistrationApprovalProps {
  categories: Category[];
}

function getStatusBadge(status: RegistrationStatus) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "approved":
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
  }
}

export function RegistrationApproval({ categories }: RegistrationApprovalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<RegistrationStatus | "all">("pending");

  const { data: registrations = [], isLoading } = useQuery<BullPair[]>({
    queryKey: ["/api/bull-pairs"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RegistrationStatus }) => {
      return apiRequest("PATCH", `/api/bull-pairs/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Registration status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/bull-pairs"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      (reg.pairName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (reg.ownerName1?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (reg.phoneNumber?.includes(searchTerm) || false);

    const matchesCategory = selectedCategory === "all" || reg.categoryId === selectedCategory;
    const matchesTab = activeTab === "all" || reg.status === activeTab;

    return matchesSearch && matchesCategory && matchesTab;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.type || "Unknown";
  };

  const counts = {
    all: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, owner, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-registrations"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48" data-testid="select-filter-category">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredRegistrations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No registrations found matching your criteria.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRegistrations.map((reg) => (
                <Card key={reg.id} data-testid={`card-registration-${reg.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold truncate">{reg.pairName}</h3>
                          {getStatusBadge(reg.status as RegistrationStatus)}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {getCategoryName(reg.categoryId)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Owner:</span>
                        <span className="truncate">
                          {reg.ownerName1}
                          {reg.ownerName2 && ` & ${reg.ownerName2}`}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{reg.phoneNumber}</span>
                      </div>
                      {reg.email && (
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="truncate">{reg.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Registered:</span>
                        <span>{new Date(reg.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {reg.status === "pending" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: reg.id, status: "approved" })
                          }
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-approve-${reg.id}`}
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: reg.id, status: "rejected" })
                          }
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-reject-${reg.id}`}
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
