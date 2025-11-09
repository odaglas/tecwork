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
import { Textarea } from "@/components/ui/textarea";

const technicianRegisterSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  rut: z.string().min(8, { message: "RUT inválido" }),
  telefono: z.string().min(9, { message: "Teléfono inválido" }),
  especialidad_principal: z.string().min(1, { message: "Debe seleccionar una especialidad" }),
  descripcion_perfil: z.string().optional(),
});

const TechnicianRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    rut: "",
    telefono: "",
    especialidad_principal: "",
    descripcion_perfil: "",
  });
  const [selectedComunas, setSelectedComunas] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = technicianRegisterSchema.parse(formData);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard-tecnico`,
          data: {
            nombre: validatedData.nombre,
            rut: validatedData.rut,
            telefono: validatedData.telefono,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: validatedData.email,
            nombre: validatedData.nombre,
            rut: validatedData.rut,
            telefono: validatedData.telefono,
          });

        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "tecnico",
          });

        if (roleError) throw roleError;

        const { error: tecnicoError } = await supabase
          .from("tecnico_profile")
          .insert({
            user_id: authData.user.id,
            especialidad_principal: validatedData.especialidad_principal,
            comunas_cobertura: selectedComunas,
            descripcion_perfil: validatedData.descripcion_perfil || null,
            is_validated: false,
          });

        if (tecnicoError) throw tecnicoError;

        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta de técnico ha sido creada. Pendiente de validación.",
        });

        navigate("/dashboard-tecnico");
      }
    } catch (error: any) {
      console.error("Error en registro:", error);
      toast({
        title: "Error al registrar",
        description: error.message || "Por favor verifica tus datos e intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 my-8">
        <div className="flex flex-col items-center gap-4">
          <Link to="/inicio" className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-3xl">T</span>
            </div>
            <h2 className="text-2xl font-bold text-primary">TecWork</h2>
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Registro de Técnico
          </h1>
          <p className="text-muted-foreground mt-2">
            Crea tu cuenta para ofrecer servicios
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Felipe Vidal"
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
              placeholder="12345678-9"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tecnico@correo.com"
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
            <Label htmlFor="especialidad">Especialidad Principal</Label>
            <Select 
              value={formData.especialidad_principal} 
              onValueChange={(value) => setFormData({ ...formData, especialidad_principal: value })} 
              required
            >
              <SelectTrigger id="especialidad">
                <SelectValue placeholder="Selecciona tu especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gasfitería">Gasfitería</SelectItem>
                <SelectItem value="Electricidad">Electricidad</SelectItem>
                <SelectItem value="Reparaciones">Reparaciones</SelectItem>
                <SelectItem value="Carpintería">Carpintería</SelectItem>
                <SelectItem value="Pintura">Pintura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción del Perfil (Opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Cuéntanos sobre tu experiencia y servicios..."
              value={formData.descripcion_perfil}
              onChange={(e) => setFormData({ ...formData, descripcion_perfil: e.target.value })}
              className="min-h-[100px]"
            />
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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Registrando..." : "Crear Cuenta"}
          </Button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login-tecnico" className="text-primary hover:underline font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TechnicianRegister;
