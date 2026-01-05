import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LapOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (meters: number, feet: number, inches: number) => void;
  defaultDistance: number;
  lapNumber: number;
}

export function LapOverrideDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultDistance,
  lapNumber,
}: LapOverrideDialogProps) {
  const [meters, setMeters] = useState(defaultDistance);
  const [feet, setFeet] = useState(0);
  const [inches, setInches] = useState(0);

  const totalMeters = meters + (feet * 0.3048) + (inches * 0.0254);

  const handleConfirm = () => {
    onConfirm(meters, feet, inches);
    setMeters(defaultDistance);
    setFeet(0);
    setInches(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override Lap {lapNumber} Distance</DialogTitle>
          <DialogDescription>
            Enter the exact distance covered for this lap. Use meters for full units, 
            then feet and inches for precision.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meters">Meters</Label>
              <Input
                id="meters"
                type="number"
                min="0"
                value={meters}
                onChange={(e) => setMeters(Number(e.target.value))}
                className="font-mono"
                data-testid="input-override-meters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feet">Feet</Label>
              <Input
                id="feet"
                type="number"
                min="0"
                max="100"
                value={feet}
                onChange={(e) => setFeet(Number(e.target.value))}
                className="font-mono"
                data-testid="input-override-feet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inches">Inches</Label>
              <Input
                id="inches"
                type="number"
                min="0"
                max="11"
                value={inches}
                onChange={(e) => setInches(Number(e.target.value))}
                className="font-mono"
                data-testid="input-override-inches"
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-md text-center">
            <p className="text-sm text-muted-foreground">Total Distance</p>
            <p className="text-2xl font-mono font-bold">{totalMeters.toFixed(2)} m</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-override-cancel">
            Cancel
          </Button>
          <Button onClick={handleConfirm} data-testid="button-override-confirm">
            Confirm Distance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
