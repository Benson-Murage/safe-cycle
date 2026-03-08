import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface CycleLengthChartProps {
  userId: string;
}

const CycleLengthChart = ({ userId }: CycleLengthChartProps) => {
  const [data, setData] = useState<{ cycle: string; length: number }[]>([]);
  const [avgLength, setAvgLength] = useState(0);

  useEffect(() => {
    const fetchCycles = async () => {
      const { data: cycles } = await supabase
        .from("cycles")
        .select("start_date, end_date")
        .eq("user_id", userId)
        .eq("is_predicted", false)
        .order("start_date", { ascending: true });

      if (cycles && cycles.length >= 2) {
        const lengths: { cycle: string; length: number }[] = [];
        for (let i = 1; i < cycles.length; i++) {
          const len = differenceInDays(new Date(cycles[i].start_date), new Date(cycles[i - 1].start_date));
          if (len > 0 && len < 60) {
            lengths.push({
              cycle: format(new Date(cycles[i - 1].start_date), "MMM yy"),
              length: len,
            });
          }
        }
        setData(lengths);
        if (lengths.length > 0) {
          setAvgLength(Math.round(lengths.reduce((s, d) => s + d.length, 0) / lengths.length));
        }
      }
    };

    fetchCycles();
  }, [userId]);

  return (
    <Card className="p-6 shadow-colorful hover:shadow-glow transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg gradient-vibrant">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Cycle Length History</h3>
          {avgLength > 0 && (
            <p className="text-xs text-muted-foreground">Average: {avgLength} days</p>
          )}
        </div>
      </div>
      {data.length >= 2 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 3", "dataMax + 3"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value} days`, "Cycle Length"]}
            />
            {avgLength > 0 && (
              <ReferenceLine
                y={avgLength}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                label={{ value: `Avg: ${avgLength}d`, position: "right", fontSize: 11, fill: "hsl(var(--primary))" }}
              />
            )}
            <Bar dataKey="length" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[220px] text-center space-y-2">
          <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            Log at least 2 periods to see your cycle length pattern
          </p>
        </div>
      )}
    </Card>
  );
};

export default CycleLengthChart;
