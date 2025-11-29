import { FileText, Users, CreditCard, Star } from "lucide-react";

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Publica tu Problema",
    description: "Describe lo que necesitas reparar (gratis).",
  },
  {
    icon: Users,
    number: "02",
    title: "Recibe Cotizaciones",
    description: "Expertos verificados te envían sus presupuestos.",
  },
  {
    icon: CreditCard,
    number: "03",
    title: "Elige y Paga",
    description: "Selecciona al técnico y paga con seguridad (Escrow).",
  },
  {
    icon: Star,
    number: "04",
    title: "Califica el Servicio",
    description: "Tu opinión ayuda a mantener la calidad de la plataforma.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 bg-background scroll-mt-16">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            ¿Cómo Funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tres simples pasos para encontrar al técnico perfecto
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                  <div className="relative w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-xl">
                    <step.icon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-success rounded-full flex items-center justify-center text-success-foreground font-bold shadow-md">
                    {step.number}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
