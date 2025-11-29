import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const FinalCTA = () => {
  return (
    <section className="py-20 bg-gradient-primary text-white">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            ¿Listo para solucionar tu problema?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Únete a cientos de chilenos que confían en TecWork para sus reparaciones del hogar.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-12 py-6 bg-success hover:bg-success/90 text-white"
            asChild
          >
            <Link to="/registro-cliente">Empezar Ahora</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
