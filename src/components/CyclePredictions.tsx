import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { calculatePredictions, CyclePrediction, getAccuracyLabel, getAccuracyColor } from "@/utils/predictions";
import { format } from "date-fns";
import { Calendar, Activity, Target, TrendingUp, HelpCircle, Sparkles, FileText } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface CyclePredictionsProps {
  userId: string;
}

const CyclePredictions = ({ userId }: CyclePredictionsProps) => {
  const [predictions, setPredictions] = useState<CyclePrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_period_date, average_cycle_length")
        .eq("id", userId)
        .single();

      if (!profile?.last_period_date) {
        setLoading(false);
        return;
      }

      // Get historical cycles
      const { data: cycles } = await supabase
        .from("cycles")
        .select("start_date, end_date")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })
        .limit(12);

      if (cycles) {
        setCycleCount(cycles.length);
        const prediction = calculatePredictions(
          cycles,
          profile.last_period_date,
          profile.average_cycle_length
        );
        setPredictions(prediction);
      }

      setLoading(false);
    };

    fetchPredictions();
  }, [userId]);

  const getConfidenceMessage = () => {
    if (cycleCount < 3) {
      return {
        icon: FileText,
        title: "Building your pattern",
        message: `We have ${cycleCount} cycle${cycleCount !== 1 ? "s" : ""} logged. With 3+ cycles, predictions become more personalized.`,
        tip: "Keep logging to help us learn your unique rhythm.",
      };
    } else if (predictions && predictions.accuracyScore >= 80) {
      return {
        icon: Sparkles,
        title: "High confidence",
        message: "Your cycles have been consistent, so these predictions should be quite reliable.",
        tip: "Your regular logging is making a real difference!",
      };
    } else if (predictions && predictions.accuracyScore >= 60) {
      return {
        icon: TrendingUp,
        title: "Good confidence",
        message: "We're getting a clear picture of your cycle pattern.",
        tip: "Some variation is normal — your body isn't a clock, and that's okay.",
      };
    } else {
      return {
        icon: HelpCircle,
        title: "Moderate confidence",
        message: "Your cycles have some natural variation, which affects prediction precision.",
        tip: "This is very common! Consider tracking BBT or cervical mucus for more insights.",
      };
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground animate-pulse">
            Calculating your predictions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions) {
    return (
      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardContent className="py-10 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Let's get started</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your last period date in your Profile to see personalized predictions.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll use your cycle history to estimate future dates — the more you log, the better we get.
          </p>
        </CardContent>
      </Card>
    );
  }

  const confidence = getConfidenceMessage();
  const ConfidenceIcon = confidence.icon;

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Cycle Predictions
            </CardTitle>
            <CardDescription>Based on {cycleCount} logged cycle{cycleCount !== 1 ? "s" : ""}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Confidence</div>
            <Badge variant="outline" className={getAccuracyColor(predictions.accuracyScore)}>
              {predictions.accuracyScore}% — {getAccuracyLabel(predictions.accuracyScore)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Next Period
            </div>
            <div className="text-2xl font-bold text-foreground">
              {format(predictions.nextPeriodDate, "MMM dd, yyyy")}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(predictions.nextPeriodDate, "EEEE")}
              {predictions.cycleVariability > 0 && (
                <span className="ml-1 opacity-70">± {Math.round(predictions.cycleVariability)} days</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Next Ovulation
            </div>
            <div className="text-2xl font-bold text-foreground">
              {format(predictions.nextOvulationDate, "MMM dd, yyyy")}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(predictions.nextOvulationDate, "EEEE")}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Fertile Window
            </div>
            <div className="text-lg font-semibold text-foreground">
              {format(predictions.fertilityWindowStart, "MMM dd")} – {format(predictions.fertilityWindowEnd, "MMM dd, yyyy")}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest chance of conception during this window
            </p>
          </div>
        </div>

        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
          <div className="pt-4 border-t border-border">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4 mr-2" />
                {showExplanation ? "Hide explanation" : "Why am I seeing these dates?"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <ConfidenceIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{confidence.title}</p>
                  <p className="text-sm text-muted-foreground">{confidence.message}</p>
                  <p className="text-xs text-primary">{confidence.tip}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pl-1">
                <p>• These are estimates based on your personal cycle data</p>
                <p>• Actual dates may vary — your body has its own rhythm</p>
                <p>• Not intended for medical decisions or contraception</p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default CyclePredictions;