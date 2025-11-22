import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const disputaSchema = z.object({
  motivo: z.string().min(1, "El motivo es requerido").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres"),
});

type DisputaFormValues = z.infer<typeof disputaSchema>;

interface DisputaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagoId: string;
  montoTotal: number;
  onSuccess?: () => void;
}

export default function DisputaDialog({
  open,
  onOpenChange,
  pagoId,
  montoTotal,
  onSuccess,
}: DisputaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<DisputaFormValues>({
    resolver: zodResolver(disputaSchema),
    defaultValues: {
      motivo: "",
      descripcion: "",
    },
  });

  const onSubmit = async (data: DisputaFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("create-disputa", {
        body: {
          pago_id: pagoId,
          motivo: data.motivo,
          descripcion: data.descripcion,
        },
      });

      if (error) throw error;

      toast({
        title: "Disputa Creada",
        description: "Tu disputa ha sido enviada al equipo de administración",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating dispute:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la disputa",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Disputa de Pago</DialogTitle>
          <DialogDescription>
            Reporta un problema con este pago de ${montoTotal.toLocaleString()}.
            El equipo de administración revisará tu caso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de la Disputa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Servicio no completado, Trabajo deficiente..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción Detallada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el problema en detalle..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium mb-1">Importante:</p>
                <p>
                  Al crear una disputa, el pago quedará retenido hasta que un
                  administrador revise el caso. Asegúrate de proporcionar toda la
                  información relevante.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Disputa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
