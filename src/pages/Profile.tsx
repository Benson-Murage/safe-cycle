import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import ProfileSettings from "@/components/ProfileSettings";
import ShareApp from "@/components/ShareApp";
import { Button } from "@/components/ui/button";
import { MessageSquareHeart, Download, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Profile
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
        <div className="space-y-6">
          <ProfileSettings userId={user.id} />
          <ShareApp />
          <div className="flex gap-3">
            <Button 
              variant="soft" 
              className="flex-1"
              onClick={() => navigate("/testimonials")}
            >
              <MessageSquareHeart className="h-4 w-4 mr-2" />
              Testimonials
            </Button>
            <Button 
              variant="soft" 
              className="flex-1"
              onClick={() => navigate("/install")}
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default Profile;