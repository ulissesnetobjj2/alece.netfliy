import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<"oauth" | "password">("oauth");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [step, setStep] = useState<"check" | "register" | "login">("check");
  const [serverInfo, setServerInfo] = useState<any>(null);

  // Usar useMutation para checkEmail (convertendo de query para mutation)
  const checkEmailMutation = trpc.auth.checkEmail.useQuery({ email }, { enabled: false });
  const registerMutation = trpc.auth.register.useMutation();
  const loginMutation = trpc.auth.loginWithPassword.useMutation();

  // Verificar email
  async function handleCheckEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, insira um e-mail");
      return;
    }

    try {
      // Refetch com o email atual
      const result = await checkEmailMutation.refetch();
      const data = result.data;

      if (!data) {
        toast.error("Erro ao verificar e-mail");
        return;
      }

      if (!data.found) {
        toast.error(data.message);
        return;
      }

      setServerInfo(data);
      setStep(data.hasPassword ? "login" : "register");
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar e-mail");
    }
  }

  // Registrar
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== senhaConfirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    registerMutation.mutate(
      { email, senha },
      {
        onSuccess: () => {
          toast.success("Conta criada com sucesso! Faça login agora.");
          setSenha("");
          setSenhaConfirm("");
          setStep("login");
        },
        onError: (err) => {
          toast.error(err.message);
        },
      }
    );
  }

  // Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { email, senha },
      {
        onSuccess: () => {
          toast.success("Login realizado! Redirecionando...");
          // Redirecionar após login
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        },
        onError: (err) => {
          toast.error(err.message);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-blue-500/20 border border-blue-400/30 mb-4">
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ALECE</h1>
          <p className="text-blue-200">Gestão de Riscos e Integridade</p>
        </div>

        <Card className="border-blue-400/20 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Acesso ao Sistema</CardTitle>
            <CardDescription>Escolha como deseja fazer login</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "oauth" | "password")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="oauth">Entrar com OAuth</TabsTrigger>
                <TabsTrigger value="password">Criar Conta / Senha</TabsTrigger>
              </TabsList>

              {/* OAuth Tab */}
              <TabsContent value="oauth" className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Faça login usando sua conta Manus OAuth
                </p>
                <a href={getLoginUrl()}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Entrar com Manus OAuth
                  </Button>
                </a>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password" className="space-y-4">
                {step === "check" && (
                  <form onSubmit={handleCheckEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail Institucional</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu.email@al.ce.gov.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={checkEmailMutation.isLoading}
                    >
                      {checkEmailMutation.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Verificar E-mail
                    </Button>
                  </form>
                )}

                {step === "register" && serverInfo && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <Alert className="bg-green-900/20 border-green-700/50">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-200">
                        E-mail encontrado! {serverInfo.servidor.nome} ({serverInfo.servidor.perfil})
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={email}
                        disabled
                        className="bg-slate-700 border-slate-600 text-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senha">Criar Senha</Label>
                      <Input
                        id="senha"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        minLength={8}
                        className="bg-slate-800 border-slate-700"
                      />
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, recomendado usar números e símbolos
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senhaConfirm">Confirmar Senha</Label>
                      <Input
                        id="senhaConfirm"
                        type="password"
                        placeholder="Confirme a senha"
                        value={senhaConfirm}
                        onChange={(e) => setSenhaConfirm(e.target.value)}
                        required
                        minLength={8}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setStep("check");
                          setEmail("");
                          setSenha("");
                          setSenhaConfirm("");
                          setServerInfo(null);
                        }}
                      >
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Criar Conta
                      </Button>
                    </div>
                  </form>
                )}

                {step === "login" && serverInfo && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Alert className="bg-blue-900/20 border-blue-700/50">
                      <AlertTriangle className="h-4 w-4 text-blue-500" />
                      <AlertDescription className="text-blue-200">
                        Bem-vindo, {serverInfo.servidor.nome}!
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={email}
                        disabled
                        className="bg-slate-700 border-slate-600 text-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loginSenha">Senha</Label>
                      <Input
                        id="loginSenha"
                        type="password"
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setStep("check");
                          setEmail("");
                          setSenha("");
                          setSenhaConfirm("");
                          setServerInfo(null);
                        }}
                      >
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Entrar
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-blue-200/60 mt-6">
          Sistema de Gestão de Riscos e Integridade da ALECE
        </p>
      </div>
    </div>
  );
}
