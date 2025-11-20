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
import { Loader2, ArrowLeft, Edit2, Check, X, Trash2, Upload, Eye, CheckCircle, XCircle } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
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
}

const TicketDetail = () => {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTicket, setEditingTicket] = useState(false);
  const [uploading, setUploading] = useState(false);
  
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

      if (cotizacionesError) throw cotizacionesError;

      // Get all unique tecnico_ids
      const tecnicoIds = [...new Set(cotizacionesData?.map(c => c.tecnico_id) || [])];
      
      // Fetch all tecnico profiles in one query
      const { data: tecnicoProfiles } = await supabase
        .from("tecnico_profile")
        .select("id, user_id")
        .in("id", tecnicoIds);

      // Get all unique user_ids
      const userIds = tecnicoProfiles?.map(tp => tp.user_id) || [];
      
      // Fetch all user profiles in one query
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("id, nombre, email")
        .in("id", userIds);

      // Create lookup maps
      const tecnicoProfileMap = new Map(tecnicoProfiles?.map(tp => [tp.id, tp]) || []);
      const userProfileMap = new Map(userProfiles?.map(up => [up.id, up]) || []);

      // Combine the data
      const formattedCotizaciones = cotizacionesData?.map((cot) => {
        const tecnicoProfile = tecnicoProfileMap.get(cot.tecnico_id);
        const userProfile = tecnicoProfile ? userProfileMap.get(tecnicoProfile.user_id) : null;
        
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
        };
      }) || [];

      setCotizaciones(formattedCotizaciones);


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
    try {
      // Update the cotizacion status to "aceptada"
      const { error: cotizacionError } = await supabase
        .from("cotizacion")
        .update({ estado: "aceptada" })
        .eq("id", cotizacionId);

      if (cotizacionError) throw cotizacionError;

      // Reject all other cotizaciones for this ticket
      const { error: rejectError } = await supabase
        .from("cotizacion")
        .update({ estado: "rechazada" })
        .eq("ticket_id", ticketId)
        .neq("id", cotizacionId);

      if (rejectError) throw rejectError;

      // Update ticket status to "en_progreso"
      const { error: ticketError } = await supabase
        .from("ticket")
        .update({ estado: "en_progreso" })
        .eq("id", ticketId);

      if (ticketError) throw ticketError;

      toast({
        title: "Cotización Aceptada",
        description: "Has aceptado esta cotización. El trabajo comenzará pronto.",
      });

      fetchTicketDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo aceptar la cotización",
        variant: "destructive",
      });
    }
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
          {getEstadoBadge(ticket.estado)}
        </div>

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
        {cotizaciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cotizaciones Recibidas ({cotizaciones.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cotizaciones.map((cot) => (
                  <div key={cot.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{cot.tecnico_nombre}</h4>
                          {getCotizacionEstadoBadge(cot.estado)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{cot.tecnico_email}</p>
                        {cot.tecnico_user_id && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-primary"
                            onClick={() => window.open(`/tecnico/${cot.tecnico_user_id}`, '_blank')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver perfil del técnico
                          </Button>
                        )}
                        <p className="text-muted-foreground mt-2">{cot.descripcion}</p>
                      </div>
                      <div className="text-right">
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
