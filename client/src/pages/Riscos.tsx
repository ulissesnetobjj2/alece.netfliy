import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const CATEGORIAS = ["Operacional", "Estratégico", "Financeiro", "Conformidade", "Reputacional", "Outro"] as const;
type Categoria = typeof CATEGORIAS[number];

const CATEGORIA_COLORS: Record<Categoria, string> = {
  "Operacional": "bg-blue-100 text-blue-800",
  "Estratégico": "bg-purple-100 text-purple-800",
  "Financeiro": "bg-yellow-100 text-yellow-800",
  "Conformidade": "bg-green-100 text-green-800",
  "Reputacional": "bg-pink-100 text-pink-800",
  "Outro": "bg-gray-100 text-gray-800",
};

type FormData = {
  titulo: string;
  processoId: string;
  causa: string;
  evento: string;
  consequencia: string;
  categoria: Categoria;
};

export default function Riscos() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [form, setForm] = useState<FormData>({
    titulo: "", processoId: "", causa: "", evento: "", consequencia: "", categoria: "Operacional",
  });

  const utils = trpc.useUtils();
  const unidadesQuery = trpc.unidades.list.useQuery();
  const processosQuery = trpc.processos.list.useQuery(
    filterUnidade !== "all" ? { unidadeId: parseInt(filterUnidade) } : {}
  );
  const riscosQuery = trpc.riscos.listByUnidade.useQuery(
    filterUnidade !== "all" ? { unidadeId: parseInt(filterUnidade) } : {}
  );

  const createMutation = trpc.riscos.create.useMutation({
    onSuccess: () => { utils.riscos.listByUnidade.invalidate(); setOpen(false); resetForm(); toast.success("Risco cadastrado!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.riscos.update.useMutation({
    onSuccess: () => { utils.riscos.listByUnidade.invalidate(); setOpen(false); resetForm(); toast.success("Risco atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ titulo: "", processoId: "", causa: "", evento: "", consequencia: "", categoria: "Operacional" });
    setEditingId(null);
  }

  function handleEdit(item: NonNullable<typeof riscosQuery.data>[0]) {
    const r = item.risco;
    setForm({
      titulo: r.titulo,
      processoId: String(r.processoId),
      causa: r.causa ?? "",
      evento: r.evento ?? "",
      consequencia: r.consequencia ?? "",
      categoria: (r.categoria ?? "Operacional") as Categoria,
    });
    setEditingId(r.id);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      titulo: form.titulo,
      processoId: parseInt(form.processoId),
      causa: form.causa || undefined,
      evento: form.evento || undefined,
      consequencia: form.consequencia || undefined,
      categoria: form.categoria,
    };
    if (editingId) updateMutation.mutate({ id: editingId, titulo: data.titulo, causa: data.causa, evento: data.evento, consequencia: data.consequencia, categoria: data.categoria });
    else createMutation.mutate(data);
  }

  return (
    <AppLayout title="Inventário de Riscos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Inventário de Riscos</h2>
            <p className="text-sm text-muted-foreground mt-1">Riscos identificados por processo e unidade</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Select value={filterUnidade} onValueChange={setFilterUnidade}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {unidadesQuery.data?.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.sigla}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Novo Risco</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Risco" : "Cadastrar Risco"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Título do Risco</Label>
                    <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Falha no controle de acesso" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Processo</Label>
                    <Select value={form.processoId} onValueChange={(v) => setForm({ ...form, processoId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione o processo" /></SelectTrigger>
                      <SelectContent>
                        {processosQuery.data?.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.titulo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Categoria</Label>
                    <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Categoria })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Causa</Label>
                    <Textarea value={form.causa} onChange={(e) => setForm({ ...form, causa: e.target.value })} placeholder="O que pode causar este risco?" rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Evento</Label>
                    <Textarea value={form.evento} onChange={(e) => setForm({ ...form, evento: e.target.value })} placeholder="Descreva o evento de risco" rows={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Consequência</Label>
                    <Textarea value={form.consequencia} onChange={(e) => setForm({ ...form, consequencia: e.target.value })} placeholder="Quais as consequências possíveis?" rows={2} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingId ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {riscosQuery.isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : riscosQuery.data?.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum risco cadastrado.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {riscosQuery.data?.map((item) => {
              const r = item.risco;
              const p = item.processo;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 shrink-0 mt-0.5">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground text-sm">{r.titulo}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIA_COLORS[r.categoria as Categoria ?? "Outro"]}`}>
                              {r.categoria}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Processo: {p.titulo}</p>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {r.causa && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">Causa</p>
                                <p className="text-xs text-foreground/80 line-clamp-2">{r.causa}</p>
                              </div>
                            )}
                            {r.evento && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">Evento</p>
                                <p className="text-xs text-foreground/80 line-clamp-2">{r.evento}</p>
                              </div>
                            )}
                            {r.consequencia && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">Consequência</p>
                                <p className="text-xs text-foreground/80 line-clamp-2">{r.consequencia}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
