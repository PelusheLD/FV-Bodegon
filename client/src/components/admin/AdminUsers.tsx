import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AdminUser } from "@shared/schema";

type AdminUserResponse = Omit<AdminUser, 'password'>;

export default function AdminUsers() {
  const { data: users = [], isLoading } = useQuery<AdminUserResponse[]>({
    queryKey: ['/api/admin/users'],
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const { toast } = useToast();

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/admin/users', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Usuario creado" });
      setIsDialogOpen(false);
      setEditingUser(null);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admin/users/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Usuario actualizado" });
      setIsDialogOpen(false);
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Usuario eliminado" });
    },
  });

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as 'admin' | 'superadmin';

    const data = editingUser
      ? { username, email, role }
      : { username, email, password, role };

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold">Usuarios Administrativos</h2>
          <p className="text-muted-foreground">Gestiona los usuarios que pueden acceder al panel</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setIsDialogOpen(true);
          }}
          data-testid="button-add-user"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map(user => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle>{user.username}</CardTitle>
                    <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>
                      {user.role === 'superadmin' ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Super Admin
                        </>
                      ) : (
                        'Admin'
                      )}
                    </Badge>
                  </div>
                  <CardDescription>{user.email}</CardDescription>
                  <p className="text-xs text-muted-foreground">
                    Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingUser(user);
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-edit-user-${user.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {user.role !== 'superadmin' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      data-testid={`button-delete-user-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario Administrativo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-username">Nombre de usuario</Label>
                <Input
                  id="user-username"
                  name="username"
                  defaultValue={editingUser?.username}
                  required
                  data-testid="input-user-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">Correo electrónico</Label>
                <Input
                  id="user-email"
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email}
                  required
                  data-testid="input-user-email"
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="user-password">Contraseña</Label>
                  <Input
                    id="user-password"
                    name="password"
                    type="password"
                    required
                    data-testid="input-user-password"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="user-role">Rol</Label>
                <select
                  id="user-role"
                  name="role"
                  defaultValue={editingUser?.role || 'admin'}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  data-testid="select-user-role"
                >
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Super Administrador</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-save-user" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                {createUserMutation.isPending || updateUserMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
