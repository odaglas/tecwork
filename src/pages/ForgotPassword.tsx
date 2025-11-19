import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import tecworkLogo from "@/assets/tecwork-logo.png";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Siempre mostrar éxito por seguridad (no revelar si el email existe)
      setEmailSent(true);
      toast({
        title: "Correo enviado",
        description: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Link to="/" className="flex flex-col items-center gap-2">
              <img src={tecworkLogo} alt="TecWork Logo" className="w-16 h-16" />
              <h2 className="text-2xl font-bold text-primary">TecWork</h2>
            </Link>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Revisa tu correo
            </h1>
            <p className="text-muted-foreground">
              Si el correo está registrado en nuestro sistema, recibirás un enlace para restablecer tu contraseña. El enlace es válido por 60 minutos.
            </p>
          </div>

          <Button onClick={() => navigate(-1)} className="w-full" size="lg">
            Volver al login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <Link to="/" className="flex flex-col items-center gap-2">
            <img src={tecworkLogo} alt="TecWork Logo" className="w-16 h-16" />
            <h2 className="text-2xl font-bold text-primary">TecWork</h2>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-muted-foreground mt-2">
            Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Enviando..." : "Enviar instrucciones"}
          </Button>

          <div className="text-center">
            <Link to="/login-cliente" className="text-sm text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
