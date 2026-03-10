CREATE TABLE `user_passwords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`senha_hash` varchar(255) NOT NULL,
	`servidor_id` int NOT NULL,
	`ativo` enum('sim','nao') NOT NULL DEFAULT 'sim',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_passwords_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_passwords_email_unique` UNIQUE(`email`)
);
