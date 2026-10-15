CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`owner` text NOT NULL,
	`author` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`created` integer NOT NULL
);
