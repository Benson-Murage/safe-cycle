import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  userId: string;
}

const CalendarView = ({ userId }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [periodDays, setPeriodDays] = useState<string[]>([]);

  useEffect(() => {
    const fetchPeriodDays = async () => {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const { data } = await supabase
        .from("cycles")
        .select("start_date, end_date")
        .eq("user_id", userId)
        .gte("start_date", start)
        .lte("start_date", end);

      if (data) {
        const days: string[] = [];
        data.forEach((cycle) => {
          const startDate = parseISO(cycle.start_date);
          const endDate = cycle.end_date ? parseISO(cycle.end_date) : startDate;
          const cycleDays = eachDayOfInterval({ start: startDate, end: endDate });
          cycleDays.forEach((day) => days.push(format(day, "yyyy-MM-dd")));
        });
        setPeriodDays(days);
      }
    };

    fetchPeriodDays();
  }, [userId, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {daysInMonth.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const isPeriod = periodDays.includes(dayStr);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayStr}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-full text-sm transition-all duration-300",
                  isPeriod && "bg-gradient-primary text-white shadow-glow",
                  isToday && !isPeriod && "border-2 border-primary",
                  !isPeriod && "hover:bg-muted cursor-pointer"
                )}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;