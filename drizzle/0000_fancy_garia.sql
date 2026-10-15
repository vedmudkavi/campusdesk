CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`location` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`assignee` text NOT NULL,
	`created` integer NOT NULL
);
