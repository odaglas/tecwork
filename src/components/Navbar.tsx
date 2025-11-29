import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import tecworkLogo from "@/assets/tecwork-logo.png";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={tecworkLogo} alt="TecWork Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold text-primary">TecWork</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#como-funciona" 
              onClick={(e) => handleSmoothScroll(e, 'como-funciona')}
              className="text-foreground hover:text-primary transition-fast font-medium cursor-pointer"
            >
              Cómo Funciona
            </a>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
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
              <a 
                href="#como-funciona" 
                onClick={(e) => handleSmoothScroll(e, 'como-funciona')}
                className="text-foreground hover:text-primary transition-fast font-medium cursor-pointer"
              >
                Cómo Funciona
              </a>
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
