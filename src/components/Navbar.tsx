import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/inicio" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-primary">TecWork</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="/#servicios" className="text-foreground hover:text-primary transition-fast font-medium">
              Servicios
            </a>
            <a href="/#como-funciona" className="text-foreground hover:text-primary transition-fast font-medium">
              Cómo Funciona
            </a>
            <a href="/#seguridad" className="text-foreground hover:text-primary transition-fast font-medium">
              Seguridad
            </a>
            <a href="/cliente" className="text-foreground hover:text-primary transition-fast font-medium">
              Portal Cliente
            </a>
            <a href="/dashboard-tecnico" className="text-foreground hover:text-primary transition-fast font-medium">
              Portal Técnico
            </a>
            <Button variant="outline" size="sm">
              Iniciar Sesión
            </Button>
            <Button variant="success" size="sm">
              Registrarse
            </Button>
          </div>
          
          <button 
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-6 w-6 text-foreground" />
          </button>
        </div>
        
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="/#servicios" className="text-foreground hover:text-primary transition-fast font-medium">
                Servicios
              </a>
              <a href="/#como-funciona" className="text-foreground hover:text-primary transition-fast font-medium">
                Cómo Funciona
              </a>
              <a href="/#seguridad" className="text-foreground hover:text-primary transition-fast font-medium">
                Seguridad
              </a>
              <a href="/cliente" className="text-foreground hover:text-primary transition-fast font-medium">
                Portal Cliente
              </a>
              <a href="/dashboard-tecnico" className="text-foreground hover:text-primary transition-fast font-medium">
                Portal Técnico
              </a>
              <Button variant="outline" size="sm" className="w-full">
                Iniciar Sesión
              </Button>
              <Button variant="success" size="sm" className="w-full">
                Registrarse
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
