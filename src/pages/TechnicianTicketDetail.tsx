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
import { Loader2, ArrowLeft, MapPin, Upload, FileText, AlertTriangle } from "lucide-react";
import { TechnicianHeader } from "@/components/TechnicianHeader";
import { SupportChatDialog } from "@/components/SupportChatDialog";
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
  cliente_nombre?: string;
}

interface TicketAdjunto {
  id: string;
  archivo_url: string;
  tipo: string;
}

const TechnicianTicketDetail = () => {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log("TechnicianTicketDetail component rendered, ticketId:", ticketId);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clienteId, setClienteId] = useState<string>("");
  
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [adjuntos, setAdjuntos] = useState<TicketAdjunto[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [existingQuote, setExistingQuote] = useState<any>(null);
  
  const [quoteForm, setQuoteForm] = useState({
    descripcion: "",
    valor_total: "",
    tiempo_estimado_dias: "",
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    console.log("useEffect triggered, ticketId:", ticketId);
    const checkAuthAndFetchTicket = async () => {
      console.log("checkAuthAndFetchTicket started");
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log("Auth check result:", { user: user?.id, authError });
      
      if (authError || !user) {
        console.log("No user or auth error, redirecting to login");
        toast({
          title: "Sesión expirada",
          description: "Por favor, inicia sesión nuevamente",
          variant: "destructive",
        });
        navigate("/tecnico/login");
        return;
      }
      
      if (ticketId) {
        console.log("Calling fetchTicketDetails");
        fetchTicketDetails();
      } else {
        console.log("No ticketId found");
      }
    };
    
    checkAuthAndFetchTicket();
  }, [ticketId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      
      setCurrentUser(profile);
    }
  };

  const fetchTicketDetails = async () => {
    console.log("Starting fetchTicketDetails, ticketId:", ticketId);
    setLoading(true);
    try {
      // Get ticket
      console.log("Fetching ticket data...");
      const { data: ticketData, error: ticketError } = await supabase
        .from("ticket")
        .select("*")
        .eq("id", ticketId)
        .maybeSingle();

      console.log("Ticket query result:", { ticketData, ticketError });

      if (ticketError) {
        console.error("Error fetching ticket:", ticketError);
        throw ticketError;
      }
      
      if (!ticketData) {
        console.log("No ticket data found");
        toast({
          title: "Ticket no encontrado",
          description: "No tienes permiso para ver este ticket o no existe",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get client name
      let clientName = "";
      if (ticketData.cliente_id) {
        const { data: clienteProfile } = await supabase
          .from("cliente_profile")
          .select("user_id")
          .eq("id", ticketData.cliente_id)
          .single();

        if (clienteProfile) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("nombre")
            .eq("id", clienteProfile.user_id)
            .single();
          
          if (profileData) {
            clientName = profileData.nombre;
          }
        }
      }
      
      // Set ticket with client name
      setTicket({
        ...ticketData,
        cliente_nombre: clientName
      });
      setClienteId(ticketData.cliente_id);
      console.log("Ticket data set successfully");

      // Get ticket adjuntos
      console.log("Fetching ticket attachments...");
      const { data: adjuntosData, error: adjuntosError } = await supabase
        .from("ticket_adjunto")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      console.log("Adjuntos query result:", { adjuntosData, adjuntosError });

      if (adjuntosError) {
        console.error("Error fetching adjuntos:", adjuntosError);
        throw adjuntosError;
      }
      setAdjuntos(adjuntosData || []);
      console.log("Adjuntos data set successfully");

      // Check if technician has already submitted a quote
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tecnicoProfile } = await supabase
          .from("tecnico_profile")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (tecnicoProfile) {
          const { data: quoteData } = await supabase
            .from("cotizacion")
            .select("*")
            .eq("ticket_id", ticketId)
            .eq("tecnico_id", tecnicoProfile.id)
            .maybeSingle();

          if (quoteData) {
            setExistingQuote(quoteData);
            // Pre-fill the form with existing quote data
            setQuoteForm({
              descripcion: quoteData.descripcion,
              valor_total: quoteData.valor_total.toString(),
              tiempo_estimado_dias: quoteData.tiempo_estimado_dias.toString(),
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error in fetchTicketDetails:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del ticket",
        variant: "destructive",
      });
    } finally {
      console.log("Setting loading to false");
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

      if (existingQuote) {
        // Update existing quote
        const { error: updateError } = await supabase
          .from("cotizacion")
          .update({
            descripcion: quoteForm.descripcion,
            valor_total: parseInt(quoteForm.valor_total),
            tiempo_estimado_dias: parseInt(quoteForm.tiempo_estimado_dias),
          })
          .eq("id", existingQuote.id);

        if (updateError) throw updateError;

        toast({
          title: "Éxito",
          description: "Cotización actualizada correctamente",
        });
      } else {
        // Create new cotizacion
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
      }

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
          <div className="flex gap-2">
            {getEstadoBadge(ticket.estado)}
            {ticket.estado === "en_progreso" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsSupportChatOpen(true)}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Reportar Problema
              </Button>
            )}
          </div>
        </div>

        {/* Ticket Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticket.cliente_nombre && (
                <div>
                  <span className="font-semibold">Cliente:</span>
                  <p className="text-muted-foreground">{ticket.cliente_nombre}</p>
                </div>
              )}
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
        {existingQuote?.estado === "aceptada" ? (
          <Card className="border-green-500/50">
            <CardHeader>
              <CardTitle className="text-green-600">Cotización Aceptada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">Tu cotización ha sido aceptada por el cliente.</p>
              <div className="space-y-2">
                <p><span className="font-semibold">Descripción:</span> {existingQuote.descripcion}</p>
                <p><span className="font-semibold">Precio:</span> ${existingQuote.valor_total.toLocaleString('es-CL')} CLP</p>
                <p><span className="font-semibold">Tiempo estimado:</span> {existingQuote.tiempo_estimado_dias} días</p>
              </div>
            </CardContent>
          </Card>
        ) : existingQuote?.estado === "rechazada" ? (
          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-600">Cotización Rechazada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tu cotización fue rechazada por el cliente. No puedes enviar otra cotización para este ticket.</p>
            </CardContent>
          </Card>
        ) : !showQuoteForm && !existingQuote ? (
          <Button
            variant="default"
            size="lg"
            className="w-full text-lg py-6"
            onClick={() => setShowQuoteForm(true)}
          >
            Enviar Cotización
          </Button>
        ) : (existingQuote?.estado === "pendiente" || showQuoteForm) ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {existingQuote ? "Editar Cotización (Pendiente)" : "Enviar Cotización"}
              </CardTitle>
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
                      {existingQuote ? "Actualizando..." : "Enviando..."}
                    </>
                  ) : (
                    existingQuote ? "Actualizar Cotización" : "Enviar Cotización"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!existingQuote) {
                      setShowQuoteForm(false);
                    } else {
                      navigate("/tecnico/dashboard");
                    }
                  }}
                  disabled={submitting}
                >
                  {existingQuote ? "Volver" : "Cancelar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Show chat button if quote is accepted */}
        {existingQuote?.estado === "aceptada" && (
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => navigate(`/tecnico/chat/${ticketId}`)}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              Chat con Cliente
            </Button>
          </div>
        )}

        {/* Show accepted/rejected status */}
        {existingQuote?.estado === "aceptada" && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <p className="text-green-700 dark:text-green-300 text-center font-semibold">
                ✓ Tu cotización ha sido aceptada
              </p>
            </CardContent>
          </Card>
        )}

        {existingQuote?.estado === "rechazada" && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300 text-center font-semibold">
                ✗ Tu cotización ha sido rechazada
              </p>
            </CardContent>
          </Card>
        )}
        
        <SupportChatDialog
          open={isSupportChatOpen}
          onOpenChange={setIsSupportChatOpen}
          ticketId={ticketId!}
          clienteId={clienteId}
          currentUserId={currentUser?.id || ""}
        />
      </div>
    </div>
  );
};

export default TechnicianTicketDetail;
