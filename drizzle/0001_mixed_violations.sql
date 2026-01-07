CREATE TABLE `scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`score` int NOT NULL,
	`difficulty` enum('easy','normal','hard') NOT NULL,
	`perfect` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`maxCombo` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scores_id` PRIMARY KEY(`id`)
);
