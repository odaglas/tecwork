import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SupportChat {
  id: string;
  ticket_id: string;
  status: string;
  created_at: string;
  ticket: {
    titulo: string;
  };
  cliente_id: string;
}

export default function AdminSupportChats() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSupportChats();
  }, []);

  const fetchSupportChats = async () => {
    try {
      const { data: chatsData, error } = await supabase
        .from("support_chat")
        .select(`
          *,
          ticket:ticket_id (
            titulo
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch cliente names separately
      const chatsWithClientes = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: clienteData } = await supabase
            .from("cliente_profile")
            .select("user_id")
            .eq("id", chat.cliente_id)
            .single();

          let clienteName = "Cliente";
          if (clienteData) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("nombre")
              .eq("id", clienteData.user_id)
              .single();
            
            clienteName = profileData?.nombre || "Cliente";
          }

          return {
            ...chat,
            cliente_nombre: clienteName,
          };
        })
      );

      setChats(chatsWithClientes as any);
    } catch (error) {
      console.error("Error fetching support chats:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los chats de soporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      abierto: "destructive",
      en_revision: "default",
      resuelto: "secondary",
    };

    const labels: { [key: string]: string } = {
      abierto: "Abierto",
      en_revision: "En Revisión",
      resuelto: "Resuelto",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Cargando chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chats de Soporte</h1>
          <p className="text-muted-foreground">
            Administra las solicitudes de soporte de los clientes
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {chats.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay chats de soporte activos
            </CardContent>
          </Card>
        ) : (
          chats.map((chat) => (
            <Card key={chat.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {chat.ticket.titulo}
                    </CardTitle>
                    <CardDescription>
                      Cliente: {(chat as any).cliente_nombre || "N/A"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(chat.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Creado: {new Date(chat.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    onClick={() => navigate(`/admin/support-chat/${chat.id}`)}
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Abrir Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
