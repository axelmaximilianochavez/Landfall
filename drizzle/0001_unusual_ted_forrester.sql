CREATE TABLE `segments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`trip_id` text NOT NULL,
	`name` text NOT NULL,
	`country_code` text,
	`start_date` text,
	`end_date` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `segments_trip_order_idx` ON `segments` (`trip_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `item_people` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`item_id` text NOT NULL,
	`person_id` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_people_unique` ON `item_people` (`item_id`,`person_id`);--> statement-breakpoint
CREATE INDEX `item_people_person_idx` ON `item_people` (`person_id`);--> statement-breakpoint
ALTER TABLE `people` ADD `email` text;--> statement-breakpoint
ALTER TABLE `people` ADD `invited_at` integer;