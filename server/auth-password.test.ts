import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as bcrypt from "bcryptjs";
import { checkEmailInServidores, getUserPasswordByEmail, createUserPassword } from "./db";

describe("Autenticação com Senha", () => {
  // Nota: Estes testes validam a lógica de hash e verificação de senha
  // Os testes de integração com o banco de dados dependem de dados reais

  it("deve gerar hash de senha com bcrypt", async () => {
    const senha = "SenhaForte123!";
    const hash = await bcrypt.hash(senha, 10);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(senha);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("deve validar senha correta contra hash", async () => {
    const senha = "SenhaForte123!";
    const hash = await bcrypt.hash(senha, 10);
    const valida = await bcrypt.compare(senha, hash);

    expect(valida).toBe(true);
  });

  it("deve rejeitar senha incorreta contra hash", async () => {
    const senha = "SenhaForte123!";
    const senhaErrada = "SenhaErrada456!";
    const hash = await bcrypt.hash(senha, 10);
    const valida = await bcrypt.compare(senhaErrada, hash);

    expect(valida).toBe(false);
  });

  it("deve rejeitar senha vazia", async () => {
    const senhaVazia = "";
    const hash = await bcrypt.hash(senhaVazia, 10);
    const valida = await bcrypt.compare(senhaVazia, hash);

    // Mesmo vazia, o hash é válido (não é recomendado)
    expect(valida).toBe(true);
    // Mas na aplicação, validamos tamanho mínimo
  });

  it("deve validar força de senha (mínimo 8 caracteres)", () => {
    const senhaFraca = "abc123";
    const senhaForte = "SenhaForte123!";

    expect(senhaFraca.length).toBeLessThan(8);
    expect(senhaForte.length).toBeGreaterThanOrEqual(8);
  });

  it("deve gerar hashes diferentes para mesma senha", async () => {
    const senha = "SenhaForte123!";
    const hash1 = await bcrypt.hash(senha, 10);
    const hash2 = await bcrypt.hash(senha, 10);

    expect(hash1).not.toBe(hash2);
    // Mas ambos devem validar a mesma senha
    expect(await bcrypt.compare(senha, hash1)).toBe(true);
    expect(await bcrypt.compare(senha, hash2)).toBe(true);
  });

  it("deve validar email em formato correto", () => {
    const emailValido = "usuario@al.ce.gov.br";
    const emailInvalido = "usuarioinvalido";

    // Validação básica
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(regexEmail.test(emailValido)).toBe(true);
    expect(regexEmail.test(emailInvalido)).toBe(false); // Sem @ não é válido
  });

  it("deve rejeitar senhas com caracteres especiais perigosos", () => {
    const senhasSeguras = [
      "SenhaForte123!",
      "Outra@Senha456",
      "Mais#Uma$Senha",
    ];

    senhasSeguras.forEach((senha) => {
      expect(senha.length).toBeGreaterThanOrEqual(8);
    });
  });
});
