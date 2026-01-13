import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, ChevronDown, ChevronUp, Info } from "lucide-react";
import { FertilityData } from "@/utils/fertility";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FertilityInfoProps {
  fertilityData: FertilityData;
}

const phaseExplanations: Record<FertilityData["currentPhase"], { 
  description: string; 
  tips: string[];
  hormones: string;
}> = {
  menstrual: {
    description: "Your body is shedding the uterine lining. This typically lasts 3-7 days.",
    tips: [
      "Rest when needed and stay hydrated",
      "Iron-rich foods can help replenish nutrients",
      "Gentle exercise like walking may ease cramps",
    ],
    hormones: "Estrogen and progesterone are at their lowest levels.",
  },
  follicular: {
    description: "Your body prepares eggs for ovulation. Energy levels often increase during this phase.",
    tips: [
      "Great time for high-intensity workouts",
      "Focus on complex carbs and proteins",
      "You may feel more social and creative",
    ],
    hormones: "Estrogen rises, boosting mood and energy.",
  },
  ovulation: {
    description: "An egg is released from the ovary. This is your most fertile time.",
    tips: [
      "Peak fertility window for conception",
      "You may notice increased energy",
      "Some experience mild cramping (mittelschmerz)",
    ],
    hormones: "Estrogen peaks, triggering LH surge and egg release.",
  },
  luteal: {
    description: "Post-ovulation phase where progesterone rises. PMS symptoms may occur.",
    tips: [
      "Prioritize sleep and stress management",
      "Magnesium-rich foods may help mood",
      "Gentle yoga or stretching can be beneficial",
    ],
    hormones: "Progesterone rises to prepare for possible pregnancy.",
  },
  unknown: {
    description: "We need more data to determine your current cycle phase.",
    tips: [
      "Log your period to improve predictions",
      "Track symptoms to understand patterns",
    ],
    hormones: "Add your last period date to see phase information.",
  },
};

const FertilityInfo = ({ fertilityData }: FertilityInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { ovulationDate, fertileWindowStart, fertileWindowEnd, currentPhase, daysUntilOvulation } = fertilityData;

  const phaseColors: Record<FertilityData["currentPhase"], string> = {
    menstrual: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    follicular: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    ovulation: "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400",
    luteal: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    unknown: "bg-muted text-muted-foreground",
  };

  const phaseLabels: Record<FertilityData["currentPhase"], string> = {
    menstrual: "Menstrual Phase",
    follicular: "Follicular Phase",
    ovulation: "Ovulation Phase",
    luteal: "Luteal Phase",
    unknown: "Unknown Phase",
  };

  const explanation = phaseExplanations[currentPhase];

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Fertility & Cycle Phase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Phase</span>
            <div className="flex items-center gap-2">
              <Badge className={phaseColors[currentPhase]}>
                {phaseLabels[currentPhase]}
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className="mt-3 space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-foreground/90">{explanation.description}</p>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Hormones
                </p>
                <p className="text-sm text-foreground/80">{explanation.hormones}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tips for this phase
                </p>
                <ul className="space-y-1">
                  {explanation.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {ovulationDate && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Ovulation</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Ovulation Date</p>
                <p className="font-medium">{format(ovulationDate, "MMM d, yyyy")}</p>
              </div>
              {daysUntilOvulation !== null && (
                <div>
                  <p className="text-muted-foreground mb-1">Days Until</p>
                  <p className="font-medium">
                    {daysUntilOvulation > 0 
                      ? `${daysUntilOvulation} days`
                      : daysUntilOvulation === 0
                      ? "Today!"
                      : `${Math.abs(daysUntilOvulation)} days ago`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {fertileWindowStart && fertileWindowEnd && (
          <div className="space-y-2 pt-2 border-t">
            <span className="text-sm font-medium">Fertile Window</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gradient-to-r from-teal-500/20 via-pink-500/20 to-teal-500/20 rounded-full h-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              {format(fertileWindowStart, "MMM d")} - {format(fertileWindowEnd, "MMM d, yyyy")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FertilityInfo;
