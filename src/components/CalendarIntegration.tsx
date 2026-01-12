import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, Download, ExternalLink, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { 
  generateCycleEvents, 
  downloadICSFile, 
  generateGoogleCalendarURL,
  CycleEvent 
} from "@/utils/calendar-export";

interface CalendarIntegrationProps {
  userId: string;
}

const CalendarIntegration = ({ userId }: CalendarIntegrationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<{
    last_period_date: string | null;
    average_cycle_length: number;
    average_period_length: number;
  } | null>(null);
  
  // Export options
  const [includePeriods, setIncludePeriods] = useState(true);
  const [includeFertile, setIncludeFertile] = useState(true);
  const [includeOvulation, setIncludeOvulation] = useState(true);
  const [monthsAhead, setMonthsAhead] = useState("3");
  const [events, setEvents] = useState<CycleEvent[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("last_period_date, average_cycle_length, average_period_length")
        .eq("id", userId)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (profile) {
      const allEvents = generateCycleEvents(
        profile.last_period_date,
        profile.average_cycle_length,
        profile.average_period_length,
        parseInt(monthsAhead)
      );

      const filteredEvents = allEvents.filter((event) => {
        if (event.type === 'period' && !includePeriods) return false;
        if (event.type === 'fertile' && !includeFertile) return false;
        if (event.type === 'ovulation' && !includeOvulation) return false;
        return true;
      });

      setEvents(filteredEvents);
    }
  }, [profile, includePeriods, includeFertile, includeOvulation, monthsAhead]);

  const handleDownloadICS = () => {
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    setIsLoading(true);
    try {
      downloadICSFile(events, `cycle-events-${new Date().toISOString().split('T')[0]}.ics`);
      toast.success("Calendar file downloaded! Import it to your calendar app.");
    } catch (error) {
      toast.error("Failed to generate calendar file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCalendarExport = (event: CycleEvent) => {
    const url = generateGoogleCalendarURL(event);
    window.open(url, '_blank');
    toast.success("Opening Google Calendar...");
  };

  const handleExportAllToGoogle = () => {
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    // Open first event, user can add the rest manually or use ICS
    const url = generateGoogleCalendarURL(events[0]);
    window.open(url, '_blank');
    toast.info("For multiple events, we recommend downloading the .ics file and importing it to Google Calendar.");
  };

  if (!profile?.last_period_date) {
    return (
      <Card className="bg-gradient-card shadow-colorful border-border/50">
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Log your first period to enable calendar export features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-colorful border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-vibrant text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Calendar Integration</CardTitle>
            <CardDescription className="text-white/80">
              Sync your cycle predictions with your calendar
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Export Options */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Export Options
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="periods" 
                checked={includePeriods}
                onCheckedChange={(checked) => setIncludePeriods(checked === true)}
              />
              <Label htmlFor="periods" className="flex items-center gap-2 cursor-pointer">
                <span className="w-3 h-3 rounded-full bg-gradient-primary"></span>
                Period Days
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="fertile" 
                checked={includeFertile}
                onCheckedChange={(checked) => setIncludeFertile(checked === true)}
              />
              <Label htmlFor="fertile" className="flex items-center gap-2 cursor-pointer">
                <span className="w-3 h-3 rounded-full bg-teal-500/50 border border-teal-500"></span>
                Fertile Window
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ovulation" 
                checked={includeOvulation}
                onCheckedChange={(checked) => setIncludeOvulation(checked === true)}
              />
              <Label htmlFor="ovulation" className="flex items-center gap-2 cursor-pointer">
                <span className="w-3 h-3 rounded-full bg-pink-500/50 border-2 border-pink-500"></span>
                Ovulation Day
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="months">Months ahead:</Label>
              <Select value={monthsAhead} onValueChange={setMonthsAhead}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Events Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Events Preview</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {events.length} events
            </Badge>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {events.slice(0, 10).map((event, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{event.title.split(' ')[0]}</span>
                  <div>
                    <p className="font-medium text-sm">{event.title.split(' ').slice(1).join(' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGoogleCalendarExport(event)}
                  className="text-primary hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {events.length > 10 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                +{events.length - 10} more events...
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Export Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleDownloadICS}
            disabled={isLoading || events.length === 0}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4 mr-2" />
            Download .ICS File
          </Button>

          <Button
            onClick={handleExportAllToGoogle}
            disabled={events.length === 0}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19.5 4H18V3a1 1 0 0 0-2 0v1H8V3a1 1 0 0 0-2 0v1H4.5A2.5 2.5 0 0 0 2 6.5v13A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 19.5 4zm1 15.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V10h17v9.5zm0-11H4.5V6.5a1 1 0 0 1 1-1H6v1a1 1 0 0 0 2 0V5.5h8V6a1 1 0 0 0 2 0V5.5h1.5a1 1 0 0 1 1 1V8.5z"/>
            </svg>
            Add to Google Calendar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: Download the .ICS file and import it to Google Calendar, Apple Calendar, Outlook, or any calendar app for multiple events at once.
        </p>
      </CardContent>
    </Card>
  );
};

export default CalendarIntegration;
