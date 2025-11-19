import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import tecworkLogo from "@/assets/tecwork-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={tecworkLogo} alt="TecWork Logo" className="w-10 h-10" />
              <span className="text-2xl font-bold">TecWork</span>
            </div>
            <p className="text-background/70">
              Conectando hogares chilenos con técnicos certificados y confiables.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Servicios</h3>
            <ul className="space-y-2 text-background/70">
              <li><a href="#" className="hover:text-success transition-fast">Plomería</a></li>
              <li><a href="#" className="hover:text-success transition-fast">Electricidad</a></li>
              <li><a href="#" className="hover:text-success transition-fast">Climatización</a></li>
              <li><a href="#" className="hover:text-success transition-fast">Pintura</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Empresa</h3>
            <ul className="space-y-2 text-background/70">
              <li><Link to="/sobre-nosotros" className="hover:text-success transition-fast">Sobre Nosotros</Link></li>
              <li><a href="#" className="hover:text-success transition-fast">Blog</a></li>
              <li><a href="#" className="hover:text-success transition-fast">Trabaja con Nosotros</a></li>
              <li><Link to="/terminos-condiciones" className="hover:text-success transition-fast">Términos y Condiciones</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-2 text-background/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contacto@tecwork.cl</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+56 9 1234 5678</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Santiago, Chile</span>
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-success transition-fast">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-success transition-fast">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-success transition-fast">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-background/20 pt-8 text-center text-background/70">
          <p>&copy; 2025 TecWork. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
