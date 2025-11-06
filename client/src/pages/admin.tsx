import { useState } from "react";
import { LogOut, Users, FolderOpen, Settings, ShoppingBag, Upload, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminImport from "@/components/admin/AdminImport";
import AdminSponsors from "@/components/admin/AdminSponsors";

type AdminSection = 'categories' | 'orders' | 'users' | 'settings' | 'import' | 'sponsors';

export default function AdminPage({ onLogout }: { onLogout: () => void }) {
  const [activeSection, setActiveSection] = useState<AdminSection>('categories');

  const menuItems = [
    {
      id: 'categories' as AdminSection,
      title: 'Categorías y Productos',
      icon: FolderOpen,
    },
    {
      id: 'import' as AdminSection,
      title: 'Importar Excel',
      icon: Upload,
    },
    {
      id: 'orders' as AdminSection,
      title: 'Pedidos',
      icon: ShoppingBag,
    },
    {
      id: 'sponsors' as AdminSection,
      title: 'Patrocinadores',
      icon: Heart,
    },
    {
      id: 'users' as AdminSection,
      title: 'Usuarios Administrativos',
      icon: Users,
    },
    {
      id: 'settings' as AdminSection,
      title: 'Configuración del Sitio',
      icon: Settings,
    },
  ];

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-display font-semibold px-4 py-4">
                FV BODEGONES
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="font-display font-semibold text-xl">
              Panel Administrativo
            </h1>
            <div className="w-10" />
          </header>

          <main className="flex-1 overflow-auto p-6">
            {activeSection === 'categories' && <AdminCategories />}
            {activeSection === 'import' && <AdminImport />}
            {activeSection === 'orders' && <AdminOrders />}
            {activeSection === 'sponsors' && <AdminSponsors />}
            {activeSection === 'users' && <AdminUsers />}
            {activeSection === 'settings' && <AdminSettings />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
