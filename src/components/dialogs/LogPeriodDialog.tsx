import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface LogPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const LogPeriodDialog = ({ open, onOpenChange, userId }: LogPeriodDialogProps) => {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("cycles").insert({
      user_id: userId,
      start_date: startDate,
      end_date: endDate || null,
      is_predicted: false,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log period",
      });
    } else {
      toast({
        title: "Success",
        description: "Period logged successfully",
      });
      onOpenChange(false);
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setEndDate("");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-card">
        <DialogHeader>
          <DialogTitle>Log Period</DialogTitle>
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
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Period
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogPeriodDialog;