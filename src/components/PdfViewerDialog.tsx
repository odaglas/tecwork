import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title?: string;
}

export const PdfViewerDialog = ({ open, onOpenChange, pdfUrl, title = "Documento PDF" }: PdfViewerDialogProps) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'cotizacion.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                className="gap-2"
              >
                <Download className="h-4 w-4" />
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
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full border-0 rounded-md"
            aria-label="PDF Viewer"
          >
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <p className="text-muted-foreground">
                No se puede mostrar el PDF en el navegador. Esto puede deberse a extensiones como bloqueadores de anuncios.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva pestaña
                </Button>
              </div>
            </div>
          </object>
        </div>
      </DialogContent>
    </Dialog>
  );
};
