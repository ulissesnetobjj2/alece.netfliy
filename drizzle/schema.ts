import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
} from "drizzle-orm/mysql-core";

// ─── Tabela de Usuários (OAuth) ───────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Unidades Estruturais ─────────────────────────────────────────────────────
export const unidadesEstruturais = mysqlTable("unidades_estruturais", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  sigla: varchar("sigla", { length: 50 }).notNull().unique(),
  tipoUnidade: mysqlEnum("tipo_unidade", [
    "Diretoria",
    "Secretaria",
    "Assessoria",
    "Coordenadoria",
    "Departamento",
    "Gabinete",
    "Outro",
  ]).notNull(),
  vinculo: varchar("vinculo", { length: 255 }),
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UnidadeEstrutural = typeof unidadesEstruturais.$inferSelect;
export type InsertUnidadeEstrutural = typeof unidadesEstruturais.$inferInsert;

// ─── Base de Servidores ───────────────────────────────────────────────────────
export const baseServidores = mysqlTable("base_servidores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  perfil: mysqlEnum("perfil", ["Gestor", "Servidor"]).notNull(),
  siglaOrgaoVinculo: varchar("sigla_orgao_vinculo", { length: 50 }).notNull(),
  unidadeId: int("unidade_id").notNull(),
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BaseServidor = typeof baseServidores.$inferSelect;
export type InsertBaseServidor = typeof baseServidores.$inferInsert;

// ─── Processos ────────────────────────────────────────────────────────────────
export const processos = mysqlTable("processos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  unidadeId: int("unidade_id").notNull(),
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Processo = typeof processos.$inferSelect;
export type InsertProcesso = typeof processos.$inferInsert;

// ─── Inventário de Riscos ─────────────────────────────────────────────────────
export const inventarioRiscos = mysqlTable("inventario_riscos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  processoId: int("processo_id").notNull(),
  causa: text("causa"),
  evento: text("evento"),
  consequencia: text("consequencia"),
  categoria: mysqlEnum("categoria", [
    "Operacional",
    "Estratégico",
    "Financeiro",
    "Conformidade",
    "Reputacional",
    "Outro",
  ]).default("Operacional"),
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventarioRisco = typeof inventarioRiscos.$inferSelect;
export type InsertInventarioRisco = typeof inventarioRiscos.$inferInsert;

// ─── Avaliações de Riscos ─────────────────────────────────────────────────────
export const avaliacoesRiscos = mysqlTable("avaliacoes_riscos", {
  id: int("id").autoincrement().primaryKey(),
  riscoId: int("risco_id").notNull(),
  probabilidade: int("probabilidade").notNull(), // 1-5
  impacto: int("impacto").notNull(), // 1-5
  nivelRisco: int("nivel_risco").notNull(), // probabilidade * impacto
  justificativa: text("justificativa"),
  dataAvaliacao: timestamp("data_avaliacao").defaultNow().notNull(),
  avaliadoPor: varchar("avaliado_por", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AvaliacaoRisco = typeof avaliacoesRiscos.$inferSelect;
export type InsertAvaliacaoRisco = typeof avaliacoesRiscos.$inferInsert;

// ─── Planos de Ação ───────────────────────────────────────────────────────────
export const planosDeAcao = mysqlTable("planos_de_acao", {
  id: int("id").autoincrement().primaryKey(),
  riscoId: int("risco_id").notNull(),
  descricao: text("descricao").notNull(),
  responsavel: varchar("responsavel", { length: 255 }),
  prazo: date("prazo"),
  status: mysqlEnum("status", [
    "Pendente",
    "Em Andamento",
    "Concluído",
    "Cancelado",
  ])
    .default("Pendente")
    .notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanoDeAcao = typeof planosDeAcao.$inferSelect;
export type InsertPlanoDeAcao = typeof planosDeAcao.$inferInsert;

// ─── Senhas de Usuários (Autenticação com Senha) ───────────────────────────────
export const userPasswords = mysqlTable("user_passwords", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  senhaHash: varchar("senha_hash", { length: 255 }).notNull(),
  servidorId: int("servidor_id").notNull(),
  ativo: mysqlEnum("ativo", ["sim", "nao"]).default("sim").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPassword = typeof userPasswords.$inferSelect;
export type InsertUserPassword = typeof userPasswords.$inferInsert;
