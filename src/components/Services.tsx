import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Zap, Droplet, Hammer, PaintBucket, Wind } from "lucide-react";

const services = [
  {
    icon: Droplet,
    title: "Plomería",
    description: "Instalaciones, reparaciones y mantención de sistemas de agua",
  },
  {
    icon: Zap,
    title: "Electricidad",
    description: "Trabajos eléctricos certificados y seguros para tu hogar",
  },
  {
    icon: Wind,
    title: "Climatización",
    description: "Instalación y mantención de aires acondicionados",
  },
  {
    icon: PaintBucket,
    title: "Pintura",
    description: "Pintores profesionales para interior y exterior",
  },
  {
    icon: Hammer,
    title: "Construcción",
    description: "Maestros y contratistas para remodelaciones",
  },
  {
    icon: Wrench,
    title: "Mantenimiento",
    description: "Técnicos generales para reparaciones del hogar",
  },
];

export const Services = () => {
  return (
    <section className="py-20 bg-secondary">
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
