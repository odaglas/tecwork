import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleSelection from "./pages/RoleSelection";
import Index from "./pages/Index";
import Login from "./pages/Login";
import TechnicianLogin from "./pages/TechnicianLogin";
import ClientRegister from "./pages/ClientRegister";
import TechnicianRegister from "./pages/TechnicianRegister";
import ClientHome from "./pages/ClientHome";
import CreateTicket from "./pages/CreateTicket";
import CompareQuotes from "./pages/CompareQuotes";
import TicketDetail from "./pages/TicketDetail";
import TechnicianTicketDetail from "./pages/TechnicianTicketDetail";
import Chat from "./pages/Chat";
import TechnicianProfile from "./pages/TechnicianProfile";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianQuoteForm from "./pages/TechnicianQuoteForm";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/inicio" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-tecnico" element={<TechnicianLogin />} />
          <Route path="/registro-cliente" element={<ClientRegister />} />
          <Route path="/registro-tecnico" element={<TechnicianRegister />} />
          <Route path="/cliente/home" element={<ClientHome />} />
          <Route path="/cliente/crear-ticket" element={<CreateTicket />} />
          <Route path="/cliente/ticket/:id" element={<TicketDetail />} />
          <Route path="/comparar-cotizaciones" element={<CompareQuotes />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/tecnico/perfil/:id" element={<TechnicianProfile />} />
          <Route path="/tecnico/ticket/:id" element={<TechnicianTicketDetail />} />
          <Route path="/tecnico/cotizar/:ticketId" element={<TechnicianQuoteForm />} />
          <Route path="/tecnico/dashboard" element={<TechnicianDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
