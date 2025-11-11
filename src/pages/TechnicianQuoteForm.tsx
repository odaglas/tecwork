import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const TechnicianQuoteForm = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [valorTotal, setValorTotal] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tiempoEstimadoDias, setTiempoEstimadoDias] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement quote submission logic
    console.log("Submit quote:", { 
      ticketId, 
      valorTotal, 
      descripcion, 
      tiempoEstimadoDias 
    });
    // Redirigir al dashboard del técnico después de enviar
    navigate("/tecnico/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">Enviar Cotización</h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Cotizar Trabajo
          </h1>
          <p className="text-muted-foreground">
            Completa los detalles de tu cotización para enviarla al cliente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Valor Total */}
          <div className="space-y-2">
            <Label htmlFor="valorTotal">Valor Total (CLP)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="valorTotal"
                type="number"
                placeholder="45000"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                className="pl-8"
                required
                min="1000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa el costo total del trabajo
            </p>
          </div>

          {/* Descripción del Trabajo */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción del Trabajo</Label>
            <Textarea
              id="descripcion"
              placeholder="Detalla qué trabajo realizarás, materiales incluidos, etc..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="min-h-[150px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Sé claro y específico sobre lo que incluye tu servicio
            </p>
          </div>

          {/* Tiempo Estimado */}
          <div className="space-y-2">
            <Label htmlFor="tiempoEstimadoDias">Tiempo Estimado (días)</Label>
            <Input
              id="tiempoEstimadoDias"
              type="number"
              placeholder="1"
              value={tiempoEstimadoDias}
              onChange={(e) => setTiempoEstimadoDias(e.target.value)}
              required
              min="1"
              max="30"
            />
            <p className="text-xs text-muted-foreground">
              ¿Cuántos días te tomará completar el trabajo?
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
            >
              Enviar Cotización al Cliente
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TechnicianQuoteForm;
