import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
  sender_picture?: string | null;
}

const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profile) {
          setCurrentUserId(profile.id);
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData) {
          setUserRole(roleData.role);
        }

        await loadMessages();
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el chat",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [id, navigate, toast]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        id,
        sender_id,
        message,
        created_at,
        profiles!chat_messages_sender_id_fkey (
          nombre,
          profile_picture_url
        )
      `)
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    const formattedMessages = data.map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      message: msg.message,
      created_at: msg.created_at,
      sender_name: msg.profiles?.nombre || "Usuario",
      sender_picture: msg.profiles?.profile_picture_url || null,
    }));

    setMessages(formattedMessages);
    setTimeout(scrollToBottom, 100);
  };

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `ticket_id=eq.${id}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nombre, profile_picture_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg: Message = {
            id: payload.new.id,
            sender_id: payload.new.sender_id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            sender_name: profile?.nombre || "Usuario",
            sender_picture: profile?.profile_picture_url || null,
          };

          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase.from("chat_messages").insert({
      ticket_id: id,
      sender_id: currentUserId,
      message: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Cargando chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl p-4">
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              const route = userRole === "tecnico" 
                ? `/tecnico/ticket/${id}` 
                : `/cliente/ticket/${id}`;
              navigate(route);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Chat</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender_id !== currentUserId && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={msg.sender_picture || undefined} />
                    <AvatarFallback>{msg.sender_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender_id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">{msg.sender_name}</div>
                  <div className="break-words">{msg.message}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {msg.sender_id === currentUserId && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={msg.sender_picture || undefined} />
                    <AvatarFallback>{msg.sender_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;