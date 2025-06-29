CREATE TABLE `llm_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`tool_name` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`total_tokens` integer,
	`estimated_cost` real,
	`duration_ms` integer,
	`status` text NOT NULL,
	`error_message` text,
	`request_data` text,
	`response_data` text,
	`finish_reason` text
);
--> statement-breakpoint
CREATE INDEX `llm_requests_timestamp_idx` ON `llm_requests` (`timestamp`);--> statement-breakpoint
CREATE INDEX `llm_requests_provider_idx` ON `llm_requests` (`provider`);--> statement-breakpoint
CREATE INDEX `llm_requests_status_idx` ON `llm_requests` (`status`);