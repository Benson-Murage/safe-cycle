import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, FileText } from "lucide-react";

interface DataExportProps {
  userId: string;
}

const DataExport = ({ userId }: DataExportProps) => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const [cyclesRes, symptomsRes, checkInsRes, bbtRes, medsRes] = await Promise.all([
        supabase.from("cycles").select("*").eq("user_id", userId).eq("is_predicted", false).order("start_date", { ascending: false }),
        supabase.from("symptoms").select("*").eq("user_id", userId).order("date", { ascending: false }),
        supabase.from("daily_checkins").select("*").eq("user_id", userId).order("date", { ascending: false }),
        supabase.from("bbt_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
        supabase.from("medications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      const lines: string[] = [];

      // Cycles
      lines.push("=== Period Cycles ===");
      lines.push("Start Date,End Date,Duration (days)");
      (cyclesRes.data || []).forEach((c) => {
        const duration = c.end_date
          ? Math.ceil((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000)
          : "";
        lines.push(`${c.start_date},${c.end_date || ""},${duration}`);
      });

      lines.push("");
      lines.push("=== Symptoms ===");
      lines.push("Date,Mood,Symptoms,Notes");
      (symptomsRes.data || []).forEach((s) => {
        const symptoms = s.symptoms ? s.symptoms.join("; ") : "";
        lines.push(`${s.date},${s.mood || ""},${symptoms},"${(s.notes || "").replace(/"/g, '""')}"`);
      });

      lines.push("");
      lines.push("=== Daily Check-Ins ===");
      lines.push("Date,Mood,Energy,Water (glasses),Sleep (hours),Notes");
      (checkInsRes.data || []).forEach((c) => {
        lines.push(`${c.date},${c.mood || ""},${c.energy_level ?? ""},${c.water_intake ?? ""},${c.sleep_hours ?? ""},"${(c.notes || "").replace(/"/g, '""')}"`);
      });

      lines.push("");
      lines.push("=== BBT Logs ===");
      lines.push("Date,Temperature,Time Taken,Notes");
      (bbtRes.data || []).forEach((b) => {
        lines.push(`${b.date},${b.temperature},${b.time_taken || ""},"${(b.notes || "").replace(/"/g, '""')}"`);
      });

      lines.push("");
      lines.push("=== Medications ===");
      lines.push("Name,Type,Dosage,Frequency,Start Date,End Date");
      (medsRes.data || []).forEach((m) => {
        lines.push(`${m.name},${m.type},${m.dosage || ""},${m.frequency},${m.start_date || ""},${m.end_date || ""}`);
      });

      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safe-cycle-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Your data has been downloaded as a CSV file.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download all your tracked data as a CSV file. Your data belongs to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} disabled={exporting} className="w-full">
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {exporting ? "Exporting..." : "Download CSV"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataExport;
