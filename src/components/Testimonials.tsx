import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "María González",
    role: "Cliente - Las Condes",
    text: "Al fin encontré un eléctrico que llegó a la hora y solucionó todo en una visita. El sistema de pago seguro me dio mucha tranquilidad.",
    rating: 5,
  },
  {
    name: "Diego Polanco",
    role: "Técnico - Providencia",
    text: "TecWork me permitió encontrar clientes de forma constante. La plataforma es fácil de usar y el pago es seguro y puntual.",
    rating: 5,
  },
  {
    name: "Felipe Vidal",
    role: "Cliente - Ñuñoa",
    text: "Contraté un gasfíter para mi casa. La comunicación fue perfecta, el precio justo y el trabajo impecable. 100% recomendado.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Lo Que Dicen Nuestros Usuarios
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Miles de trabajos completados exitosamente
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-border/50 hover:shadow-lg transition-smooth bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Quote className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-success text-lg">★</span>
                    ))}
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.text}"
                </p>
                
                <div className="border-t border-border/50 pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
