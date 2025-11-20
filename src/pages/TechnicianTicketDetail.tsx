import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, MapPin, Upload, FileText } from "lucide-react";
import { TechnicianHeader } from "@/components/TechnicianHeader";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TicketData {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  comuna: string;
  estado: string;
  created_at: string;
}

interface TicketAdjunto {
  id: string;
  archivo_url: string;
  tipo: string;
}

const TechnicianTicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [adjuntos, setAdjuntos] = useState<TicketAdjunto[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  
  const [quoteForm, setQuoteForm] = useState({
    descripcion: "",
    valor_total: "",
    tiempo_estimado_dias: "",
  });

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      // Get ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("ticket")
        .select("*")
        .eq("id", ticketId)
        .maybeSingle();

      if (ticketError) {
        console.error("Error fetching ticket:", ticketError);
        throw ticketError;
      }
      
      if (!ticketData) {
        toast({
          title: "Ticket no encontrado",
          description: "No tienes permiso para ver este ticket o no existe",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      setTicket(ticketData);

      // Get ticket adjuntos
      const { data: adjuntosData, error: adjuntosError } = await supabase
        .from("ticket_adjunto")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (adjuntosError) throw adjuntosError;
      setAdjuntos(adjuntosData || []);
    } catch (error: any) {
      console.error("Error fetching ticket details:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    setUploadingPdf(true);
    try {
      const fileExt = 'pdf';
      const fileName = `cotizaciones/${ticketId}/${Math.random()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('tecnico-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tecnico-documents')
        .getPublicUrl(fileName);

      setPdfUrl(publicUrl);
      setPdfFile(file);

      toast({
        title: "Éxito",
        description: "PDF cargado correctamente",
      });
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Error",
        description: "Error al subir PDF: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleSubmitQuote = async () => {
    if (!quoteForm.descripcion || !quoteForm.valor_total || !quoteForm.tiempo_estimado_dias) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get current user's tecnico profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: tecnicoProfile, error: profileError } = await supabase
        .from("tecnico_profile")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Create cotizacion
      const { error: cotizacionError } = await supabase
        .from("cotizacion")
        .insert({
          ticket_id: ticketId,
          tecnico_id: tecnicoProfile.id,
          descripcion: quoteForm.descripcion,
          valor_total: parseInt(quoteForm.valor_total),
          tiempo_estimado_dias: parseInt(quoteForm.tiempo_estimado_dias),
          estado: "pendiente"
        });

      if (cotizacionError) throw cotizacionError;

      // Update ticket status to cotizando if it was abierto
      if (ticket?.estado === "abierto") {
        await supabase
          .from("ticket")
          .update({ estado: "cotizando" })
          .eq("id", ticketId);
      }

      toast({
        title: "Éxito",
        description: "Cotización enviada correctamente",
      });

      // Navigate back to dashboard
      navigate("/tecnico/dashboard");
    } catch (error: any) {
      console.error("Error submitting quote:", error);
      toast({
        title: "Error",
        description: "Error al enviar cotización: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      abierto: { className: "bg-success/10 text-success border-success", label: "Abierto" },
      cotizando: { className: "bg-blue-500/10 text-blue-500 border-blue-500", label: "Cotizando" },
      en_progreso: { className: "bg-yellow-500/10 text-yellow-500 border-yellow-500", label: "En Progreso" },
      finalizado: { className: "bg-gray-500/10 text-gray-500 border-gray-500", label: "Finalizado" },
      cancelado: { className: "bg-red-500/10 text-red-500 border-red-500", label: "Cancelado" },
    };
    const variant = variants[estado] || variants.abierto;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TechnicianHeader />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <TechnicianHeader />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">Ticket no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TechnicianHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back Button and Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tecnico/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{ticket.titulo}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="capitalize">{ticket.comuna}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
          </div>
          {getEstadoBadge(ticket.estado)}
        </div>

        {/* Ticket Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Categoría:</span>
                <p className="text-muted-foreground">{ticket.categoria}</p>
              </div>
              <div>
                <span className="font-semibold">Descripción:</span>
                <p className="text-muted-foreground">{ticket.descripcion}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Card */}
        {adjuntos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {adjuntos.map((adjunto) => (
                  <a 
                    key={adjunto.id}
                    href={adjunto.archivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {adjunto.tipo === "imagen" ? (
                      <img
                        src={adjunto.archivo_url}
                        alt="Foto del cliente"
                        className="w-full h-48 object-cover rounded-lg border-2 border-border hover:border-primary transition-smooth cursor-pointer"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-lg border-2 border-border hover:border-primary transition-smooth cursor-pointer flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎥</div>
                          <span className="text-sm font-semibold">Ver video</span>
                        </div>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Form Card */}
        {!showQuoteForm ? (
          <Button
            variant="default"
            size="lg"
            className="w-full text-lg py-6"
            onClick={() => setShowQuoteForm(true)}
          >
            Enviar Cotización
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Enviar Cotización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descripcion">Descripción del Trabajo *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe el trabajo que realizarás..."
                  value={quoteForm.descripcion}
                  onChange={(e) => setQuoteForm({ ...quoteForm, descripcion: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor">Precio Total (CLP) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    placeholder="45000"
                    value={quoteForm.valor_total}
                    onChange={(e) => setQuoteForm({ ...quoteForm, valor_total: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dias">Tiempo Estimado (días) *</Label>
                  <Input
                    id="dias"
                    type="number"
                    placeholder="2"
                    value={quoteForm.tiempo_estimado_dias}
                    onChange={(e) => setQuoteForm({ ...quoteForm, tiempo_estimado_dias: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pdf-upload">Cotización en PDF (Opcional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="pdf-upload"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                    disabled={uploadingPdf}
                    className="w-full"
                  >
                    {uploadingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Subiendo...
                      </>
                    ) : pdfFile ? (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        {pdfFile.name}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir PDF
                      </>
                    )}
                  </Button>
                  {pdfFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF cargado correctamente
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="default"
                  onClick={handleSubmitQuote}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Cotización"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQuoteForm(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TechnicianTicketDetail;
