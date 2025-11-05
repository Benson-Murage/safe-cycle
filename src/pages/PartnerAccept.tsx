import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Loader2, CheckCircle, XCircle } from "lucide-react";

const PartnerAccept = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const shareCode = searchParams.get("code");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && shareCode) {
      fetchShareInfo();
    }
  }, [user, shareCode]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);

    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to accept the invitation.",
      });
      navigate(`/auth?redirect=/partner-accept?code=${shareCode}`);
    }
  };

  const fetchShareInfo = async () => {
    if (!shareCode) {
      setError("Invalid invitation link");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("partner_shares")
      .select("*")
      .eq("share_code", shareCode)
      .maybeSingle();

    if (fetchError || !data) {
      setError("Invitation not found or has expired");
      return;
    }

    if (data.status === "accepted") {
      setError("This invitation has already been accepted");
      return;
    }

    if (data.status === "revoked") {
      setError("This invitation has been revoked");
      return;
    }

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      setError("This invitation has expired");
      return;
    }

    // Fetch partner username
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user_id)
      .maybeSingle();

    setShareInfo({
      ...data,
      profiles: profile || { username: data.partner_email }
    });
  };

  const acceptInvitation = async () => {
    if (!shareCode || !user) return;

    setAccepting(true);
    try {
      const { error: updateError } = await supabase
        .from("partner_shares")
        .update({
          partner_user_id: user.id,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("share_code", shareCode);

      if (updateError) throw updateError;

      toast({
        title: "Invitation Accepted!",
        description: "You can now view your partner's cycle information.",
      });

      navigate("/partner-view");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-colorful">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg gradient-vibrant">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Partner Invitation</CardTitle>
          </div>
          <CardDescription>
            Accept this invitation to view your partner's cycle information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate("/dashboard")} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          ) : shareInfo ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">Invitation from:</p>
                <p className="font-semibold">
                  {shareInfo.profiles?.username || shareInfo.partner_email}
                </p>
                <div className="pt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>View cycle predictions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>View symptoms and moods</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>View health insights</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={acceptInvitation}
                disabled={accepting}
                className="w-full gradient-animated"
                size="lg"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>

              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full"
              >
                Decline
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerAccept;
