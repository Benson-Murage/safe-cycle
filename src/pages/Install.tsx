import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check } from "lucide-react";
import Navigation from "@/components/Navigation";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card className="bg-gradient-card shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-primary" />
                Install Luna App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isInstalled ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">App Already Installed!</h3>
                  <p className="text-muted-foreground">
                    Luna is installed on your device. You can find it on your home screen.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Works Offline</h4>
                        <p className="text-sm text-muted-foreground">
                          Track your cycle even without internet connection
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Fast & Reliable</h4>
                        <p className="text-sm text-muted-foreground">
                          Instant access from your home screen
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">App-like Experience</h4>
                        <p className="text-sm text-muted-foreground">
                          Full-screen experience without browser UI
                        </p>
                      </div>
                    </div>
                  </div>

                  {deferredPrompt ? (
                    <Button onClick={handleInstallClick} className="w-full" size="lg">
                      <Download className="h-5 w-5 mr-2" />
                      Install App
                    </Button>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">How to Install:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li><strong>iPhone:</strong> Tap Share → Add to Home Screen</li>
                        <li><strong>Android:</strong> Tap menu (⋮) → Install app or Add to Home screen</li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default Install;
