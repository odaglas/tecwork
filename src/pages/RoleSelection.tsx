import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-4xl">T</span>
          </div>
          <h2 className="text-3xl font-bold text-primary">TecWork</h2>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          ¿Cómo quieres ingresar?
        </h1>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <Button 
            className="w-full h-14 text-lg"
            size="lg"
            onClick={() => navigate("/login-cliente")}
          >
            Soy Cliente
          </Button>
          
          <Button 
            variant="outline"
            className="w-full h-14 text-lg"
            size="lg"
            onClick={() => navigate("/login-tecnico")}
          >
            Soy Técnico
          </Button>
        </div>

        {/* Optional Footer Link */}
        <div className="pt-8">
          <button 
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-primary transition-smooth underline"
          >
            Conocer más sobre TecWork
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
