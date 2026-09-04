CREATE TABLE `expense_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`expense_id` text NOT NULL,
	`person_id` text NOT NULL,
	`share_amount_minor` integer NOT NULL,
	`share_units` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expense_shares_unique` ON `expense_shares` (`expense_id`,`person_id`);--> statement-breakpoint
CREATE INDEX `expense_shares_person_idx` ON `expense_shares` (`person_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`trip_id` text NOT NULL,
	`description` text NOT NULL,
	`category` text,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`rate_to_base_micros` integer DEFAULT 1000000 NOT NULL,
	`paid_by_person_id` text NOT NULL,
	`split_mode` text DEFAULT 'equal' NOT NULL,
	`spent_at` integer NOT NULL,
	`item_id` text,
	`receipt_uri` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`paid_by_person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `expenses_trip_spent_idx` ON `expenses` (`trip_id`,`spent_at`);--> statement-breakpoint
CREATE INDEX `expenses_payer_idx` ON `expenses` (`paid_by_person_id`);--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`title` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`base_currency` text DEFAULT 'JPY' NOT NULL,
	`cover_image_uri` text,
	`notes` text,
	`owner_user_id` text
);
--> statement-breakpoint
CREATE INDEX `trips_start_date_idx` ON `trips` (`start_date`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`trip_id` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_uri` text,
	`is_self` integer DEFAULT false NOT NULL,
	`user_id` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `people_trip_idx` ON `people` (`trip_id`);--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`trip_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`lat` integer,
	`lng` integer,
	`google_place_id` text,
	`timezone` text,
	`country_code` text,
	`is_wishlist` integer DEFAULT false NOT NULL,
	`notes` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `places_trip_idx` ON `places` (`trip_id`);--> statement-breakpoint
CREATE INDEX `places_wishlist_idx` ON `places` (`trip_id`,`is_wishlist`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`updated_at` integer DEFAULT (CAST(unixepoch('subsec') * 1000 AS INTEGER)) NOT NULL,
	`deleted_at` integer,
	`trip_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`start_at` integer,
	`end_at` integer,
	`is_all_day` integer DEFAULT false NOT NULL,
	`from_place_id` text,
	`to_place_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`details` text,
	`notes` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`to_place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `items_trip_start_idx` ON `items` (`trip_id`,`start_at`,`sort_order`);--> statement-breakpoint
CREATE INDEX `items_trip_kind_idx` ON `items` (`trip_id`,`kind`);