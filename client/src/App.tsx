import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Unidades from "./pages/Unidades";
import Servidores from "./pages/Servidores";
import Processos from "./pages/Processos";
import Riscos from "./pages/Riscos";
import Avaliacoes from "./pages/Avaliacoes";
import Planos from "./pages/Planos";
import Ranking from "./pages/Ranking";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/unidades" component={Unidades} />
      <Route path="/servidores" component={Servidores} />
      <Route path="/processos" component={Processos} />
      <Route path="/riscos" component={Riscos} />
      <Route path="/avaliacoes" component={Avaliacoes} />
      <Route path="/planos" component={Planos} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
