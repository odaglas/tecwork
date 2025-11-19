import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  email: string;
  nombre: string;
  rut: string;
  telefono: string;
  role: string;
  comuna?: string;
  is_validated?: boolean;
}

const AdminUsuarios = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [comunaFilter, setComunaFilter] = useState("");
  const [validationFilter, setValidationFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Roles error:", rolesError);
        throw rolesError;
      }
      
      console.log("Fetched roles:", roles);

      // Get cliente profiles for comuna info
      const { data: clienteProfiles, error: clienteError } = await supabase
        .from("cliente_profile")
        .select("user_id, comuna");

      if (clienteError) throw clienteError;

      // Get tecnico profiles for validation status
      const { data: tecnicoProfiles, error: tecnicoError } = await supabase
        .from("tecnico_profile")
        .select("user_id, is_validated, comunas_cobertura");

      if (tecnicoError) throw tecnicoError;

      // Combine all data
      const usersData: UserData[] = profiles.map((profile) => {
        const userRoles = roles?.filter((r) => r.user_id === profile.id) || [];
        const clienteProfile = clienteProfiles?.find((c) => c.user_id === profile.id);
        const tecnicoProfile = tecnicoProfiles?.find((t) => t.user_id === profile.id);

        console.log(`Processing ${profile.nombre}:`, {
          userRoles,
          hasClienteProfile: !!clienteProfile,
          hasTecnicoProfile: !!tecnicoProfile,
          is_validated: tecnicoProfile?.is_validated
        });

        // Determine primary role: tecnico > cliente > admin
        let primaryRole = "unknown";
        if (userRoles.some(r => r.role === "tecnico")) {
          primaryRole = "tecnico";
        } else if (userRoles.some(r => r.role === "cliente")) {
          primaryRole = "cliente";
        } else if (userRoles.some(r => r.role === "admin")) {
          primaryRole = "admin";
        }

        console.log(`${profile.nombre} primary role:`, primaryRole);

        // Get comuna
        let comuna = clienteProfile?.comuna;
        if (!comuna && tecnicoProfile?.comunas_cobertura?.length > 0) {
          comuna = tecnicoProfile.comunas_cobertura.join(", ");
        }
        // Show "No especificado" for empty comunas
        if (!comuna || comuna === "") {
          comuna = undefined;
        }

        return {
          id: profile.id,
          email: profile.email,
          nombre: profile.nombre,
          rut: profile.rut,
          telefono: profile.telefono,
          role: primaryRole,
          comuna: comuna,
          is_validated: tecnicoProfile?.is_validated,
        };
      });

      console.log("Final usersData:", usersData);

      setUsers(usersData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      // This would need an edge function to properly delete a user
      // For now, just show a message
      toast({
        title: "Funcionalidad pendiente",
        description: "La eliminación de usuarios requiere una función backend adicional",
      });
      setDeleteUserId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (validationFilter === "pending" && user.role === "tecnico" && user.is_validated !== false) return false;
    if (validationFilter === "validated" && user.role === "tecnico" && user.is_validated !== true) return false;
    if (comunaFilter && user.comuna && !user.comuna.toLowerCase().includes(comunaFilter.toLowerCase())) return false;
    if (searchTerm && !user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.rut.includes(searchTerm)) return false;
    return true;
  });

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link to="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Gestión de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar por nombre, email o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Filtrar por comuna..."
                value={comunaFilter}
                onChange={(e) => setComunaFilter(e.target.value)}
              />
              <Select value={validationFilter} onValueChange={setValidationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado validación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="validated">Validado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Comuna</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.rut}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{user.comuna || "No especificado"}</TableCell>
                      <TableCell>
                        {user.role === "tecnico" ? (
                          <span className={user.is_validated ? "text-green-600" : "text-yellow-600"}>
                            {user.is_validated ? "Validado" : "Pendiente"}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteUserId(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsuarios;
