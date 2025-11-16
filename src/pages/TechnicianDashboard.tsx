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
}

const TechnicianDashboard = () => {
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicianSpecialty, setTechnicianSpecialty] = useState<string>("");

  useEffect(() => {
    const checkValidationAndFetchTickets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: tecnicoData } = await supabase
            .from("tecnico_profile")
            .select("is_validated, especialidad_principal")
            .eq("user_id", user.id)
            .single();

          setIsValidated(tecnicoData?.is_validated || false);
          setTechnicianSpecialty(tecnicoData?.especialidad_principal || "");

          // Fetch tickets matching technician's specialty
          if (tecnicoData?.is_validated && tecnicoData?.especialidad_principal) {
            const { data: ticketsData } = await supabase
              .from("ticket")
              .select("*")
              .eq("categoria", tecnicoData.especialidad_principal)
              .in("estado", ["abierto", "cotizando"])
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

        {/* Title and Filters */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Nuevos Trabajos Disponibles</h1>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtrar por Comuna
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtrar por Categoría
            </Button>
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl">{ticket.titulo}</CardTitle>
                  <Badge variant="secondary">{ticket.categoria}</Badge>
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
                  Cotizar
                </Button>
              </CardFooter>
            </Card>
          ))}
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
