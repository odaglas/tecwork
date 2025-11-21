import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_picture: string | null;
  attachments?: { file_url: string; file_type: string }[];
}

interface SupportChatData {
  id: string;
  status: string;
  ticket: {
    titulo: string;
  };
  cliente_id: string;
  cliente_nombre: string;
}

export default function AdminSupportChatDetail() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chatData, setChatData] = useState<SupportChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchChatData();
    loadMessages();
    subscribeToMessages();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setCurrentUserId(profile.id);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchChatData = async () => {
    const { data, error } = await supabase
      .from("support_chat")
      .select(`
        *,
        ticket:ticket_id (
          titulo
        )
      `)
      .eq("id", chatId)
      .single();

    if (error) {
      console.error("Error fetching chat data:", error);
      return;
    }

    // Fetch cliente name separately
    let clienteName = "Cliente";
    if (data) {
      const { data: clienteData } = await supabase
        .from("cliente_profile")
        .select("user_id")
        .eq("id", data.cliente_id)
        .single();

      if (clienteData) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nombre")
          .eq("id", clienteData.user_id)
          .single();
        
        clienteName = profileData?.nombre || "Cliente";
      }

      setChatData({
        ...data,
        cliente_nombre: clienteName,
      });
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("support_messages")
      .select(`
        *,
        profiles:sender_id (
          nombre,
          profile_picture_url
        ),
        support_attachments (
          file_url,
          file_type
        )
      `)
      .eq("support_chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    const formattedMessages: Message[] = data.map((msg: any) => ({
      id: msg.id,
      message: msg.message,
      created_at: msg.created_at,
      sender_id: msg.sender_id,
      sender_name: msg.profiles?.nombre || "Usuario",
      sender_picture: msg.profiles?.profile_picture_url || null,
      attachments: msg.support_attachments || [],
    }));

    setMessages(formattedMessages);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`admin-support-chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `support_chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nombre, profile_picture_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMsg: Message = {
            id: payload.new.id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            sender_id: payload.new.sender_id,
            sender_name: profile?.nombre || "Usuario",
            sender_picture: profile?.profile_picture_url || null,
            attachments: [],
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        support_chat_id: chatId,
        sender_id: currentUserId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_chat")
        .update({ status: newStatus })
        .eq("id", chatId);

      if (error) throw error;

      setChatData((prev) => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: "Estado actualizado",
        description: "El estado del chat ha sido actualizado",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  if (!chatData) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/support-chats")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{chatData.ticket.titulo}</h1>
          <p className="text-muted-foreground">
            Cliente: {chatData.cliente_nombre}
          </p>
        </div>
        <Select value={chatData.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="abierto">Abierto</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
            <SelectItem value="resuelto">Resuelto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Mensajes</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={msg.sender_picture || undefined} />
                      <AvatarFallback>
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`flex flex-col ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-md ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline block"
                              >
                                Ver archivo adjunto
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex gap-2 border-t pt-4">
            <Input
              placeholder="Escribe tu respuesta..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
