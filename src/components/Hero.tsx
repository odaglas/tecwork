import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80 z-10" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="container relative z-20 px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-8 w-8" />
            <span className="text-lg font-semibold">100% Certificados y Validados</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Conectamos tu Hogar con los Mejores Técnicos de Chile
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
            Encuentra profesionales certificados y confiables para cualquier trabajo en tu hogar. 
            Rápido, seguro y garantizado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button size="lg" variant="success" className="text-lg px-8 py-6">
              Buscar Técnico Ahora
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Registrarse como Técnico
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Verificación en 24 horas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Garantía de servicio</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Atención inmediata</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
