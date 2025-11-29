import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "María González",
    role: "Cliente",
    text: "Al fin encontré un eléctrico que llegó a la hora y dejó todo impecable. El pago protegido me dio confianza total.",
  },
  {
    name: "Pedro Ramírez",
    role: "Técnico",
    text: "Como técnico, TecWork me ayudó a conseguir más clientes. La validación me distingue de la competencia.",
  },
  {
    name: "Carolina Silva",
    role: "Cliente",
    text: "Contraté un gasfiter y todo el proceso fue transparente. Ver las calificaciones reales marca la diferencia.",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Lo que dicen nuestros usuarios
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="relative">
              <CardContent className="pt-8 pb-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="mt-4">
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
