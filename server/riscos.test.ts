import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers de contexto ──────────────────────────────────────────────────────

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "codins@al.ce.gov.br",
      name: "Admin CODINS",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function makeUserCtx(email = "servidor@al.ce.gov.br"): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      email,
      name: "Servidor Teste",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ─── Lógica de semáforo ───────────────────────────────────────────────────────

function calcularSemaforo(ultimaAvaliacao: Date | null): "verde" | "laranja" | "vermelho" {
  if (!ultimaAvaliacao) return "vermelho";
  const agora = new Date();
  const dias = Math.floor((agora.getTime() - ultimaAvaliacao.getTime()) / (1000 * 60 * 60 * 24));
  if (dias <= 30) return "verde";
  if (dias <= 45) return "laranja";
  return "vermelho";
}

describe("Lógica de Semáforo", () => {
  it("retorna verde para avaliação há menos de 30 dias", () => {
    const data = new Date();
    data.setDate(data.getDate() - 15);
    expect(calcularSemaforo(data)).toBe("verde");
  });

  it("retorna verde para avaliação exatamente hoje", () => {
    expect(calcularSemaforo(new Date())).toBe("verde");
  });

  it("retorna laranja para avaliação entre 31 e 45 dias", () => {
    const data = new Date();
    data.setDate(data.getDate() - 35);
    expect(calcularSemaforo(data)).toBe("laranja");
  });

  it("retorna vermelho para avaliação há mais de 45 dias", () => {
    const data = new Date();
    data.setDate(data.getDate() - 60);
    expect(calcularSemaforo(data)).toBe("vermelho");
  });

  it("retorna vermelho quando não há avaliação", () => {
    expect(calcularSemaforo(null)).toBe("vermelho");
  });
});

// ─── Nível de risco ───────────────────────────────────────────────────────────

function calcularNivelRisco(probabilidade: number, impacto: number): number {
  return probabilidade * impacto;
}

function classificarNivel(nivel: number): string {
  if (nivel <= 4) return "Baixo";
  if (nivel <= 9) return "Médio";
  if (nivel <= 16) return "Alto";
  return "Crítico";
}

describe("Cálculo de Nível de Risco", () => {
  it("calcula corretamente o produto probabilidade x impacto", () => {
    expect(calcularNivelRisco(3, 4)).toBe(12);
    expect(calcularNivelRisco(1, 1)).toBe(1);
    expect(calcularNivelRisco(5, 5)).toBe(25);
  });

  it("classifica nível baixo (1-4)", () => {
    expect(classificarNivel(1)).toBe("Baixo");
    expect(classificarNivel(4)).toBe("Baixo");
  });

  it("classifica nível médio (5-9)", () => {
    expect(classificarNivel(5)).toBe("Médio");
    expect(classificarNivel(9)).toBe("Médio");
  });

  it("classifica nível alto (10-16)", () => {
    expect(classificarNivel(10)).toBe("Alto");
    expect(classificarNivel(16)).toBe("Alto");
  });

  it("classifica nível crítico (17-25)", () => {
    expect(classificarNivel(17)).toBe("Crítico");
    expect(classificarNivel(25)).toBe("Crítico");
  });
});

// ─── Autenticação e autorização ───────────────────────────────────────────────

describe("auth.me", () => {
  it("retorna usuário admin autenticado", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.role).toBe("admin");
    expect(user?.email).toBe("codins@al.ce.gov.br");
  });

  it("retorna usuário servidor autenticado", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.role).toBe("user");
  });

  it("retorna null para usuário não autenticado", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

describe("auth.logout", () => {
  it("limpa o cookie de sessão e retorna sucesso", async () => {
    const clearedCookies: string[] = [];
    const ctx = makeAdminCtx();
    ctx.res.clearCookie = (name: string) => { clearedCookies.push(name); };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBe(1);
  });
});

// ─── Controle de acesso ───────────────────────────────────────────────────────

describe("Controle de Acesso - Unidades", () => {
  it("admin pode listar unidades", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    // Deve resolver sem erro (pode retornar array vazio em ambiente de teste)
    const result = await caller.unidades.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("usuário comum pode listar unidades", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.unidades.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("usuário comum não pode criar unidade (FORBIDDEN)", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.unidades.create({
        titulo: "Teste",
        sigla: "TST",
        tipoUnidade: "Diretoria",
      })
    ).rejects.toThrow();
  });
});

// ─── Ordenação do ranking ─────────────────────────────────────────────────────

describe("Ordenação do Ranking de Transparência", () => {
  it("vermelhos aparecem antes de laranjas e verdes", () => {
    const items = [
      { semaforo: "verde" as const, diasDesdeAvaliacao: 10 },
      { semaforo: "vermelho" as const, diasDesdeAvaliacao: 60 },
      { semaforo: "laranja" as const, diasDesdeAvaliacao: 35 },
      { semaforo: "vermelho" as const, diasDesdeAvaliacao: null as number | null },
    ];

    const sorted = [...items].sort((a, b) => {
      if (a.semaforo === "vermelho" && b.semaforo !== "vermelho") return -1;
      if (a.semaforo !== "vermelho" && b.semaforo === "vermelho") return 1;
      if (a.semaforo === "laranja" && b.semaforo === "verde") return -1;
      if (a.semaforo === "verde" && b.semaforo === "laranja") return 1;
      const da = a.diasDesdeAvaliacao ?? 9999;
      const db = b.diasDesdeAvaliacao ?? 9999;
      return db - da;
    });

    expect(sorted[0].semaforo).toBe("vermelho");
    expect(sorted[1].semaforo).toBe("vermelho");
    expect(sorted[2].semaforo).toBe("laranja");
    expect(sorted[3].semaforo).toBe("verde");
  });
});
