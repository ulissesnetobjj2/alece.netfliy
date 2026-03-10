# ALECE - Sistema de Gestão de Riscos e Integridade - TODO

## Banco de Dados
- [x] Schema: tabela unidades_estruturais
- [x] Schema: tabela base_servidores (com perfil gestor/servidor e sigla_orgao)
- [x] Schema: tabela processos
- [x] Schema: tabela inventario_riscos
- [x] Schema: tabela avaliacoes_riscos
- [x] Schema: tabela planos_de_acao
- [x] Migração SQL aplicada via webdev_execute_sql

## Backend (tRPC Routers)
- [x] Router: unidades (CRUD - admin only)
- [x] Router: servidores (CRUD - admin cria gestores, gestor cria servidores da sua unidade)
- [x] Router: processos (CRUD - filtrado por unidade)
- [x] Router: riscos (CRUD - filtrado por unidade)
- [x] Router: avaliacoes (CRUD - filtrado por unidade)
- [x] Router: planos (CRUD - filtrado por unidade)
- [x] Router: dashboard (stats por unidade)
- [x] Router: ranking (painel público de transparência com semáforo)
- [x] Regra de segurança: gestor/servidor só vê sua unidade
- [x] Admin vê todos os órgãos

## Frontend - Layout e Autenticação
- [x] AppLayout com sidebar responsiva e navegação condicional por perfil
- [x] Paleta de cores ALECE (azul institucional - sidebar escura)
- [x] Página de login com redirecionamento OAuth
- [x] Proteção de rotas por perfil
- [x] Navegação condicional por perfil (admin/gestor/servidor)

## Frontend - Dashboard
- [x] Dashboard inicial com atalhos para Meus Riscos e Planos de Ação
- [x] Cards de estatísticas (total processos, riscos, planos ativos)
- [x] Filtro por órgão para CODINS (admin)
- [x] Preview do painel de transparência no dashboard

## Frontend - Módulos de Cadastro
- [x] Página: Unidades Estruturais (admin)
- [x] Página: Servidores (admin cria gestores; gestor cria servidores da unidade)
- [x] Página: Processos (filtrado por unidade)
- [x] Página: Inventário de Riscos (causa, evento, consequência, categoria)
- [x] Formulários com validação (zod no backend)

## Frontend - Avaliações e Planos
- [x] Página: Avaliações de Riscos (probabilidade x impacto, nível calculado)
- [x] Página: Planos de Ação (com status, prazo, responsável e indicador de atraso)
- [x] Ícones de status: círculos verde/laranja/vermelho

## Frontend - Painel de Transparência
- [x] Painel público (todos os usuários logados)
- [x] Galeria de performance com última avaliação e dias desde avaliação
- [x] Lógica de semáforo: Verde (<30d), Laranja (31-45d), Vermelho (>45d ou sem avaliação)
- [x] Ordenação: mais atrasados no topo
- [x] Filtro por órgão para CODINS
- [x] Cards de resumo (total, verde, laranja, vermelho)
- [x] Mensagem "Preencha Reavaliação" para riscos vermelhos

## Testes
- [x] Testes unitários para lógica de semáforo (5 casos)
- [x] Testes para cálculo de nível de risco (probabilidade x impacto)
- [x] Testes de autenticação e autorização (admin, servidor, não autenticado)
- [x] Testes de ordenação do ranking
- [x] 19 testes passando (2 arquivos)

## Entrega
- [x] Checkpoint salvo
- [ ] Página estática de apresentação interativa

## Registro com Senha (Nova Funcionalidade)
- [x] Schema: tabela user_passwords (email, senha_hash, servidor_id)
- [x] Migração SQL para nova tabela
- [x] Router: auth.checkEmail (valida se email está na base de servidores)
- [x] Router: auth.register (cria conta com senha para servidor cadastrado)
- [x] Router: auth.loginWithPassword (autentica com email/senha)
- [x] Página: Login/Registro com abas (OAuth vs Senha)
- [x] Validação de força de senha (mínimo 8 caracteres)
- [x] Testes para fluxo de registro (8 testes passando)
