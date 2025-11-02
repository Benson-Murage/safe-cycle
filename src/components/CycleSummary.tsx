import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";

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

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle>Cycle Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Average Cycle</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {avgCycleLength || 28} days
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Tracked Cycles</span>
            </div>
            <div className="text-2xl font-bold text-secondary">
              {totalCycles}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CycleSummary;