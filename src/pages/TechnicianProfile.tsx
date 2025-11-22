import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TechnicianHeader } from "@/components/TechnicianHeader";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { Loader2, Edit2, Lock, DollarSign } from "lucide-react";
import { formatRut } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";


const TechnicianProfile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profile, setProfile] = useState({
    id: "",
    nombre: "",
    email: "",
    rut: "",
    telefono: "",
    especialidad_principal: "",
    descripcion_perfil: "",
    comunas_cobertura: [] as string[],
    profile_picture_url: null as string | null,
  });
  const [balanceData, setBalanceData] = useState({
    available: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchBalanceData();
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
        id: user.id,
        nombre: profileData.nombre,
        email: profileData.email,
        rut: formatRut(profileData.rut),
        telefono: profileData.telefono,
        especialidad_principal: techData.especialidad_principal,
        descripcion_perfil: techData.descripcion_perfil || "",
        comunas_cobertura: techData.comunas_cobertura || [],
        profile_picture_url: profileData.profile_picture_url || null,
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

  const fetchBalanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tecnico_id
      const { data: techData } = await supabase
        .from("tecnico_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!techData) return;

      // Get payments for this technician
      const { data: payments, error } = await supabase
        .from("pago")
        .select(`
          monto_total,
          estado_pago,
          cotizacion!inner(
            tecnico_id
          )
        `)
        .eq("cotizacion.tecnico_id", techData.id);

      if (error) throw error;

      // Calculate available and pending balances
      const available = payments
        ?.filter(p => p.estado_pago === "liberado_tecnico")
        .reduce((sum, p) => sum + p.monto_total, 0) || 0;

      const pending = payments
        ?.filter(p => p.estado_pago === "pagado_retenido")
        .reduce((sum, p) => sum + p.monto_total, 0) || 0;

      setBalanceData({ available, pending });
    } catch (error) {
      console.error("Error fetching balance data:", error);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta",
          variant: "destructive",
        });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });

      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
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
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle>Balance de Pagos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm text-muted-foreground mb-1">Dinero Disponible</p>
                <p className="text-2xl font-bold text-green-600">
                  ${balanceData.available.toLocaleString("es-CL")}
                </p>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-sm text-muted-foreground mb-1">Dinero Pendiente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${balanceData.pending.toLocaleString("es-CL")}
                </p>
              </div>
            </div>

            <ChartContainer
              config={{
                amount: {
                  label: "Monto",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Disponible", amount: balanceData.available },
                    { name: "Pendiente", amount: balanceData.pending },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `$${Number(value).toLocaleString("es-CL")}`}
                      />
                    }
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

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
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Cambiar Contraseña</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Ingresa tu nueva contraseña"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirma tu nueva contraseña"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={changingPassword} className="w-full">
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cambiando Contraseña...
                  </>
                ) : (
                  "Cambiar Contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TechnicianProfile;
