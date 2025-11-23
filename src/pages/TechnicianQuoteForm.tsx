import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { TechnicianHeader } from "@/components/TechnicianHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, FileText, Info } from "lucide-react";

const TechnicianQuoteForm = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [valorTotal, setValorTotal] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tiempoEstimadoDias, setTiempoEstimadoDias] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede superar los 10MB');
        return;
      }
      setPdfFile(file);
      toast.success('PDF adjuntado correctamente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Get current user and tecnico profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return;
      }

      const { data: tecnicoProfile, error: profileError } = await supabase
        .from('tecnico_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !tecnicoProfile) {
        toast.error('No se encontró tu perfil de técnico');
        return;
      }

      let documentoUrl = null;

      // Upload PDF if provided
      if (pdfFile) {
        const fileExt = 'pdf';
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `cotizaciones/${ticketId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tecnico-documents')
          .upload(filePath, pdfFile);

        if (uploadError) {
          toast.error('Error al subir el PDF');
          console.error(uploadError);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('tecnico-documents')
          .getPublicUrl(filePath);

        documentoUrl = urlData.publicUrl;
      }

      // Create cotizacion
      const { error: cotizacionError } = await supabase
        .from('cotizacion')
        .insert({
          ticket_id: ticketId,
          tecnico_id: tecnicoProfile.id,
          valor_total: parseInt(valorTotal),
          descripcion,
          tiempo_estimado_dias: parseInt(tiempoEstimadoDias),
          documento_url: documentoUrl,
          estado: 'pendiente'
        });

      if (cotizacionError) {
        toast.error('Error al crear la cotización');
        console.error(cotizacionError);
        return;
      }

      toast.success('Cotización enviada exitosamente');
      navigate("/tecnico/dashboard");
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado al enviar la cotización');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TechnicianHeader />

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
            
            {/* Commission Breakdown */}
            {valorTotal && parseInt(valorTotal) > 0 && (
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold">Desglose de Comisión:</div>
                    <div className="flex justify-between">
                      <span>Valor Total de la Cotización:</span>
                      <span className="font-medium">${parseInt(valorTotal).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Comisión TecWork (15%):</span>
                      <span>-${Math.round(parseInt(valorTotal) * 0.15).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t font-semibold text-primary">
                      <span>Recibirás:</span>
                      <span>${Math.round(parseInt(valorTotal) * 0.85).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
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

          {/* PDF Adjunto (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="pdfFile">Documento PDF (Opcional)</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('pdfFile')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {pdfFile ? 'Cambiar PDF' : 'Subir PDF'}
              </Button>
              {pdfFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{pdfFile.name}</span>
                </div>
              )}
            </div>
            <Input
              id="pdfFile"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Adjunta un documento PDF con los detalles de tu cotización (máx. 10MB)
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando cotización...
                </>
              ) : (
                'Enviar Cotización al Cliente'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TechnicianQuoteForm;
