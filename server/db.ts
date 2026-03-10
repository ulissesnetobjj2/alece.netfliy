import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  avaliacoesRiscos,
  baseServidores,
  inventarioRiscos,
  planosDeAcao,
  processos,
  unidadesEstruturais,
  users,
  userPasswords,
  InsertUserPassword,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Unidades Estruturais ─────────────────────────────────────────────────────

export async function getAllUnidades() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(unidadesEstruturais)
    .where(eq(unidadesEstruturais.ativo, "sim"))
    .orderBy(unidadesEstruturais.titulo);
}

export async function getUnidadeBySigla(sigla: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(unidadesEstruturais)
    .where(eq(unidadesEstruturais.sigla, sigla))
    .limit(1);
  return result[0];
}

export async function createUnidade(data: {
  titulo: string;
  sigla: string;
  tipoUnidade: "Diretoria" | "Secretaria" | "Assessoria" | "Coordenadoria" | "Departamento" | "Gabinete" | "Outro";
  vinculo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(unidadesEstruturais).values(data);
}

export async function updateUnidade(
  id: number,
  data: Partial<{ titulo: string; sigla: string; tipoUnidade: "Diretoria" | "Secretaria" | "Assessoria" | "Coordenadoria" | "Departamento" | "Gabinete" | "Outro"; vinculo: string; ativo: "sim" | "nao" }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(unidadesEstruturais).set(data).where(eq(unidadesEstruturais.id, id));
}

// ─── Base de Servidores ───────────────────────────────────────────────────────

export async function getServidoresByUnidade(unidadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(baseServidores)
    .where(and(eq(baseServidores.unidadeId, unidadeId), eq(baseServidores.ativo, "sim")))
    .orderBy(baseServidores.nome);
}

export async function getAllServidores() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(baseServidores)
    .where(eq(baseServidores.ativo, "sim"))
    .orderBy(baseServidores.nome);
}

export async function getServidorByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(baseServidores)
    .where(eq(baseServidores.email, email))
    .limit(1);
  return result[0];
}

export async function createServidor(data: {
  nome: string;
  email: string;
  perfil: "Gestor" | "Servidor";
  siglaOrgaoVinculo: string;
  unidadeId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(baseServidores).values(data);
}

export async function updateServidor(
  id: number,
  data: Partial<{ nome: string; email: string; perfil: "Gestor" | "Servidor"; siglaOrgaoVinculo: string; ativo: "sim" | "nao" }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(baseServidores).set(data).where(eq(baseServidores.id, id));
}

// ─── Processos ────────────────────────────────────────────────────────────────

export async function getProcessosByUnidade(unidadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(processos)
    .where(and(eq(processos.unidadeId, unidadeId), eq(processos.ativo, "sim")))
    .orderBy(processos.titulo);
}

export async function getAllProcessos() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(processos)
    .where(eq(processos.ativo, "sim"))
    .orderBy(processos.titulo);
}

export async function createProcesso(data: { titulo: string; descricao?: string; unidadeId: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(processos).values(data);
}

export async function updateProcesso(
  id: number,
  data: Partial<{ titulo: string; descricao: string; ativo: "sim" | "nao" }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(processos).set(data).where(eq(processos.id, id));
}

// ─── Inventário de Riscos ─────────────────────────────────────────────────────

export async function getRiscosByProcesso(processoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(inventarioRiscos)
    .where(and(eq(inventarioRiscos.processoId, processoId), eq(inventarioRiscos.ativo, "sim")))
    .orderBy(inventarioRiscos.titulo);
}

export async function getRiscosByUnidade(unidadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      risco: inventarioRiscos,
      processo: processos,
    })
    .from(inventarioRiscos)
    .innerJoin(processos, eq(inventarioRiscos.processoId, processos.id))
    .where(and(eq(processos.unidadeId, unidadeId), eq(inventarioRiscos.ativo, "sim")))
    .orderBy(inventarioRiscos.titulo);
}

export async function getAllRiscos() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      risco: inventarioRiscos,
      processo: processos,
    })
    .from(inventarioRiscos)
    .innerJoin(processos, eq(inventarioRiscos.processoId, processos.id))
    .where(eq(inventarioRiscos.ativo, "sim"))
    .orderBy(inventarioRiscos.titulo);
}

export async function createRisco(data: {
  titulo: string;
  processoId: number;
  causa?: string;
  evento?: string;
  consequencia?: string;
  categoria?: "Operacional" | "Estratégico" | "Financeiro" | "Conformidade" | "Reputacional" | "Outro";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(inventarioRiscos).values(data);
}

export async function updateRisco(
  id: number,
  data: Partial<{
    titulo: string;
    causa: string;
    evento: string;
    consequencia: string;
    categoria: "Operacional" | "Estratégico" | "Financeiro" | "Conformidade" | "Reputacional" | "Outro";
    ativo: "sim" | "nao";
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(inventarioRiscos).set(data).where(eq(inventarioRiscos.id, id));
}

// ─── Avaliações de Riscos ─────────────────────────────────────────────────────

export async function getAvaliacoesByRisco(riscoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(avaliacoesRiscos)
    .where(eq(avaliacoesRiscos.riscoId, riscoId))
    .orderBy(desc(avaliacoesRiscos.dataAvaliacao));
}

export async function getUltimaAvaliacaoByRisco(riscoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(avaliacoesRiscos)
    .where(eq(avaliacoesRiscos.riscoId, riscoId))
    .orderBy(desc(avaliacoesRiscos.dataAvaliacao))
    .limit(1);
  return result[0];
}

export async function createAvaliacao(data: {
  riscoId: number;
  probabilidade: number;
  impacto: number;
  justificativa?: string;
  avaliadoPor?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const nivelRisco = data.probabilidade * data.impacto;
  await db.insert(avaliacoesRiscos).values({ ...data, nivelRisco, dataAvaliacao: new Date() });
}

// ─── Planos de Ação ───────────────────────────────────────────────────────────

export async function getPlanosByRisco(riscoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(planosDeAcao)
    .where(eq(planosDeAcao.riscoId, riscoId))
    .orderBy(planosDeAcao.prazo);
}

export async function getPlanosByUnidade(unidadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      plano: planosDeAcao,
      risco: inventarioRiscos,
      processo: processos,
    })
    .from(planosDeAcao)
    .innerJoin(inventarioRiscos, eq(planosDeAcao.riscoId, inventarioRiscos.id))
    .innerJoin(processos, eq(inventarioRiscos.processoId, processos.id))
    .where(eq(processos.unidadeId, unidadeId))
    .orderBy(planosDeAcao.prazo);
}

export async function getAllPlanos() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      plano: planosDeAcao,
      risco: inventarioRiscos,
      processo: processos,
    })
    .from(planosDeAcao)
    .innerJoin(inventarioRiscos, eq(planosDeAcao.riscoId, inventarioRiscos.id))
    .innerJoin(processos, eq(inventarioRiscos.processoId, processos.id))
    .orderBy(planosDeAcao.prazo);
}

export async function createPlano(data: {
  riscoId: number;
  descricao: string;
  responsavel?: string;
  prazo?: Date;
  status?: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
  observacoes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(planosDeAcao).values(data);
}

export async function updatePlano(
  id: number,
  data: Partial<{
    descricao: string;
    responsavel: string;
    prazo: Date;
    status: "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
    observacoes: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(planosDeAcao).set(data).where(eq(planosDeAcao.id, id));
}

// ─── Ranking / Painel de Transparência ───────────────────────────────────────

export async function getRankingTransparencia() {
  const db = await getDb();
  if (!db) return [];

  // Busca todos os riscos com sua última avaliação e dados da unidade
  const result = await db
    .select({
      riscoId: inventarioRiscos.id,
      riscoTitulo: inventarioRiscos.titulo,
      processoId: processos.id,
      processoTitulo: processos.titulo,
      unidadeId: unidadesEstruturais.id,
      unidadeTitulo: unidadesEstruturais.titulo,
      unidadeSigla: unidadesEstruturais.sigla,
      ultimaAvaliacao: sql<Date | null>`(
        SELECT MAX(ar.data_avaliacao)
        FROM avaliacoes_riscos ar
        WHERE ar.risco_id = ${inventarioRiscos.id}
      )`,
      nivelRisco: sql<number | null>`(
        SELECT ar2.nivel_risco
        FROM avaliacoes_riscos ar2
        WHERE ar2.risco_id = ${inventarioRiscos.id}
        ORDER BY ar2.data_avaliacao DESC
        LIMIT 1
      )`,
    })
    .from(inventarioRiscos)
    .innerJoin(processos, eq(inventarioRiscos.processoId, processos.id))
    .innerJoin(unidadesEstruturais, eq(processos.unidadeId, unidadesEstruturais.id))
    .where(and(eq(inventarioRiscos.ativo, "sim"), eq(unidadesEstruturais.ativo, "sim")))
    .orderBy(inventarioRiscos.titulo);

  return result;
}

export async function getDashboardStats(unidadeId?: number) {
  const db = await getDb();
  if (!db) return { totalRiscos: 0, totalProcessos: 0, planosAtivos: 0, avaliacoesPendentes: 0 };

  const whereProcessos = unidadeId ? eq(processos.unidadeId, unidadeId) : undefined;
  const whereRiscosJoin = unidadeId ? eq(processos.unidadeId, unidadeId) : undefined;

  const [totalProcessosResult, totalRiscosResult, planosAtivosResult] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(processos)
      .where(whereProcessos ? and(whereProcessos, eq(processos.ativo, "sim")) : eq(processos.ativo, "sim")),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inventarioRiscos)
      .innerJoin(processos, eq(inventarioRiscos.processoId, processos.id))
      .where(
        whereRiscosJoin
          ? and(whereRiscosJoin, eq(inventarioRiscos.ativo, "sim"))
          : eq(inventarioRiscos.ativo, "sim")
      ),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(planosDeAcao)
      .innerJoin(inventarioRiscos, eq(planosDeAcao.riscoId, inventarioRiscos.id))
      .innerJoin(processos, eq(inventarioRiscos.processoId, processos.id))
      .where(
        whereRiscosJoin
          ? and(whereRiscosJoin, or(eq(planosDeAcao.status, "Pendente"), eq(planosDeAcao.status, "Em Andamento")))
          : or(eq(planosDeAcao.status, "Pendente"), eq(planosDeAcao.status, "Em Andamento"))
      ),
  ]);

  return {
    totalProcessos: Number(totalProcessosResult[0]?.count ?? 0),
    totalRiscos: Number(totalRiscosResult[0]?.count ?? 0),
    planosAtivos: Number(planosAtivosResult[0]?.count ?? 0),
  };
}

// ─── Autenticação com Senha ───────────────────────────────────────────────────

export async function checkEmailInServidores(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: baseServidores.id,
      nome: baseServidores.nome,
      email: baseServidores.email,
      perfil: baseServidores.perfil,
      unidadeId: baseServidores.unidadeId,
      siglaOrgaoVinculo: baseServidores.siglaOrgaoVinculo,
    })
    .from(baseServidores)
    .where(and(eq(baseServidores.email, email), eq(baseServidores.ativo, "sim")))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserPasswordByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userPasswords)
    .where(and(eq(userPasswords.email, email), eq(userPasswords.ativo, "sim")))
    .limit(1);
  return result[0] ?? null;
}

export async function createUserPassword(data: InsertUserPassword) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(userPasswords).values(data);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
}
