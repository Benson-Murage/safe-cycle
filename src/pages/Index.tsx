import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, TrendingUp, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-primary p-6 rounded-full shadow-glow animate-scale-in">
                <Heart className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
              Your Cycle, Your Power
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
              Track your menstrual cycle, understand your body, and take control of your health
              with beautiful insights and predictions.
            </p>
            <div className="flex gap-4 justify-center animate-fade-in">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6 rounded-2xl bg-gradient-card shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Smart Tracking</h3>
            <p className="text-muted-foreground">
              Log your periods, symptoms, and moods with an intuitive calendar interface
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl bg-gradient-card shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="flex justify-center">
              <div className="bg-secondary/10 p-4 rounded-full">
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Predictive Insights</h3>
            <p className="text-muted-foreground">
              Get accurate predictions for your next period, fertile window, and ovulation
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl bg-gradient-card shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-105">
            <div className="flex justify-center">
              <div className="bg-accent/10 p-4 rounded-full">
                <Shield className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Private & Secure</h3>
            <p className="text-muted-foreground">
              Your health data is encrypted and secure, with complete privacy control
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6 p-12 rounded-3xl gradient-animated shadow-glow">
          <h2 className="text-4xl font-bold text-white">
            Ready to take control of your cycle?
          </h2>
          <p className="text-xl text-white/90">
            Join thousands of users who trust our app for their period tracking needs
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="shadow-soft hover:shadow-glow"
          >
            Start Tracking Today
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
