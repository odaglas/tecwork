import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

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
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
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

            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <h2 className="font-semibold text-foreground">
                  {technicianName} (Técnico)
                </h2>
                <div className="flex items-center gap-2 justify-end">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? "bg-success" : "bg-muted-foreground"
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {isOnline ? "En línea" : "Desconectado"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

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
