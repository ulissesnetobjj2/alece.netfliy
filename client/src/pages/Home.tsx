import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, BarChart3, Users, FileText } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.20 0.06 240)" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">ALECE</h1>
            <p className="text-white/60 text-xs">Assembleia Legislativa do Estado do Ceará</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm px-4 py-2 rounded-full mb-8 border border-white/20">
            <ShieldCheck className="h-4 w-4" />
            Sistema de Gestão de Riscos e Integridade
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Gestão de Riscos
            <span className="block text-blue-300">Institucional</span>
          </h2>

          <p className="text-white/70 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            Plataforma integrada para identificação, avaliação e monitoramento de riscos
            da Assembleia Legislativa do Estado do Ceará — CODINS.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: "Inventário de Riscos",
                desc: "Cadastre e monitore riscos por unidade estrutural com causas, eventos e consequências.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Painel de Transparência",
                desc: "Acompanhe o status de avaliações com semáforo visual (verde, laranja, vermelho).",
              },
              {
                icon: <FileText className="h-6 w-6" />,
                title: "Planos de Ação",
                desc: "Crie e acompanhe planos de mitigação com prazos, responsáveis e status.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-left hover:bg-white/10 transition-colors"
              >
                <div className="text-blue-300 mb-3">{f.icon}</div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getLoginUrl()}>
              <Button
                size="lg"
                className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3 text-base shadow-lg shadow-blue-500/25"
              >
                <Users className="h-5 w-5 mr-2" />
                Entrar com OAuth
              </Button>
            </a>
            <a href="/auth">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3 text-base"
              >
                Criar Conta com Senha
              </Button>
            </a>
          </div>

          <p className="text-white/40 text-sm mt-4">
            Acesso restrito a servidores da ALECE
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto text-center text-white/40 text-sm">
          © 2025 Assembleia Legislativa do Estado do Ceará — CODINS
        </div>
      </footer>
    </div>
  );
}
