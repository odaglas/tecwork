import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { containsBannedContent } from "@/lib/utils";

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_picture: string | null;
  attachments?: { file_url: string; file_type: string }[];
}

interface SupportChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  clienteId: string;
  currentUserId: string;
}

export function SupportChatDialog({
  open,
  onOpenChange,
  ticketId,
  clienteId,
  currentUserId
}: SupportChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [supportChatId, setSupportChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      initializeSupportChat();
    }
  }, [open]);

  useEffect(() => {
    if (supportChatId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [supportChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const initializeSupportChat = async () => {
    setIsLoading(true);
    try {
      // Check if support chat already exists
      const { data: existingChat, error: fetchError } = await supabase
        .from("support_chat")
        .select("id")
        .eq("ticket_id", ticketId)
        .single();

      if (existingChat) {
        setSupportChatId(existingChat.id);
      } else {
        // Create new support chat
        const { data: newChat, error: createError } = await supabase
          .from("support_chat")
          .insert({
            ticket_id: ticketId,
            cliente_id: clienteId,
          })
          .select()
          .single();

        if (createError) throw createError;
        setSupportChatId(newChat.id);
      }
    } catch (error) {
      console.error("Error initializing support chat:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el chat de soporte",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!supportChatId) return;

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
      .eq("support_chat_id", supportChatId)
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
    if (!supportChatId) return;

    const channel = supabase
      .channel(`support-chat-${supportChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `support_chat_id=eq.${supportChatId}`,
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
    if (!newMessage.trim() && !selectedFile) return;
    if (!supportChatId) return;

    if (newMessage.trim()) {
      const validation = containsBannedContent(newMessage.trim());
      if (!validation.isValid) {
        toast({
          title: "Mensaje rechazado",
          description: validation.reason,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSending(true);
    try {
      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from("support_messages")
        .insert({
          support_chat_id: supportChatId,
          sender_id: currentUserId,
          message: newMessage.trim() || "Archivo adjunto",
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("support-attachments")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("support-attachments")
          .getPublicUrl(fileName);

        // Insert attachment
        await supabase.from("support_attachments").insert({
          support_message_id: messageData.id,
          file_url: urlData.publicUrl,
          file_type: selectedFile.type,
        });
      }

      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat de Soporte</DialogTitle>
          <DialogDescription>
            Reporta tu problema al equipo de administración
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Cargando chat...</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
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

            <div className="border-t pt-4 space-y-2">
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Archivo seleccionado: {selectedFile.name}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0] || null)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Escribe tu mensaje..."
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
                  disabled={isSending || (!newMessage.trim() && !selectedFile)}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
