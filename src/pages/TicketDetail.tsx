import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientHeader } from "@/components/ClientHeader";

const TicketDetail = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual data from API/state
  const ticket = {
    id: "1",
    titulo: "Fuga de agua en lavamanos",
    descripcion: "El grifo del lavamanos del baño principal no para de gotear. He intentado cerrar la llave de paso pero el problema persiste. Necesito una solución urgente ya que está desperdiciando mucha agua.",
    estado: "listo_revisar",
    fotos: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    cotizaciones: [
      {
        id: "1",
        tecnico: {
          id: "t1",
          nombre: "Felipe Vidal",
          rating: 4.9
        },
        valor_total: 45000,
        descripcion: "Reparación de grifo con reemplazo de sello",
        tiempo_estimado_dias: 1
      },
      {
        id: "2",
        tecnico: {
          id: "t2",
          nombre: "María González",
          rating: 4.8
        },
        valor_total: 38000,
        descripcion: "Diagnóstico y reparación de fuga",
        tiempo_estimado_dias: 1
      },
      {
        id: "3",
        tecnico: {
          id: "t3",
          nombre: "Roberto Sánchez",
          rating: 5.0
        },
        valor_total: 52000,
        descripcion: "Reparación completa con garantía extendida",
        tiempo_estimado_dias: 2
      }
    ]
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAcceptQuote = (quoteId: string) => {
    console.log("Accepting quote:", quoteId);
    // Navigate to payment flow
  };

  const handleViewProfile = (tecnicoId: string) => {
    navigate(`/tecnico/perfil/${tecnicoId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Title and Status */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">{ticket.titulo}</h1>
            <Badge 
              variant="secondary" 
              className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
            >
              Listo para revisar
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
            <div className="space-y-4">
              {ticket.cotizaciones.map((cotizacion) => (
                <Card key={cotizacion.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left side - Technician info */}
                      <div className="space-y-2 flex-1">
                        <h3 className="text-xl font-semibold text-foreground">
                          {cotizacion.tecnico.nombre}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-foreground">
                              {cotizacion.tecnico.rating}
                            </span>
                            <span className="text-muted-foreground">estrellas</span>
                          </div>
                        </div>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary hover:underline"
                          onClick={() => handleViewProfile(cotizacion.tecnico.id)}
                        >
                          Ver Perfil del Técnico
                        </Button>
                      </div>

                      {/* Right side - Price and action */}
                      <div className="flex flex-col items-end gap-3 md:min-w-[200px]">
                        <div className="text-3xl font-bold text-foreground">
                          {formatPrice(cotizacion.valor_total)}
                        </div>
                        <Button
                          variant="success"
                          size="lg"
                          className="w-full md:w-auto"
                          onClick={() => handleAcceptQuote(cotizacion.id)}
                        >
                          Aceptar y Pagar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TicketDetail;
