import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicianHeader } from "@/components/TechnicianHeader";

const TechnicianTicketDetail = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual data from API/state
  const ticket = {
    id: "1",
    titulo: "Instalación de Lámpara",
    descripcion: "Necesito instalar una lámpara de techo en el living, ya tengo la lámpara y los tarugos. El techo es de concreto y necesito que traigan las herramientas necesarias para la instalación.",
    comuna: "Providencia",
    estado: "abierto",
    fotos: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ]
  };

  const handleSendQuote = () => {
    console.log("Opening quote form for ticket:", ticket.id);
    navigate(`/tecnico/cotizar/${ticket.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <TechnicianHeader />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Title, Location and Status */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h1 className="text-3xl font-bold text-foreground">{ticket.titulo}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{ticket.comuna}</span>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
            >
              Buscando Técnico
            </Badge>
          </div>
        </div>

        {/* Client Description Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descripción del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {ticket.descripcion}
            </p>
          </CardContent>
        </Card>

        {/* Client Photos Section */}
        {ticket.fotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fotos del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ticket.fotos.map((foto, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted hover:border-primary transition-colors cursor-pointer"
                  >
                    <img
                      src={foto}
                      alt={`Foto del cliente ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Send Quote Button */}
        <div className="pt-4">
          <Button
            variant="default"
            size="lg"
            className="w-full text-lg py-6"
            onClick={handleSendQuote}
          >
            Enviar Cotización
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TechnicianTicketDetail;
