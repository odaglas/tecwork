import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "cliente" | "tecnico" | "admin";
  allowUnvalidated?: boolean; // Allow non-validated tecnicos for certain pages
}

export const ProtectedRoute = ({ children, allowedRole, allowUnvalidated = false }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(true);
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

        // Fetch all user roles
        const { data: rolesData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error || !rolesData || rolesData.length === 0) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        const roles = rolesData.map(r => r.role);
        setUserRoles(roles);

        // Check if user has the required role
        const hasRequiredRole = roles.includes(allowedRole);

        // For tecnicos, check validation status (unless allowUnvalidated is true)
        if (hasRequiredRole && allowedRole === "tecnico" && !allowUnvalidated) {
          const { data: tecnicoData } = await supabase
            .from("tecnico_profile")
            .select("is_validated")
            .eq("user_id", user.id)
            .single();

          if (tecnicoData && !tecnicoData.is_validated) {
            setIsValidated(false);
            setHasAccess(false);
            setIsLoading(false);
            return;
          }
        }

        setHasAccess(hasRequiredRole);
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
    if (!isLoading && !hasAccess && userRoles.length > 0) {
      if (!isValidated) {
        toast({
          title: "Cuenta pendiente de validación",
          description: "Tu cuenta de técnico está siendo revisada por un administrador. Te notificaremos cuando esté aprobada.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta página",
          variant: "destructive",
        });
      }
    }
  }, [isLoading, hasAccess, userRoles, isValidated, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    // For admin routes, redirect to admin login if not authenticated
    if (allowedRole === "admin") {
      return <Navigate to="/admin/login" replace />;
    }

    // If tecnico is not validated, redirect to a waiting page
    if (!isValidated && allowedRole === "tecnico") {
      return <Navigate to="/tecnico/dashboard" replace />;
    }

    // Redirect based on user's first role
    if (userRoles.includes("cliente")) {
      return <Navigate to="/cliente/home" replace />;
    } else if (userRoles.includes("tecnico")) {
      return <Navigate to="/tecnico/dashboard" replace />;
    } else if (userRoles.includes("admin")) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // No role found, redirect to login
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
