import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title?: string;
}

export const PdfViewerDialog = ({ open, onOpenChange, pdfUrl, title = "Documento PDF" }: PdfViewerDialogProps) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    if (open && pdfUrl) {
      loadPdfBlob();
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [open, pdfUrl]);

  const loadPdfBlob = async () => {
    try {
      // Extract the file path from the public URL
      const urlParts = pdfUrl.split('/tecnico-documents/');
      if (urlParts.length !== 2) return;
      
      const filePath = urlParts[1];
      
      // Download the file using Supabase client
      const { data, error } = await supabase.storage
        .from('tecnico-documents')
        .download(filePath);

      if (error) throw error;

      if (data) {
        const url = URL.createObjectURL(data);
        setBlobUrl(url);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Extract the file path from the public URL
      const urlParts = pdfUrl.split('/tecnico-documents/');
      if (urlParts.length !== 2) {
        throw new Error("Invalid file URL");
      }
      
      const filePath = urlParts[1];
      
      // Download the file using Supabase client
      const { data, error } = await supabase.storage
        .from('tecnico-documents')
        .download(filePath);

      if (error) throw error;

      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cotizacion.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Descarga completada",
          description: "El PDF se ha descargado correctamente",
        });
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el PDF",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="gap-2"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en nueva pestaña
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {blobUrl ? (
            <object
              data={blobUrl}
              type="application/pdf"
              className="w-full h-full border-0 rounded-md"
              aria-label="PDF Viewer"
            >
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                <p className="text-muted-foreground">
                  No se puede mostrar el PDF en el navegador.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleDownload} disabled={downloading} className="gap-2">
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Descargar PDF
                  </Button>
                </div>
              </div>
            </object>
          ) : (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
