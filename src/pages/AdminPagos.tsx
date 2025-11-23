import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CheckCircle, AlertCircle, ArrowLeft, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingPayment {
  id: string;
  monto_total: number;
  comision_porcentaje?: number;
  comision_monto?: number;
  monto_neto?: number;
  estado_pago: string;
  created_at: string;
  updated_at: string;
  ticket: {
    id: string;
    titulo: string;
    cliente_id: string;
  };
  cotizacion: {
    tecnico_id: string;
  };
  tecnico_nombre?: string;
  cliente_nombre?: string;
}

export default function AdminPagos() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
    fetchCommissionHistory();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const { data: paymentsData, error } = await supabase
        .from("pago")
        .select(`
          *,
          ticket:ticket_id (
            id,
            titulo,
            cliente_id,
            estado
          ),
          cotizacion:cotizacion_id (
            tecnico_id
          )
        `)
        .eq("estado_pago", "pagado_retenido")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const paymentsWithNames = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          let tecnicoNombre = "N/A";
          let clienteNombre = "N/A";

          if (payment.cotizacion?.tecnico_id) {
            const { data: tecnicoProfile } = await supabase
              .from("tecnico_profile")
              .select("user_id")
              .eq("id", payment.cotizacion.tecnico_id)
              .single();

            if (tecnicoProfile) {
              const { data: tecnicoUser } = await supabase
                .from("profiles")
                .select("nombre")
                .eq("id", tecnicoProfile.user_id)
                .single();

              tecnicoNombre = tecnicoUser?.nombre || "N/A";
            }
          }

          if (payment.ticket?.cliente_id) {
            const { data: clienteProfile } = await supabase
              .from("cliente_profile")
              .select("user_id")
              .eq("id", payment.ticket.cliente_id)
              .single();

            if (clienteProfile) {
              const { data: clienteUser } = await supabase
                .from("profiles")
                .select("nombre")
                .eq("id", clienteProfile.user_id)
                .single();

              clienteNombre = clienteUser?.nombre || "N/A";
            }
          }

          return {
            ...payment,
            tecnico_nombre: tecnicoNombre,
            cliente_nombre: clienteNombre,
          };
        })
      );

      setPayments(paymentsWithNames as PendingPayment[]);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos pendientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionHistory = async () => {
    try {
      const { data: historyData, error } = await supabase
        .from("pago")
        .select(`
          *,
          ticket:ticket_id (
            id,
            titulo,
            cliente_id,
            estado
          ),
          cotizacion:cotizacion_id (
            tecnico_id
          )
        `)
        .eq("estado_pago", "liberado_tecnico")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const historyWithNames = await Promise.all(
        (historyData || []).map(async (payment) => {
          let tecnicoNombre = "N/A";
          let clienteNombre = "N/A";

          if (payment.cotizacion?.tecnico_id) {
            const { data: tecnicoProfile } = await supabase
              .from("tecnico_profile")
              .select("user_id")
              .eq("id", payment.cotizacion.tecnico_id)
              .single();

            if (tecnicoProfile) {
              const { data: tecnicoUser } = await supabase
                .from("profiles")
                .select("nombre")
                .eq("id", tecnicoProfile.user_id)
                .single();

              tecnicoNombre = tecnicoUser?.nombre || "N/A";
            }
          }

          if (payment.ticket?.cliente_id) {
            const { data: clienteProfile } = await supabase
              .from("cliente_profile")
              .select("user_id")
              .eq("id", payment.ticket.cliente_id)
              .single();

            if (clienteProfile) {
              const { data: clienteUser } = await supabase
                .from("profiles")
                .select("nombre")
                .eq("id", clienteProfile.user_id)
                .single();

              clienteNombre = clienteUser?.nombre || "N/A";
            }
          }

          return {
            ...payment,
            tecnico_nombre: tecnicoNombre,
            cliente_nombre: clienteNombre,
          };
        })
      );

      setCommissionHistory(historyWithNames as PendingPayment[]);
    } catch (error) {
      console.error("Error fetching commission history:", error);
    }
  };

  const handleReleasePayment = async () => {
    if (!selectedPayment) return;

    setReleasing(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sesión Expirada",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive",
        });
        navigate("/admin/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("release-payment", {
        body: { pago_id: selectedPayment.id },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      toast({
        title: "Pago Liberado",
        description: `El pago de $${selectedPayment.monto_total.toLocaleString()} ha sido liberado al técnico`,
      });

      // Refresh both lists
      await fetchPendingPayments();
      await fetchCommissionHistory();
      setShowConfirmDialog(false);
      setSelectedPayment(null);
    } catch (error: any) {
      console.error("Error releasing payment:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo liberar el pago. Verifica tu sesión e intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setReleasing(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      pagado_retenido: "default",
      liberado_tecnico: "secondary",
      disputa: "destructive",
    };

    const labels: { [key: string]: string } = {
      pagado_retenido: "Pagado - Retenido",
      liberado_tecnico: "Liberado",
      disputa: "En Disputa",
    };

    return (
      <Badge variant={variants[estado] || "default"}>
        {labels[estado] || estado}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Cargando pagos pendientes...</p>
        </div>
      </div>
    );
  }

  const totalCommission = commissionHistory.reduce((sum, payment) => 
    sum + (payment.comision_monto || 0), 0
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona pagos pendientes y revisa el historial de comisiones
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Pagos Pendientes
            {payments.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {payments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Historial de Comisiones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">
                  No hay pagos pendientes de liberación
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Todos los pagos han sido procesados
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes de Liberación</CardTitle>
                <CardDescription>
                  Pagos confirmados por clientes esperando aprobación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.ticket?.titulo || "N/A"}
                        </TableCell>
                        <TableCell>{payment.cliente_nombre}</TableCell>
                        <TableCell>{payment.tecnico_nombre}</TableCell>
                        <TableCell className="font-semibold">
                          ${payment.monto_total.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.estado_pago)}</TableCell>
                        <TableCell>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowConfirmDialog(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Liberar Pago
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Comisiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ${totalCommission.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comisiones totales generadas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pagos Liberados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {commissionHistory.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pagos procesados exitosamente
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tasa de Comisión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">15%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comisión estándar por servicio
                </p>
              </CardContent>
            </Card>
          </div>

          {commissionHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">
                  No hay historial de comisiones aún
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Las comisiones aparecerán aquí cuando se liberen pagos
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Comisiones</CardTitle>
                <CardDescription>
                  Registro completo de todas las comisiones generadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>Comisión (15%)</TableHead>
                      <TableHead>Pago al Técnico</TableHead>
                      <TableHead>Fecha Liberación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.ticket?.titulo || "N/A"}
                        </TableCell>
                        <TableCell>{payment.tecnico_nombre}</TableCell>
                        <TableCell className="font-semibold">
                          ${payment.monto_total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-primary font-semibold">
                          ${(payment.comision_monto || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${(payment.monto_neto || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.updated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar liberación de pago?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Estás a punto de liberar el siguiente pago al técnico:
              </p>
              {selectedPayment && (
                <div className="bg-muted p-4 rounded-lg space-y-3 text-foreground">
                  <p><strong>Técnico:</strong> {selectedPayment.tecnico_nombre}</p>
                  <p><strong>Ticket:</strong> {selectedPayment.ticket?.titulo}</p>
                  <div className="border-t border-border pt-3 mt-3 space-y-1">
                    <p className="flex justify-between">
                      <span>Monto Total:</span>
                      <span className="font-semibold">${selectedPayment.monto_total.toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between text-sm text-muted-foreground">
                      <span>Comisión (15%):</span>
                      <span>-${Math.floor(selectedPayment.monto_total * 0.15).toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between text-lg font-bold border-t border-border pt-2 text-primary">
                      <span>Pago al Técnico:</span>
                      <span>${Math.floor(selectedPayment.monto_total * 0.85).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              )}
              <p className="text-destructive font-medium flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4" />
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releasing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReleasePayment}
              disabled={releasing}
            >
              {releasing ? "Liberando..." : "Confirmar Liberación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
