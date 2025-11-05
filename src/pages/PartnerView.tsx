import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PeriodCountdown from "@/components/PeriodCountdown";
import CycleSummary from "@/components/CycleSummary";
import FertilityInfo from "@/components/FertilityInfo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { calculateFertility, FertilityData } from "@/utils/fertility";

interface PartnerShare {
  id: string;
  user_id: string;
  profiles?: {
    username: string;
  };
}

const PartnerView = () => {
  const [user, setUser] = useState<User | null>(null);
  const [partnerShares, setPartnerShares] = useState<PartnerShare[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [fertilityData, setFertilityData] = useState<FertilityData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchPartnerShares();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPartnerFertilityData();
    }
  }, [selectedPartnerId]);

  const fetchPartnerShares = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("partner_shares")
      .select("id, user_id")
      .eq("partner_user_id", user.id)
      .eq("status", "accepted");

    if (error) {
      console.error("Error fetching partner shares:", error);
      return;
    }

    if (data && data.length > 0) {
      // Fetch usernames separately
      const sharesWithProfiles = await Promise.all(
        data.map(async (share) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", share.user_id)
            .single();
          
          return {
            ...share,
            profiles: profile || { username: "Partner" }
          };
        })
      );

      setPartnerShares(sharesWithProfiles as PartnerShare[]);
      setSelectedPartnerId(data[0].user_id);
    } else {
      setPartnerShares([]);
    }
  };

  const fetchPartnerFertilityData = async () => {
    if (!selectedPartnerId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("last_period_date, average_cycle_length")
      .eq("id", selectedPartnerId)
      .single();

    if (profile) {
      const fertility = calculateFertility(
        profile.last_period_date,
        profile.average_cycle_length
      );
      setFertilityData(fertility);
    }
  };

  if (!user) {
    return null;
  }

  if (partnerShares.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-soft pb-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl mb-20">
          <Card className="shadow-colorful">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg gradient-vibrant">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Partner View</CardTitle>
                  <CardDescription>
                    View cycle information shared with you
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                You don't have any active partner shares yet.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Ask your partner to send you an invitation to view their cycle information.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl mb-20">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg gradient-vibrant">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Partner View
            </h1>
          </div>

          {partnerShares.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {partnerShares.map((share) => (
                <Badge
                  key={share.id}
                  variant={selectedPartnerId === share.user_id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedPartnerId(share.user_id)}
                >
                  {share.profiles?.username || "Partner"}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {selectedPartnerId && (
          <div className="space-y-6">
            <PeriodCountdown userId={selectedPartnerId} />
            {fertilityData && <FertilityInfo fertilityData={fertilityData} />}
            <CycleSummary userId={selectedPartnerId} />
          </div>
        )}
      </div>
      <Footer />
      <Navigation />
    </div>
  );
};

export default PartnerView;
