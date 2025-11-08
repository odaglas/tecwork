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
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Camera, ArrowLeft } from "lucide-react";

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [comuna, setComuna] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement ticket creation logic
    console.log("Create ticket:", { title, category, description, comuna, files });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground hover:text-primary transition-fast"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Link to="/inicio" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-primary">TecWork</span>
          </Link>
        </div>
      </header>

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
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
              />
              <label
                htmlFor="files"
                className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border rounded-md hover:border-primary hover:bg-accent transition-fast cursor-pointer"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {files && files.length > 0
                      ? `${files.length} archivo(s) seleccionado(s)`
                      : "Haz clic para adjuntar fotos o video"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos: JPG, PNG, MP4
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
          <Button type="submit" className="w-full" size="lg">
            Publicar Ticket
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
