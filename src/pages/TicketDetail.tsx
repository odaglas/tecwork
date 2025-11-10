import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TicketDetail = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual data from API/state
  const ticket = {
    id: "1",
    titulo: "Fuga de agua en lavamanos",
    descripcion: "El grifo del lavamanos del baño principal no para de gotear. He intentado cerrar la llave de paso pero el problema persiste. Necesito una solución urgente ya que está desperdiciando mucha agua.",
    estado: "cotizando",
    fotos: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    cotizaciones: []
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "cotizando":
        return { label: "Esperando cotizaciones", variant: "default" as const };
      case "en_progreso":
        return { label: "En progreso", variant: "secondary" as const };
      case "finalizado":
        return { label: "Finalizado", variant: "outline" as const };
      default:
        return { label: "Abierto", variant: "default" as const };
    }
  };

  const estadoBadge = getEstadoBadge(ticket.estado);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">Detalle de mi Ticket</h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Title and Status */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">{ticket.titulo}</h1>
            <Badge 
              variant="default" 
              className="bg-yellow-500 text-white hover:bg-yellow-600 whitespace-nowrap"
            >
              {estadoBadge.label}
            </Badge>
          </div>
        </div>

        {/* Description Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {ticket.descripcion}
            </p>
          </CardContent>
        </Card>

        {/* Photos Section */}
        {ticket.fotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fotos Adjuntadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {ticket.fotos.map((foto, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted hover:border-primary transition-colors cursor-pointer"
                  >
                    <img
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quotes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Cotizaciones Recibidas ({ticket.cotizaciones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground max-w-md">
                Serás notificado cuando los técnicos comiencen a enviar sus cotizaciones.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TicketDetail;
