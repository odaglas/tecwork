import { Shield, CreditCard, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const indicators = [
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

export const TrustIndicators = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            ¿Por qué elegirnos?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {indicators.map((indicator) => (
            <Card key={indicator.title} className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <indicator.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {indicator.title}
                </h3>
                <p className="text-muted-foreground">
                  {indicator.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
