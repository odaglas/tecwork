import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CalificacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  tecnicoId: string;
  clienteId: string;
  onSuccess: () => void;
}

export function CalificacionDialog({
  open,
  onOpenChange,
  ticketId,
  tecnicoId,
  clienteId,
  onSuccess
}: CalificacionDialogProps) {
  const [puntaje, setPuntaje] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (puntaje === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, update ticket status to finalizado
      const { error: ticketError } = await supabase
        .from("ticket")
        .update({ estado: "finalizado" })
        .eq("id", ticketId);

      if (ticketError) throw ticketError;

      // Create calificacion
      const { error: calificacionError } = await supabase
        .from("calificacion")
        .insert({
          ticket_id: ticketId,
          tecnico_id: tecnicoId,
          cliente_id: clienteId,
          puntaje,
          comentario: comentario.trim() || null,
        });

      if (calificacionError) throw calificacionError;

      toast({
        title: "¡Gracias!",
        description: "Tu calificación ha sido enviada exitosamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calificar Trabajo</DialogTitle>
          <DialogDescription>
            ¿Cómo fue tu experiencia con este técnico?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setPuntaje(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredStar || puntaje)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentario (opcional)
            </label>
            <Textarea
              placeholder="Comparte tu experiencia..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comentario.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || puntaje === 0}
          >
            {isSubmitting ? "Enviando..." : "Enviar Calificación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
