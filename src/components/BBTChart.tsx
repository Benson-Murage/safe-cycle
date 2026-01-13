import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { Thermometer, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BBTChartProps {
  userId: string;
}

interface BBTData {
  date: string;
  fullDate: string;
  temperature: number;
  time_taken: string | null;
}

const BBTChart = ({ userId }: BBTChartProps) => {
  const [data, setData] = useState<BBTData[]>([]);
  const [averageTemp, setAverageTemp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBBTData = async () => {
      setLoading(true);
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      
      const { data: bbtLogs, error } = await supabase
        .from("bbt_logs")
        .select("date, temperature, time_taken")
        .eq("user_id", userId)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching BBT data:", error);
        setLoading(false);
        return;
      }

      if (bbtLogs && bbtLogs.length > 0) {
        const chartData = bbtLogs.map((log) => ({
          date: format(parseISO(log.date), "MMM d"),
          fullDate: log.date,
          temperature: Number(log.temperature),
          time_taken: log.time_taken,
        }));
        
        setData(chartData);
        
        // Calculate average temperature
        const avg = bbtLogs.reduce((sum, log) => sum + Number(log.temperature), 0) / bbtLogs.length;
        setAverageTemp(Math.round(avg * 100) / 100);
      }
      
      setLoading(false);
    };

    fetchBBTData();
  }, [userId]);

  const detectOvulationShift = () => {
    if (data.length < 6) return null;
    
    // Look for a sustained temperature rise (0.2°F / 0.1°C above baseline for 3+ days)
    const baseline = data.slice(0, Math.floor(data.length / 2));
    const avgBaseline = baseline.reduce((sum, d) => sum + d.temperature, 0) / baseline.length;
    
    let shiftIndex = -1;
    for (let i = baseline.length; i < data.length - 2; i++) {
      const threeDayAvg = (data[i].temperature + data[i + 1].temperature + data[i + 2].temperature) / 3;
      if (threeDayAvg > avgBaseline + 0.2) {
        shiftIndex = i;
        break;
      }
    }
    
    return shiftIndex >= 0 ? data[shiftIndex]?.fullDate : null;
  };

  const ovulationShift = detectOvulationShift();

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            BBT Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Loading temperature data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-primary" />
              BBT Chart
            </CardTitle>
            <CardDescription>
              Track your basal body temperature to identify ovulation patterns
            </CardDescription>
          </div>
          {averageTemp && (
            <Badge variant="secondary" className="text-sm">
              Avg: {averageTemp}°F
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value}°`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}°F`, 'Temperature']}
                />
                {averageTemp && (
                  <ReferenceLine 
                    y={averageTemp} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: 'Baseline', 
                      position: 'right',
                      fontSize: 10,
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="temperature" 
                  fill="url(#tempGradient)" 
                  stroke="transparent"
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {ovulationShift && (
              <div className="flex items-center gap-2 text-sm bg-pink-500/10 text-pink-700 dark:text-pink-400 rounded-lg p-3">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Temperature shift detected around {format(parseISO(ovulationShift), "MMM d")} — possible ovulation
                </span>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                A sustained rise of 0.2°F (0.1°C) above your baseline for 3+ days typically indicates ovulation has occurred. 
                For best results, take your temperature at the same time each morning before getting out of bed.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground space-y-3">
            <Thermometer className="h-12 w-12 opacity-30" />
            <div className="text-center">
              <p className="font-medium">No BBT data yet</p>
              <p className="text-sm mt-1">
                Start logging your morning temperature in the Insights tab to see patterns
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BBTChart;
