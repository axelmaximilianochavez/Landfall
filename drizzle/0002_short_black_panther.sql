ALTER TABLE `items` ADD `segment_id` text REFERENCES segments(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `items_segment_idx` ON `items` (`segment_id`);