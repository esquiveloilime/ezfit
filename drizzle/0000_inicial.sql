CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cardio_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`workout_id` text NOT NULL,
	`position` integer NOT NULL,
	`machine_type` text NOT NULL,
	`duration_seconds` integer,
	`level` real,
	`speed` real,
	`distance_meters` real,
	`incline` real,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `cardio_entries_workout_idx` ON `cardio_entries` (`workout_id`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text NOT NULL,
	`secondary_muscles` text DEFAULT '[]' NOT NULL,
	`equipment` text NOT NULL,
	`tracking_type` text NOT NULL,
	`uses_rir` integer DEFAULT true NOT NULL,
	`uses_technique` integer DEFAULT true NOT NULL,
	`notes` text,
	`archived` integer DEFAULT false NOT NULL,
	`image_key` text,
	`video_url` text
);
--> statement-breakpoint
CREATE INDEX `exercises_user_idx` ON `exercises` (`user_id`);--> statement-breakpoint
CREATE TABLE `plan_days` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`plan_id` text NOT NULL,
	`position` integer NOT NULL,
	`routine_id` text NOT NULL,
	`weekday` integer
);
--> statement-breakpoint
CREATE INDEX `plan_days_plan_idx` ON `plan_days` (`plan_id`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`name` text NOT NULL,
	`days_per_week` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`level` text,
	`weight_unit` text DEFAULT 'lb' NOT NULL,
	`training_weekdays` text,
	`training_days_count` integer,
	`active_plan_id` text,
	`rest_seconds` integer DEFAULT 90 NOT NULL,
	`rest_auto_start` integer DEFAULT true NOT NULL,
	`rest_sound` integer DEFAULT true NOT NULL,
	`rest_vibration` integer DEFAULT true NOT NULL,
	`weight_increment_kg` real DEFAULT 2.5 NOT NULL,
	`weight_increment_lb` real DEFAULT 5 NOT NULL,
	`onboarding_completed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`routine_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`target_sets` integer,
	`reps_min` integer,
	`reps_max` integer,
	`rest_seconds` integer
);
--> statement-breakpoint
CREATE INDEX `routine_exercises_routine_idx` ON `routine_exercises` (`routine_id`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`estimated_minutes` integer
);
--> statement-breakpoint
CREATE INDEX `routines_user_idx` ON `routines` (`user_id`);--> statement-breakpoint
CREATE TABLE `run_points` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`accuracy` real,
	`recorded_at` integer NOT NULL,
	`segment` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `run_points_run_idx` ON `run_points` (`run_id`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`kind` text NOT NULL,
	`name` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`moving_seconds` integer DEFAULT 0 NOT NULL,
	`distance_meters` real DEFAULT 0 NOT NULL,
	`avg_pace_seconds_per_km` real,
	`route` text,
	`notes` text,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `runs_started_idx` ON `runs` (`started_at`);--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`workout_exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text DEFAULT 'working' NOT NULL,
	`weight` real,
	`unit` text,
	`reps` integer,
	`duration_seconds` integer,
	`distance_meters` real,
	`rir` integer,
	`technique` integer,
	`performed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sets_workout_exercise_idx` ON `sets` (`workout_exercise_id`);--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`machine` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `workout_exercises_workout_idx` ON `workout_exercises` (`workout_id`);--> statement-breakpoint
CREATE INDEX `workout_exercises_exercise_idx` ON `workout_exercises` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`routine_id` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`status` text NOT NULL,
	`mood` integer,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `workouts_started_idx` ON `workouts` (`started_at`);