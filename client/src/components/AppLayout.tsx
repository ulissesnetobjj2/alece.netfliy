import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Building2,
  ChevronDown,
  FileText,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
  ClipboardList,
  AlertTriangle,
  Star,
  LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Ranking", href: "/ranking", icon: <Star className="h-4 w-4" /> },
  { label: "Processos", href: "/processos", icon: <FileText className="h-4 w-4" /> },
  { label: "Riscos", href: "/riscos", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "Avaliações", href: "/avaliacoes", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Planos de Ação", href: "/planos", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Servidores", href: "/servidores", icon: <Users className="h-4 w-4" />, roles: ["admin", "gestor"] },
  { label: "Unidades", href: "/unidades", icon: <Building2 className="h-4 w-4" />, roles: ["admin"] },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const myInfoQuery = trpc.dashboard.myInfo.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const myInfo = myInfoQuery.data;
  const perfil = myInfo?.perfil?.toLowerCase() ?? "servidor";
  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Faça login para acessar o sistema.</p>
          <a href={getLoginUrl()}>
            <Button>Entrar</Button>
          </a>
        </div>
      </div>
    );
  }

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (isAdmin) return true;
    if (item.roles.includes("gestor") && perfil === "gestor") return true;
    return false;
  });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary/20">
              <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <p className="font-bold text-sidebar-foreground text-sm leading-tight">ALECE</p>
              <p className="text-sidebar-foreground/50 text-xs">Gestão de Riscos</p>
            </div>
          </div>
        </div>

        {/* Perfil do usuário */}
        {myInfo && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="bg-sidebar-accent rounded-lg px-3 py-2">
              <p className="text-sidebar-foreground text-xs font-medium truncate">{user?.name ?? user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isAdmin
                      ? "bg-blue-500/20 text-blue-300"
                      : myInfo.perfil === "Gestor"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-gray-500/20 text-gray-300"
                  }`}
                >
                  {isAdmin ? "Admin" : myInfo.perfil}
                </span>
                <span className="text-sidebar-foreground/50 text-xs truncate">{myInfo.sigla}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-sidebar-foreground">ALECE - Riscos</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-foreground text-base flex-1">{title ?? "Sistema de Gestão de Riscos"}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm text-muted-foreground max-w-32 truncate">
                  {user?.name ?? user?.email}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{user?.name ?? user?.email}</p>
                <p className="text-xs text-muted-foreground">{isAdmin ? "Administrador" : myInfo?.perfil}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
