import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Star, CheckCircle2, Briefcase } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { useToast } from "@/hooks/use-toast";

interface TechnicianProfile {
  id: string;
  especialidad_principal: string;
  descripcion_perfil: string | null;
  comunas_cobertura: string[] | null;
  is_validated: boolean;
  user_id: string;
}

interface Profile {
  nombre: string;
}

interface Rating {
  puntaje: number;
  comentario: string | null;
  created_at: string;
}

const TechnicianPublicProfile = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [tecnicoProfile, setTecnicoProfile] = useState<TechnicianProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnicianData = async () => {
      try {
        // Fetch tecnico profile
        const { data: tecnicoData, error: tecnicoError } = await supabase
          .from("tecnico_profile")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (tecnicoError) throw tecnicoError;

        if (!tecnicoData) {
          toast({
            title: "Técnico no encontrado",
            description: "No se pudo encontrar el perfil del técnico",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!tecnicoData.is_validated) {
          toast({
            title: "Técnico no disponible",
            description: "Este técnico aún no ha sido validado",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setTecnicoProfile(tecnicoData);

        // Fetch basic profile info (only nombre, no contact details for clientes)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nombre")
          .eq("id", tecnicoData.user_id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch ratings
        const { data: ratingsData } = await supabase
          .from("calificacion")
          .select("puntaje, comentario, created_at")
          .eq("tecnico_id", id)
          .order("created_at", { ascending: false });

        if (ratingsData) {
          setRatings(ratingsData);
          const avg = ratingsData.reduce((sum, r) => sum + r.puntaje, 0) / ratingsData.length;
          setAverageRating(avg || 0);
        }
      } catch (error: any) {
        console.error("Error fetching technician data:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información del técnico",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTechnicianData();
    }
  }, [id, toast]);

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

  if (!tecnicoProfile || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <ClientHeader />
        <div className="container py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No se encontró el técnico</p>
              <Button className="mt-4" asChild>
                <Link to="/cliente/home">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      <div className="container py-8 space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/cliente/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl">{profile.nombre}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {tecnicoProfile.especialidad_principal}
                  </Badge>
                  {tecnicoProfile.is_validated && (
                    <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>
              {averageRating > 0 && (
                <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-lg">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({ratings.length})</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {tecnicoProfile.descripcion_perfil && (
              <div>
                <h3 className="font-semibold mb-2">Sobre el técnico</h3>
                <p className="text-muted-foreground">{tecnicoProfile.descripcion_perfil}</p>
              </div>
            )}

            {tecnicoProfile.comunas_cobertura && tecnicoProfile.comunas_cobertura.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Comunas de cobertura
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tecnicoProfile.comunas_cobertura.map((comuna) => (
                    <Badge key={comuna} variant="outline">
                      {comuna}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {ratings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Calificaciones y comentarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratings.map((rating, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating.puntaje
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.comentario && (
                    <p className="text-muted-foreground">{rating.comentario}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TechnicianPublicProfile;
