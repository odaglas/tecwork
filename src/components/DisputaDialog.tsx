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
import { AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<DisputaFormValues>({
    resolver: zodResolver(disputaSchema),
    defaultValues: {
      motivo: "",
      descripcion: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no puede superar los 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: DisputaFormValues) => {
    setIsSubmitting(true);
    try {
      let imagenUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `disputas/${pagoId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tecnico-documents')
          .upload(filePath, imageFile);

        if (uploadError) {
          toast({
            title: "Error",
            description: "Error al subir la imagen",
            variant: "destructive",
          });
          console.error(uploadError);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('tecnico-documents')
          .getPublicUrl(filePath);

        imagenUrl = urlData.publicUrl;
      }

      const { error } = await supabase.functions.invoke("create-disputa", {
        body: {
          pago_id: pagoId,
          motivo: data.motivo,
          descripcion: data.descripcion,
          imagen_url: imagenUrl,
        },
      });

      if (error) throw error;

      toast({
        title: "Disputa Creada",
        description: "Tu disputa ha sido enviada al equipo de administración",
      });

      form.reset();
      setImageFile(null);
      setImagePreview(null);
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="disputaImage">Imagen de Evidencia (Opcional)</Label>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('disputaImage')?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {imageFile ? 'Cambiar Imagen' : 'Subir Imagen'}
                </Button>
                {imagePreview && (
                  <div className="relative w-full h-40 border rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
              <Input
                id="disputaImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Adjunta una imagen como evidencia (máx. 5MB)
              </p>
            </div>

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
