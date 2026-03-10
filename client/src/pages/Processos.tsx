import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type FormData = { titulo: string; descricao: string; unidadeId: string };

export default function Processos() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [form, setForm] = useState<FormData>({ titulo: "", descricao: "", unidadeId: "" });

  const utils = trpc.useUtils();
  const unidadesQuery = trpc.unidades.list.useQuery();
  const myInfoQuery = trpc.dashboard.myInfo.useQuery();

  const processosQuery = trpc.processos.list.useQuery(
    filterUnidade !== "all" ? { unidadeId: parseInt(filterUnidade) } : {}
  );

  const createMutation = trpc.processos.create.useMutation({
    onSuccess: () => { utils.processos.list.invalidate(); setOpen(false); resetForm(); toast.success("Processo criado!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.processos.update.useMutation({
    onSuccess: () => { utils.processos.list.invalidate(); setOpen(false); resetForm(); toast.success("Processo atualizado!"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() { setForm({ titulo: "", descricao: "", unidadeId: "" }); setEditingId(null); }

  function handleEdit(p: NonNullable<typeof processosQuery.data>[0]) {
    setForm({ titulo: p.titulo, descricao: p.descricao ?? "", unidadeId: String(p.unidadeId) });
    setEditingId(p.id);
    setOpen(true);
  }

  function handleOpenCreate() {
    if (!isAdmin && myInfoQuery.data?.unidadeId) {
      setForm((f) => ({ ...f, unidadeId: String(myInfoQuery.data!.unidadeId) }));
    }
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { titulo: form.titulo, descricao: form.descricao || undefined, unidadeId: parseInt(form.unidadeId) };
    if (editingId) updateMutation.mutate({ id: editingId, titulo: data.titulo, descricao: data.descricao });
    else createMutation.mutate(data);
  }

  const getUnidadeSigla = (id: number) => unidadesQuery.data?.find((u) => u.id === id)?.sigla ?? String(id);

  return (
    <AppLayout title="Processos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Processos</h2>
            <p className="text-sm text-muted-foreground mt-1">Processos vinculados às unidades estruturais</p>
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
                <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Novo Processo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Processo" : "Novo Processo"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Título do Processo</Label>
                    <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Gestão de Contratos" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição (opcional)</Label>
                    <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o processo..." rows={3} />
                  </div>
                  {isAdmin && (
                    <div className="space-y-1.5">
                      <Label>Unidade</Label>
                      <Select value={form.unidadeId} onValueChange={(v) => setForm({ ...form, unidadeId: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                        <SelectContent>
                          {unidadesQuery.data?.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>{u.sigla} — {u.titulo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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

        {processosQuery.isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : processosQuery.data?.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum processo cadastrado.</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {processosQuery.data?.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-tight">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{getUnidadeSigla(p.unidadeId)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {p.descricao && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{p.descricao}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
