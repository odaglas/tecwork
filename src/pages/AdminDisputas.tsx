import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Disputa {
  id: string;
  pago_id: string;
  motivo: string;
  descripcion: string;
  estado: string;
  tipo_iniciador: string;
  created_at: string;
  pago: {
    monto_total: number;
    ticket_id: string;
  };
  iniciador_nombre?: string;
  ticket_titulo?: string;
}

export default function AdminDisputas() {
  const navigate = useNavigate();
  const [disputas, setDisputas] = useState<Disputa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisputa, setSelectedDisputa] = useState<Disputa | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolucion, setResolucion] = useState<string>("");
  const [resolucionAdmin, setResolucionAdmin] = useState("");
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputas();
  }, []);

  const fetchDisputas = async () => {
    try {
      setLoading(true);
      const { data: disputasData, error } = await supabase
        .from("disputas")
        .select(`
          *,
          pago:pago_id (
            monto_total,
            ticket_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch additional details
      const disputasWithDetails = await Promise.all(
        (disputasData || []).map(async (disputa) => {
          let iniciadorNombre = "N/A";
          let ticketTitulo = "N/A";

          // Get initiator name
          const { data: profileData } = await supabase
            .from("profiles")
            .select("nombre")
            .eq("id", disputa.iniciado_por)
            .single();

          iniciadorNombre = profileData?.nombre || "N/A";

          // Get ticket title
          if (disputa.pago?.ticket_id) {
            const { data: ticketData } = await supabase
              .from("ticket")
              .select("titulo")
              .eq("id", disputa.pago.ticket_id)
              .single();

            ticketTitulo = ticketData?.titulo || "N/A";
          }

          return {
            ...disputa,
            iniciador_nombre: iniciadorNombre,
            ticket_titulo: ticketTitulo,
          };
        })
      );

      setDisputas(disputasWithDetails as Disputa[]);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las disputas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDisputa || !resolucion || !resolucionAdmin.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setResolving(true);
    try {
      const { error } = await supabase.functions.invoke("resolve-disputa", {
        body: {
          disputa_id: selectedDisputa.id,
          resolucion,
          resolucion_admin: resolucionAdmin,
        },
      });

      if (error) throw error;

      toast({
        title: "Disputa Resuelta",
        description: "La disputa ha sido resuelta exitosamente",
      });

      await fetchDisputas();
      setShowResolveDialog(false);
      setSelectedDisputa(null);
      setResolucion("");
      setResolucionAdmin("");
    } catch (error: any) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo resolver la disputa",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      pendiente: "destructive",
      en_revision: "default",
      resuelta: "secondary",
      rechazada: "secondary",
    };

    const labels: { [key: string]: string } = {
      pendiente: "Pendiente",
      en_revision: "En Revisión",
      resuelta: "Resuelta",
      rechazada: "Rechazada",
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
          <p className="text-muted-foreground">Cargando disputas...</p>
        </div>
      </div>
    );
  }

  const pendingDisputas = disputas.filter(d => ['pendiente', 'en_revision'].includes(d.estado));
  const resolvedDisputas = disputas.filter(d => ['resuelta', 'rechazada'].includes(d.estado));

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
          <h1 className="text-3xl font-bold">Gestión de Disputas</h1>
          <p className="text-muted-foreground">
            Revisa y resuelve disputas de pagos entre clientes y técnicos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <div className="text-right">
            <p className="text-2xl font-bold">{pendingDisputas.length}</p>
            <p className="text-xs text-muted-foreground">Disputas pendientes</p>
          </div>
        </div>
      </div>

      {/* Pending Disputes */}
      <Card>
        <CardHeader>
          <CardTitle>Disputas Pendientes</CardTitle>
          <CardDescription>
            Disputas que requieren tu atención
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDisputas.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay disputas pendientes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Iniciado Por</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDisputas.map((disputa) => (
                  <TableRow key={disputa.id}>
                    <TableCell className="font-medium">
                      {disputa.ticket_titulo}
                    </TableCell>
                    <TableCell>{disputa.iniciador_nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {disputa.tipo_iniciador === 'cliente' ? 'Cliente' : 'Técnico'}
                      </Badge>
                    </TableCell>
                    <TableCell>{disputa.motivo}</TableCell>
                    <TableCell className="font-semibold">
                      ${disputa.pago?.monto_total?.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(disputa.estado)}</TableCell>
                    <TableCell>
                      {new Date(disputa.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDisputa(disputa);
                          setShowResolveDialog(true);
                        }}
                      >
                        Resolver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolved Disputes */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Disputas</CardTitle>
          <CardDescription>
            Disputas que ya han sido resueltas o rechazadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resolvedDisputas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay disputas resueltas aún</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Iniciado Por</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolvedDisputas.map((disputa) => (
                  <TableRow key={disputa.id}>
                    <TableCell className="font-medium">
                      {disputa.ticket_titulo}
                    </TableCell>
                    <TableCell>{disputa.iniciador_nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {disputa.tipo_iniciador === 'cliente' ? 'Cliente' : 'Técnico'}
                      </Badge>
                    </TableCell>
                    <TableCell>{disputa.motivo}</TableCell>
                    <TableCell className="font-semibold">
                      ${disputa.pago?.monto_total?.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(disputa.estado)}</TableCell>
                    <TableCell>
                      {new Date(disputa.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Resolver Disputa</DialogTitle>
            <DialogDescription>
              Revisa los detalles y decide cómo resolver esta disputa
            </DialogDescription>
          </DialogHeader>

          {selectedDisputa && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Ticket:</strong> {selectedDisputa.ticket_titulo}</p>
                <p><strong>Iniciado por:</strong> {selectedDisputa.iniciador_nombre} ({selectedDisputa.tipo_iniciador})</p>
                <p><strong>Monto:</strong> ${selectedDisputa.pago?.monto_total?.toLocaleString()}</p>
                <p><strong>Motivo:</strong> {selectedDisputa.motivo}</p>
                <p><strong>Descripción:</strong></p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedDisputa.descripcion}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolucion">Decisión</Label>
                <Select value={resolucion} onValueChange={setResolucion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una decisión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobar_cliente">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Aprobar Cliente (retener pago)
                      </div>
                    </SelectItem>
                    <SelectItem value="aprobar_tecnico">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Aprobar Técnico (liberar pago)
                      </div>
                    </SelectItem>
                    <SelectItem value="rechazar">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Rechazar disputa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolucion_admin">Explicación de la Decisión</Label>
                <Textarea
                  id="resolucion_admin"
                  placeholder="Explica por qué tomaste esta decisión..."
                  value={resolucionAdmin}
                  onChange={(e) => setResolucionAdmin(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
              disabled={resolving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResolveDispute}
              disabled={resolving || !resolucion || !resolucionAdmin.trim()}
            >
              {resolving ? "Resolviendo..." : "Confirmar Resolución"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
