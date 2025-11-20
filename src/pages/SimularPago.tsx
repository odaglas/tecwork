import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";

const SimularPago = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cotizacion, setCotizacion] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);

  const cotizacionId = searchParams.get("cotizacion_id");
  const ticketId = searchParams.get("ticket_id");

  useEffect(() => {
    const loadData = async () => {
      if (!cotizacionId || !ticketId) {
        toast({
          title: "Error",
          description: "Datos de pago inválidos",
          variant: "destructive",
        });
        navigate("/cliente/home");
        return;
      }

      const { data: cotData } = await supabase
        .from("cotizacion")
        .select("*")
        .eq("id", cotizacionId)
        .single();

      const { data: ticketData } = await supabase
        .from("ticket")
        .select("*")
        .eq("id", ticketId)
        .single();

      setCotizacion(cotData);
      setTicket(ticketData);
      setLoading(false);
    };

    loadData();
  }, [cotizacionId, ticketId, navigate, toast]);

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Create payment record
      const { error: pagoError } = await supabase.from("pago").insert({
        ticket_id: ticketId,
        cotizacion_id: cotizacionId,
        monto_total: cotizacion.valor_total,
        estado_pago: "pagado_retenido",
        transbank_token: `SIM-${Date.now()}`, // Simulated token
      });

      if (pagoError) throw pagoError;

      // Accept the cotizacion
      const { error: acceptError } = await supabase.functions.invoke(
        "accept-cotizacion",
        {
          body: { cotizacionId },
        }
      );

      if (acceptError) throw acceptError;

      toast({
        title: "¡Pago exitoso!",
        description: "La cotización ha sido aceptada y el pago está retenido",
      });

      // Redirect to ticket detail
      setTimeout(() => {
        navigate(`/cliente/ticket/${ticketId}`);
      }, 2000);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar el pago",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cotizacion || !ticket) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl p-4 py-8">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Simulador de Pago WebPay</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              (Esta es una página de prueba para el prototipo)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket:</span>
                <span className="font-semibold">{ticket.titulo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descripción del Servicio:</span>
                <span className="font-semibold text-right max-w-[60%]">
                  {cotizacion.descripcion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tiempo Estimado:</span>
                <span className="font-semibold">
                  {cotizacion.tiempo_estimado_dias} día(s)
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total a Pagar:</span>
                  <span className="font-bold text-primary">
                    ${cotizacion.valor_total.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Nota:</strong> El pago quedará retenido hasta que confirmes que
                el servicio fue completado satisfactoriamente. El técnico recibirá el
                pago solo después de tu confirmación.
              </p>
            </div>

            {!processing ? (
              <div className="space-y-3">
                <Button
                  onClick={handlePayment}
                  className="w-full"
                  size="lg"
                  disabled={processing}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Simular Pago Exitoso
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/cliente/ticket/${ticketId}`)}
                  className="w-full"
                  disabled={processing}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-lg font-semibold">Procesando pago...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esto puede tomar unos segundos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimularPago;
