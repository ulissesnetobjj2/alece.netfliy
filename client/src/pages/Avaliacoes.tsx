import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ESCALA = [1, 2, 3, 4, 5] as const;
const ESCALA_LABELS: Record<number, string> = {
  1: "Muito Baixo",
  2: "Baixo",
  3: "Médio",
  4: "Alto",
  5: "Muito Alto",
};

function getNivelColor(nivel: number): string {
  if (nivel <= 4) return "bg-green-100 text-green-800";
  if (nivel <= 9) return "bg-yellow-100 text-yellow-800";
  if (nivel <= 16) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getNivelLabel(nivel: number): string {
  if (nivel <= 4) return "Baixo";
  if (nivel <= 9) return "Médio";
  if (nivel <= 16) return "Alto";
  return "Crítico";
}

type FormData = {
  riscoId: string;
  probabilidade: string;
  impacto: string;
  justificativa: string;
};

export default function Avaliacoes() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [form, setForm] = useState<FormData>({ riscoId: "", probabilidade: "3", impacto: "3", justificativa: "" });

  const utils = trpc.useUtils();
  const unidadesQuery = trpc.unidades.list.useQuery();
  const riscosQuery = trpc.riscos.listByUnidade.useQuery(
    filterUnidade !== "all" ? { unidadeId: parseInt(filterUnidade) } : {}
  );

  // Buscar avaliações do risco selecionado
  const [selectedRiscoId, setSelectedRiscoId] = useState<number | null>(null);
  const avaliacoesQuery = trpc.avaliacoes.listByRisco.useQuery(
    { riscoId: selectedRiscoId! },
    { enabled: selectedRiscoId !== null }
  );

  const createMutation = trpc.avaliacoes.create.useMutation({
    onSuccess: () => {
      utils.avaliacoes.listByRisco.invalidate();
      utils.ranking.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("Avaliação registrada com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ riscoId: "", probabilidade: "3", impacto: "3", justificativa: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      riscoId: parseInt(form.riscoId),
      probabilidade: parseInt(form.probabilidade),
      impacto: parseInt(form.impacto),
      justificativa: form.justificativa || undefined,
    });
  }

  const nivelPreview = parseInt(form.probabilidade) * parseInt(form.impacto);

  return (
    <AppLayout title="Avaliações de Riscos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Avaliações de Riscos</h2>
            <p className="text-sm text-muted-foreground mt-1">Registre avaliações de probabilidade e impacto</p>
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
                <Button><Plus className="h-4 w-4 mr-2" />Nova Avaliação</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Avaliação de Risco</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Risco</Label>
                    <Select value={form.riscoId} onValueChange={(v) => setForm({ ...form, riscoId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione o risco" /></SelectTrigger>
                      <SelectContent>
                        {riscosQuery.data?.map((item) => (
                          <SelectItem key={item.risco.id} value={String(item.risco.id)}>
                            {item.risco.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Probabilidade</Label>
                      <Select value={form.probabilidade} onValueChange={(v) => setForm({ ...form, probabilidade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ESCALA.map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} — {ESCALA_LABELS[n]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Impacto</Label>
                      <Select value={form.impacto} onValueChange={(v) => setForm({ ...form, impacto: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ESCALA.map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} — {ESCALA_LABELS[n]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Preview do nível */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${getNivelColor(nivelPreview)}`}>
                    <div>
                      <p className="text-sm font-semibold">Nível de Risco: {nivelPreview}</p>
                      <p className="text-xs">{getNivelLabel(nivelPreview)} ({form.probabilidade} × {form.impacto})</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Justificativa (opcional)</Label>
                    <Textarea
                      value={form.justificativa}
                      onChange={(e) => setForm({ ...form, justificativa: e.target.value })}
                      placeholder="Descreva a justificativa desta avaliação..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                    <Button type="submit" disabled={!form.riscoId || createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Registrar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lista de riscos com botão para ver avaliações */}
        {riscosQuery.isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : riscosQuery.data?.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum risco disponível para avaliação.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {riscosQuery.data?.map((item) => {
              const r = item.risco;
              const isSelected = selectedRiscoId === r.id;
              return (
                <Card key={r.id} className={`transition-shadow ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Processo: {item.processo.titulo}</p>
                      </div>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRiscoId(isSelected ? null : r.id)}
                      >
                        {isSelected ? "Ocultar" : "Ver Avaliações"}
                      </Button>
                    </div>

                    {isSelected && (
                      <div className="mt-4 border-t border-border pt-4">
                        {avaliacoesQuery.isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando avaliações...
                          </div>
                        ) : avaliacoesQuery.data?.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nenhuma avaliação registrada ainda.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Histórico de Avaliações</p>
                            {avaliacoesQuery.data?.map((av) => (
                              <div key={av.id} className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-3 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getNivelColor(av.nivelRisco)}`}>
                                  {av.nivelRisco} — {getNivelLabel(av.nivelRisco)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  P:{av.probabilidade} × I:{av.impacto}
                                </span>
                                <span className="text-muted-foreground text-xs ml-auto">
                                  {format(new Date(av.dataAvaliacao), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                {av.avaliadoPor && (
                                  <span className="text-muted-foreground text-xs hidden sm:inline">
                                    por {av.avaliadoPor}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
