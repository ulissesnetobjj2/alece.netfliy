import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Status = "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";

const STATUS_COLORS: Record<Status, string> = {
  "Pendente": "bg-yellow-100 text-yellow-800",
  "Em Andamento": "bg-blue-100 text-blue-800",
  "Concluído": "bg-green-100 text-green-800",
  "Cancelado": "bg-gray-100 text-gray-600",
};

type FormData = {
  riscoId: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  status: Status;
  observacoes: string;
};

export default function Planos() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState<FormData>({
    riscoId: "", descricao: "", responsavel: "", prazo: "", status: "Pendente", observacoes: "",
  });

  const utils = trpc.useUtils();
  const unidadesQuery = trpc.unidades.list.useQuery();
  const riscosQuery = trpc.riscos.listByUnidade.useQuery(
    filterUnidade !== "all" ? { unidadeId: parseInt(filterUnidade) } : {}
  );
  const planosQuery = trpc.planos.listByUnidade.useQuery(
    filterUnidade !== "all" ? { unidadeId: parseInt(filterUnidade) } : {}
  );

  const createMutation = trpc.planos.create.useMutation({
    onSuccess: () => { utils.planos.listByUnidade.invalidate(); setOpen(false); resetForm(); toast.success("Plano criado!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.planos.update.useMutation({
    onSuccess: () => { utils.planos.listByUnidade.invalidate(); setOpen(false); resetForm(); toast.success("Plano atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ riscoId: "", descricao: "", responsavel: "", prazo: "", status: "Pendente", observacoes: "" });
    setEditingId(null);
  }

  function handleEdit(item: NonNullable<typeof planosQuery.data>[0]) {
    const p = item.plano;
    setForm({
      riscoId: String(p.riscoId),
      descricao: p.descricao,
      responsavel: p.responsavel ?? "",
      prazo: p.prazo ? format(new Date(p.prazo), "yyyy-MM-dd") : "",
      status: p.status as Status,
      observacoes: p.observacoes ?? "",
    });
    setEditingId(p.id);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      riscoId: parseInt(form.riscoId),
      descricao: form.descricao,
      responsavel: form.responsavel || undefined,
      prazo: form.prazo || undefined,
      status: form.status,
      observacoes: form.observacoes || undefined,
    };
    if (editingId) {
      const { riscoId, ...rest } = data;
      updateMutation.mutate({ id: editingId, ...rest });
    } else {
      createMutation.mutate(data);
    }
  }

  const filteredPlanos = planosQuery.data?.filter((item) =>
    filterStatus === "all" || item.plano.status === filterStatus
  );

  const isPrazoAtrasado = (prazo: Date | null, status: string) => {
    if (!prazo || status === "Concluído" || status === "Cancelado") return false;
    return isPast(new Date(prazo));
  };

  return (
    <AppLayout title="Planos de Ação">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Planos de Ação</h2>
            <p className="text-sm text-muted-foreground mt-1">Gerencie as ações de mitigação de riscos</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <Select value={filterUnidade} onValueChange={setFilterUnidade}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {unidadesQuery.data?.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.sigla}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Plano" : "Novo Plano de Ação"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  {!editingId && (
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
                  )}
                  <div className="space-y-1.5">
                    <Label>Descrição da Ação</Label>
                    <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva a ação a ser tomada..." rows={3} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Responsável</Label>
                      <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Prazo</Label>
                      <Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Observações</Label>
                    <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações adicionais..." rows={2} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingId ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {planosQuery.isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : filteredPlanos?.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum plano de ação encontrado.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredPlanos?.map((item) => {
              const p = item.plano;
              const r = item.risco;
              const atrasado = isPrazoAtrasado(p.prazo, p.status);
              return (
                <Card key={p.id} className={`hover:shadow-md transition-shadow ${atrasado ? "border-red-200" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status as Status]}`}>
                            {p.status}
                          </span>
                          {atrasado && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                              ATRASADO
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-foreground text-sm leading-snug">{p.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">Risco: {r.titulo}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          {p.responsavel && <span>Responsável: <strong className="text-foreground">{p.responsavel}</strong></span>}
                          {p.prazo && (
                            <span className={atrasado ? "text-red-600 font-medium" : ""}>
                              Prazo: {format(new Date(p.prazo), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                        {p.observacoes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">{p.observacoes}</p>
                        )}
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
