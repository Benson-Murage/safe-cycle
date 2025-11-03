import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ShareApp = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const shareUrl = window.location.origin;
  const shareText = "Check out Luna - the best period tracker app! Track your cycle, understand your body, and stay healthy. 🌸";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Luna - Period Tracker",
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link",
      });
    }
  };

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Share with Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Help your friends take control of their cycle health. Share Luna and empower women everywhere!
        </p>
        <div className="flex gap-2">
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share App
          </Button>
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareApp;
