import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Briefcase, CheckCircle2 } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { useToast } from "@/hooks/use-toast";

interface TechnicianWithProfile {
  id: string;
  especialidad_principal: string;
  descripcion_perfil: string | null;
  comunas_cobertura: string[] | null;
  is_validated: boolean;
  profiles: {
    nombre: string;
    telefono: string;
  };
  calificaciones: { puntaje: number }[];
}

const BrowseTechnicians = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [technicians, setTechnicians] = useState<TechnicianWithProfile[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<TechnicianWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string | null>(null);

  const especialidades = [
    "Gasfitería",
    "Electricidad",
    "Reparaciones",
    "Soporte TI",
    "Carpintería",
    "Pintura",
  ];

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    filterTechnicians();
  }, [searchTerm, selectedEspecialidad, technicians]);

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from("tecnico_profile")
        .select(`
          id,
          especialidad_principal,
          descripcion_perfil,
          comunas_cobertura,
          is_validated,
          user_id,
          profiles!inner (
            nombre,
            telefono
          )
        `)
        .eq("is_validated", true);

      if (error) throw error;

      // Fetch ratings for each technician
      const techniciansWithRatings = await Promise.all(
        (data || []).map(async (tech: any) => {
          const { data: ratings } = await supabase
            .from("calificacion")
            .select("puntaje")
            .eq("tecnico_id", tech.id);

          return {
            ...tech,
            calificaciones: ratings || [],
          };
        })
      );

      setTechnicians(techniciansWithRatings);
      setFilteredTechnicians(techniciansWithRatings);
    } catch (error: any) {
      console.error("Error fetching technicians:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los técnicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTechnicians = () => {
    let filtered = [...technicians];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (tech) =>
          tech.profiles.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.especialidad_principal.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.descripcion_perfil?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by especialidad
    if (selectedEspecialidad) {
      filtered = filtered.filter(
        (tech) => tech.especialidad_principal === selectedEspecialidad
      );
    }

    setFilteredTechnicians(filtered);
  };

  const calculateAverageRating = (ratings: { puntaje: number }[]) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.puntaje, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ClientHeader />
        <div className="container py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      <main className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Encuentra un Técnico
          </h1>
          <p className="text-muted-foreground">
            Busca profesionales validados en tu área
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre, especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-2 focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Filtrar por Especialidad</h2>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedEspecialidad === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedEspecialidad(null)}
            >
              Todas
            </Badge>
            {especialidades.map((esp) => (
              <Badge
                key={esp}
                variant={selectedEspecialidad === esp ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedEspecialidad(esp)}
              >
                {esp}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredTechnicians.length} técnico{filteredTechnicians.length !== 1 ? "s" : ""} encontrado{filteredTechnicians.length !== 1 ? "s" : ""}
        </p>

        {/* Technicians Grid */}
        {filteredTechnicians.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No se encontraron técnicos con esos criterios
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTechnicians.map((tech) => (
              <Card
                key={tech.id}
                className="hover:shadow-lg transition-smooth cursor-pointer border-2 hover:border-primary"
                onClick={() => navigate(`/tecnico/${tech.id}`)}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {tech.profiles.nombre}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{tech.especialidad_principal}</span>
                      </div>
                    </div>
                    {tech.is_validated && (
                      <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-foreground">
                        {calculateAverageRating(tech.calificaciones)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({tech.calificaciones.length} reseñas)
                    </span>
                  </div>

                  {/* Description */}
                  {tech.descripcion_perfil && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {tech.descripcion_perfil}
                    </p>
                  )}

                  {/* Coverage Areas */}
                  {tech.comunas_cobertura && tech.comunas_cobertura.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Cobertura:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tech.comunas_cobertura.slice(0, 3).map((comuna, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {comuna}
                          </Badge>
                        ))}
                        {tech.comunas_cobertura.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tech.comunas_cobertura.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button className="w-full" variant="outline">
                    Ver Perfil Completo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseTechnicians;
