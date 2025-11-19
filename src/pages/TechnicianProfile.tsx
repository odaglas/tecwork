import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TechnicianHeader } from "@/components/TechnicianHeader";
import { Loader2, Edit2 } from "lucide-react";
import { formatRut } from "@/lib/utils";


const TechnicianProfile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    rut: "",
    telefono: "",
    especialidad_principal: "",
    descripcion_perfil: "",
    comunas_cobertura: [] as string[],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const { data: techData, error: techError } = await supabase
        .from("tecnico_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (techError) throw techError;

      setProfile({
        nombre: profileData.nombre,
        email: profileData.email,
        rut: formatRut(profileData.rut),
        telefono: profileData.telefono,
        especialidad_principal: techData.especialidad_principal,
        descripcion_perfil: techData.descripcion_perfil || "",
        comunas_cobertura: techData.comunas_cobertura || [],
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nombre: profile.nombre,
          telefono: profile.telefono,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update tecnico_profile table
      const { error: techError } = await supabase
        .from("tecnico_profile")
        .update({
          descripcion_perfil: profile.descripcion_perfil,
          comunas_cobertura: profile.comunas_cobertura,
        })
        .eq("user_id", user.id);

      if (techError) throw techError;

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      });
      setEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <TechnicianHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <TechnicianHeader />

      <main className="container px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Mi Perfil</CardTitle>
              {!editing && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={profile.nombre}
                onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                disabled={!editing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (No editable)</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rut">RUT (No editable)</Label>
              <Input
                id="rut"
                value={profile.rut}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={profile.telefono}
                onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
                disabled={!editing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad Principal (No editable)</Label>
              <Input
                id="especialidad"
                value={profile.especialidad_principal}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción del Perfil</Label>
              <Textarea
                id="descripcion"
                value={profile.descripcion_perfil}
                onChange={(e) => setProfile({ ...profile, descripcion_perfil: e.target.value })}
                disabled={!editing}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comunas">Comunas de Cobertura (separadas por comas)</Label>
              <Input
                id="comunas"
                value={profile.comunas_cobertura.join(", ")}
                onChange={(e) => setProfile({ 
                  ...profile, 
                  comunas_cobertura: e.target.value.split(",").map(c => c.trim()) 
                })}
                disabled={!editing}
              />
            </div>

            {editing && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    fetchProfile();
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TechnicianProfile;
