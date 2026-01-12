import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

interface FertilityLoggingProps {
  userId: string;
}

interface BBTLog {
  id: string;
  date: string;
  temperature: number;
  time_taken: string | null;
  notes: string | null;
}

interface CervicalMucusLog {
  id: string;
  date: string;
  type: string;
  amount: string | null;
  notes: string | null;
}

const mucusTypes = [
  { value: "dry", label: "Dry", description: "No mucus present", fertility: "low" },
  { value: "sticky", label: "Sticky", description: "Thick, tacky texture", fertility: "low" },
  { value: "creamy", label: "Creamy", description: "White, lotion-like", fertility: "medium" },
  { value: "watery", label: "Watery", description: "Clear, wet", fertility: "high" },
  { value: "egg_white", label: "Egg White", description: "Stretchy, clear", fertility: "peak" },
];

const FertilityLogging = ({ userId }: FertilityLoggingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bbtLogs, setBbtLogs] = useState<BBTLog[]>([]);
  const [mucusLogs, setMucusLogs] = useState<CervicalMucusLog[]>([]);
  
  // BBT form state
  const [bbtTemp, setBbtTemp] = useState("");
  const [bbtTime, setBbtTime] = useState("");
  const [bbtNotes, setBbtNotes] = useState("");
  const [bbtDate, setBbtDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  // Mucus form state
  const [mucusType, setMucusType] = useState("");
  const [mucusAmount, setMucusAmount] = useState("");
  const [mucusNotes, setMucusNotes] = useState("");
  const [mucusDate, setMucusDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const fetchLogs = async () => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    
    const [bbtResult, mucusResult] = await Promise.all([
      supabase
        .from("bbt_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: false }),
      supabase
        .from("cervical_mucus_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: false }),
    ]);

    if (bbtResult.data) setBbtLogs(bbtResult.data);
    if (mucusResult.data) setMucusLogs(mucusResult.data);
  };

  const handleLogBBT = async () => {
    if (!bbtTemp) {
      toast.error("Please enter a temperature");
      return;
    }

    const temp = parseFloat(bbtTemp);
    if (isNaN(temp) || temp < 95 || temp > 105) {
      toast.error("Please enter a valid temperature (95-105°F)");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("bbt_logs").upsert({
        user_id: userId,
        date: bbtDate,
        temperature: temp,
        time_taken: bbtTime || null,
        notes: bbtNotes || null,
      }, { onConflict: "user_id,date" });

      if (error) throw error;

      toast.success("BBT logged successfully!");
      setBbtTemp("");
      setBbtTime("");
      setBbtNotes("");
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Failed to log BBT");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMucus = async () => {
    if (!mucusType) {
      toast.error("Please select a mucus type");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("cervical_mucus_logs").upsert({
        user_id: userId,
        date: mucusDate,
        type: mucusType,
        amount: mucusAmount || null,
        notes: mucusNotes || null,
      }, { onConflict: "user_id,date" });

      if (error) throw error;

      toast.success("Cervical mucus logged successfully!");
      setMucusType("");
      setMucusAmount("");
      setMucusNotes("");
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Failed to log cervical mucus");
    } finally {
      setIsLoading(false);
    }
  };

  const getFertilityBadge = (type: string) => {
    const mucus = mucusTypes.find(m => m.value === type);
    if (!mucus) return null;
    
    const colors = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-teal-100 text-teal-700",
      peak: "bg-pink-100 text-pink-700",
    };
    
    return (
      <Badge className={colors[mucus.fertility as keyof typeof colors]}>
        {mucus.fertility === "peak" ? "🌟 Peak" : mucus.fertility}
      </Badge>
    );
  };

  return (
    <Card className="bg-gradient-card shadow-colorful border-border/50 overflow-hidden">
      <CardHeader className="bg-gradient-vibrant text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Fertility Tracking</CardTitle>
            <CardDescription className="text-white/80">
              Log BBT & cervical mucus for accurate ovulation prediction
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="bbt" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="bbt" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              BBT
            </TabsTrigger>
            <TabsTrigger value="mucus" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Cervical Mucus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bbt" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bbt-date">Date</Label>
                <Input
                  id="bbt-date"
                  type="date"
                  value={bbtDate}
                  onChange={(e) => setBbtDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bbt-temp">Temperature (°F)</Label>
                <Input
                  id="bbt-temp"
                  type="number"
                  step="0.01"
                  placeholder="97.5"
                  value={bbtTemp}
                  onChange={(e) => setBbtTemp(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bbt-time">Time Taken</Label>
              <Input
                id="bbt-time"
                type="time"
                value={bbtTime}
                onChange={(e) => setBbtTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bbt-notes">Notes (optional)</Label>
              <Textarea
                id="bbt-notes"
                placeholder="Any factors that might affect your reading..."
                value={bbtNotes}
                onChange={(e) => setBbtNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleLogBBT}
              disabled={isLoading}
              className="w-full bg-gradient-primary"
            >
              <Thermometer className="h-4 w-4 mr-2" />
              Log Temperature
            </Button>

            {/* Recent BBT Logs */}
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">Recent Logs</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {bbtLogs.slice(0, 7).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{format(new Date(log.date), "MMM d")}</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {log.temperature}°F
                    </Badge>
                  </div>
                ))}
                {bbtLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No BBT logs yet. Start tracking for better predictions!
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mucus" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mucus-date">Date</Label>
              <Input
                id="mucus-date"
                type="date"
                value={mucusDate}
                onChange={(e) => setMucusDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mucus Type</Label>
              <div className="grid grid-cols-1 gap-2">
                {mucusTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMucusType(type.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      mucusType === type.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                      {getFertilityBadge(type.value)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mucus-amount">Amount</Label>
              <Select value={mucusAmount} onValueChange={setMucusAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mucus-notes">Notes (optional)</Label>
              <Textarea
                id="mucus-notes"
                placeholder="Any additional observations..."
                value={mucusNotes}
                onChange={(e) => setMucusNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleLogMucus}
              disabled={isLoading}
              className="w-full bg-gradient-primary"
            >
              <Droplets className="h-4 w-4 mr-2" />
              Log Cervical Mucus
            </Button>

            {/* Recent Mucus Logs */}
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">Recent Logs</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mucusLogs.slice(0, 7).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{format(new Date(log.date), "MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm capitalize">{log.type.replace("_", " ")}</span>
                      {getFertilityBadge(log.type)}
                    </div>
                  </div>
                ))}
                {mucusLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No cervical mucus logs yet. Start tracking for better predictions!
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FertilityLogging;
