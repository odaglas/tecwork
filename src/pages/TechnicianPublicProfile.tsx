import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Star, CheckCircle2, Briefcase, Award, Shield } from "lucide-react";
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
  email: string;
  profile_picture_url: string | null;
}

interface Rating {
  puntaje: number;
  comentario: string | null;
  created_at: string;
  cliente_id: string;
  profiles?: {
    nombre: string;
  };
}

interface Certification {
  id: string;
  nombre_documento: string;
  archivo_url: string;
  estado: string;
  created_at: string;
}

const TechnicianPublicProfile = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [tecnicoProfile, setTecnicoProfile] = useState<TechnicianProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [completedJobs, setCompletedJobs] = useState<number>(0);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [hasSECCert, setHasSECCert] = useState<boolean>(false);
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

        // Fetch basic profile info
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nombre, email, profile_picture_url")
          .eq("id", tecnicoData.user_id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch ratings with client names
        const { data: ratingsData } = await supabase
          .from("calificacion")
          .select(`
            puntaje, 
            comentario, 
            created_at,
            cliente_id,
            cliente_profile!inner(user_id),
            profiles:cliente_profile(profiles(nombre))
          `)
          .eq("tecnico_id", id)
          .order("created_at", { ascending: false });

        if (ratingsData) {
          const formattedRatings = ratingsData.map((r: any) => ({
            puntaje: r.puntaje,
            comentario: r.comentario,
            created_at: r.created_at,
            cliente_id: r.cliente_id,
            profiles: r.profiles?.[0] || null
          }));
          setRatings(formattedRatings);
          const avg = ratingsData.reduce((sum, r) => sum + r.puntaje, 0) / ratingsData.length;
          setAverageRating(avg || 0);
        }

        // Count completed jobs
        const { data: acceptedCotizaciones } = await supabase
          .from("cotizacion")
          .select("ticket_id")
          .eq("tecnico_id", id)
          .eq("estado", "aceptada");

        if (acceptedCotizaciones && acceptedCotizaciones.length > 0) {
          const ticketIds = acceptedCotizaciones.map(c => c.ticket_id);
          const { count: jobsCount } = await supabase
            .from("ticket")
            .select("*", { count: 'exact', head: true })
            .in("id", ticketIds)
            .eq("estado", "finalizado");

          setCompletedJobs(jobsCount || 0);
        } else {
          setCompletedJobs(0);
        }

        // Fetch certifications
        const { data: certsData } = await supabase
          .from("documentacion_tecnico")
          .select("*")
          .eq("tecnico_id", id)
          .eq("estado", "aprobado")
          .order("created_at", { ascending: false });

        if (certsData) {
          setCertifications(certsData);
          // Check if has SEC certification
          const hasSEC = certsData.some(cert => 
            cert.nombre_documento.toLowerCase().includes("sec")
          );
          setHasSECCert(hasSEC);
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
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex flex-col items-center md:items-start gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.profile_picture_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.nombre}`} />
                  <AvatarFallback className="text-3xl">{profile.nombre.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold">{profile.nombre}</h1>
                  <p className="text-muted-foreground">{tecnicoProfile.especialidad_principal}</p>
                </div>
              </div>

              {/* Stats and Badges */}
              <div className="flex-1 space-y-4">
                {/* Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    <div>
                      <div className="font-bold">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">
                        {ratings.length} {ratings.length === 1 ? 'reseña' : 'reseñas'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-secondary-foreground" />
                    <div>
                      <div className="font-bold">{completedJobs}</div>
                      <div className="text-xs text-muted-foreground">trabajos realizados</div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                {(tecnicoProfile.is_validated || hasSECCert) && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Insignias de Confianza
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tecnicoProfile.is_validated && (
                        <Badge className="gap-2 bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20">
                          <CheckCircle2 className="h-4 w-4" />
                          Técnico Validado por TecWork
                        </Badge>
                      )}
                      {hasSECCert && (
                        <Badge className="gap-2 bg-blue-500/10 text-blue-700 border-blue-500/30 hover:bg-blue-500/20">
                          <Award className="h-4 w-4" />
                          Certificación SEC Vigente
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="calificaciones" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="sobre-mi">Sobre Mí</TabsTrigger>
                <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>
                <TabsTrigger value="certificaciones">Certificaciones</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre-mi" className="mt-6 space-y-6">
                {tecnicoProfile.descripcion_perfil && (
                  <div>
                    <h3 className="font-semibold mb-2">Descripción</h3>
                    <p className="text-muted-foreground">{tecnicoProfile.descripcion_perfil}</p>
                  </div>
                )}

                {tecnicoProfile.comunas_cobertura && tecnicoProfile.comunas_cobertura.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
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

                <div>
                  <h3 className="font-semibold mb-2">Especialidad</h3>
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {tecnicoProfile.especialidad_principal}
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="calificaciones" className="mt-6">
                {ratings.length > 0 ? (
                  <div className="space-y-4">
                    {ratings.map((rating, index) => (
                      <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
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
                              {rating.profiles?.nombre && (
                                <span className="text-sm font-medium">{rating.profiles.nombre}</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(rating.created_at).toLocaleDateString('es-CL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        {rating.comentario && (
                          <p className="text-muted-foreground mt-2">{rating.comentario}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aún no hay calificaciones para este técnico
                  </p>
                )}
              </TabsContent>

              <TabsContent value="certificaciones" className="mt-6">
                {certifications.length > 0 ? (
                  <div className="space-y-3">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{cert.nombre_documento}</p>
                            <p className="text-xs text-muted-foreground">
                              Aprobado el {new Date(cert.created_at).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(cert.archivo_url, '_blank')}
                        >
                          Ver documento
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay certificaciones disponibles
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicianPublicProfile;
