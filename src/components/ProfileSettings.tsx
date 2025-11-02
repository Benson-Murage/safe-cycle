import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProfileSettingsProps {
  userId: string;
}

const ProfileSettings = ({ userId }: ProfileSettingsProps) => {
  const [username, setUsername] = useState("");
  const [avgCycle, setAvgCycle] = useState(28);
  const [avgPeriod, setAvgPeriod] = useState(5);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setUsername(data.username || "");
        setAvgCycle(data.average_cycle_length);
        setAvgPeriod(data.average_period_length);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        average_cycle_length: avgCycle,
        average_period_length: avgPeriod,
      })
      .eq("id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
    setLoading(false);
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avgCycle">Average Cycle Length (days)</Label>
          <Input
            id="avgCycle"
            type="number"
            value={avgCycle}
            onChange={(e) => setAvgCycle(Number(e.target.value))}
            min="20"
            max="45"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avgPeriod">Average Period Length (days)</Label>
          <Input
            id="avgPeriod"
            type="number"
            value={avgPeriod}
            onChange={(e) => setAvgPeriod(Number(e.target.value))}
            min="3"
            max="10"
            className="rounded-xl"
          />
        </div>
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;