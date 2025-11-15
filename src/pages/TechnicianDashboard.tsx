import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Clock, Filter, AlertCircle } from "lucide-react";
import { TechnicianHeader } from "@/components/TechnicianHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TechnicianDashboard = () => {
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkValidation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("tecnico_profile")
            .select("is_validated")
            .eq("user_id", user.id)
            .single();

          setIsValidated(data?.is_validated || false);
        }
      } catch (error) {
        console.error("Error checking validation:", error);
      } finally {
        setLoading(false);
      }
    };

    checkValidation();
  }, []);
  const availableJobs = [
    {
      id: 1,
      title: "Instalación de Lámpara",
      location: "Providencia",
      postedTime: "Publicado hace 15 minutos",
      category: "Electricidad",
      description: "Necesito instalar una lámpara de techo en el living principal.",
    },
    {
      id: 2,
      title: "Reparación de Llave de Agua",
      location: "Las Condes",
      postedTime: "Publicado hace 1 hora",
      category: "Gasfitería",
      description: "Llave de la cocina presenta goteo constante y necesita reparación urgente.",
    },
    {
      id: 3,
      title: "Instalación de Enchufe Adicional",
      location: "Ñuñoa",
      postedTime: "Publicado hace 2 horas",
      category: "Electricidad",
      description: "Requiero instalación de dos enchufes adicionales en el dormitorio.",
    },
    {
      id: 4,
      title: "Cambio de Cañería bajo Lavamanos",
      location: "Vitacura",
      postedTime: "Publicado hace 3 horas",
      category: "Gasfitería",
      description: "Cañería oxidada bajo lavamanos del baño necesita ser reemplazada.",
    },
  ];

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
          {availableJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <Badge variant="secondary">{job.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">{job.description}</p>
                
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{job.postedTime}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = `/tecnico/ticket/${job.id}`}
                >
                  Cotizar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty State (hidden when jobs exist) */}
        {availableJobs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No hay trabajos disponibles en este momento.
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
