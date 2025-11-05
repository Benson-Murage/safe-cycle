import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-6 px-4 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Created with</span>
            <Heart className="h-4 w-4 text-primary fill-primary animate-pulse" />
            <span>by</span>
            <span className="font-semibold bg-gradient-primary bg-clip-text text-transparent">
              Benson M. Maina
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
