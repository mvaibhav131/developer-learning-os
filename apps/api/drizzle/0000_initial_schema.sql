CREATE TABLE `coding_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`problem_id` integer NOT NULL,
	`language` text NOT NULL,
	`kind` text NOT NULL,
	`code` text NOT NULL,
	`status` text NOT NULL,
	`passed_count` integer NOT NULL,
	`total_count` integer NOT NULL,
	`runtime_ms` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`problem_id`) REFERENCES `coding_problems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coding_attempts_user_problem_idx` ON `coding_attempts` (`user_id`,`problem_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `coding_problems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`lesson_id` integer,
	`title` text NOT NULL,
	`difficulty` text NOT NULL,
	`topics` text NOT NULL,
	`statement_markdown` text NOT NULL,
	`constraints_markdown` text,
	`examples` text NOT NULL,
	`starter_code` text NOT NULL,
	`function_name` text NOT NULL,
	`test_cases` text NOT NULL,
	`hints` text NOT NULL,
	`walkthrough` text,
	`source` text DEFAULT 'original' NOT NULL,
	`external_url` text,
	`license` text,
	`content_status` text DEFAULT 'planned' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coding_problems_slug_unique` ON `coding_problems` (`slug`);--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`quiz_id` integer NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`passed` integer NOT NULL,
	`answers` text NOT NULL,
	`duration_seconds` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quiz_attempts_user_idx` ON `quiz_attempts` (`user_id`,`quiz_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_id` integer NOT NULL,
	`kind` text NOT NULL,
	`prompt` text NOT NULL,
	`options` text NOT NULL,
	`correct_option_ids` text NOT NULL,
	`explanation` text NOT NULL,
	`translations` text,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quiz_questions_quiz_idx` ON `quiz_questions` (`quiz_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`lesson_id` integer,
	`title` text NOT NULL,
	`description` text,
	`pass_percent` integer DEFAULT 70 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quizzes_slug_unique` ON `quizzes` (`slug`);--> statement-breakpoint
CREATE TABLE `review_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`item_type` text NOT NULL,
	`item_id` integer NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL,
	`interval_days` integer DEFAULT 1 NOT NULL,
	`repetitions` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`due_date` text NOT NULL,
	`last_reviewed_at` text,
	`last_outcome` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_schedules_item_idx` ON `review_schedules` (`user_id`,`item_type`,`item_id`);--> statement-breakpoint
CREATE INDEX `review_schedules_due_idx` ON `review_schedules` (`user_id`,`status`,`due_date`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`description` text NOT NULL,
	`difficulty` text NOT NULL,
	`icon` text NOT NULL,
	`tags` text NOT NULL,
	`outcomes` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`track_id`) REFERENCES `learning_tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_unique` ON `courses` (`slug`);--> statement-breakpoint
CREATE INDEX `courses_track_idx` ON `courses` (`track_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `learning_tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`short_title` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_tracks_slug_unique` ON `learning_tracks` (`slug`);--> statement-breakpoint
CREATE TABLE `lesson_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lesson_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`body_markdown` text NOT NULL,
	`review_status` text DEFAULT 'draft' NOT NULL,
	`content_hash` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_translations_lesson_locale_idx` ON `lesson_translations` (`lesson_id`,`locale`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`difficulty` text NOT NULL,
	`kind` text DEFAULT 'lesson' NOT NULL,
	`estimated_minutes` integer NOT NULL,
	`content_status` text DEFAULT 'planned' NOT NULL,
	`content_version` integer DEFAULT 0 NOT NULL,
	`tags` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_slug_unique` ON `lessons` (`slug`);--> statement-breakpoint
CREATE INDEX `lessons_module_idx` ON `lessons` (`module_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `lessons_course_idx` ON `lessons` (`course_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modules_course_slug_idx` ON `modules` (`course_id`,`slug`);--> statement-breakpoint
CREATE TABLE `diagrams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`graph` text NOT NULL,
	`case_study_slug` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `diagrams_user_idx` ON `diagrams` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `interview_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`interview_id` integer NOT NULL,
	`answer_markdown` text NOT NULL,
	`self_scores` text NOT NULL,
	`total_score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`duration_seconds` integer,
	`ai_feedback` text,
	`ai_provider` text,
	`ai_model` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `interview_attempts_user_idx` ON `interview_attempts` (`user_id`,`interview_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`role` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`prompt_markdown` text NOT NULL,
	`difficulty` text NOT NULL,
	`time_limit_minutes` integer,
	`answer_markdown` text NOT NULL,
	`rubric` text NOT NULL,
	`follow_ups` text NOT NULL,
	`tags` text NOT NULL,
	`content_status` text DEFAULT 'planned' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interviews_slug_unique` ON `interviews` (`slug`);--> statement-breakpoint
CREATE INDEX `interviews_role_idx` ON `interviews` (`role`,`difficulty`);--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`label` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_entity_idx` ON `bookmarks` (`user_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `flashcards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`lesson_id` integer,
	`front_markdown` text NOT NULL,
	`back_markdown` text NOT NULL,
	`source` text DEFAULT 'user' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `flashcards_user_idx` ON `flashcards` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`body_markdown` text NOT NULL,
	`lesson_id` integer,
	`pinned` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notes_user_updated_idx` ON `notes` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `taggings` (
	`tag_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	PRIMARY KEY(`tag_id`, `entity_type`, `entity_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `taggings_entity_idx` ON `taggings` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_user_name_idx` ON `tags` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `study_plan_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`week_number` integer NOT NULL,
	`day_offset` integer NOT NULL,
	`track_slug` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`planned_minutes` integer NOT NULL,
	`lesson_id` integer,
	`project_slug` text,
	`is_optional` integer DEFAULT false NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `study_plan_tasks_slot_idx` ON `study_plan_tasks` (`plan_id`,`week_number`,`day_offset`);--> statement-breakpoint
CREATE INDEX `study_plan_tasks_completed_idx` ON `study_plan_tasks` (`plan_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `study_plan_weeks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`week_number` integer NOT NULL,
	`phase_key` text NOT NULL,
	`phase_title` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`goals` text NOT NULL,
	`deliverable` text NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_plan_weeks_plan_week_idx` ON `study_plan_weeks` (`plan_id`,`week_number`);--> statement-breakpoint
CREATE TABLE `study_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`template_key` text NOT NULL,
	`start_date` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `study_plans_user_idx` ON `study_plans` (`user_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`user_id` integer NOT NULL,
	`lesson_id` integer NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`last_position` text,
	`locale` text,
	`started_at` text,
	`completed_at` text,
	`last_accessed_at` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_progress_user_status_idx` ON `lesson_progress` (`user_id`,`status`,`last_accessed_at`);--> statement-breakpoint
CREATE TABLE `progress_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`event_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`payload` text NOT NULL,
	`occurred_at` text NOT NULL,
	`local_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `progress_events_user_time_idx` ON `progress_events` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `progress_events_entity_idx` ON `progress_events` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`track_slug` text NOT NULL,
	`started_at` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`local_date` text NOT NULL,
	`source` text NOT NULL,
	`lesson_id` integer,
	`plan_task_id` integer,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`plan_task_id`) REFERENCES `study_plan_tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `study_sessions_user_date_idx` ON `study_sessions` (`user_id`,`local_date`);--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_milestones_project_order_idx` ON `project_milestones` (`project_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`goal` text NOT NULL,
	`summary` text NOT NULL,
	`difficulty` text NOT NULL,
	`estimated_hours` integer NOT NULL,
	`prerequisites` text NOT NULL,
	`stack` text NOT NULL,
	`content_status` text DEFAULT 'planned' NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `user_project_milestones` (
	`user_id` integer NOT NULL,
	`milestone_id` integer NOT NULL,
	`completed_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `milestone_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_projects` (
	`user_id` integer NOT NULL,
	`project_id` integer NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`started_at` text,
	`completed_at` text,
	`repository_url` text,
	`notes` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learning_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`url` text NOT NULL,
	`language` text NOT NULL,
	`resource_type` text NOT NULL,
	`cost` text NOT NULL,
	`license` text,
	`difficulty` text NOT NULL,
	`topics` text NOT NULL,
	`track_slug` text,
	`duration_minutes` integer,
	`embeddable` integer DEFAULT false NOT NULL,
	`embed_url` text,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`last_checked_at` text,
	`notes` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_resources_slug_unique` ON `learning_resources` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `learning_resources_url_unique` ON `learning_resources` (`url`);--> statement-breakpoint
CREATE INDEX `resources_track_idx` ON `learning_resources` (`track_slug`,`resource_type`);--> statement-breakpoint
CREATE TABLE `lesson_resources` (
	`lesson_id` integer NOT NULL,
	`resource_id` integer NOT NULL,
	`role` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`lesson_id`, `resource_id`),
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `learning_resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `resource_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` integer NOT NULL,
	`checked_at` text NOT NULL,
	`status` text NOT NULL,
	`http_status` integer,
	`final_url` text,
	`method` text NOT NULL,
	`note` text,
	FOREIGN KEY (`resource_id`) REFERENCES `learning_resources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `resource_verifications_resource_idx` ON `resource_verifications` (`resource_id`,`checked_at`);--> statement-breakpoint
CREATE TABLE `ai_settings` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'none' NOT NULL,
	`base_url` text,
	`chat_model` text,
	`embedding_model` text,
	`api_key_env_var` text,
	`enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`locale` text DEFAULT 'hi-Latn' NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`timezone` text NOT NULL,
	`week_starts_on` integer DEFAULT 1 NOT NULL,
	`daily_goals` text NOT NULL,
	`streak_min_minutes` integer DEFAULT 10 NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`handle` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);