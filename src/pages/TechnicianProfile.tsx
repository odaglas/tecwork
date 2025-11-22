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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
    payments: [] as any[],
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

      // Get payments for this technician with commission details
      const { data: payments, error } = await supabase
        .from("pago")
        .select(`
          id,
          monto_total,
          monto_neto,
          comision_monto,
          comision_porcentaje,
          estado_pago,
          created_at,
          cotizacion!inner(
            tecnico_id,
            ticket!inner(
              titulo
            )
          )
        `)
        .eq("cotizacion.tecnico_id", techData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate available and pending balances using net amounts
      const available = payments
        ?.filter(p => p.estado_pago === "liberado_tecnico")
        .reduce((sum, p) => sum + (p.monto_neto || 0), 0) || 0;

      const pending = payments
        ?.filter(p => p.estado_pago === "pagado_retenido")
        .reduce((sum, p) => sum + (p.monto_neto || 0), 0) || 0;

      setBalanceData({ available, pending, payments: payments || [] });
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
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6">
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

            <Card>
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
                        Cambiando...
                      </>
                    ) : (
                      "Cambiar Contraseña"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <CardTitle>Balance de Pagos</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Montos netos después de la comisión del 15%
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Disponible para Retiro</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${balanceData.available.toLocaleString("es-CL")}
                    </p>
                      {balanceData.available > 0 && (
                      <Button 
                        className="w-full mt-3"
                        onClick={() => {
                          const amount = balanceData.available;
                          setBalanceData(prev => ({
                            ...prev,
                            available: 0
                          }));
                          toast({
                            title: "Retiro simulado exitoso",
                            description: `Se ha procesado el retiro de $${amount.toLocaleString("es-CL")} a tu cuenta personal.`,
                          });
                        }}
                      >
                        Retirar a Cuenta Personal
                      </Button>
                    )}
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Pendiente de Liberación</p>
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
                <CardTitle>Historial de Comisiones</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Detalle de pagos recibidos y comisiones descontadas
                </p>
              </CardHeader>
              <CardContent>
                {balanceData.payments && balanceData.payments.length > 0 ? (
                  <div className="space-y-4">
                    {balanceData.payments
                      .filter((pago: any) => pago.estado_pago === "liberado_tecnico")
                      .map((pago: any) => (
                        <div key={pago.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{pago.cotizacion.ticket.titulo}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(pago.created_at).toLocaleDateString("es-CL", {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                ${pago.monto_neto?.toLocaleString("es-CL") || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Monto Neto</p>
                            </div>
                          </div>
                          <div className="pt-3 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Monto Total del Servicio:</span>
                              <span className="font-medium">${pago.monto_total.toLocaleString("es-CL")}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Comisión de Plataforma ({pago.comision_porcentaje || 15}%):
                              </span>
                              <span className="text-red-600 font-medium">
                                -${pago.comision_monto?.toLocaleString("es-CL") || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-base font-semibold pt-2 border-t">
                              <span>Recibes:</span>
                              <span className="text-green-600">
                                ${pago.monto_neto?.toLocaleString("es-CL") || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No hay pagos liberados todavía
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cuando completes servicios y el cliente libere el pago, aparecerán aquí
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TechnicianProfile;
