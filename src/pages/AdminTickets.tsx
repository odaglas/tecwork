import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Trash2 } from "lucide-react";

interface TicketData {
  id: string;
  titulo: string;
  categoria: string;
  comuna: string;
  estado: string;
  created_at: string;
  cliente_nombre: string;
  cotizaciones_count: number;
  cotizacion_aceptada: boolean;
}

const AdminTickets = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [comunaFilter, setComunaFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [cotizacionFilter, setCotizacionFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Get all tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("ticket")
        .select("*")
        .order("created_at", { ascending: false });

      if (ticketsError) {
        console.error("Tickets error:", ticketsError);
        throw ticketsError;
      }

      // Get all cliente profiles with user data
      const { data: clienteProfiles, error: clienteError } = await supabase
        .from("cliente_profile")
        .select("id, user_id");

      if (clienteError) {
        console.error("Cliente profiles error:", clienteError);
        throw clienteError;
      }

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nombre");

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        throw profilesError;
      }

      // Get cotizaciones for each ticket
      const { data: cotizaciones, error: cotizacionesError } = await supabase
        .from("cotizacion")
        .select("ticket_id, estado");

      if (cotizacionesError) {
        console.error("Cotizaciones error:", cotizacionesError);
        throw cotizacionesError;
      }

      // Combine data
      const ticketsWithInfo: TicketData[] = ticketsData.map((ticket) => {
        const clienteProfile = clienteProfiles?.find((cp) => cp.id === ticket.cliente_id);
        const profile = profiles?.find((p) => p.id === clienteProfile?.user_id);
        const ticketCotizaciones = cotizaciones?.filter((c) => c.ticket_id === ticket.id) || [];
        
        return {
          id: ticket.id,
          titulo: ticket.titulo,
          categoria: ticket.categoria,
          comuna: ticket.comuna,
          estado: ticket.estado,
          created_at: ticket.created_at,
          cliente_nombre: profile?.nombre || "Desconocido",
          cotizaciones_count: ticketCotizaciones.length,
          cotizacion_aceptada: ticketCotizaciones.some((c) => c.estado === "aceptada"),
        };
      });

      setTickets(ticketsWithInfo);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;

    try {
      const { error } = await supabase
        .from("ticket")
        .delete()
        .eq("id", ticketToDelete);

      if (error) throw error;

      toast({
        title: "Ticket eliminado",
        description: "El ticket ha sido eliminado exitosamente",
      });

      // Refresh the tickets list
      fetchTickets();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el ticket",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      abierto: "default",
      cotizando: "secondary",
      en_progreso: "outline",
      finalizado: "default",
      cancelado: "destructive",
    };
    return <Badge variant={variants[estado] || "default"}>{estado}</Badge>;
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (categoriaFilter !== "all" && ticket.categoria !== categoriaFilter) return false;
    if (estadoFilter !== "all" && ticket.estado !== estadoFilter) return false;
    if (comunaFilter && !ticket.comuna.toLowerCase().includes(comunaFilter.toLowerCase())) return false;
    if (cotizacionFilter === "with" && ticket.cotizaciones_count === 0) return false;
    if (cotizacionFilter === "without" && ticket.cotizaciones_count > 0) return false;
    if (cotizacionFilter === "accepted" && !ticket.cotizacion_aceptada) return false;
    if (searchTerm && !ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ticket.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link to="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Gestión de Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Buscar por título o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Electricidad">Electricidad</SelectItem>
                  <SelectItem value="Gasfitería">Gasfitería</SelectItem>
                  <SelectItem value="Carpintería">Carpintería</SelectItem>
                  <SelectItem value="Pintura">Pintura</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Comuna..."
                value={comunaFilter}
                onChange={(e) => setComunaFilter(e.target.value)}
              />
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="abierto">Abierto</SelectItem>
                  <SelectItem value="cotizando">Cotizando</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cotizacionFilter} onValueChange={setCotizacionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Cotizaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="with">Con cotizaciones</SelectItem>
                  <SelectItem value="without">Sin cotizaciones</SelectItem>
                  <SelectItem value="accepted">Cotización aceptada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Comuna</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cotizaciones</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.titulo}</TableCell>
                      <TableCell>{ticket.cliente_nombre}</TableCell>
                      <TableCell>{ticket.categoria}</TableCell>
                      <TableCell>{ticket.comuna}</TableCell>
                      <TableCell>{getEstadoBadge(ticket.estado)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {ticket.cotizaciones_count}
                          {ticket.cotizacion_aceptada && " ✓"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link to={`/admin/tickets/${ticket.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteClick(ticket.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron tickets</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ticket y toda su información relacionada serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTickets;
