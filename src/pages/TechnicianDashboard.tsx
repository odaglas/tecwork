import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Filter } from "lucide-react";
import { Link } from "react-router-dom";

const TechnicianDashboard = () => {
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
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-foreground">TecWork</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Felipe Vidal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
