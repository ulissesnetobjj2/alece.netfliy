import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { publicProcedure } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import {
  checkEmailInServidores,
  getUserPasswordByEmail,
  createUserPassword,
  getUserByEmail,
  upsertUser,
} from "./db";

/**
 * Verificar se email está cadastrado na base de servidores
 */
export const checkEmailProcedure = publicProcedure
  .input(z.object({ email: z.string().email() }))
  .query(async ({ input }) => {
    const servidor = await checkEmailInServidores(input.email);
    if (!servidor) {
      return { found: false, message: "E-mail não encontrado na base de servidores." };
    }
    // Verificar se já tem senha cadastrada
    const hasPassword = await getUserPasswordByEmail(input.email);
    return {
      found: true,
      servidor: {
        id: servidor.id,
        nome: servidor.nome,
        email: servidor.email,
        perfil: servidor.perfil,
        unidadeId: servidor.unidadeId,
        siglaOrgaoVinculo: servidor.siglaOrgaoVinculo,
      },
      hasPassword: !!hasPassword,
    };
  });

/**
 * Registrar novo usuário com senha
 */
export const registerProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
      nome: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Validar se email existe na base de servidores
    const servidor = await checkEmailInServidores(input.email);
    if (!servidor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "E-mail não encontrado na base de servidores da ALECE.",
      });
    }

    // Verificar se já tem senha
    const existing = await getUserPasswordByEmail(input.email);
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Este e-mail já possui uma senha cadastrada.",
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(input.senha, 10);

    // Criar registro de senha
    await createUserPassword({
      email: input.email,
      senhaHash,
      servidorId: servidor.id,
      ativo: "sim",
    });

    return {
      success: true,
      message: "Conta criada com sucesso! Você já pode fazer login.",
      servidor: {
        nome: servidor.nome,
        email: servidor.email,
        perfil: servidor.perfil,
      },
    };
  });

/**
 * Autenticar com email e senha
 */
export const loginWithPasswordProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      senha: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Buscar usuário com senha
    const userPassword = await getUserPasswordByEmail(input.email);
    if (!userPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "E-mail ou senha inválidos.",
      });
    }

    // Validar senha
    const senhaValida = await bcrypt.compare(input.senha, userPassword.senhaHash);
    if (!senhaValida) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "E-mail ou senha inválidos.",
      });
    }

    // Buscar ou criar usuário no sistema
    let user = await getUserByEmail(input.email);
    if (!user) {
      const servidor = await checkEmailInServidores(input.email);
      if (!servidor) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar dados do servidor.",
        });
      }
      // Criar usuário com openId baseado no email (para compatibilidade)
      const openId = `password-${input.email}`;
      await upsertUser({
        openId,
        name: servidor.nome,
        email: input.email,
        loginMethod: "password",
        role: "user",
        lastSignedIn: new Date(),
      });
      user = await getUserByEmail(input.email);
    } else {
      // Atualizar lastSignedIn
      await upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });
    }

    if (!user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao criar sessão.",
      });
    }

    // Criar sessão (similar ao OAuth)
    // Nota: A sessão é gerenciada pelo middleware de autenticação
    // Aqui apenas retornamos sucesso

    return {
      success: true,
      message: "Login realizado com sucesso!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });
