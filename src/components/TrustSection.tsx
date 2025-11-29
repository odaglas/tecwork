import { Card, CardContent } from "@/components/ui/card";
import { Shield, CreditCard, Star } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Validación Real",
    description: "Verificamos identidad y antecedentes de cada técnico.",
  },
  {
    icon: CreditCard,
    title: "Pago Seguro",
    description: "Tu dinero se libera solo cuando el trabajo está terminado (Escrow).",
  },
  {
    icon: Star,
    title: "Calidad Garantizada",
    description: "Sistema de reputación real y transparente.",
  },
];

export const TrustSection = () => {
  return (
    <section id="seguridad" className="py-20 bg-primary text-primary-foreground scroll-mt-16">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tu Seguridad es Nuestra Prioridad
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Trabajamos solo con profesionales certificados y verificados
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur-sm hover:bg-primary-foreground/20 transition-smooth">
              <CardContent className="p-6 text-center">
                <div className="inline-flex p-4 rounded-full bg-success/20 mb-4">
                  <feature.icon className="h-8 w-8 text-success-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary-foreground">
                  {feature.title}
                </h3>
                <p className="text-primary-foreground/80">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
