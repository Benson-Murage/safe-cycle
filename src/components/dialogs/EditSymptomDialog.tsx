import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Trash2, X } from "lucide-react";
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

interface SymptomLog {
  id: string;
  date: string;
  mood: string | null;
  symptoms: string[] | null;
  notes: string | null;
}

interface EditSymptomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symptomLog: SymptomLog | null;
  onSuccess: () => void;
}

const commonSymptoms = ["Cramps", "Headache", "Fatigue", "Mood swings", "Bloating", "Acne"];

const EditSymptomDialog = ({ open, onOpenChange, symptomLog, onSuccess }: EditSymptomDialogProps) => {
  const [date, setDate] = useState("");
  const [mood, setMood] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (symptomLog) {
      setDate(symptomLog.date);
      setMood(symptomLog.mood || "");
      setSymptoms(symptomLog.symptoms || []);
      setNotes(symptomLog.notes || "");
    }
  }, [symptomLog]);

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomLog) return;
    
    setLoading(true);

    const { error } = await supabase
      .from("symptoms")
      .update({
        date,
        mood: mood || null,
        symptoms: symptoms.length > 0 ? symptoms : null,
        notes: notes || null,
      })
      .eq("id", symptomLog.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Couldn't save changes",
        description: "Please try again in a moment.",
      });
    } else {
      toast({
        title: "Changes saved",
        description: "Your symptom log has been updated.",
      });
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!symptomLog) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("symptoms")
      .delete()
      .eq("id", symptomLog.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Couldn't delete entry",
        description: "Please try again in a moment.",
      });
    } else {
      toast({
        title: "Entry removed",
        description: "Your symptom log has been deleted.",
      });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gradient-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Symptom Log</DialogTitle>
            <DialogDescription>
              Update or remove this entry from your history.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mood">Mood</Label>
              <Input
                id="mood"
                placeholder="How were you feeling?"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Symptoms</Label>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((symptom) => (
                  <Badge
                    key={symptom}
                    variant={symptoms.includes(symptom) ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => toggleSymptom(symptom)}
                  >
                    {symptom}
                    {symptoms.includes(symptom) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this symptom log. You can always log new symptoms later.
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

export default EditSymptomDialog;
