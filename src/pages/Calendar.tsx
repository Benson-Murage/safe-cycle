import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import CalendarView from "@/components/CalendarView";
import CalendarIntegration from "@/components/CalendarIntegration";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Share2 } from "lucide-react";

const Calendar = () => {
  const [user, setUser] = useState<User | null>(null);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl mb-20">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Calendar
        </h1>
        
        <Tabs defaultValue="view" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="view" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              View
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Export & Sync
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="view">
            <CalendarView userId={user.id} />
          </TabsContent>
          
          <TabsContent value="export">
            <CalendarIntegration userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
      <Navigation />
    </div>
  );
};

export default Calendar;