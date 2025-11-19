import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users, GraduationCap, Heart, Target } from "lucide-react";

const SobreNosotros = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">Sobre Nosotros</h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-card border border-border rounded-lg p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground m-0">Nuestro Origen</h2>
              </div>
              <p className="text-muted-foreground">
                TecWork nace como un proyecto innovador desarrollado por un grupo de estudiantes de INACAP, 
                la Universidad Tecnológica de Chile. Nuestro equipo multidisciplinario combina conocimientos 
                en desarrollo de software, diseño de experiencia de usuario y gestión de proyectos para crear 
                una solución que conecte a clientes con técnicos profesionales de manera eficiente y segura.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground m-0">Nuestra Misión</h2>
              </div>
              <p className="text-muted-foreground">
                Facilitar el acceso a servicios técnicos de calidad, creando un puente digital entre 
                profesionales validados y clientes que necesitan soluciones confiables. Buscamos democratizar 
                el acceso a servicios técnicos especializados y contribuir al desarrollo económico de técnicos 
                independientes en todo Chile.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground m-0">Nuestros Valores</h2>
              </div>
              <ul className="text-muted-foreground space-y-3">
                <li><strong className="text-foreground">Innovación:</strong> Aplicamos las últimas tecnologías para resolver problemas reales</li>
                <li><strong className="text-foreground">Confianza:</strong> Validamos a cada técnico para garantizar servicios de calidad</li>
                <li><strong className="text-foreground">Transparencia:</strong> Sistema de cotizaciones claro y proceso de pago seguro</li>
                <li><strong className="text-foreground">Compromiso Social:</strong> Apoyamos el emprendimiento y el trabajo independiente</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground m-0">El Equipo</h2>
              </div>
              <p className="text-muted-foreground">
                Somos estudiantes apasionados por la tecnología y la innovación, comprometidos con crear 
                soluciones que generen un impacto positivo en la comunidad. Este proyecto representa no solo 
                nuestro aprendizaje académico, sino también nuestra visión de cómo la tecnología puede mejorar 
                la vida de las personas y facilitar el acceso a servicios esenciales.
              </p>
              <p className="text-muted-foreground mt-4">
                Desarrollado con dedicación en INACAP, Universidad Tecnológica de Chile.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SobreNosotros;
