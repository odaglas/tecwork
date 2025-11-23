import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Disputa {
  id: string;
  motivo: string;
  descripcion: string;
  estado: string;
  created_at: string;
  resolucion_admin: string | null;
  updated_at: string;
  pago: {
    monto_total: number;
    ticket: {
      titulo: string;
    };
  };
}

interface DisputasHistorialProps {
  userType: "cliente" | "tecnico";
}

export default function DisputasHistorial({ userType }: DisputasHistorialProps) {
  const [disputas, setDisputas] = useState<Disputa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDisputas();
  }, []);

  const fetchDisputas = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("disputas")
        .select(`
          id,
          motivo,
          descripcion,
          estado,
          created_at,
          resolucion_admin,
          updated_at,
          pago:pago_id(
            monto_total,
            ticket:ticket_id(
              titulo
            )
          )
        `)
        .eq("iniciado_por", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDisputas(data || []);
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, label: string }> = {
      pendiente: { variant: "secondary", icon: Clock, label: "Pendiente" },
      en_revision: { variant: "outline", icon: FileText, label: "En Revisión" },
      resuelta: { variant: "default", icon: CheckCircle, label: "Resuelta" },
      rechazada: { variant: "destructive", icon: AlertCircle, label: "Rechazada" },
    };

    const config = variants[estado] || variants.pendiente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Historial de Disputas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando disputas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Historial de Disputas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {disputas.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No has iniciado ninguna disputa
          </p>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {disputas.map((disputa) => (
                <Card key={disputa.id} className="border-muted">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">
                            {disputa.pago?.ticket?.titulo || "Ticket"}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Monto: ${disputa.pago?.monto_total?.toLocaleString() || 0}
                          </p>
                        </div>
                        {getEstadoBadge(disputa.estado)}
                      </div>

                      <Separator />

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Motivo
                        </p>
                        <p className="text-sm">{disputa.motivo}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Descripción
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {disputa.descripcion}
                        </p>
                      </div>

                      {disputa.resolucion_admin && (
                        <>
                          <Separator />
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Respuesta del Administrador
                            </p>
                            <p className="text-sm">{disputa.resolucion_admin}</p>
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Creada {formatDistanceToNow(new Date(disputa.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        {disputa.updated_at !== disputa.created_at && (
                          <span>
                            Actualizada {formatDistanceToNow(new Date(disputa.updated_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
