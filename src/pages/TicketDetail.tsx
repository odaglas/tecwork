import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Edit2, Check, X, Trash2, Upload, Eye, CheckCircle, XCircle, FileText, ChevronDown, MapPin, Star, Briefcase } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { PdfViewerDialog } from "@/components/PdfViewerDialog";
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
  created_at: string;
}

interface CotizacionData {
  id: string;
  descripcion: string;
  valor_total: number;
  tiempo_estimado_dias: number;
  estado: string;
  created_at: string;
  tecnico_nombre: string;
  tecnico_email: string;
  tecnico_id: string;
  tecnico_user_id: string | null;
  documento_url: string | null;
  tecnico_especialidad?: string;
  tecnico_descripcion?: string | null;
  tecnico_comunas?: string[] | null;
  tecnico_calificacion_promedio?: number;
  tecnico_calificaciones_count?: number;
}

const TicketDetail = () => {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTicket, setEditingTicket] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [cotizaciones, setCotizaciones] = useState<CotizacionData[]>([]);
  const [adjuntos, setAdjuntos] = useState<TicketAdjunto[]>([]);
  
  const [ticketForm, setTicketForm] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
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

      if (ticketError) throw ticketError;

      if (!ticketData) {
        toast({
          title: "Ticket no encontrado",
          description: "No tienes permiso para ver este ticket o no existe",
          variant: "destructive",
        });
        setLoading(false);
        navigate("/cliente/home");
        return;
      }

      setTicket(ticketData);
      setTicketForm({
        titulo: ticketData.titulo,
        descripcion: ticketData.descripcion,
        categoria: ticketData.categoria,
      });

      // Get cotizaciones
      const { data: cotizacionesData, error: cotizacionesError } = await supabase
        .from("cotizacion")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      console.log("Cotizaciones data:", cotizacionesData);
      if (cotizacionesError) throw cotizacionesError;

      if (!cotizacionesData || cotizacionesData.length === 0) {
        setCotizaciones([]);
      } else {
        // Get all unique tecnico_ids
        const tecnicoIds = [...new Set(cotizacionesData.map(c => c.tecnico_id))];
        console.log("Tecnico IDs:", tecnicoIds);
        
        // Fetch all tecnico profiles in one query
        const { data: tecnicoProfiles, error: tecnicoError } = await supabase
          .from("tecnico_profile")
          .select("id, user_id, especialidad_principal, descripcion_perfil, comunas_cobertura")
          .in("id", tecnicoIds);

        console.log("Tecnico profiles:", tecnicoProfiles);
        if (tecnicoError) console.error("Error fetching tecnico profiles:", tecnicoError);

        // Get all unique user_ids
        const userIds = tecnicoProfiles?.map(tp => tp.user_id) || [];
        console.log("User IDs:", userIds);
        
        // Fetch all user profiles in one query
        const { data: userProfiles, error: userError } = await supabase
          .from("profiles")
          .select("id, nombre, email")
          .in("id", userIds);

        console.log("User profiles:", userProfiles);
        if (userError) console.error("Error fetching user profiles:", userError);

        // Fetch ratings for all technicians
        const { data: ratingsData } = await supabase
          .from("calificacion")
          .select("tecnico_id, puntaje")
          .in("tecnico_id", tecnicoIds);

        // Calculate average ratings
        const ratingsMap = new Map<string, { avg: number; count: number }>();
        tecnicoIds.forEach(id => {
          const techRatings = ratingsData?.filter(r => r.tecnico_id === id) || [];
          if (techRatings.length > 0) {
            const avg = techRatings.reduce((sum, r) => sum + r.puntaje, 0) / techRatings.length;
            ratingsMap.set(id, { avg, count: techRatings.length });
          }
        });

        // Create lookup maps
        const tecnicoProfileMap = new Map(tecnicoProfiles?.map(tp => [tp.id, tp]) || []);
        const userProfileMap = new Map(userProfiles?.map(up => [up.id, up]) || []);

        console.log("Tecnico profile map:", tecnicoProfileMap);
        console.log("User profile map:", userProfileMap);

        // Combine the data
        const formattedCotizaciones = cotizacionesData.map((cot) => {
          const tecnicoProfile = tecnicoProfileMap.get(cot.tecnico_id);
          const userProfile = tecnicoProfile ? userProfileMap.get(tecnicoProfile.user_id) : null;
          const ratings = ratingsMap.get(cot.tecnico_id);
          
          console.log(`Processing cot ${cot.id}:`, {
            tecnico_id: cot.tecnico_id,
            tecnicoProfile,
            userProfile
          });
          
          return {
            id: cot.id,
            descripcion: cot.descripcion,
            valor_total: cot.valor_total,
            tiempo_estimado_dias: cot.tiempo_estimado_dias,
            estado: cot.estado,
            created_at: cot.created_at,
            tecnico_nombre: userProfile?.nombre || "Desconocido",
            tecnico_email: userProfile?.email || "",
            tecnico_id: cot.tecnico_id,
            tecnico_user_id: tecnicoProfile?.user_id || null,
            documento_url: cot.documento_url || null,
            tecnico_especialidad: tecnicoProfile?.especialidad_principal,
            tecnico_descripcion: tecnicoProfile?.descripcion_perfil,
            tecnico_comunas: tecnicoProfile?.comunas_cobertura,
            tecnico_calificacion_promedio: ratings?.avg,
            tecnico_calificaciones_count: ratings?.count,
          };
        });

        console.log("Formatted cotizaciones:", formattedCotizaciones);
        setCotizaciones(formattedCotizaciones);
      }


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

  const handleAcceptCotizacion = async (cotizacionId: string) => {
    // Redirect to payment simulator page
    navigate(`/simular-pago?cotizacion_id=${cotizacionId}&ticket_id=${ticketId}`);
  };

  const handleRejectCotizacion = async (cotizacionId: string) => {
    try {
      const { error } = await supabase
        .from("cotizacion")
        .update({ estado: "rechazada" })
        .eq("id", cotizacionId);

      if (error) throw error;

      toast({
        title: "Cotización Rechazada",
        description: "Has rechazado esta cotización",
      });

      fetchTicketDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la cotización",
        variant: "destructive",
      });
    }
  };

  const handleSaveTicket = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ticket")
        .update({
          titulo: ticketForm.titulo,
          descripcion: ticketForm.descripcion,
          categoria: ticketForm.categoria,
        })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ticket actualizado correctamente",
      });

      setEditingTicket(false);
      fetchTicketDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el ticket",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !ticketId) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${ticketId}/${Math.random()}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('tecnico-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('tecnico-documents')
          .getPublicUrl(fileName);

        // Determine file type
        const tipo = file.type.startsWith('video/') ? 'video' : 'imagen';

        // Save to ticket_adjunto table
        const { error: adjuntoError } = await supabase
          .from('ticket_adjunto')
          .insert({
            ticket_id: ticketId,
            archivo_url: publicUrl,
            tipo: tipo
          });

        if (adjuntoError) throw adjuntoError;
      });

      await Promise.all(uploadPromises);
      
      // Refresh adjuntos
      await fetchTicketDetails();
      
      toast({
        title: "Éxito",
        description: "Archivos subidos correctamente",
      });
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast({
        title: "Error",
        description: "Error al subir archivos: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleCancelTicket = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("ticket")
        .update({ estado: "cancelado" })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Ticket Cancelado",
        description: "El ticket ha sido cancelado exitosamente",
      });

      setShowCancelDialog(false);
      fetchTicketDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cancelar el ticket",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteFile = async (adjuntoId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/tecnico-documents/');
      if (urlParts.length !== 2) {
        throw new Error("Invalid file URL");
      }
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('tecnico-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('ticket_adjunto')
        .delete()
        .eq('id', adjuntoId);

      if (dbError) throw dbError;

      // Refresh adjuntos
      await fetchTicketDetails();

      toast({
        title: "Éxito",
        description: "Archivo eliminado correctamente",
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Error al eliminar archivo",
        variant: "destructive",
      });
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

  const getCotizacionEstadoBadge = (estado: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pendiente: { className: "bg-yellow-500/10 text-yellow-500 border-yellow-500", label: "Pendiente" },
      aceptada: { className: "bg-success/10 text-success border-success", label: "Aceptada" },
      rechazada: { className: "bg-red-500/10 text-red-500 border-red-500", label: "Rechazada" },
    };
    const variant = variants[estado] || variants.pendiente;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <ClientHeader />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-secondary">
        <ClientHeader />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">Ticket no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <ClientHeader />
      
      <div className="container px-4 py-8 space-y-6">
        {/* Back Button and Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cliente/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Detalles del Ticket</h1>
            <p className="text-sm text-muted-foreground">
              Creado {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getEstadoBadge(ticket.estado)}
            {ticket.estado !== "cancelado" && ticket.estado !== "finalizado" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción cancelará el ticket permanentemente. No podrás recibir más cotizaciones y los técnicos serán notificados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>No, mantener ticket</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelTicket}
                disabled={cancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  "Sí, cancelar ticket"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Ticket Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Información del Ticket</CardTitle>
              {!editingTicket ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTicket(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveTicket}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTicket(false);
                      setTicketForm({
                        titulo: ticket.titulo,
                        descripcion: ticket.descripcion,
                        categoria: ticket.categoria,
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingTicket ? (
              <>
                <div>
                  <Label>Título</Label>
                  <Input
                    value={ticketForm.titulo}
                    onChange={(e) => setTicketForm({ ...ticketForm, titulo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={ticketForm.descripcion}
                    onChange={(e) => setTicketForm({ ...ticketForm, descripcion: e.target.value })}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={ticketForm.categoria}
                    onChange={(e) => setTicketForm({ ...ticketForm, categoria: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Comuna</Label>
                  <Input value={ticket.comuna} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">La comuna no se puede editar</p>
                </div>
              </>
            ) : (
              <div className="grid gap-4">
                <div>
                  <span className="font-semibold">Título:</span>
                  <p className="text-muted-foreground">{ticket.titulo}</p>
                </div>
                <div>
                  <span className="font-semibold">Descripción:</span>
                  <p className="text-muted-foreground">{ticket.descripcion}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Categoría:</span>
                    <p className="text-muted-foreground">{ticket.categoria}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Comuna:</span>
                    <p className="text-muted-foreground capitalize">{ticket.comuna}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fotos del Ticket</CardTitle>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Subir Fotos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {adjuntos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay archivos adjuntos</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {adjuntos.map((adjunto) => (
                  <div key={adjunto.id} className="relative group">
                    {adjunto.tipo === "imagen" ? (
                      <a 
                        href={adjunto.archivo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={adjunto.archivo_url}
                          alt="Foto del ticket"
                          className="w-full h-48 object-cover rounded-lg border-2 border-border hover:border-primary transition-smooth cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-smooth rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-smooth font-semibold">
                            Ver imagen
                          </span>
                        </div>
                      </a>
                    ) : (
                      <a 
                        href={adjunto.archivo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="w-full h-48 bg-muted rounded-lg border-2 border-border hover:border-primary transition-smooth cursor-pointer flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎥</div>
                            <span className="text-sm font-semibold">Ver video</span>
                          </div>
                        </div>
                      </a>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-smooth h-8 w-8"
                      onClick={() => handleDeleteFile(adjunto.id, adjunto.archivo_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cotizaciones Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones Recibidas ({cotizaciones.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {cotizaciones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-2">No hay cotizaciones todavía</p>
                <p className="text-muted-foreground text-sm">Los técnicos interesados enviarán sus cotizaciones pronto</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cotizaciones.map((cot) => (
                  <div key={cot.id} className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/5 transition-smooth">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{cot.tecnico_nombre}</h4>
                          {getCotizacionEstadoBadge(cot.estado)}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm text-muted-foreground">{cot.tecnico_email}</p>
                          {cot.tecnico_calificacion_promedio && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              <span className="text-sm font-medium">{cot.tecnico_calificacion_promedio.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({cot.tecnico_calificaciones_count})</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Technician Profile Collapsible */}
                        <Collapsible className="mb-3">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:bg-transparent">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver perfil del técnico
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 p-3 bg-muted/50 rounded-md space-y-2">
                            {cot.tecnico_especialidad && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{cot.tecnico_especialidad}</span>
                              </div>
                            )}
                            {cot.tecnico_descripcion && (
                              <p className="text-sm text-muted-foreground">{cot.tecnico_descripcion}</p>
                            )}
                            {cot.tecnico_comunas && cot.tecnico_comunas.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Comunas de cobertura:</span>
                                </div>
                                <div className="flex flex-wrap gap-1 ml-6">
                                  {cot.tecnico_comunas.map((comuna) => (
                                    <Badge key={comuna} variant="outline" className="text-xs">
                                      {comuna}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>

                        <p className="text-muted-foreground mt-3">{cot.descripcion}</p>
                        {cot.documento_url && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-primary mt-3"
                            onClick={() => {
                              setSelectedPdfUrl(cot.documento_url!);
                              setPdfViewerOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Ver documento PDF
                          </Button>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-primary">{formatPrice(cot.valor_total)}</p>
                        <p className="text-sm text-muted-foreground">{cot.tiempo_estimado_dias} día(s)</p>
                      </div>
                    </div>
                    {cot.estado === "pendiente" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptCotizacion(cot.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aceptar Cotización
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRejectCotizacion(cot.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat button if quote accepted */}
        {cotizaciones.some(c => c.estado === 'aceptada') && (
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => navigate(`/chat/${ticketId}`)}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              Chat con Técnico
            </Button>
          </div>
        )}
      </div>

      <PdfViewerDialog
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={selectedPdfUrl}
        title="Documento de Cotización"
      />
    </div>
  );
};

export default TicketDetail;
