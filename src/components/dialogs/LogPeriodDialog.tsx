import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Droplet, Trash2, AlertCircle } from "lucide-react";
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

interface LogPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editingPeriod?: {
    id: string;
    start_date: string;
    end_date: string | null;
    flow_intensity?: string | null;
  } | null;
}

const flowIntensities = [
  { value: "spotting", label: "Spotting", color: "bg-pink-200 text-pink-800 border-pink-300" },
  { value: "light", label: "Light", color: "bg-pink-300 text-pink-900 border-pink-400" },
  { value: "medium", label: "Medium", color: "bg-red-400 text-white border-red-500" },
  { value: "heavy", label: "Heavy", color: "bg-red-600 text-white border-red-700" },
];

const LogPeriodDialog = ({ open, onOpenChange, userId, editingPeriod = null }: LogPeriodDialogProps) => {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [flowIntensity, setFlowIntensity] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const isEditing = !!editingPeriod;

  useEffect(() => {
    if (editingPeriod) {
      setStartDate(editingPeriod.start_date);
      setEndDate(editingPeriod.end_date || "");
      setFlowIntensity(editingPeriod.flow_intensity || "");
    } else {
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setEndDate("");
      setFlowIntensity("");
    }
  }, [editingPeriod, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const periodData = {
      user_id: userId,
      start_date: startDate,
      end_date: endDate || null,
      is_predicted: false,
    };

    let error;

    if (isEditing) {
      const result = await supabase
        .from("cycles")
        .update({
          start_date: startDate,
          end_date: endDate || null,
        })
        .eq("id", editingPeriod.id);
      error = result.error;
    } else {
      const result = await supabase.from("cycles").insert(periodData);
      error = result.error;
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "log"} period`,
      });
    } else {
      toast({
        title: "Success",
        description: `Period ${isEditing ? "updated" : "logged"} successfully`,
      });
      onOpenChange(false);
      resetForm();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!editingPeriod) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("cycles")
      .delete()
      .eq("id", editingPeriod.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete period log",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Period log has been removed",
      });
      setDeleteDialogOpen(false);
      onOpenChange(false);
      resetForm();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate("");
    setFlowIntensity("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gradient-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-primary" />
              {isEditing ? "Edit Period" : "Log Period"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the details of your period log"
                : "Record your period start date. You can add the end date later."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-xl"
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl"
                min={startDate}
                max={format(new Date(), "yyyy-MM-dd")}
              />
              <p className="text-xs text-muted-foreground">
                You can update this later when your period ends
              </p>
            </div>

            <div className="space-y-2">
              <Label>Flow Intensity (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {flowIntensities.map((flow) => (
                  <Badge
                    key={flow.value}
                    variant="outline"
                    className={`cursor-pointer transition-all duration-200 ${
                      flowIntensity === flow.value 
                        ? flow.color 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setFlowIntensity(
                      flowIntensity === flow.value ? "" : flow.value
                    )}
                  >
                    {flow.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Period" : "Log Period"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Period Log
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this period log. This action cannot be undone
              and may affect your cycle predictions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LogPeriodDialog;
