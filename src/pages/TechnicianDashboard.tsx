import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Clock, Filter, AlertCircle } from "lucide-react";
import { TechnicianHeader } from "@/components/TechnicianHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";


interface Ticket {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  comuna: string;
  created_at: string;
  estado?: string;
}

const TechnicianDashboard = () => {
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quotedTickets, setQuotedTickets] = useState<Ticket[]>([]);
  const [quotedTicketIds, setQuotedTicketIds] = useState<string[]>([]);
  const [technicianSpecialty, setTechnicianSpecialty] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const checkValidationAndFetchTickets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get user name from profiles
          const { data: profileData } = await supabase
            .from("profiles")
            .select("nombre")
            .eq("id", user.id)
            .single();

          if (profileData) {
            setUserName(profileData.nombre);
          }

          const { data: tecnicoData } = await supabase
            .from("tecnico_profile")
            .select("is_validated, especialidad_principal")
            .eq("user_id", user.id)
            .single();

          setIsValidated(tecnicoData?.is_validated || false);
          setTechnicianSpecialty(tecnicoData?.especialidad_principal || "");

          // Fetch tickets matching technician's specialty
          if (tecnicoData?.is_validated && tecnicoData?.especialidad_principal) {
            // Get tecnico_profile id
            const { data: tecnicoProfileData } = await supabase
              .from("tecnico_profile")
              .select("id")
              .eq("user_id", user.id)
              .single();

            if (tecnicoProfileData) {
              // Fetch tickets with technician's quotes
              const { data: cotizacionesData } = await supabase
                .from("cotizacion")
                .select("ticket_id")
                .eq("tecnico_id", tecnicoProfileData.id);

              if (cotizacionesData && cotizacionesData.length > 0) {
                const quotedTicketIds = cotizacionesData.map(c => c.ticket_id);
                setQuotedTicketIds(quotedTicketIds);
                
                const { data: quotedTicketsData } = await supabase
                  .from("ticket")
                  .select("*")
                  .in("id", quotedTicketIds)
                  .order("created_at", { ascending: false });

                if (quotedTicketsData) {
                  setQuotedTickets(quotedTicketsData);
                }
              }
            }

            // Fetch available tickets (case-insensitive category match)
            // Exclude tickets that the technician has already quoted
            const { data: ticketsData } = await supabase
              .from("ticket")
              .select("*")
              .ilike("categoria", tecnicoData.especialidad_principal)
              .in("estado", ["abierto", "cotizando"])
              .not("id", "in", `(${quotedTicketIds.length > 0 ? quotedTicketIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
              .order("created_at", { ascending: false });

            if (ticketsData) {
              setTickets(ticketsData);
            }
          }
        }
      } catch (error) {
        console.error("Error checking validation:", error);
      } finally {
        setLoading(false);
      }
    };

    checkValidationAndFetchTickets();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TechnicianHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Message */}
        {userName && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              ¡Bienvenido, {userName}!
            </h1>
          </div>
        )}

        {/* Validation Warning */}
        {!loading && isValidated === false && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cuenta pendiente de validación</AlertTitle>
            <AlertDescription>
              Tu cuenta de técnico está siendo revisada por nuestro equipo. Una vez aprobada, 
              podrás acceder a todos los trabajos disponibles y comenzar a enviar cotizaciones. 
              Te notificaremos por correo cuando tu cuenta esté lista.
            </AlertDescription>
          </Alert>
        )}

        {/* Quoted Tickets Section - Always visible */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Mis Cotizaciones</h2>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {quotedTickets.length}
            </Badge>
          </div>
          {quotedTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quotedTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-xl">{ticket.titulo}</CardTitle>
                      <div className="flex flex-col gap-2">
                        <Badge variant="secondary">{ticket.categoria}</Badge>
                        {ticket.estado === "en_progreso" && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500">
                            En Progreso
                          </Badge>
                        )}
                        {ticket.estado === "cotizando" && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500">
                            Cotizando
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground text-sm">{ticket.descripcion}</p>
                    
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{ticket.comuna}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Publicado {new Date(ticket.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => window.location.href = `/tecnico/ticket/${ticket.id}`}
                    >
                      Ver Detalles
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Aún no has enviado cotizaciones. Los tickets que cotices aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Title and Filters */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Nuevos Trabajos Disponibles</h2>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtrar por Comuna
            </Button>
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => {
            const isQuoted = quotedTicketIds.includes(ticket.id);
            return (
              <Card key={ticket.id} className={`hover:shadow-lg transition-shadow ${isQuoted ? 'border-blue-500/50 bg-blue-50/5' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">{ticket.titulo}</CardTitle>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary">{ticket.categoria}</Badge>
                      {isQuoted && (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500">
                          Ya Cotizado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">{ticket.descripcion}</p>
                
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{ticket.comuna}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Publicado {new Date(ticket.created_at).toLocaleDateString('es-CL')}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = `/tecnico/ticket/${ticket.id}`}
                >
                  {isQuoted ? "Ver/Editar Cotización" : "Ver Detalles"}
                </Button>
              </CardFooter>
            </Card>
          );
          })}
        </div>

        {/* Empty State */}
        {tickets.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No hay trabajos disponibles en tu especialidad en este momento.
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Revisa más tarde para ver nuevas oportunidades.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TechnicianDashboard;
