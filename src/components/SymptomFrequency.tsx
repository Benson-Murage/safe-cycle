import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SymptomFrequencyProps {
  userId: string;
}

const SymptomFrequency = ({ userId }: SymptomFrequencyProps) => {
  const [symptoms, setSymptoms] = useState<{ symptom: string; count: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("symptoms")
        .select("symptoms")
        .eq("user_id", userId);

      if (data) {
        const allSymptoms = data.flatMap((d) => d.symptoms || []);
        const frequency: { [key: string]: number } = {};

        allSymptoms.forEach((symptom) => {
          frequency[symptom] = (frequency[symptom] || 0) + 1;
        });

        const sorted = Object.entries(frequency)
          .map(([symptom, count]) => ({ symptom, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setSymptoms(sorted);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle>Common Symptoms</CardTitle>
      </CardHeader>
      <CardContent>
        {symptoms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {symptoms.map(({ symptom, count }) => (
              <Badge
                key={symptom}
                variant="secondary"
                className="text-sm px-3 py-1"
              >
                {symptom} ({count})
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Log symptoms to see patterns
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomFrequency;