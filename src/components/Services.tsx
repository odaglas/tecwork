import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Zap, Droplet, Hammer, PaintBucket, Wind, Monitor } from "lucide-react";

const services = [
  {
    icon: Zap,
    title: "Electricidad",
    description: "Trabajos eléctricos certificados y seguros para tu hogar",
  },
  {
    icon: Droplet,
    title: "Gasfitería",
    description: "Instalaciones, reparaciones y mantención de sistemas de agua",
  },
  {
    icon: Monitor,
    title: "Soporte Informático",
    description: "Asistencia técnica en computadores y sistemas",
  },
  {
    icon: Wind,
    title: "Línea Blanca",
    description: "Reparación de electrodomésticos y lavadoras",
  },
  {
    icon: Hammer,
    title: "Carpintería",
    description: "Trabajos en madera y muebles a medida",
  },
  {
    icon: PaintBucket,
    title: "Mantenimiento General",
    description: "Técnicos generales para reparaciones del hogar",
  },
];

export const Services = () => {
  return (
    <section id="servicios" className="py-20 bg-secondary scroll-mt-16">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Servicios Disponibles
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra el técnico perfecto para cualquier necesidad de tu hogar
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card 
              key={service.title} 
              className="hover:shadow-lg transition-smooth border-2 hover:border-primary cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary transition-smooth">
                    <service.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-smooth" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
