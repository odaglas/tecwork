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
import { LayoutDashboard, Users, Ticket, ShieldCheck, LogOut, MessageSquare, DollarSign, Settings, AlertTriangle } from "lucide-react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import tecworkLogo from "@/assets/tecwork-logo.png";
import { FinancialReportExport } from "@/components/FinancialReportExport";

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
    revenuePerDay: [] as any[],
    paymentsByState: [] as any[],
    totalRevenue: 0,
    totalCommissions: 0,
    totalNetRevenue: 0,
  });
  const [notifications, setNotifications] = useState({
    supportChats: 0,
    pendingValidations: 0,
    pendingPayments: 0,
    pendingDisputas: 0,
  });

  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Usuarios", url: "/admin/usuarios", icon: Users },
    { title: "Tickets", url: "/admin/tickets", icon: Ticket },
    { title: "Validación de Técnicos", url: "/admin/validacion", icon: ShieldCheck },
    { title: "Soporte", url: "/admin/support-chats", icon: MessageSquare },
    { title: "Pagos Pendientes", url: "/admin/pagos", icon: DollarSign },
    { title: "Disputas", url: "/admin/disputas", icon: AlertTriangle },
    { title: "Configuración", url: "/admin/settings", icon: Settings },
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
    fetchNotifications();
    
    // Subscribe to realtime updates
    const supportChannel = supabase
      .channel('support-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chat',
        },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        () => fetchNotifications()
      )
      .subscribe();

    const validationChannel = supabase
      .channel('validation-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tecnico_profile',
        },
        () => fetchNotifications()
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel('payments-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pago',
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(supportChannel);
      supabase.removeChannel(validationChannel);
      supabase.removeChannel(paymentsChannel);
    };
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

  const fetchNotifications = async () => {
    try {
      // Count support chats with status 'abierto' or 'en_revision'
      const { count: openChats } = await supabase
        .from("support_chat")
        .select("*", { count: 'exact', head: true })
        .in('status', ['abierto', 'en_revision']);

      // Count pending technician validations
      const { count: pendingValidations } = await supabase
        .from("tecnico_profile")
        .select("*", { count: 'exact', head: true })
        .eq('is_validated', false);

      // Count pending payments (pagado_retenido)
      const { count: pendingPayments } = await supabase
        .from("pago")
        .select("*", { count: 'exact', head: true })
        .eq('estado_pago', 'pagado_retenido');

      // Count pending disputas
      const { count: pendingDisputas } = await supabase
        .from("disputas")
        .select("*", { count: 'exact', head: true })
        .in('estado', ['pendiente', 'en_revision']);

      setNotifications({
        supportChats: openChats || 0,
        pendingValidations: pendingValidations || 0,
        pendingPayments: pendingPayments || 0,
        pendingDisputas: pendingDisputas || 0,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

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

      // Payment analytics
      const { data: pagos } = await supabase
        .from("pago")
        .select("monto_total, comision_monto, monto_neto, estado_pago, created_at");

      // Revenue per day (last 7 days)
      const revenueByDay: Record<string, { total: number; comision: number; neto: number }> = {};
      let totalRevenue = 0;
      let totalCommissions = 0;
      let totalNetRevenue = 0;

      pagos?.forEach((p) => {
        const day = new Date(p.created_at).toLocaleDateString();
        if (!revenueByDay[day]) {
          revenueByDay[day] = { total: 0, comision: 0, neto: 0 };
        }
        revenueByDay[day].total += p.monto_total;
        revenueByDay[day].comision += p.comision_monto || 0;
        revenueByDay[day].neto += p.monto_neto || 0;
        
        totalRevenue += p.monto_total;
        totalCommissions += p.comision_monto || 0;
        totalNetRevenue += p.monto_neto || 0;
      });

      // Payment states distribution
      const paymentStates: Record<string, number> = {};
      pagos?.forEach((p) => {
        const stateLabel = {
          'pendiente_cliente': 'Pendiente Cliente',
          'pagado_retenido': 'Retenido',
          'liberado_tecnico': 'Liberado',
          'disputa': 'En Disputa'
        }[p.estado_pago] || p.estado_pago;
        
        paymentStates[stateLabel] = (paymentStates[stateLabel] || 0) + 1;
      });

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
        revenuePerDay: Object.entries(revenueByDay).map(([day, amounts]) => ({ 
          day, 
          total: amounts.total,
          comision: amounts.comision,
          neto: amounts.neto
        })),
        paymentsByState: Object.entries(paymentStates).map(([estado, count]) => ({ estado, count })),
        totalRevenue,
        totalCommissions,
        totalNetRevenue,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--destructive))"];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="bg-card border-r">
          <SidebarContent className="bg-card">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <img src={tecworkLogo} alt="TecWork Logo" className="w-10 h-10" />
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
                        <Link to={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          {item.url === "/admin/support-chats" && notifications.supportChats > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
                              {notifications.supportChats}
                            </Badge>
                          )}
                          {item.url === "/admin/validacion" && notifications.pendingValidations > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
                              {notifications.pendingValidations}
                            </Badge>
                          )}
                          {item.url === "/admin/pagos" && notifications.pendingPayments > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
                              {notifications.pendingPayments}
                            </Badge>
                          )}
                          {item.url === "/admin/disputas" && notifications.pendingDisputas > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-xs">
                              {notifications.pendingDisputas}
                            </Badge>
                          )}
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

                {/* Money Flow Summary Cards */}
                <h3 className="text-xl font-bold mt-8 mb-4">Flujo de Dinero</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        ${analytics.totalRevenue.toLocaleString('es-CL')}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Pagos totales</p>
                    </CardContent>
                  </Card>

                  <Card className="border-success/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Comisiones Ganadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-success">
                        ${analytics.totalCommissions.toLocaleString('es-CL')}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">15% de comisión</p>
                    </CardContent>
                  </Card>

                  <Card className="border-muted-foreground/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pagado a Técnicos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        ${analytics.totalNetRevenue.toLocaleString('es-CL')}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Monto neto</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Money Flow Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Flujo de Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.revenuePerDay}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="total" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              name="Total"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="comision" 
                              stroke="hsl(var(--success))" 
                              strokeWidth={2}
                              name="Comisión"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="neto" 
                              stroke="hsl(var(--accent))" 
                              strokeWidth={2}
                              name="Neto"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estados de Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.paymentsByState}
                              dataKey="count"
                              nameKey="estado"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {analytics.paymentsByState.map((entry, index) => (
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

                {/* Financial Report Export */}
                <div className="mt-6">
                  <FinancialReportExport />
                </div>

                {/* User Analytics Charts */}
                <h3 className="text-xl font-bold mt-8 mb-4">Análisis de Usuarios</h3>
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
