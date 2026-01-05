import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { GripVertical, Shuffle, Lock, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BullPair, Category } from "@shared/schema";
import { cn } from "@/lib/utils";

interface RaceSetupProps {
  category: Category;
  approvedPairs: BullPair[];
  onStartRace: (orderedPairs: BullPair[]) => void;
  isLocked: boolean;
}

export function RaceSetup({ category, approvedPairs, onStartRace, isLocked }: RaceSetupProps) {
  const { toast } = useToast();
  const [orderedPairs, setOrderedPairs] = useState<BullPair[]>(approvedPairs);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const shufflePairs = () => {
    const shuffled = [...orderedPairs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOrderedPairs(shuffled);
    toast({ title: "Order Shuffled", description: "Race order has been randomized." });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedPairs];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setOrderedPairs(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleLockAndStart = () => {
    setShowConfirmDialog(true);
  };

  const confirmStart = () => {
    onStartRace(orderedPairs);
    setShowConfirmDialog(false);
  };

  if (approvedPairs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>No approved bull pairs for this category yet.</p>
          <p className="text-sm mt-1">Approve registrations to start setting up the race.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4 flex-wrap">
            <span>Race Order - {category.type}</span>
            <Badge variant="outline">{orderedPairs.length} pairs</Badge>
          </CardTitle>
          <CardDescription>
            Drag to reorder or shuffle for a random arrangement. Lock the order when ready to start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            {orderedPairs.map((pair, index) => (
              <div
                key={pair.id}
                draggable={!isLocked}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-md border bg-card transition-colors",
                  !isLocked && "cursor-move hover:bg-muted/50",
                  draggedIndex === index && "opacity-50",
                  isLocked && "opacity-75"
                )}
                data-testid={`pair-row-${pair.id}`}
              >
                {!isLocked && (
                  <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pair.pairName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {pair.ownerName1}
                    {pair.ownerName2 && ` & ${pair.ownerName2}`}
                  </p>
                </div>
                <Badge variant="secondary" className="flex-shrink-0">
                  #{pair.registrationOrder}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={shufflePairs}
              disabled={isLocked}
              className="flex-1 min-w-[140px]"
              data-testid="button-shuffle-order"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle Order
            </Button>
            <Button
              onClick={handleLockAndStart}
              disabled={isLocked}
              className="flex-1 min-w-[140px]"
              data-testid="button-lock-start"
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Order Locked
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Lock & Start Race
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock Race Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock the race order and begin the race. The order cannot be changed 
              after this point. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-lock">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStart} data-testid="button-confirm-lock">
              Lock & Start
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
