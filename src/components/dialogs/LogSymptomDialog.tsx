import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface LogSymptomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const commonSymptoms = ["Cramps", "Headache", "Fatigue", "Mood swings", "Bloating", "Acne"];

const LogSymptomDialog = ({ open, onOpenChange, userId }: LogSymptomDialogProps) => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mood, setMood] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("symptoms").upsert({
      user_id: userId,
      date,
      mood: mood || null,
      symptoms: symptoms.length > 0 ? symptoms : null,
      notes: notes || null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log symptoms",
      });
    } else {
      toast({
        title: "Success",
        description: "Symptoms logged successfully",
      });
      onOpenChange(false);
      setDate(format(new Date(), "yyyy-MM-dd"));
      setMood("");
      setSymptoms([]);
      setNotes("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Symptoms & Mood</DialogTitle>
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
              placeholder="How are you feeling?"
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
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Symptoms
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogSymptomDialog;