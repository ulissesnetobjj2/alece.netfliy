import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BarChart3, ClipboardList, FileText, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedUnidade, setSelectedUnidade] = useState<string>("all");

  const unidadesQuery = trpc.unidades.list.useQuery();
  const myInfoQuery = trpc.dashboard.myInfo.useQuery();
  const statsQuery = trpc.dashboard.stats.useQuery(
    selectedUnidade !== "all" ? { unidadeId: parseInt(selectedUnidade) } : {}
  );

  const stats = statsQuery.data;
  const myInfo = myInfoQuery.data;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Boas-vindas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Olá, {user?.name?.split(" ")[0] ?? "Usuário"}!
            </h2>
            <p className="text-muted-foreground mt-1">
              {isAdmin
                ? "Visão geral de todos os órgãos da ALECE"
                : `Unidade: ${myInfo?.unidadeTitulo ?? "..."} — ${myInfo?.perfil ?? ""}`}
            </p>
          </div>

          {/* Filtro por órgão (apenas admin) */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por órgão:</span>
              <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os órgãos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os órgãos</SelectItem>
                  {unidadesQuery.data?.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.sigla} — {u.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Cards de Estatísticas */}
        {statsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Total de Processos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats?.totalProcessos ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Processos cadastrados</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Total de Riscos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats?.totalRiscos ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Riscos identificados</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-green-500" />
                  Planos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats?.planosAtivos ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Pendentes ou em andamento</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Atalhos Principais */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Acesso Rápido</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Meus Riscos",
                desc: "Visualize e gerencie os riscos da sua unidade",
                href: "/riscos",
                icon: <AlertTriangle className="h-6 w-6" />,
                color: "text-orange-500",
                bg: "bg-orange-50 hover:bg-orange-100",
              },
              {
                label: "Planos de Ação",
                desc: "Acompanhe planos de mitigação e prazos",
                href: "/planos",
                icon: <ClipboardList className="h-6 w-6" />,
                color: "text-green-600",
                bg: "bg-green-50 hover:bg-green-100",
              },
              {
                label: "Avaliações",
                desc: "Registre avaliações de probabilidade e impacto",
                href: "/avaliacoes",
                icon: <BarChart3 className="h-6 w-6" />,
                color: "text-blue-600",
                bg: "bg-blue-50 hover:bg-blue-100",
              },
              {
                label: "Ranking",
                desc: "Painel de transparência com semáforo de avaliações",
                href: "/ranking",
                icon: <Star className="h-6 w-6" />,
                color: "text-purple-600",
                bg: "bg-purple-50 hover:bg-purple-100",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className={`cursor-pointer transition-colors ${item.bg} border-0 shadow-sm`}>
                  <CardContent className="p-5">
                    <div className={`${item.color} mb-3`}>{item.icon}</div>
                    <h4 className="font-semibold text-foreground mb-1">{item.label}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Painel de Transparência Preview */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Painel de Transparência</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Status das avaliações de riscos por unidade</p>
            </div>
            <Link href="/ranking">
              <Button variant="outline" size="sm">Ver completo</Button>
            </Link>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Verde: avaliado há menos de 30 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              <span className="text-muted-foreground">Laranja: 31 a 45 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Vermelho: mais de 45 dias ou sem avaliação</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
