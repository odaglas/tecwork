import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";

const CompareQuotes = () => {
  const navigate = useNavigate();

  const quotes = [
    {
      id: 1,
      technicianName: "Felipe Vidal",
      rating: 4.9,
      price: "$45.000",
      profileLink: "/tecnico/1",
    },
    {
      id: 2,
      technicianName: "María González",
      rating: 4.8,
      price: "$42.000",
      profileLink: "/tecnico/2",
    },
    {
      id: 3,
      technicianName: "Carlos Muñoz",
      rating: 4.7,
      price: "$48.000",
      profileLink: "/tecnico/3",
    },
  ];

  const handleAcceptQuote = (technicianName: string, price: string) => {
    // TODO: Implement payment logic
    console.log(`Accepting quote from ${technicianName} for ${price}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground hover:text-primary transition-fast"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Link to="/inicio" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-primary">TecWork</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Cotizaciones Recibidas ({quotes.length})
          </h1>
          <p className="text-lg text-muted-foreground">
            Fuga de agua en lavamanos
          </p>
        </div>

        {/* Quotes List */}
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="p-6 hover:shadow-lg transition-smooth">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section: Technician Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {quote.technicianName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-foreground">
                          {quote.rating}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">estrellas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-primary">
                      {quote.price}
                    </div>
                    <Link
                      to={quote.profileLink}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Ver Perfil
                    </Link>
                  </div>
                </div>

                {/* Right Section: Accept Button */}
                <div className="sm:ml-4">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleAcceptQuote(quote.technicianName, quote.price)}
                    className="w-full sm:w-auto"
                  >
                    Aceptar y Pagar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Message */}
        <div className="mt-8 p-4 bg-accent rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Al aceptar una cotización, serás redirigido al pago seguro y el técnico será notificado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompareQuotes;
