import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative bg-primary text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80 z-10" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="container relative z-20 px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-8 w-8" />
            <span className="text-lg font-semibold">100% Validados</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Contrata servicios técnicos con confianza y seguridad
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            La única plataforma en Chile con técnicos 100% validados y pago protegido.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90" asChild>
              <Link to="/registro-cliente">Busco un Técnico</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/registro-tecnico">Quiero trabajar</Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Pago protegido con Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Técnicos verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Calificaciones reales</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
