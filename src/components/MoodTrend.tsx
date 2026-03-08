import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SmilePlus } from "lucide-react";
import { format, subDays } from "date-fns";

interface MoodTrendProps {
  userId: string;
}

const moodScore: Record<string, number> = {
  great: 5,
  good: 4,
  okay: 3,
  neutral: 3,
  low: 2,
  bad: 1,
  sad: 1,
  anxious: 2,
  happy: 5,
  calm: 4,
  stressed: 2,
  irritable: 2,
  energetic: 5,
  tired: 1,
};

const MoodTrend = ({ userId }: MoodTrendProps) => {
  const [data, setData] = useState<{ date: string; mood: number; label: string }[]>([]);

  useEffect(() => {
    const fetchMoods = async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      const { data: checkIns } = await supabase
        .from("daily_checkins")
        .select("date, mood")
        .eq("user_id", userId)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: true });

      if (checkIns) {
        const chartData = checkIns
          .filter((c) => c.mood)
          .map((c) => ({
            date: format(new Date(c.date), "MMM d"),
            mood: moodScore[c.mood!.toLowerCase()] ?? 3,
            label: c.mood!,
          }));
        setData(chartData);
      }
    };

    fetchMoods();
  }, [userId]);

  return (
    <Card className="p-6 shadow-colorful hover:shadow-glow transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg gradient-vibrant">
          <SmilePlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Mood Trend</h3>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
      </div>
      {data.length >= 2 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => ["", "Bad", "Low", "Okay", "Good", "Great"][v] || ""}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number, _name: string, props: any) => [
                props.payload.label,
                "Mood",
              ]}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[220px] text-center space-y-2">
          <SmilePlus className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            {data.length === 1
              ? "Log one more daily check-in with mood to see your trend"
              : "Start logging daily check-ins to see your mood patterns over time"}
          </p>
        </div>
      )}
    </Card>
  );
};

export default MoodTrend;
