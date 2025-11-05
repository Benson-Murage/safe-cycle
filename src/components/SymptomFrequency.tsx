import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity } from "lucide-react";

interface SymptomFrequencyProps {
  userId: string;
}

const SymptomFrequency = ({ userId }: SymptomFrequencyProps) => {
  const [symptomData, setSymptomData] = useState<any[]>([]);

  useEffect(() => {
    const fetchSymptomData = async () => {
      const { data: symptoms } = await supabase
        .from("symptoms")
        .select("symptoms")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (symptoms) {
        const frequency: { [key: string]: number } = {};
        symptoms.forEach((symptomRecord) => {
          if (symptomRecord.symptoms) {
            symptomRecord.symptoms.forEach((symptom: string) => {
              frequency[symptom] = (frequency[symptom] || 0) + 1;
            });
          }
        });

        const chartData = Object.entries(frequency)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setSymptomData(chartData);
      }
    };

    fetchSymptomData();
  }, [userId]);

  const colors = ['hsl(330, 70%, 60%)', 'hsl(270, 60%, 65%)', 'hsl(180, 60%, 55%)', 'hsl(330, 85%, 75%)', 'hsl(270, 50%, 50%)'];

  return (
    <Card className="p-6 shadow-colorful hover:shadow-glow transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg gradient-vibrant">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold">Top Symptoms</h3>
      </div>
      {symptomData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={symptomData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {symptomData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          <p>No symptom data yet. Start tracking to see insights!</p>
        </div>
      )}
    </Card>
  );
};

export default SymptomFrequency;
