import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Droplet, AlertTriangle, Sparkles } from "lucide-react";
import { addDays, differenceInDays, format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PeriodCountdownProps {
  userId: string;
}

const PeriodCountdown = ({ userId }: PeriodCountdownProps) => {
  const [daysUntil, setDaysUntil] = useState<number | null>(null);
  const [nextPeriodDate, setNextPeriodDate] = useState<Date | null>(null);
  const [isLate, setIsLate] = useState(false);
  const [daysLate, setDaysLate] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: cycles } = await supabase
        .from("cycles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_predicted", false)
        .order("start_date", { ascending: false })
        .limit(1);

      const { data: profile } = await supabase
        .from("profiles")
        .select("average_cycle_length, last_period_date")
        .eq("id", userId)
        .maybeSingle();

      if (cycles && cycles.length > 0 && profile) {
        const lastPeriod = parseISO(cycles[0].start_date);
        const predicted = addDays(lastPeriod, profile.average_cycle_length);
        const daysRemaining = differenceInDays(predicted, new Date());
        
        setNextPeriodDate(predicted);
        setDaysUntil(daysRemaining);
        
        // Check if period is late
        if (daysRemaining < 0) {
          setIsLate(true);
          setDaysLate(Math.abs(daysRemaining));
        } else {
          setIsLate(false);
          setDaysLate(0);
        }

        // Update last_period_date in profile if not set or outdated
        if (!profile.last_period_date || profile.last_period_date !== cycles[0].start_date) {
          await supabase
            .from("profiles")
            .update({ last_period_date: cycles[0].start_date })
            .eq("id", userId);
        }
      }
    };

    fetchData();
  }, [userId]);

  const getStatusMessage = () => {
    if (daysUntil === null) return null;
    
    if (isLate) {
      if (daysLate <= 7) {
        return {
          message: "Your period may arrive soon",
          color: "text-yellow-600 dark:text-yellow-400",
          icon: <AlertTriangle className="h-4 w-4" />
        };
      } else {
        return {
          message: "Consider logging if your period has started",
          color: "text-orange-600 dark:text-orange-400",
          icon: <AlertTriangle className="h-4 w-4" />
        };
      }
    }
    
    if (daysUntil <= 3 && daysUntil > 0) {
      return {
        message: "Period approaching - be prepared!",
        color: "text-pink-600 dark:text-pink-400",
        icon: <Sparkles className="h-4 w-4" />
      };
    }
    
    return null;
  };

  const status = getStatusMessage();

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-primary" />
          Next Period
          {isLate && (
            <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              {daysLate} day{daysLate !== 1 ? "s" : ""} late
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {daysUntil !== null && nextPeriodDate ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent ${isLate ? "opacity-60" : ""}`}>
                {isLate ? "—" : daysUntil}
              </div>
              <div className="text-muted-foreground mt-2">
                {isLate 
                  ? "Expected date has passed"
                  : daysUntil === 0 
                    ? "Today is the day!" 
                    : daysUntil === 1 
                      ? "day remaining" 
                      : "days remaining"
                }
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {isLate ? "Was expected" : "Expected"} on {format(nextPeriodDate, "MMMM d, yyyy")}
              </span>
            </div>

            {status && (
              <div className={`flex items-center justify-center gap-2 text-sm ${status.color} bg-muted/50 rounded-lg p-3`}>
                {status.icon}
                <span>{status.message}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="text-muted-foreground">
              <p className="mb-2">No period data yet</p>
              <p className="text-sm">Log your first period to start tracking and get predictions</p>
            </div>
            <Button 
              variant="soft" 
              size="sm"
              onClick={() => navigate("/profile")}
            >
              Set up your cycle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PeriodCountdown;
