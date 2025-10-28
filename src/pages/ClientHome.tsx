import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Droplet, Zap, Wrench, Monitor, Clock } from "lucide-react";

const categories = [
  { icon: Droplet, label: "Gasfitería", color: "text-primary" },
  { icon: Zap, label: "Electricidad", color: "text-primary" },
  { icon: Wrench, label: "Reparaciones", color: "text-primary" },
  { icon: Monitor, label: "Soporte TI", color: "text-primary" },
];

const ClientHome = () => {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-primary">TecWork</span>
            </div>
            
            <button className="relative p-2 hover:bg-accent rounded-full transition-fast">
              <Bell className="h-6 w-6 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
          ¿Qué servicio necesitas hoy?
        </h1>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ej: Electricista, Gásfiter..."
            className="pl-12 h-14 text-lg border-2 focus:border-primary shadow-md"
          />
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category.label}
                className="hover:shadow-lg transition-smooth cursor-pointer border-2 hover:border-primary group"
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary transition-smooth">
                    <category.icon className={`h-8 w-8 ${category.color} group-hover:text-primary-foreground transition-smooth`} />
                  </div>
                  <span className="font-semibold text-foreground">{category.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <Button
            variant="success"
            size="lg"
            className="w-full md:w-auto text-lg px-8 py-6"
          >
            Crear un Ticket de Servicio
          </Button>
        </div>

        {/* Active Tickets Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Mis Tickets Activos</h2>
          
          <Card className="border-2 hover:shadow-lg transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Fuga de agua en lavamanos
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Creado hace 2 horas</span>
                  </div>
                  <Badge className="bg-success/10 text-success border-success hover:bg-success/20">
                    Esperando cotizaciones
                  </Badge>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/tecnico/felipe-vidal">Ver Detalles</a>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Cancelar Ticket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClientHome;
