import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { formatRut, cleanRut, validateRut } from "@/lib/utils";
import tecworkLogo from "@/assets/tecwork-logo.png";
import { ArrowLeft } from "lucide-react";
import { TermsCheckbox } from "@/components/TermsCheckbox";

const clientRegisterSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  rut: z.string().refine((val) => validateRut(val), {
    message: "RUT inválido"
  }),
  telefono: z.string().min(9, { message: "Teléfono inválido" }),
  direccion: z.string().min(5, { message: "Dirección inválida" }),
  comuna: z.string().min(1, { message: "Debe seleccionar una comuna" }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos y condiciones"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const ClientRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    rut: "",
    telefono: "",
    direccion: "",
    comuna: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState<string>("");
  const [rutError, setRutError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      setTermsError("");
      // Validate form data
      const validatedData = clientRegisterSchema.parse({ ...formData, acceptTerms });

      // Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/cliente/home`,
          data: {
            nombre: validatedData.nombre,
            rut: cleanRut(validatedData.rut),
            telefono: validatedData.telefono,
            role: "cliente", // Role assigned securely via database trigger
          },
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario. Por favor intenta nuevamente.");
      }

      console.log("Usuario creado exitosamente:", authData.user.id);

      // Create profile - using the authenticated session
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: validatedData.email,
          nombre: validatedData.nombre,
          rut: cleanRut(validatedData.rut),
          telefono: validatedData.telefono,
        });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      console.log("Perfil creado exitosamente");

      // Create cliente profile
      const { error: clienteError } = await supabase
        .from("cliente_profile")
        .insert({
          user_id: authData.user.id,
          direccion: validatedData.direccion,
          comuna: validatedData.comuna,
        });

      if (clienteError) {
        console.error("Cliente profile error:", clienteError);
        throw clienteError;
      }

      console.log("Cliente perfil creado exitosamente");

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada correctamente.",
      });

      navigate("/cliente/home");
    } catch (error: any) {
      console.error("Error en registro:", error);
      
      // Handle zod validation errors for terms
      if (error.errors) {
        const termsError = error.errors.find((e: any) => e.path?.includes("acceptTerms"));
        if (termsError) {
          setTermsError(termsError.message);
          setLoading(false);
          return;
        }
      }
      
      let errorMessage = error.message || "Por favor verifica tus datos e intenta nuevamente.";
      
      // Provide more specific error messages
      if (error.message?.includes("duplicate key")) {
        errorMessage = "Este correo electrónico ya está registrado. Por favor inicia sesión.";
      } else if (error.message?.includes("email_not_confirmed")) {
        errorMessage = "Por favor confirma tu correo electrónico antes de iniciar sesión.";
      } else if (error.code === "over_email_send_rate_limit") {
        errorMessage = "Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.";
      }
      
      toast({
        title: "Error al registrar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

        <div className="flex flex-col items-center gap-4">
          <Link to="/" className="flex flex-col items-center gap-2">
            <img src={tecworkLogo} alt="TecWork Logo" className="w-16 h-16" />
            <h2 className="text-2xl font-bold text-primary">TecWork</h2>
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Registro de Cliente
          </h1>
          <p className="text-muted-foreground mt-2">
            Crea tu cuenta para solicitar servicios
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Juan Pérez"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rut">RUT</Label>
            <Input
              id="rut"
              type="text"
              placeholder="11.111.111-1"
              value={formData.rut}
              onChange={(e) => {
                const formatted = formatRut(e.target.value);
                setFormData({ ...formData, rut: formatted });
                if (formatted.length >= 11) {
                  if (!validateRut(formatted)) {
                    setRutError("RUT inválido");
                  } else {
                    setRutError("");
                  }
                } else {
                  setRutError("");
                }
              }}
              onBlur={() => {
                if (formData.rut && !validateRut(formData.rut)) {
                  setRutError("RUT inválido");
                } else {
                  setRutError("");
                }
              }}
              required
              className={rutError ? "border-destructive" : ""}
            />
            {rutError && (
              <p className="text-sm text-destructive">{rutError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@correo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="+56912345678"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              type="text"
              placeholder="Av. Principal 123"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comuna">Comuna</Label>
            <Select value={formData.comuna} onValueChange={(value) => setFormData({ ...formData, comuna: value })} required>
              <SelectTrigger id="comuna">
                <SelectValue placeholder="Selecciona tu comuna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="santiago">Santiago</SelectItem>
                <SelectItem value="providencia">Providencia</SelectItem>
                <SelectItem value="las-condes">Las Condes</SelectItem>
                <SelectItem value="vitacura">Vitacura</SelectItem>
                <SelectItem value="maipu">Maipú</SelectItem>
                <SelectItem value="la-florida">La Florida</SelectItem>
                <SelectItem value="puente-alto">Puente Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <TermsCheckbox
            checked={acceptTerms}
            onCheckedChange={(checked) => {
              setAcceptTerms(checked);
              if (checked) setTermsError("");
            }}
            error={termsError}
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Registrando..." : "Crear Cuenta"}
          </Button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login-cliente" className="text-primary hover:underline font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientRegister;
