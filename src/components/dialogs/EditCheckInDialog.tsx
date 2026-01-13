import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Smile, Frown, Meh, SmilePlus, Angry, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
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

interface DailyCheckIn {
  id: string;
  date: string;
  mood: string | null;
  energy_level: number | null;
  water_intake: number | null;
  sleep_hours: number | null;
  notes: string | null;
}

interface EditCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkIn: DailyCheckIn | null;
  onSuccess: () => void;
}

const EditCheckInDialog = ({ open, onOpenChange, checkIn, onSuccess }: EditCheckInDialogProps) => {
  const [mood, setMood] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<number[]>([3]);
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const moods = [
    { value: "amazing", icon: SmilePlus, label: "Amazing", color: "text-green-500" },
    { value: "happy", icon: Smile, label: "Happy", color: "text-blue-500" },
    { value: "neutral", icon: Meh, label: "Neutral", color: "text-yellow-500" },
    { value: "sad", icon: Frown, label: "Sad", color: "text-orange-500" },
    { value: "angry", icon: Angry, label: "Angry", color: "text-red-500" },
  ];

  useEffect(() => {
    if (checkIn) {
      setMood(checkIn.mood || "");
      setEnergyLevel([checkIn.energy_level || 3]);
      setWaterIntake(checkIn.water_intake || 0);
      setSleepHours(checkIn.sleep_hours?.toString() || "");
      setNotes(checkIn.notes || "");
    }
  }, [checkIn]);

  const handleSubmit = async () => {
    if (!checkIn) return;
    
    if (!mood) {
      toast({
        title: "Missing Information",
        description: "Please select your mood",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("daily_checkins")
        .update({
          mood,
          energy_level: energyLevel[0],
          water_intake: waterIntake,
          sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
          notes: notes || null,
        })
        .eq("id", checkIn.id);

      if (error) throw error;

      toast({
        title: "Changes saved",
        description: "Your check-in has been updated.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Couldn't save changes",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!checkIn) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("daily_checkins")
        .delete()
        .eq("id", checkIn.id);

      if (error) throw error;

      toast({
        title: "Entry removed",
        description: "Your check-in has been deleted.",
      });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Couldn't delete entry",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Check-In</DialogTitle>
            <DialogDescription>
              Update or remove this wellness entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>How were you feeling?</Label>
              <div className="grid grid-cols-5 gap-2">
                {moods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      mood === m.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <m.icon className={`h-6 w-6 ${m.color}`} />
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Energy Level: {energyLevel[0]}/5</Label>
              <Slider
                value={energyLevel}
                onValueChange={setEnergyLevel}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="water">Water Intake (glasses)</Label>
              <Input
                id="water"
                type="number"
                min="0"
                max="20"
                value={waterIntake}
                onChange={(e) => setWaterIntake(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleep">Sleep (hours)</Label>
              <Input
                id="sleep"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any thoughts to capture..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1"
                variant="soft"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this check-in. You can always log new check-ins later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, remove it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditCheckInDialog;
