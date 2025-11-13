import { Bell, User } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const ClientHeader = () => {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/cliente/home" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-primary">TecWork</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-6 w-6 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full"></span>
            </Button>

            {/* User Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-6 w-6 text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                <DropdownMenuItem asChild>
                  <Link to="/cliente/perfil" className="cursor-pointer">
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
