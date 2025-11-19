import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { validateRut, formatRut, cleanRut } from "@/lib/utils";

const userEditSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  rut: z.string().refine((val) => validateRut(val), {
    message: "RUT inválido",
  }),
  telefono: z.string().min(8, "El teléfono debe tener al menos 8 caracteres"),
  email: z.string().email("Email inválido"),
  comuna: z.string().optional(),
  direccion: z.string().optional(),
  especialidad_principal: z.string().optional(),
  descripcion_perfil: z.string().optional(),
});

type UserEditForm = z.infer<typeof userEditSchema>;

interface UserEditDialogProps {
  userId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserEditDialog = ({ userId, onClose, onSuccess }: UserEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      nombre: "",
      rut: "",
      telefono: "",
      email: "",
      comuna: "",
      direccion: "",
      especialidad_principal: "",
      descripcion_perfil: "",
    },
  });

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile) {
        toast({
          title: "Error",
          description: "Usuario no encontrado",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // Get roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      let primaryRole = "unknown";
      if (roles?.some(r => r.role === "tecnico")) {
        primaryRole = "tecnico";
      } else if (roles?.some(r => r.role === "cliente")) {
        primaryRole = "cliente";
      } else if (roles?.some(r => r.role === "admin")) {
        primaryRole = "admin";
      }

      setUserRole(primaryRole);

      // Get role-specific data
      if (primaryRole === "cliente") {
        const { data: clienteProfile } = await supabase
          .from("cliente_profile")
          .select("comuna, direccion")
          .eq("user_id", userId)
          .maybeSingle();

        form.reset({
          ...profile,
          rut: formatRut(profile.rut),
          comuna: clienteProfile?.comuna || "",
          direccion: clienteProfile?.direccion || "",
        });
      } else if (primaryRole === "tecnico") {
        const { data: tecnicoProfile } = await supabase
          .from("tecnico_profile")
          .select("especialidad_principal, descripcion_perfil")
          .eq("user_id", userId)
          .maybeSingle();

        form.reset({
          ...profile,
          rut: formatRut(profile.rut),
          especialidad_principal: tecnicoProfile?.especialidad_principal || "",
          descripcion_perfil: tecnicoProfile?.descripcion_perfil || "",
        });
      } else {
        form.reset({
          ...profile,
          rut: formatRut(profile.rut),
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserEditForm) => {
    if (!userId) return;

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nombre: data.nombre,
          rut: cleanRut(data.rut),
          telefono: data.telefono,
          email: data.email,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update role-specific profile
      if (userRole === "cliente" && (data.comuna || data.direccion)) {
        const { error: clienteError } = await supabase
          .from("cliente_profile")
          .update({
            comuna: data.comuna,
            direccion: data.direccion,
          })
          .eq("user_id", userId);

        if (clienteError) throw clienteError;
      } else if (userRole === "tecnico" && (data.especialidad_principal || data.descripcion_perfil)) {
        const { error: tecnicoError } = await supabase
          .from("tecnico_profile")
          .update({
            especialidad_principal: data.especialidad_principal,
            descripcion_perfil: data.descripcion_perfil,
          })
          .eq("user_id", userId);

        if (tecnicoError) throw tecnicoError;
      }

      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    form.setValue("rut", formatted);
  };

  return (
    <Dialog open={!!userId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>

        {loading && !form.formState.isDirty ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  {...form.register("nombre")}
                  placeholder="Nombre completo"
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.nombre.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  {...form.register("rut")}
                  onChange={handleRutChange}
                  placeholder="11.111.111-1"
                />
                {form.formState.errors.rut && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.rut.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="correo@ejemplo.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  {...form.register("telefono")}
                  placeholder="+56912345678"
                />
                {form.formState.errors.telefono && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.telefono.message}
                  </p>
                )}
              </div>
            </div>

            {userRole === "cliente" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="comuna">Comuna</Label>
                  <Input
                    id="comuna"
                    {...form.register("comuna")}
                    placeholder="Comuna"
                  />
                </div>

                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    {...form.register("direccion")}
                    placeholder="Dirección"
                  />
                </div>
              </div>
            )}

            {userRole === "tecnico" && (
              <>
                <div>
                  <Label htmlFor="especialidad_principal">Especialidad</Label>
                  <Input
                    id="especialidad_principal"
                    {...form.register("especialidad_principal")}
                    placeholder="Especialidad principal"
                  />
                </div>

                <div>
                  <Label htmlFor="descripcion_perfil">Descripción</Label>
                  <Textarea
                    id="descripcion_perfil"
                    {...form.register("descripcion_perfil")}
                    placeholder="Descripción del perfil"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
