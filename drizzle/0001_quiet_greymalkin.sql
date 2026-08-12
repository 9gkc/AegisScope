CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`programId` int NOT NULL,
	`assetType` enum('domain','ip_address','web_application') NOT NULL,
	`value` varchar(512) NOT NULL,
	`normalizedValue` varchar(512) NOT NULL,
	`label` varchar(160),
	`assetStatus` enum('active','paused','retired') NOT NULL DEFAULT 'active',
	`authorizationStatus` enum('verified','pending','expired') NOT NULL DEFAULT 'pending',
	`authorizationEvidence` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`programId` int NOT NULL,
	`assetId` int,
	`title` varchar(200) NOT NULL,
	`findingSeverity` enum('critical','high','medium','low','info') NOT NULL,
	`cvssScore` decimal(3,1),
	`findingStatus` enum('open','in_progress','resolved','accepted_risk','closed') NOT NULL DEFAULT 'open',
	`impact` text NOT NULL,
	`testEnvironment` text,
	`safePoc` text,
	`remediation` text,
	`retestNotes` text,
	`evidenceMetadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `headerReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`assetId` int NOT NULL,
	`targetUrl` varchar(512) NOT NULL,
	`score` int NOT NULL,
	`observations` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `headerReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`programType` enum('bug_bounty','pentest','internal_review') NOT NULL,
	`programStatus` enum('active','paused','completed','archived') NOT NULL DEFAULT 'active',
	`scopeNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`findingId` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`markdown` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportDrafts_id` PRIMARY KEY(`id`)
);
