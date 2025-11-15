import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import TechnicianPublicProfile from "./pages/TechnicianPublicProfile";
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
          <Route path="/" element={<Index />} />
          <Route path="/inicio" element={<Index />} />
          <Route path="/login" element={<RoleSelection />} />
          <Route path="/login-cliente" element={<Login />} />
          <Route path="/login-tecnico" element={<TechnicianLogin />} />
          <Route path="/registro-cliente" element={<ClientRegister />} />
          <Route path="/registro-tecnico" element={<TechnicianRegister />} />
          
          {/* Cliente routes - protected */}
          <Route path="/cliente/home" element={<ProtectedRoute allowedRole="cliente"><ClientHome /></ProtectedRoute>} />
          <Route path="/cliente/crear-ticket" element={<ProtectedRoute allowedRole="cliente"><CreateTicket /></ProtectedRoute>} />
          <Route path="/cliente/ticket/:id" element={<ProtectedRoute allowedRole="cliente"><TicketDetail /></ProtectedRoute>} />
          <Route path="/comparar-cotizaciones" element={<ProtectedRoute allowedRole="cliente"><CompareQuotes /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute allowedRole="cliente"><Chat /></ProtectedRoute>} />
          <Route path="/tecnico/:id" element={<ProtectedRoute allowedRole="cliente"><TechnicianPublicProfile /></ProtectedRoute>} />
          
          {/* Tecnico routes - protected */}
          <Route path="/tecnico/perfil/:id" element={<ProtectedRoute allowedRole="tecnico"><TechnicianProfile /></ProtectedRoute>} />
          <Route path="/tecnico/ticket/:id" element={<ProtectedRoute allowedRole="tecnico"><TechnicianTicketDetail /></ProtectedRoute>} />
          <Route path="/tecnico/cotizar/:ticketId" element={<ProtectedRoute allowedRole="tecnico"><TechnicianQuoteForm /></ProtectedRoute>} />
          <Route path="/tecnico/dashboard" element={<ProtectedRoute allowedRole="tecnico"><TechnicianDashboard /></ProtectedRoute>} />
          
          {/* Admin routes - protected */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
