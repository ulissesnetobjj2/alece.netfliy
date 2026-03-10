CREATE TABLE `avaliacoes_riscos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`risco_id` int NOT NULL,
	`probabilidade` int NOT NULL,
	`impacto` int NOT NULL,
	`nivel_risco` int NOT NULL,
	`justificativa` text,
	`data_avaliacao` timestamp NOT NULL DEFAULT (now()),
	`avaliado_por` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avaliacoes_riscos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `base_servidores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`perfil` enum('Gestor','Servidor') NOT NULL,
	`sigla_orgao_vinculo` varchar(50) NOT NULL,
	`unidade_id` int NOT NULL,
	`ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `base_servidores_id` PRIMARY KEY(`id`),
	CONSTRAINT `base_servidores_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `inventario_riscos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`processo_id` int NOT NULL,
	`causa` text,
	`evento` text,
	`consequencia` text,
	`categoria` enum('Operacional','Estratégico','Financeiro','Conformidade','Reputacional','Outro') DEFAULT 'Operacional',
	`ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventario_riscos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planos_de_acao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`risco_id` int NOT NULL,
	`descricao` text NOT NULL,
	`responsavel` varchar(255),
	`prazo` date,
	`status` enum('Pendente','Em Andamento','Concluído','Cancelado') NOT NULL DEFAULT 'Pendente',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planos_de_acao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`unidade_id` int NOT NULL,
	`ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unidades_estruturais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`sigla` varchar(50) NOT NULL,
	`tipo_unidade` enum('Diretoria','Secretaria','Assessoria','Coordenadoria','Departamento','Gabinete','Outro') NOT NULL,
	`vinculo` varchar(255),
	`ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unidades_estruturais_id` PRIMARY KEY(`id`),
	CONSTRAINT `unidades_estruturais_sigla_unique` UNIQUE(`sigla`)
);
