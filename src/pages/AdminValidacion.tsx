import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Eye, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PendingTechnician {
  id: string;
  user_id: string;
  especialidad_principal: string;
  descripcion_perfil: string | null;
  comunas_cobertura: string[] | null;
  profile: {
    nombre: string;
    email: string;
    rut: string;
    telefono: string;
  };
  documents: {
    id: string;
    nombre_documento: string;
    archivo_url: string;
    estado: string;
  }[];
}

const AdminValidacion = () => {
  const [technicians, setTechnicians] = useState<PendingTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState<PendingTechnician | null>(null);
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const fetchPendingTechnicians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-pending-validations");

      if (error) throw error;

      setTechnicians(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los técnicos pendientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTechnicians();
  }, []);

  const handleValidate = async (tecnicoId: string, aprobar: boolean) => {
    setValidating(true);
    try {
      const { error } = await supabase.functions.invoke("validate-technician", {
        body: { tecnico_id: tecnicoId, aprobar },
      });

      if (error) throw error;

      toast({
        title: aprobar ? "Técnico aprobado" : "Técnico rechazado",
        description: aprobar
          ? "El técnico ha sido validado exitosamente"
          : "El técnico ha sido rechazado",
      });

      setSelectedTech(null);
      fetchPendingTechnicians();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo procesar la validación",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link to="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Validación de Técnicos ({technicians.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Comunas</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicians.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-medium">{tech.profile.nombre}</TableCell>
                      <TableCell>{tech.profile.rut}</TableCell>
                      <TableCell>{tech.especialidad_principal}</TableCell>
                      <TableCell>
                        {tech.comunas_cobertura?.join(", ") || "No especificado"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {tech.documents.length} documento(s)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTech(tech)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && technicians.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay técnicos pendientes de validación
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTech} onOpenChange={() => setSelectedTech(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Revisión de Técnico</DialogTitle>
            <DialogDescription>
              Revisa la información y documentación del técnico antes de validar
            </DialogDescription>
          </DialogHeader>

          {selectedTech && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Información Personal</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>
                      <p className="font-medium">{selectedTech.profile.nombre}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">RUT:</span>
                      <p className="font-medium">{selectedTech.profile.rut}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedTech.profile.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <p className="font-medium">{selectedTech.profile.telefono}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Información Profesional</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Especialidad:</span>
                      <p className="font-medium">{selectedTech.especialidad_principal}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comunas de cobertura:</span>
                      <p className="font-medium">
                        {selectedTech.comunas_cobertura?.join(", ") || "No especificado"}
                      </p>
                    </div>
                    {selectedTech.descripcion_perfil && (
                      <div>
                        <span className="text-muted-foreground">Descripción:</span>
                        <p className="font-medium">{selectedTech.descripcion_perfil}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Documentación</h3>
                  <div className="space-y-2">
                    {selectedTech.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.nombre_documento}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.archivo_url, "_blank")}
                        >
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    variant="default"
                    onClick={() => handleValidate(selectedTech.id, true)}
                    disabled={validating}
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprobar Técnico
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleValidate(selectedTech.id, false)}
                    disabled={validating}
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Rechazar
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminValidacion;
