import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Ticket, ShieldCheck } from "lucide-react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [analytics, setAnalytics] = useState({
    ticketsPerDay: [] as any[],
    ticketsByComuna: [] as any[],
    userLogins: [] as any[],
    ticketsByCategory: [] as any[],
  });

  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Usuarios", url: "/admin/usuarios", icon: Users },
    { title: "Tickets", url: "/admin/tickets", icon: Ticket },
    { title: "Validación de Técnicos", url: "/admin/validacion", icon: ShieldCheck },
  ];

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    if (currentPath === "/admin") {
      fetchAnalytics();
    }
  }, [currentPath]);

  const fetchAnalytics = async () => {
    try {
      // Tickets per day (last 7 days)
      const { data: tickets } = await supabase
        .from("ticket")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const ticketsByDay: Record<string, number> = {};
      tickets?.forEach((t) => {
        const day = new Date(t.created_at).toLocaleDateString();
        ticketsByDay[day] = (ticketsByDay[day] || 0) + 1;
      });

      // Tickets by comuna
      const { data: ticketsByComuna } = await supabase
        .from("ticket")
        .select("comuna");

      const comunaCounts: Record<string, number> = {};
      ticketsByComuna?.forEach((t) => {
        comunaCounts[t.comuna] = (comunaCounts[t.comuna] || 0) + 1;
      });

      // Tickets by category
      const { data: ticketsByCategory } = await supabase
        .from("ticket")
        .select("categoria");

      const categoryCounts: Record<string, number> = {};
      ticketsByCategory?.forEach((t) => {
        categoryCounts[t.categoria] = (categoryCounts[t.categoria] || 0) + 1;
      });

      setAnalytics({
        ticketsPerDay: Object.entries(ticketsByDay).map(([day, count]) => ({ day, count })),
        ticketsByComuna: Object.entries(comunaCounts).map(([comuna, count]) => ({ comuna, count })).slice(0, 5),
        userLogins: [],
        ticketsByCategory: Object.entries(categoryCounts).map(([categoria, count]) => ({ categoria, count })),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--destructive))"];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">T</span>
                </div>
                <span className="text-xl font-bold text-primary">TecWork Admin</span>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold text-foreground">Panel de Administración</h2>
          </header>

          <main className="flex-1 p-6 bg-background">
            {currentPath === "/admin" ? (
              <div className="max-w-7xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold">Estadísticas del Sistema</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tickets Creados (Últimos 7 días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.ticketsPerDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tickets por Comuna (Top 5)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.ticketsByComuna}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="comuna" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tickets por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.ticketsByCategory}
                              dataKey="count"
                              nameKey="categoria"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {analytics.ticketsByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Total de Tickets</span>
                        <span className="text-2xl font-bold">{analytics.ticketsPerDay.reduce((sum, d) => sum + d.count, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Categorías Activas</span>
                        <span className="text-2xl font-bold">{analytics.ticketsByCategory.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Comunas con Tickets</span>
                        <span className="text-2xl font-bold">{analytics.ticketsByComuna.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
