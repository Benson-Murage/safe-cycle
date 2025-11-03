import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import Navigation from "@/components/Navigation";

const testimonials = [
  {
    name: "Sarah M.",
    avatar: "S",
    rating: 5,
    text: "This app changed my life! I finally understand my cycle and can plan ahead with confidence.",
    date: "2 weeks ago",
  },
  {
    name: "Emily R.",
    avatar: "E",
    rating: 5,
    text: "Beautiful design and so easy to use. The fertility tracking is incredibly accurate!",
    date: "1 month ago",
  },
  {
    name: "Jessica L.",
    avatar: "J",
    rating: 5,
    text: "Love the daily quotes and mood tracking. It's like having a personal health companion.",
    date: "3 weeks ago",
  },
  {
    name: "Maria K.",
    avatar: "M",
    rating: 5,
    text: "Best period tracker I've ever used. The predictions are spot on and the interface is gorgeous.",
    date: "1 week ago",
  },
  {
    name: "Anna P.",
    avatar: "A",
    rating: 5,
    text: "Finally, a tracker that respects my privacy and gives me insights I can actually use!",
    date: "2 months ago",
  },
];

const Testimonials = () => {
  return (
    <div className="min-h-screen bg-gradient-soft pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">What Our Users Say</h1>
          <p className="text-muted-foreground">Real stories from women who trust Luna</p>
        </div>

        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gradient-card shadow-soft border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{testimonial.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default Testimonials;
