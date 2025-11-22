import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
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
  estado_pago: string;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPayments();
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

      // Fetch technician and client names
      const paymentsWithNames = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          let tecnicoNombre = "N/A";
          let clienteNombre = "N/A";

          // Get technician name
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

          // Get client name
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

  const handleReleasePayment = async () => {
    if (!selectedPayment) return;

    setReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("release-payment", {
        body: { paymentId: selectedPayment.id },
      });

      if (error) throw error;

      toast({
        title: "Pago Liberado",
        description: `El pago de $${selectedPayment.monto_total.toLocaleString()} ha sido liberado al técnico`,
      });

      // Refresh the list
      await fetchPendingPayments();
      setShowConfirmDialog(false);
      setSelectedPayment(null);
    } catch (error: any) {
      console.error("Error releasing payment:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo liberar el pago",
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
          <h1 className="text-3xl font-bold">Pagos Pendientes de Liberación</h1>
          <p className="text-muted-foreground">
            Gestiona los pagos retenidos que están listos para ser liberados a los técnicos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-primary" />
          <div className="text-right">
            <p className="text-2xl font-bold">{payments.length}</p>
            <p className="text-xs text-muted-foreground">Pagos pendientes</p>
          </div>
        </div>
      </div>

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
            <CardTitle>Lista de Pagos</CardTitle>
            <CardDescription>
              Pagos que han sido confirmados por el cliente y están esperando aprobación
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar liberación de pago?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Estás a punto de liberar el siguiente pago al técnico:
              </p>
              {selectedPayment && (
                <div className="bg-muted p-4 rounded-lg space-y-2 text-foreground">
                  <p><strong>Técnico:</strong> {selectedPayment.tecnico_nombre}</p>
                  <p><strong>Monto:</strong> ${selectedPayment.monto_total.toLocaleString()}</p>
                  <p><strong>Ticket:</strong> {selectedPayment.ticket?.titulo}</p>
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
