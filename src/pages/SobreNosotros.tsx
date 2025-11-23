import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Eye, Lightbulb, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";
import diegoPhoto from "@/assets/diego-polanco.png";
import felipePhoto from "@/assets/felipe-vidal.png";
import luisPhoto from "@/assets/luis-salgado.png";

const SobreNosotros = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const team = [
    {
      name: "Diego Polanco",
      role: "Co-Fundador & Desarrollador",
      initials: "DP",
      photo: diegoPhoto,
    },
    {
      name: "Felipe Vidal",
      role: "Co-Fundador & Desarrollador",
      initials: "FV",
      photo: felipePhoto,
    },
    {
      name: "Luis Salgado",
      role: "Co-Fundador & Desarrollador",
      initials: "LS",
      photo: luisPhoto,
    },
  ];

  const values = [
    {
      icon: Shield,
      title: "Seguridad",
      description: "Protegemos cada transacción con validación de técnicos y sistema de pago protegido.",
    },
    {
      icon: Eye,
      title: "Transparencia",
      description: "Sistema de cotizaciones claro, sin sorpresas ni costos ocultos.",
    },
    {
      icon: Lightbulb,
      title: "Innovación",
      description: "Usamos tecnología para profesionalizar una industria que lo necesita.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm font-medium">Proyecto de Título INACAP</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              De las aulas de INACAP a solucionar un problema real.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Somos un equipo de futuros ingenieros comprometidos con la transformación digital de los servicios técnicos en Chile.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-6">Nuestra Historia</h2>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                TecWork nació como un <strong className="text-foreground">Proyecto de Título</strong> de estudiantes de Ingeniería en INACAP. 
                Lo que comenzó como un desafío académico se convirtió en una solución real para un problema que afecta a miles de chilenos: 
                la <strong className="text-foreground">informalidad y desconfianza</strong> en los servicios técnicos.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Detectamos que tanto clientes como técnicos sufrían las consecuencias de un mercado sin regulación: 
                estafas, trabajos mal ejecutados, y la imposibilidad de encontrar profesionales confiables.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Decidimos usar la tecnología para crear una plataforma donde la <strong className="text-foreground">Confianza</strong> y 
                la <strong className="text-foreground">Validación</strong> fueran la base de cada transacción. 
                Nuestro objetivo es <strong className="text-foreground">profesionalizar la industria</strong> y brindar seguridad tanto a clientes como a técnicos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Nuestros Valores</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">El Equipo</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tres estudiantes de Ingeniería de INACAP unidos por la pasión de crear soluciones tecnológicas con impacto social.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                    <AvatarImage src={member.photo} alt={member.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-foreground mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SobreNosotros;
