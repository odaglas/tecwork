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
import { formatRut, cleanRut, validateRut } from "@/lib/utils";
import tecworkLogo from "@/assets/tecwork-logo.png";
import { ArrowLeft } from "lucide-react";

const technicianRegisterSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  rut: z.string().refine((val) => validateRut(val), {
    message: "RUT inválido"
  }),
  telefono: z.string().min(9, { message: "Teléfono inválido" }),
  especialidad_principal: z.string().min(1, { message: "Debe seleccionar una especialidad" }),
  descripcion_perfil: z.string().optional(),
  cedula: z.instanceof(File, { message: "Debe cargar su cédula de identidad" }),
  curriculum: z.instanceof(File, { message: "Debe cargar su curriculum vitae" }),
  certificado: z.instanceof(File).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const TechnicianRegister = () => {
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
    especialidad_principal: "",
    descripcion_perfil: "",
  });
  const [selectedComunas, setSelectedComunas] = useState<string[]>([]);
  const [cedula, setCedula] = useState<File | null>(null);
  const [curriculum, setCurriculum] = useState<File | null>(null);
  const [certificado, setCertificado] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!cedula) {
        throw new Error("Debe cargar su cédula de identidad");
      }
      if (!curriculum) {
        throw new Error("Debe cargar su curriculum vitae");
      }
      
      const validatedData = technicianRegisterSchema.parse({ 
        ...formData, 
        cedula,
        curriculum,
        certificado: certificado || undefined
      });

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/tecnico/dashboard`,
          data: {
            nombre: validatedData.nombre,
            rut: cleanRut(validatedData.rut),
            telefono: validatedData.telefono,
            role: "tecnico", // Role assigned securely via database trigger
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

      const { error: tecnicoError } = await supabase
        .from("tecnico_profile")
        .insert({
          user_id: authData.user.id,
          especialidad_principal: validatedData.especialidad_principal,
          comunas_cobertura: selectedComunas,
          descripcion_perfil: validatedData.descripcion_perfil || null,
          is_validated: false,
        });

      if (tecnicoError) {
        console.error("Tecnico profile error:", tecnicoError);
        throw tecnicoError;
      }

      console.log("Técnico perfil creado exitosamente");

      // Get tecnico_profile id
      const { data: tecnicoProfileData } = await supabase
        .from("tecnico_profile")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      if (!tecnicoProfileData) {
        throw new Error("No se pudo obtener el perfil del técnico");
      }

      const tecnicoId = tecnicoProfileData.id;
      const cleanedRut = cleanRut(validatedData.rut);

      // Upload documents with proper naming
      const documentsToUpload = [
        { file: cedula, name: `${cleanedRut}_cedula`, displayName: "Cédula de Identidad" },
        { file: curriculum, name: `${cleanedRut}_curriculum`, displayName: "Curriculum Vitae" },
      ];

      // Add certificado if provided
      if (certificado) {
        documentsToUpload.push({ 
          file: certificado, 
          name: `${cleanedRut}_certificado`, 
          displayName: "Certificado SEC u Otro" 
        });
      }

      // Upload all documents
      for (const doc of documentsToUpload) {
        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${authData.user.id}/${doc.name}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('tecnico-documents')
          .upload(fileName, doc.file);

        if (uploadError) {
          console.error(`Upload error for ${doc.displayName}:`, uploadError);
          throw new Error(`Error al subir ${doc.displayName}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('tecnico-documents')
          .getPublicUrl(fileName);

        // Save document reference in database
        const { error: docError } = await supabase
          .from("documentacion_tecnico")
          .insert({
            tecnico_id: tecnicoId,
            nombre_documento: doc.displayName,
            archivo_url: urlData.publicUrl,
            estado: "pendiente",
          });

        if (docError) {
          console.error(`Document reference error for ${doc.displayName}:`, docError);
          throw new Error(`Error al guardar referencia de ${doc.displayName}`);
        }
      }

      console.log("Documentos subidos y guardados exitosamente");

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada. Un administrador validará tus documentos pronto.",
      });

      navigate("/tecnico/dashboard");

    } catch (error: any) {
      console.error("Error en registro:", error);
      
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
      <div className="w-full max-w-md space-y-8 my-8">
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
              placeholder="11.111.111-1"
              value={formData.rut}
              onChange={(e) => {
                const formatted = formatRut(e.target.value);
                setFormData({ ...formData, rut: formatted });
              }}
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
            <Label htmlFor="cedula">Cédula de Identidad *</Label>
            <Input
              id="cedula"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setCedula(e.target.files?.[0] || null)}
              required
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceptados: PDF, JPG, PNG (máx. 10MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="curriculum">Curriculum Vitae *</Label>
            <Input
              id="curriculum"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setCurriculum(e.target.files?.[0] || null)}
              required
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceptados: PDF, DOC, DOCX (máx. 10MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificado">Certificado SEC u Otro (Opcional)</Label>
            <Input
              id="certificado"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setCertificado(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceptados: PDF, JPG, PNG (máx. 10MB)
            </p>
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
