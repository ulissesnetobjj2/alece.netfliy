import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Star, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Semaforo = "verde" | "laranja" | "vermelho";

const SEMAFORO_CONFIG: Record<Semaforo, { color: string; bg: string; label: string; dot: string }> = {
  verde: {
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    label: "Em Dia",
    dot: "bg-green-500",
  },
  laranja: {
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    label: "Atenção",
    dot: "bg-orange-400",
  },
  vermelho: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    label: "ATRASADO",
    dot: "bg-red-500",
  },
};

export default function Ranking() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [filterSemaforo, setFilterSemaforo] = useState<string>("all");
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [search, setSearch] = useState("");

  const rankingQuery = trpc.ranking.list.useQuery();
  const unidadesQuery = trpc.unidades.list.useQuery();

  const filtered = useMemo(() => {
    if (!rankingQuery.data) return [];
    return rankingQuery.data.filter((item) => {
      if (filterSemaforo !== "all" && item.semaforo !== filterSemaforo) return false;
      if (filterUnidade !== "all" && String(item.unidadeId) !== filterUnidade) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.riscoTitulo.toLowerCase().includes(q) &&
          !item.unidadeSigla.toLowerCase().includes(q) &&
          !item.unidadeTitulo.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rankingQuery.data, filterSemaforo, filterUnidade, search]);

  // Contagem por semáforo
  const counts = useMemo(() => {
    const data = rankingQuery.data ?? [];
    return {
      verde: data.filter((i) => i.semaforo === "verde").length,
      laranja: data.filter((i) => i.semaforo === "laranja").length,
      vermelho: data.filter((i) => i.semaforo === "vermelho").length,
      total: data.length,
    };
  }, [rankingQuery.data]);

  return (
    <AppLayout title="Painel de Transparência">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Ranking de Transparência</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Status das avaliações de riscos — ordenado por mais atrasados primeiro
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total de Riscos", value: counts.total, color: "text-foreground", bg: "bg-card" },
            { label: "Em Dia", value: counts.verde, color: "text-green-700", bg: "bg-green-50" },
            { label: "Atenção", value: counts.laranja, color: "text-orange-700", bg: "bg-orange-50" },
            { label: "Atrasados", value: counts.vermelho, color: "text-red-700", bg: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-border rounded-xl p-4`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-6 flex-wrap text-sm bg-card border border-border rounded-xl px-4 py-3">
          <span className="font-medium text-muted-foreground text-xs">Legenda:</span>
          {(["verde", "laranja", "vermelho"] as Semaforo[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${SEMAFORO_CONFIG[s].dot}`} />
              <span className="text-xs text-muted-foreground">
                {s === "verde" && "Verde: avaliado há menos de 30 dias"}
                {s === "laranja" && "Laranja: 31 a 45 dias"}
                {s === "vermelho" && "Vermelho: mais de 45 dias ou sem avaliação"}
              </span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Buscar por risco ou unidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={filterSemaforo} onValueChange={setFilterSemaforo}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Semáforo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="vermelho">Vermelho (Atrasado)</SelectItem>
              <SelectItem value="laranja">Laranja (Atenção)</SelectItem>
              <SelectItem value="verde">Verde (Em Dia)</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidadesQuery.data?.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.sigla} — {u.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Lista de Riscos com Semáforo */}
        {rankingQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Star className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhum risco encontrado com os filtros selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, index) => {
              const cfg = SEMAFORO_CONFIG[item.semaforo as Semaforo];
              return (
                <div
                  key={item.riscoId}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border ${cfg.bg} transition-all`}
                >
                  {/* Posição */}
                  <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
                    {index + 1}
                  </span>

                  {/* Semáforo */}
                  <div className={`w-4 h-4 rounded-full shrink-0 ${cfg.dot} shadow-sm`} />

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-tight truncate">
                      {item.riscoTitulo}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {item.unidadeSigla} — {item.processoTitulo}
                      </span>
                    </div>
                  </div>

                  {/* Status e data */}
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-semibold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.ultimaAvaliacao
                        ? `${item.diasDesdeAvaliacao}d atrás — ${format(new Date(item.ultimaAvaliacao), "dd/MM/yyyy", { locale: ptBR })}`
                        : "Sem avaliação"}
                    </p>
                    {item.semaforo === "vermelho" && (
                      <p className="text-xs text-red-600 font-medium mt-0.5 flex items-center gap-1 justify-end">
                        <AlertTriangle className="h-3 w-3" />
                        Preencha Reavaliação
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
