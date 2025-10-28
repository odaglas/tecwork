import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star, Shield, Award, CheckCircle2, MapPin, Briefcase } from "lucide-react";

const reviews = [
  {
    id: 1,
    clientName: "María González",
    rating: 5,
    comment: "Excelente trabajo! Muy profesional y ordenado. Solucionó el problema de la fuga en menos de una hora. 100% recomendado.",
    date: "Hace 2 días",
  },
  {
    id: 2,
    clientName: "Carlos Ramírez",
    rating: 5,
    comment: "Llegó puntual, trabajó muy bien y dejó todo limpio. El precio justo por el servicio realizado.",
    date: "Hace 1 semana",
  },
  {
    id: 3,
    clientName: "Andrea Silva",
    rating: 4,
    comment: "Buen trabajo en general. Resolvió el problema del lavamanos. Solo le faltó explicar mejor el proceso.",
    date: "Hace 2 semanas",
  },
];

const certifications = [
  {
    name: "Certificación SEC Vigente",
    issuer: "Superintendencia de Electricidad y Combustibles",
    date: "Válida hasta Diciembre 2025",
  },
  {
    name: "Técnico en Gasfitería",
    issuer: "INACAP",
    date: "2019",
  },
];

const TechnicianProfile = () => {
  const averageRating = 4.9;
  const totalJobs = 32;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="/cliente">
                <ArrowLeft className="h-6 w-6" />
              </a>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-primary">TecWork</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6 border-2">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex justify-center md:justify-start">
                <Avatar className="w-32 h-32 border-4 border-primary/20">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felipe" alt="Felipe Vidal" />
                  <AvatarFallback className="text-3xl font-bold">FV</AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">Felipe Vidal</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.floor(averageRating)
                            ? "fill-success text-success"
                            : star - averageRating < 1
                            ? "fill-success/50 text-success"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-foreground">
                    {averageRating} estrellas
                  </span>
                  <span className="text-muted-foreground">({totalJobs} trabajos)</span>
                </div>

                {/* Location & Experience */}
                <div className="flex flex-wrap gap-4 mb-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Santiago, Providencia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>6 años de experiencia</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button variant="success" size="lg" className="w-full md:w-auto">
                  Solicitar Cotización
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Badges Section - PROMINENT */}
        <Card className="mb-6 border-2 border-success/30 bg-success/5 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-success" />
              <h2 className="text-2xl font-bold text-foreground">Insignias de Confianza</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Badge 1: TecWork Validated */}
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border-2 border-success/40">
                <div className="p-2 bg-success rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-success-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Técnico Validado por TecWork
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Identidad y antecedentes verificados
                  </p>
                </div>
              </div>

              {/* Badge 2: SEC Certification */}
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border-2 border-primary/40">
                <div className="p-2 bg-primary rounded-full">
                  <Award className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Certificación SEC Vigente
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Certificado profesional actualizado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card className="border-2">
          <CardContent className="p-0">
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                <TabsTrigger value="about" className="text-base">Sobre Mí</TabsTrigger>
                <TabsTrigger value="reviews" className="text-base">Calificaciones</TabsTrigger>
                <TabsTrigger value="certifications" className="text-base">Certificaciones</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Acerca de Felipe</h3>
                <p className="text-muted-foreground mb-4">
                  Técnico especialista en gasfitería con más de 6 años de experiencia. 
                  Me dedico a ofrecer soluciones rápidas y efectivas para problemas de 
                  plomería en hogares y oficinas.
                </p>
                <p className="text-muted-foreground mb-4">
                  Trabajo con las mejores herramientas y materiales del mercado. 
                  Mi prioridad es la satisfacción del cliente y dejar cada trabajo impecable.
                </p>
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-foreground">Especialidades:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Reparación de fugas</Badge>
                    <Badge variant="secondary">Instalación de cañerías</Badge>
                    <Badge variant="secondary">Destape de cañerías</Badge>
                    <Badge variant="secondary">Instalación de lavamanos</Badge>
                  </div>
                </div>
              </TabsContent>

              {/* Reviews Tab - DEFAULT SELECTED */}
              <TabsContent value="reviews" className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Calificaciones de Clientes
                </h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{review.clientName}</p>
                            <p className="text-sm text-muted-foreground">{review.date}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-success text-success"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Certifications Tab */}
              <TabsContent value="certifications" className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Certificaciones Profesionales
                </h3>
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Award className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground mb-1">{cert.issuer}</p>
                            <p className="text-sm font-medium text-success">{cert.date}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="mt-6 sticky bottom-4 z-10">
          <Card className="border-2 shadow-xl">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">¿Listo para trabajar con Felipe?</p>
                  <p className="text-sm text-muted-foreground">Respuesta promedio en 2 horas</p>
                </div>
                <Button variant="success" size="lg">
                  Solicitar Cotización
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TechnicianProfile;
