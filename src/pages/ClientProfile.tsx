import { useState, useEffect } from "react";
import { ClientHeader } from "@/components/ClientHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { Loader2 } from "lucide-react";
import { formatRut } from "@/lib/utils";

const ClientProfile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    id: "",
    nombre: "",
    email: "",
    rut: "",
    telefono: "",
    direccion: "",
    comuna: "",
    profile_picture_url: null as string | null,
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
        .maybeSingle();

      if (profileError) throw profileError;

      const { data: clientData, error: clientError } = await supabase
        .from("cliente_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientError) throw clientError;

      // If cliente_profile doesn't exist, create it
      if (!clientData) {
        const { error: insertError } = await supabase
          .from("cliente_profile")
          .insert({
            user_id: user.id,
            direccion: "",
            comuna: "",
          });

        if (insertError) {
          console.error("Error creating cliente_profile:", insertError);
        }
      }

      setProfile({
        id: user.id,
        nombre: profileData?.nombre || "",
        email: profileData?.email || "",
        rut: formatRut(profileData?.rut || ""),
        telefono: profileData?.telefono || "",
        direccion: clientData?.direccion || "",
        comuna: clientData?.comuna || "",
        profile_picture_url: profileData?.profile_picture_url || null,
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

      // Update cliente_profile table
      const { error: clientError } = await supabase
        .from("cliente_profile")
        .update({
          direccion: profile.direccion,
          comuna: profile.comuna,
        })
        .eq("user_id", user.id);

      if (clientError) throw clientError;

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      });
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
        <ClientHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <ClientHeader />
      <main className="container px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Mi Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfilePictureUpload
              userId={profile.id}
              currentPictureUrl={profile.profile_picture_url}
              userName={profile.nombre}
              onUploadComplete={(url) => setProfile({ ...profile, profile_picture_url: url })}
            />
            
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={profile.nombre}
                onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={profile.direccion}
                onChange={(e) => setProfile({ ...profile, direccion: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comuna">Comuna</Label>
              <Input
                id="comuna"
                value={profile.comuna}
                onChange={(e) => setProfile({ ...profile, comuna: e.target.value })}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
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
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientProfile;
