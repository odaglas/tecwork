import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Link, useLocation } from "react-router-dom";

const AdminDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Usuarios", url: "/admin/usuarios", icon: Users },
    { title: "Tickets", url: "/admin/tickets", icon: Ticket },
    { title: "Validación de Técnicos", url: "/admin/validacion", icon: ShieldCheck },
  ];

  const isActive = (path: string) => currentPath === path;

  const pendingTechnicians = [
    {
      id: 1,
      nombre: "Carlos Méndez",
      rut: "16.234.567-8",
      fechaSolicitud: "15/03/2024",
    },
    {
      id: 2,
      nombre: "María González",
      rut: "18.456.789-0",
      fechaSolicitud: "16/03/2024",
    },
    {
      id: 3,
      nombre: "Juan Pérez",
      rut: "17.890.123-4",
      fechaSolicitud: "17/03/2024",
    },
  ];

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
            <div className="max-w-7xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Técnicos Pendientes de Validación (3)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Fecha Solicitud</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTechnicians.map((tech) => (
                        <TableRow key={tech.id}>
                          <TableCell className="font-medium">{tech.nombre}</TableCell>
                          <TableCell>{tech.rut}</TableCell>
                          <TableCell>{tech.fechaSolicitud}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm">Revisar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pendingTechnicians.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No hay técnicos pendientes de validación.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
