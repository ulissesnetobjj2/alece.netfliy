import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const TIPOS = ["Diretoria", "Secretaria", "Assessoria", "Coordenadoria", "Departamento", "Gabinete", "Outro"] as const;

type FormData = {
  titulo: string;
  sigla: string;
  tipoUnidade: typeof TIPOS[number];
  vinculo: string;
};

export default function Unidades() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ titulo: "", sigla: "", tipoUnidade: "Diretoria", vinculo: "" });

  const utils = trpc.useUtils();
  const unidadesQuery = trpc.unidades.list.useQuery();

  const createMutation = trpc.unidades.create.useMutation({
    onSuccess: () => {
      utils.unidades.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("Unidade criada com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.unidades.update.useMutation({
    onSuccess: () => {
      utils.unidades.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("Unidade atualizada com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ titulo: "", sigla: "", tipoUnidade: "Diretoria", vinculo: "" });
    setEditingId(null);
  }

  function handleEdit(u: NonNullable<typeof unidadesQuery.data>[0]) {
    setForm({ titulo: u.titulo, sigla: u.sigla, tipoUnidade: u.tipoUnidade, vinculo: u.vinculo ?? "" });
    setEditingId(u.id);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <AppLayout title="Unidades Estruturais">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Unidades Estruturais</h2>
            <p className="text-sm text-muted-foreground mt-1">Gerencie as unidades da ALECE</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Unidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Unidade" : "Nova Unidade Estrutural"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ex: Diretoria de Tecnologia da Informação"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sigla</Label>
                  <Input
                    value={form.sigla}
                    onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
                    placeholder="Ex: DTI"
                    required
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de Unidade</Label>
                  <Select
                    value={form.tipoUnidade}
                    onValueChange={(v) => setForm({ ...form, tipoUnidade: v as typeof TIPOS[number] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vínculo (opcional)</Label>
                  <Input
                    value={form.vinculo}
                    onChange={(e) => setForm({ ...form, vinculo: e.target.value })}
                    placeholder="Ex: Mesa Diretora"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingId ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {unidadesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : unidadesQuery.data?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhuma unidade cadastrada ainda.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Clique em "Nova Unidade" para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {unidadesQuery.data?.map((u) => (
              <Card key={u.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-tight">{u.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{u.sigla}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleEdit(u)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{u.tipoUnidade}</Badge>
                    {u.vinculo && (
                      <span className="text-xs text-muted-foreground">Vínculo: {u.vinculo}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
