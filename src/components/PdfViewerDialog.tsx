import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title?: string;
}

export const PdfViewerDialog = ({ open, onOpenChange, pdfUrl, title = "Documento PDF" }: PdfViewerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pdfUrl, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en nueva pestaña
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0 rounded-md"
            title="PDF Viewer"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
