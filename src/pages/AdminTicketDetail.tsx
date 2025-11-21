import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save, Edit2, Check, X, Trash2, FileText } from "lucide-react";
import { PdfViewerDialog } from "@/components/PdfViewerDialog";
import { formatRut } from "@/lib/utils";

interface TicketData {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  comuna: string;
  estado: string;
  created_at: string;
  cliente_id: string;
}

interface ClienteData {
  nombre: string;
  email: string;
  rut: string;
  telefono: string;
  comuna: string;
  direccion: string;
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
  documento_url: string | null;
}

interface TicketAdjunto {
  id: string;
  archivo_url: string;
  tipo: string;
  created_at: string;
}

const AdminTicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTicket, setEditingTicket] = useState(false);
  const [editingCotizacion, setEditingCotizacion] = useState<string | null>(null);
  
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [cotizaciones, setCotizaciones] = useState<CotizacionData[]>([]);
  const [adjuntos, setAdjuntos] = useState<TicketAdjunto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  
  const [ticketForm, setTicketForm] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    comuna: "",
    estado: "",
  });

  const [cotizacionForm, setCotizacionForm] = useState({
    descripcion: "",
    valor_total: 0,
    tiempo_estimado_dias: 0,
    estado: "",
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
        .single();

      if (ticketError) throw ticketError;

      setTicket(ticketData);
      setTicketForm({
        titulo: ticketData.titulo,
        descripcion: ticketData.descripcion,
        categoria: ticketData.categoria,
        comuna: ticketData.comuna,
        estado: ticketData.estado,
      });

      // Get cliente profile
      const { data: clienteProfile, error: clienteError } = await supabase
        .from("cliente_profile")
        .select("user_id, comuna, direccion")
        .eq("id", ticketData.cliente_id)
        .single();

      if (clienteError) throw clienteError;

      // Get cliente user data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("nombre, email, rut, telefono")
        .eq("id", clienteProfile.user_id)
        .single();

      if (profileError) throw profileError;

      setCliente({
        ...profile,
        comuna: clienteProfile.comuna || "",
        direccion: clienteProfile.direccion || "",
      });

      // Get cotizaciones
      const { data: cotizacionesData, error: cotizacionesError } = await supabase
        .from("cotizacion")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      if (cotizacionesError) throw cotizacionesError;

      // Get tecnico data for each cotizacion
      const cotizacionesWithTecnico = await Promise.all(
        cotizacionesData.map(async (cot) => {
          const { data: tecnicoProfile } = await supabase
            .from("tecnico_profile")
            .select("user_id")
            .eq("id", cot.tecnico_id)
            .single();

          const { data: tecnicoData } = await supabase
            .from("profiles")
            .select("nombre, email")
            .eq("id", tecnicoProfile?.user_id)
            .single();

          return {
            id: cot.id,
            descripcion: cot.descripcion,
            valor_total: cot.valor_total,
            tiempo_estimado_dias: cot.tiempo_estimado_dias,
            estado: cot.estado,
            created_at: cot.created_at,
            tecnico_nombre: tecnicoData?.nombre || "Desconocido",
            tecnico_email: tecnicoData?.email || "",
            documento_url: cot.documento_url || null,
          };
        })
      );

      setCotizaciones(cotizacionesWithTecnico);

      // Get ticket adjuntos (photos/videos)
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

  const handleSaveTicket = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ticket")
        .update({
          titulo: ticketForm.titulo,
          descripcion: ticketForm.descripcion,
          categoria: ticketForm.categoria,
          comuna: ticketForm.comuna,
          estado: ticketForm.estado as "abierto" | "cotizando" | "en_progreso" | "finalizado" | "cancelado",
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

  const handleEditCotizacion = (cotizacion: CotizacionData) => {
    setEditingCotizacion(cotizacion.id);
    setCotizacionForm({
      descripcion: cotizacion.descripcion,
      valor_total: cotizacion.valor_total,
      tiempo_estimado_dias: cotizacion.tiempo_estimado_dias,
      estado: cotizacion.estado,
    });
  };

  const handleSaveCotizacion = async (cotizacionId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("cotizacion")
        .update({
          descripcion: cotizacionForm.descripcion,
          valor_total: cotizacionForm.valor_total,
          tiempo_estimado_dias: cotizacionForm.tiempo_estimado_dias,
          estado: cotizacionForm.estado as "pendiente" | "aceptada" | "rechazada",
        })
        .eq("id", cotizacionId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cotización actualizada correctamente",
      });

      setEditingCotizacion(null);
      fetchTicketDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cotización",
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
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folderName = urlParts[urlParts.length - 2];
      const filePath = `${folderName}/${fileName}`;

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
        description: "Error al eliminar archivo: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      abierto: "default",
      cotizando: "secondary",
      en_progreso: "outline",
      finalizado: "default",
      cancelado: "destructive",
      pendiente: "secondary",
      aceptada: "default",
      rechazada: "destructive",
    };
    return <Badge variant={variants[estado] || "default"}>{estado}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Ticket no encontrado</p>
          <Link to="/admin/tickets">
            <Button className="mt-4">Volver a Tickets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link to="/admin/tickets">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Tickets
          </Button>
        </Link>

        {/* Ticket Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información del Ticket</CardTitle>
            {!editingTicket ? (
              <Button onClick={() => setEditingTicket(true)} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveTicket} disabled={saving} size="sm">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Guardar
                </Button>
                <Button onClick={() => setEditingTicket(false)} variant="outline" size="sm">
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            )}
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Categoría</Label>
                    <Input
                      value={ticketForm.categoria}
                      onChange={(e) => setTicketForm({ ...ticketForm, categoria: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Comuna</Label>
                    <Input
                      value={ticketForm.comuna}
                      onChange={(e) => setTicketForm({ ...ticketForm, comuna: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select
                      value={ticketForm.estado}
                      onValueChange={(value) => setTicketForm({ ...ticketForm, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abierto">Abierto</SelectItem>
                        <SelectItem value="cotizando">Cotizando</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Título:</span>
                  <span>{ticket.titulo}</span>
                </div>
                <div>
                  <span className="font-semibold">Descripción:</span>
                  <p className="mt-1 text-muted-foreground">{ticket.descripcion}</p>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Categoría:</span>
                  <span className="capitalize">{ticket.categoria}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Comuna:</span>
                  <span className="capitalize">{ticket.comuna}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Estado:</span>
                  {getEstadoBadge(ticket.estado)}
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Fecha creación:</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos/Attachments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fotos del Ticket ({adjuntos.length})</CardTitle>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    "Subir Archivos"
                  )}
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

        {/* Cliente Info */}
        {cliente && (
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Nombre:</span>
                  <p>{cliente.nombre}</p>
                </div>
                <div>
                  <span className="font-semibold">Email:</span>
                  <p>{cliente.email}</p>
                </div>
                <div>
                  <span className="font-semibold">RUT:</span>
                  <p>{formatRut(cliente.rut)}</p>
                </div>
                <div>
                  <span className="font-semibold">Teléfono:</span>
                  <p>{cliente.telefono}</p>
                </div>
                <div>
                  <span className="font-semibold">Comuna:</span>
                  <p className="capitalize">{cliente.comuna || "No especificado"}</p>
                </div>
                <div>
                  <span className="font-semibold">Dirección:</span>
                  <p>{cliente.direccion || "No especificado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cotizaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones ({cotizaciones.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {cotizaciones.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay cotizaciones para este ticket</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizaciones.map((cot) => (
                    <TableRow key={cot.id}>
                      {editingCotizacion === cot.id ? (
                        <>
                          <TableCell>{cot.tecnico_nombre}</TableCell>
                          <TableCell>
                            <Textarea
                              value={cotizacionForm.descripcion}
                              onChange={(e) => setCotizacionForm({ ...cotizacionForm, descripcion: e.target.value })}
                              rows={2}
                              className="min-w-[200px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={cotizacionForm.valor_total}
                              onChange={(e) => setCotizacionForm({ ...cotizacionForm, valor_total: Number(e.target.value) })}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={cotizacionForm.tiempo_estimado_dias}
                              onChange={(e) => setCotizacionForm({ ...cotizacionForm, tiempo_estimado_dias: Number(e.target.value) })}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={cotizacionForm.estado}
                              onValueChange={(value) => setCotizacionForm({ ...cotizacionForm, estado: value })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="aceptada">Aceptada</SelectItem>
                                <SelectItem value="rechazada">Rechazada</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{new Date(cot.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {cot.documento_url && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto"
                                onClick={() => {
                                  setSelectedPdfUrl(cot.documento_url!);
                                  setPdfViewerOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                                PDF
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleSaveCotizacion(cot.id)}
                                disabled={saving}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCotizacion(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cot.tecnico_nombre}</p>
                              <p className="text-sm text-muted-foreground">{cot.tecnico_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{cot.descripcion}</TableCell>
                          <TableCell>${cot.valor_total.toLocaleString()}</TableCell>
                          <TableCell>{cot.tiempo_estimado_dias}</TableCell>
                          <TableCell>{getEstadoBadge(cot.estado)}</TableCell>
                          <TableCell>{new Date(cot.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {cot.documento_url && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto"
                                onClick={() => {
                                  setSelectedPdfUrl(cot.documento_url!);
                                  setPdfViewerOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                                PDF
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCotizacion(cot)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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

export default AdminTicketDetail;
