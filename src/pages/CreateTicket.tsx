import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Camera, ArrowLeft } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { containsBannedContent } from "@/lib/utils";

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [comuna, setComuna] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrCreateClienteProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get existing cliente_profile
        const { data, error } = await supabase
          .from("cliente_profile")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching cliente_profile:", error);
          return;
        }

        if (data) {
          setClienteId(data.id);
        } else {
          // Create cliente_profile if it doesn't exist
          const { data: newProfile, error: insertError } = await supabase
            .from("cliente_profile")
            .insert({
              user_id: user.id,
              direccion: "",
              comuna: "",
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("Error creating cliente_profile:", insertError);
            toast.error("Error al crear perfil de cliente");
          } else if (newProfile) {
            setClienteId(newProfile.id);
            toast.success("Perfil de cliente creado");
          }
        }
      }
    };
    fetchOrCreateClienteProfile();
  }, []);

  const convertImageToJPEG = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: 'image/jpeg',
              });
              resolve(newFile);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/jpeg',
          0.9
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const convertedFiles: File[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check if it's a video
      if (file.type.startsWith('video/')) {
        convertedFiles.push(file);
        continue;
      }
      
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        // Convert to JPEG if not already JPEG or PNG
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
          convertedFiles.push(file);
        } else {
          try {
            const convertedFile = await convertImageToJPEG(file);
            convertedFiles.push(convertedFile);
            toast.success(`Imagen convertida: ${file.name}`);
          } catch (error) {
            console.error('Error converting image:', error);
            toast.error(`No se pudo convertir: ${file.name}`);
          }
        }
      }
    }
    
    setFiles(convertedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId) {
      toast.error("Error: No se pudo identificar tu perfil de cliente");
      return;
    }

    const titleValidation = containsBannedContent(title);
    if (!titleValidation.isValid) {
      toast.error(titleValidation.reason);
      return;
    }

    const descriptionValidation = containsBannedContent(description);
    if (!descriptionValidation.isValid) {
      toast.error(descriptionValidation.reason);
      return;
    }

    setLoading(true);
    
    try {
      // Insert ticket into database
      const { data: ticketData, error: ticketError } = await supabase
        .from("ticket")
        .insert({
          cliente_id: clienteId,
          titulo: title,
          categoria: category,
          descripcion: description,
          comuna: comuna,
          estado: "abierto"
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Upload files if any
      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${ticketData.id}/${Math.random()}.${fileExt}`;
          
          // Upload to storage
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('tecnico-documents')
            .upload(fileName, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            return null;
          }

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
              ticket_id: ticketData.id,
              archivo_url: publicUrl,
              tipo: tipo
            });

          if (adjuntoError) {
            console.error("Error saving adjunto:", adjuntoError);
          }
        });

        await Promise.all(uploadPromises);
      }

      toast.success("Ticket creado exitosamente");
      navigate("/cliente/home");
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast.error("Error al crear el ticket: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Describe tu problema
          </h1>
          <p className="text-muted-foreground">
            Completa los detalles para que los técnicos puedan ayudarte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título del problema */}
          <div className="space-y-2">
            <Label htmlFor="title">Título del problema</Label>
            <Input
              id="title"
              type="text"
              placeholder="Ej: Fuga de agua en lavamanos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasfiteria">Gasfitería</SelectItem>
                <SelectItem value="electricidad">Electricidad</SelectItem>
                <SelectItem value="reparaciones">Reparaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descripción detallada */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción detallada</Label>
            <Textarea
              id="description"
              placeholder="Detalla lo que necesitas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px]"
              required
            />
          </div>

          {/* Adjuntar Fotos o Video */}
          <div className="space-y-2">
            <Label htmlFor="files">Adjuntar Fotos o Video</Label>
            <div className="relative">
              <input
                id="files"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="files"
                className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border rounded-md hover:border-primary hover:bg-accent transition-fast cursor-pointer"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {files.length > 0
                      ? `${files.length} archivo(s) seleccionado(s)`
                      : "Haz clic para adjuntar fotos o video"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos: JPG, PNG, WEBP, MP4 (convertidos automáticamente)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Comuna */}
          <div className="space-y-2">
            <Label htmlFor="comuna">Comuna</Label>
            <Select value={comuna} onValueChange={setComuna} required>
              <SelectTrigger id="comuna">
                <SelectValue placeholder="Selecciona tu comuna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="santiago">Santiago</SelectItem>
                <SelectItem value="providencia">Providencia</SelectItem>
                <SelectItem value="las-condes">Las Condes</SelectItem>
                <SelectItem value="vitacura">Vitacura</SelectItem>
                <SelectItem value="maipu">Maipú</SelectItem>
                <SelectItem value="la-florida">La Florida</SelectItem>
                <SelectItem value="puente-alto">Puente Alto</SelectItem>
                <SelectItem value="san-bernardo">San Bernardo</SelectItem>
                <SelectItem value="nunoa">Ñuñoa</SelectItem>
                <SelectItem value="la-reina">La Reina</SelectItem>
                <SelectItem value="penalolen">Peñalolén</SelectItem>
                <SelectItem value="macul">Macul</SelectItem>
                <SelectItem value="estacion-central">Estación Central</SelectItem>
                <SelectItem value="quinta-normal">Quinta Normal</SelectItem>
                <SelectItem value="recoleta">Recoleta</SelectItem>
                <SelectItem value="independencia">Independencia</SelectItem>
                <SelectItem value="conchali">Conchalí</SelectItem>
                <SelectItem value="huechuraba">Huechuraba</SelectItem>
                <SelectItem value="quilicura">Quilicura</SelectItem>
                <SelectItem value="renca">Renca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Creando ticket..." : "Publicar Ticket"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
