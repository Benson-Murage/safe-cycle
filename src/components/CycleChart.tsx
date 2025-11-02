import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { differenceInDays, parseISO } from "date-fns";

interface CycleChartProps {
  userId: string;
}

const CycleChart = ({ userId }: CycleChartProps) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: cycles } = await supabase
        .from("cycles")
        .select("start_date")
        .eq("user_id", userId)
        .eq("is_predicted", false)
        .order("start_date", { ascending: true });

      if (cycles && cycles.length > 1) {
        const cycleLengths = [];
        for (let i = 1; i < cycles.length; i++) {
          const length = differenceInDays(
            parseISO(cycles[i].start_date),
            parseISO(cycles[i - 1].start_date)
          );
          cycleLengths.push({
            cycle: i,
            length,
          });
        }
        setData(cycleLengths);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle>Cycle Length Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="cycle" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="length"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Log more cycles to see trends
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CycleChart;