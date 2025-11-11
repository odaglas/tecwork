import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Send } from "lucide-react";
import { ClientHeader } from "@/components/ClientHeader";

interface Message {
  id: number;
  sender: "user" | "technician";
  text: string;
  timestamp: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newMessage, setNewMessage] = useState("");
  
  // Mock data - would come from API/database
  const technicianName = "Felipe Vidal";
  const isOnline = true;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "user",
      text: "Hola Felipe, ¿puedes venir a las 5?",
      timestamp: "14:32",
    },
    {
      id: 2,
      sender: "technician",
      text: "Claro, nos vemos a las 5.",
      timestamp: "14:35",
    },
    {
      id: 3,
      sender: "user",
      text: "Perfecto, gracias.",
      timestamp: "14:36",
    },
    {
      id: 4,
      sender: "technician",
      text: "De nada, cualquier cosa me avisas.",
      timestamp: "14:37",
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      sender: "user",
      text: newMessage,
      timestamp: new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientHeader />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-secondary text-secondary-foreground rounded-bl-none"
                }`}
              >
                <p className="text-sm md:text-base">{message.text}</p>
                <span
                  className={`text-xs mt-1 block ${
                    message.sender === "user"
                      ? "text-primary-foreground/70"
                      : "text-secondary-foreground/70"
                  }`}
                >
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim()}
              className="shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
