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
import { LayoutDashboard, Users, Ticket, ShieldCheck, LogOut } from "lucide-react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [analytics, setAnalytics] = useState({
    ticketsPerDay: [] as any[],
    ticketsByComuna: [] as any[],
    userLogins: [] as any[],
    ticketsByCategory: [] as any[],
    usersByRole: [] as any[],
    usersPerDay: [] as any[],
    techniciansByStatus: [] as any[],
    totalUsers: 0,
    totalClientes: 0,
    totalTecnicos: 0,
  });

  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Usuarios", url: "/admin/usuarios", icon: Users },
    { title: "Tickets", url: "/admin/tickets", icon: Ticket },
    { title: "Validación de Técnicos", url: "/admin/validacion", icon: ShieldCheck },
  ];

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/admin/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    if (currentPath === "/admin") {
      fetchAnalytics();
    }
  }, [currentPath]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      await supabase.auth.signOut();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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

      // Users by role
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role");

      const roleCounts: Record<string, number> = { cliente: 0, tecnico: 0, admin: 0 };
      userRoles?.forEach((ur) => {
        roleCounts[ur.role] = (roleCounts[ur.role] || 0) + 1;
      });

      // Users per day (last 7 days)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const usersByDay: Record<string, number> = {};
      profiles?.forEach((p) => {
        const day = new Date(p.created_at).toLocaleDateString();
        usersByDay[day] = (usersByDay[day] || 0) + 1;
      });

      // Technicians by validation status
      const { data: tecnicos } = await supabase
        .from("tecnico_profile")
        .select("is_validated");

      const technicianCounts = { validados: 0, pendientes: 0 };
      tecnicos?.forEach((t) => {
        if (t.is_validated) {
          technicianCounts.validados++;
        } else {
          technicianCounts.pendientes++;
        }
      });

      // Get total users count
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id");

      setAnalytics({
        ticketsPerDay: Object.entries(ticketsByDay).map(([day, count]) => ({ day, count })),
        ticketsByComuna: Object.entries(comunaCounts).map(([comuna, count]) => ({ comuna, count })).slice(0, 5),
        userLogins: [],
        ticketsByCategory: Object.entries(categoryCounts).map(([categoria, count]) => ({ categoria, count })),
        usersByRole: Object.entries(roleCounts).map(([role, count]) => ({ role, count })),
        usersPerDay: Object.entries(usersByDay).map(([day, count]) => ({ day, count })),
        techniciansByStatus: [
          { status: "Validados", count: technicianCounts.validados },
          { status: "Pendientes", count: technicianCounts.pendientes },
        ],
        totalUsers: allProfiles?.length || 0,
        totalClientes: roleCounts.cliente,
        totalTecnicos: roleCounts.tecnico,
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

          <div className="mt-auto p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
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
                
                {/* User Stats Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.totalUsers}</div>
                      <p className="text-xs text-muted-foreground mt-1">Usuarios registrados</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.totalClientes}</div>
                      <p className="text-xs text-muted-foreground mt-1">Usuarios clientes</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Técnicos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.totalTecnicos}</div>
                      <p className="text-xs text-muted-foreground mt-1">Técnicos registrados</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analytics.ticketsPerDay.reduce((sum, d) => sum + d.count, 0)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Últimos 7 días</p>
                    </CardContent>
                  </Card>
                </div>

                {/* User Analytics Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usuarios por Rol</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.usersByRole}
                              dataKey="count"
                              nameKey="role"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {analytics.usersByRole.map((entry, index) => (
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
                      <CardTitle>Registros de Usuarios (Últimos 7 días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.usersPerDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estado de Técnicos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.techniciansByStatus}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="hsl(var(--chart-3))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                
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
