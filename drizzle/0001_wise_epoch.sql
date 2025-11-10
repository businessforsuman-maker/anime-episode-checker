CREATE TABLE `animeItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`name` text,
	`totalEpisodes` int DEFAULT 0,
	`status` enum('pending','checking','completed','failed') NOT NULL DEFAULT 'pending',
	`results` text,
	`error` text,
	`checkedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `animeItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `animeItems_filename_unique` UNIQUE(`filename`)
);
--> statement-breakpoint
CREATE TABLE `episodeChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`episode` int NOT NULL,
	`episodeUrl` text NOT NULL,
	`videoPlayerUrl` text,
	`videoId` varchar(255),
	`checkStatus` enum('success','failed','error') NOT NULL DEFAULT 'success',
	`httpStatus` int,
	`errorMessage` text,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `episodeChecks_id` PRIMARY KEY(`id`)
);
