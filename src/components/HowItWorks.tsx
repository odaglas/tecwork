import { Search, UserCheck, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Busca el Servicio",
    description: "Selecciona el tipo de técnico que necesitas y describe tu problema",
  },
  {
    icon: UserCheck,
    number: "02",
    title: "Elige tu Técnico",
    description: "Revisa perfiles verificados, calificaciones y precios",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "¡Listo!",
    description: "Coordina la visita y recibe un servicio profesional garantizado",
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
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
