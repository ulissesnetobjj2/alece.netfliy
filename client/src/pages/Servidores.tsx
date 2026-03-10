import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type FormData = {
  nome: string;
  email: string;
  perfil: "Gestor" | "Servidor";
  siglaOrgaoVinculo: string;
  unidadeId: string;
};

export default function Servidores() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [form, setForm] = useState<FormData>({
    nome: "",
    email: "",
    perfil: "Servidor",
    siglaOrgaoVinculo: "",
    unidadeId: "",
  });

  const utils = trpc.useUtils();
  const unidadesQuery = trpc.unidades.list.useQuery();
  const myInfoQuery = trpc.dashboard.myInfo.useQuery();
  const servidoresQuery = trpc.servidores.list.useQuery(
    filterUnidade !== "all" ? { unidadeId: parseInt(filterUnidade) } : {}
  );

  const createMutation = trpc.servidores.create.useMutation({
    onSuccess: () => {
      utils.servidores.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("Servidor cadastrado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.servidores.update.useMutation({
    onSuccess: () => {
      utils.servidores.list.invalidate();
      setOpen(false);
      resetForm();
      toast.success("Servidor atualizado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ nome: "", email: "", perfil: "Servidor", siglaOrgaoVinculo: "", unidadeId: "" });
    setEditingId(null);
  }

  function handleEdit(s: NonNullable<typeof servidoresQuery.data>[0]) {
    setForm({
      nome: s.nome,
      email: s.email,
      perfil: s.perfil,
      siglaOrgaoVinculo: s.siglaOrgaoVinculo,
      unidadeId: String(s.unidadeId),
    });
    setEditingId(s.id);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, unidadeId: parseInt(form.unidadeId) };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  // Pré-preencher unidade para gestores
  function handleOpenCreate() {
    if (!isAdmin && myInfoQuery.data) {
      setForm((f) => ({
        ...f,
        siglaOrgaoVinculo: myInfoQuery.data!.sigla,
        unidadeId: String(myInfoQuery.data!.unidadeId ?? ""),
        perfil: "Servidor",
      }));
    }
    setOpen(true);
  }

  const perfilBadge = (perfil: string) =>
    perfil === "Gestor"
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800";

  return (
    <AppLayout title="Servidores">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Base de Servidores</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "Todos os servidores da ALECE" : "Servidores da sua unidade"}
            </p>
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
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.sigla}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Servidor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Servidor" : "Cadastrar Servidor"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Nome Completo</Label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome do servidor"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail Institucional</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="servidor@al.ce.gov.br"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Perfil</Label>
                    <Select
                      value={form.perfil}
                      onValueChange={(v) => setForm({ ...form, perfil: v as "Gestor" | "Servidor" })}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isAdmin && <SelectItem value="Gestor">Gestor</SelectItem>}
                        <SelectItem value="Servidor">Servidor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidade</Label>
                    <Select
                      value={form.unidadeId}
                      onValueChange={(v) => {
                        const u = unidadesQuery.data?.find((x) => String(x.id) === v);
                        setForm({ ...form, unidadeId: v, siglaOrgaoVinculo: u?.sigla ?? "" });
                      }}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesQuery.data?.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.sigla} — {u.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {editingId ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {servidoresQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : servidoresQuery.data?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhum servidor cadastrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Órgão</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {servidoresQuery.data?.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${perfilBadge(s.perfil)}`}>
                        {s.perfil}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.siglaOrgaoVinculo}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
