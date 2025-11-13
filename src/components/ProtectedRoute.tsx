import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "cliente" | "tecnico" | "admin";
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error || !roleData) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        setUserRole(roleData.role);
        setHasAccess(roleData.role === allowedRole);
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [allowedRole]);

  useEffect(() => {
    if (!isLoading && !hasAccess && userRole) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta página",
        variant: "destructive",
      });
    }
  }, [isLoading, hasAccess, userRole, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    // Redirect based on user's actual role
    if (userRole === "cliente") {
      return <Navigate to="/cliente/home" replace />;
    } else if (userRole === "tecnico") {
      return <Navigate to="/tecnico/dashboard" replace />;
    } else if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }
    // No role found, redirect to login
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
