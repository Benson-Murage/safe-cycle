import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Sparkles } from "lucide-react";

interface CycleSummaryProps {
  userId: string;
}

const CycleSummary = ({ userId }: CycleSummaryProps) => {
  const [avgCycleLength, setAvgCycleLength] = useState<number | null>(null);
  const [totalCycles, setTotalCycles] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("average_cycle_length")
        .eq("id", userId)
        .single();

      const { count } = await supabase
        .from("cycles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_predicted", false);

      if (profile) {
        setAvgCycleLength(profile.average_cycle_length);
      }
      setTotalCycles(count || 0);
    };

    fetchData();
  }, [userId]);

  const getInsightMessage = () => {
    if (totalCycles === 0) {
      return "Start logging to build your personal cycle profile";
    } else if (totalCycles < 3) {
      return `${3 - totalCycles} more cycle${3 - totalCycles !== 1 ? "s" : ""} until personalized insights`;
    } else if (totalCycles >= 6) {
      return "Strong data foundation for accurate predictions";
    } else {
      return "Building a clearer picture of your pattern";
    }
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Cycle Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Average Cycle</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {avgCycleLength || 28} days
            </div>
            <p className="text-xs text-muted-foreground">
              {avgCycleLength && avgCycleLength >= 21 && avgCycleLength <= 35 
                ? "Within typical range (21-35 days)"
                : avgCycleLength && avgCycleLength < 21 
                ? "Shorter than typical — talk to a provider if concerned"
                : avgCycleLength && avgCycleLength > 35
                ? "Longer than typical — this can be normal for some"
                : "Based on default average"}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Tracked Cycles</span>
            </div>
            <div className="text-2xl font-bold text-secondary">
              {totalCycles}
            </div>
            <p className="text-xs text-muted-foreground">
              {getInsightMessage()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CycleSummary;