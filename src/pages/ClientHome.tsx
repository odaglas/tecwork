import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Droplet, Zap, Wrench, Monitor, Clock, Loader2 } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const categories = [
  { icon: Droplet, label: "Gasfitería", color: "text-primary" },
  { icon: Zap, label: "Electricidad", color: "text-primary" },
  { icon: Wrench, label: "Reparaciones", color: "text-primary" },
  { icon: Monitor, label: "Soporte TI", color: "text-primary" },
];

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  created_at: string;
}

const ClientHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserTickets();
  }, []);

  const fetchUserTickets = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para ver tus tickets",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Get cliente_profile for current user
      const { data: clienteProfile, error: profileError } = await supabase
        .from("cliente_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!clienteProfile) {
        toast({
          title: "Error",
          description: "No se encontró tu perfil de cliente",
          variant: "destructive",
        });
        return;
      }

      // Fetch tickets for this cliente
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("ticket")
        .select("*")
        .eq("cliente_id", clienteProfile.id)
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;

      setTickets(ticketsData || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      abierto: { className: "bg-success/10 text-success border-success hover:bg-success/20", label: "Abierto" },
      cotizando: { className: "bg-blue-500/10 text-blue-500 border-blue-500 hover:bg-blue-500/20", label: "Cotizando" },
      en_progreso: { className: "bg-yellow-500/10 text-yellow-500 border-yellow-500 hover:bg-yellow-500/20", label: "En Progreso" },
      finalizado: { className: "bg-gray-500/10 text-gray-500 border-gray-500 hover:bg-gray-500/20", label: "Finalizado" },
      cancelado: { className: "bg-red-500/10 text-red-500 border-red-500 hover:bg-red-500/20", label: "Cancelado" },
    };
    const variant = variants[estado] || variants.abierto;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-secondary">
      <ClientHeader />

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          ¿Qué servicio necesitas hoy?
        </h1>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ej: Electricista, Gásfiter..."
            className="pl-12 h-14 text-lg border-2 focus:border-primary shadow-md"
          />
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category.label}
                className="hover:shadow-lg transition-smooth cursor-pointer border-2 hover:border-primary group"
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary transition-smooth">
                    <category.icon className={`h-8 w-8 ${category.color} group-hover:text-primary-foreground transition-smooth`} />
                  </div>
                  <span className="font-semibold text-foreground">{category.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <Button
            variant="success"
            size="lg"
            className="w-full md:w-auto text-lg px-8 py-6"
            onClick={() => window.location.href = "/cliente/crear-ticket"}
          >
            Crear un Ticket de Servicio
          </Button>
        </div>

        {/* Active Tickets Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Mis Tickets</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Aún no tienes tickets creados
                </p>
                <Button 
                  variant="default" 
                  onClick={() => navigate("/cliente/crear-ticket")}
                >
                  Crear tu primer ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="border-2 hover:shadow-lg transition-smooth">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {ticket.titulo}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {ticket.descripcion}
                        </p>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {formatDistanceToNow(new Date(ticket.created_at), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {ticket.categoria}
                          </Badge>
                        </div>
                        {getEstadoBadge(ticket.estado)}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/cliente/ticket/${ticket.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientHome;
