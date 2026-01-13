import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface IrregularCycleAlertProps {
  userId: string;
}

interface CycleAnalysis {
  isIrregular: boolean;
  latestCycleLength: number | null;
  averageLength: number;
  deviation: number;
  deviationType: "short" | "long" | null;
}

const IrregularCycleAlert = ({ userId }: IrregularCycleAlertProps) => {
  const [analysis, setAnalysis] = useState<CycleAnalysis | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const analyzeCycles = async () => {
      // Get user profile for average cycle length
      const { data: profile } = await supabase
        .from("profiles")
        .select("average_cycle_length")
        .eq("id", userId)
        .single();

      // Get recent cycles
      const { data: cycles } = await supabase
        .from("cycles")
        .select("start_date, end_date")
        .eq("user_id", userId)
        .eq("is_predicted", false)
        .order("start_date", { ascending: false })
        .limit(6);

      if (!cycles || cycles.length < 2 || !profile) {
        return;
      }

      // Calculate the latest cycle length
      const latestStart = new Date(cycles[0].start_date);
      const previousStart = new Date(cycles[1].start_date);
      const latestCycleLength = differenceInDays(latestStart, previousStart);

      // Skip invalid data
      if (latestCycleLength <= 0 || latestCycleLength > 60) {
        return;
      }

      const averageLength = profile.average_cycle_length || 28;
      const deviation = Math.abs(latestCycleLength - averageLength);
      const deviationThreshold = 7; // Days deviation that triggers alert

      const isIrregular = deviation >= deviationThreshold;
      const deviationType = latestCycleLength < averageLength ? "short" : "long";

      setAnalysis({
        isIrregular,
        latestCycleLength,
        averageLength,
        deviation,
        deviationType: isIrregular ? deviationType : null,
      });
    };

    analyzeCycles();
  }, [userId]);

  if (!analysis?.isIrregular || dismissed) {
    return null;
  }

  const possibleCauses = analysis.deviationType === "short" 
    ? [
        "Stress or changes in routine",
        "Hormonal fluctuations",
        "Weight changes or intense exercise",
        "New medications or supplements",
      ]
    : [
        "Stress or lifestyle changes",
        "Hormonal variations",
        "Changes in sleep patterns",
        "Travel or time zone changes",
      ];

  return (
    <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 relative">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      <AlertTitle className="text-amber-800 dark:text-amber-200 pr-8">
        Your recent cycle was {analysis.deviationType === "short" ? "shorter" : "longer"} than usual
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300 space-y-3">
        <p className="text-sm">
          Your last cycle was {analysis.latestCycleLength} days — {analysis.deviation} days {analysis.deviationType === "short" ? "shorter" : "longer"} than your {analysis.averageLength}-day average. 
          This is completely normal and happens to most people from time to time.
        </p>
        
        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
          <CollapsibleTrigger asChild>
            <Button variant="link" size="sm" className="h-auto p-0 text-amber-700 dark:text-amber-300">
              <HelpCircle className="h-3 w-3 mr-1" />
              {showExplanation ? "Hide details" : "Why might this happen?"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <p className="text-sm font-medium">Common causes include:</p>
            <ul className="text-sm list-disc list-inside space-y-1">
              {possibleCauses.map((cause, idx) => (
                <li key={idx}>{cause}</li>
              ))}
            </ul>
            <p className="text-xs mt-3 text-amber-600 dark:text-amber-400">
              💡 If you notice persistent irregularity over several cycles, consider speaking with a healthcare provider for personalized guidance.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
    </Alert>
  );
};

export default IrregularCycleAlert;
