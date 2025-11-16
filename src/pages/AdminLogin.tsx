import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        
        if (isAdmin) {
          navigate("/admin/dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the admin-login edge function
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { email, password }
      });

      if (error) {
        console.error("Admin login error:", error);
        toast.error(error.message || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      // Set the session using the token from the edge function
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: data.token // Using access token as refresh token for admin sessions
      });

      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Error al establecer la sesión");
        setLoading(false);
        return;
      }

      // Success - user is authenticated and verified as admin
      toast.success("Bienvenido, Administrador");
      navigate("/admin/dashboard");
      
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al iniciar sesión como administrador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <Link to="/" className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">TecWork</h1>
          </Link>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Portal Administrativo</h2>
            <p className="text-sm text-muted-foreground mt-1">Acceso exclusivo para administradores</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-xl shadow-md border border-border">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@tecwork.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Verificando credenciales..." : "Iniciar sesión como Administrador"}
          </Button>
        </form>

        {/* Back to Main */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-primary transition-smooth"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
