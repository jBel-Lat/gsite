-- ============================================================
-- CCS GSITE Organization Management System — Full Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS `cc_gsite_db`;
USE `cc_gsite_db`;

-- Drop all tables in correct dependency order
DROP TABLE IF EXISTS `project_file_comments`, `project_file_history`, `project_files`,
    `event_registrations`, `events`, `post_comments`, `posts`,
    `announcement_comments`, `team_announcements`,
    `activity_logs`, `uploads`, `repositories`, `comments`, `announcements`,
    `users`, `groups`, `roles`, `teams`;

-- ============================================================
-- GROUPS (Multimedia sub-teams)
-- ============================================================
CREATE TABLE `groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `groups` (`id`, `group_name`) VALUES
(1, 'Videographer'), (2, 'Photographer'), (3, 'Graphic Designer');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `role` enum('superadmin','multimedia_head','developer_head','multimedia_member','developer_member') NOT NULL,
  `team` enum('multimedia','developer') DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT 'default.png',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `group_id` (`group_id`),
  KEY `team` (`team`),
  CONSTRAINT `fk_user_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`username`, `password_hash`, `email`, `name`, `role`, `team`) VALUES
('superadmin', '$2y$10$BBN9PxwWeUC/SOpI2u.5feY9PBW14uMy2C.x4KdhpdQ.GLc4jxDcC', 'admin@ccgsite.edu', 'System Super Admin', 'superadmin', NULL),
('multihead', '$2y$10$BBN9PxwWeUC/SOpI2u.5feY9PBW14uMy2C.x4KdhpdQ.GLc4jxDcC', 'multi@ccgsite.edu', 'Multimedia Head', 'multimedia_head', 'multimedia'),
('devhead', '$2y$10$BBN9PxwWeUC/SOpI2u.5feY9PBW14uMy2C.x4KdhpdQ.GLc4jxDcC', 'dev@ccgsite.edu', 'Developer Head', 'developer_head', 'developer');

-- ============================================================
-- TEAM ANNOUNCEMENTS (internal, team-specific)
-- ============================================================
CREATE TABLE `team_announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `author_id` int NOT NULL,
  `team` enum('multimedia','developer') NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `fk_ta_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TEAM ANNOUNCEMENT COMMENTS
-- ============================================================
CREATE TABLE `announcement_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `announcement_id` int NOT NULL,
  `author_id` int NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `announcement_id` (`announcement_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `fk_ac_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `team_announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ac_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PUBLIC POSTS (GSITE — visible on Student Page)
-- ============================================================
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `author_id` int NOT NULL,
  `team` enum('multimedia','developer') NOT NULL,
  `title` varchar(255) NOT NULL,
  `details` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_banner` tinyint(1) DEFAULT 0,
  `auto_hide_at` timestamp NULL DEFAULT NULL COMMENT 'auto-hide after 20 days',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `fk_post_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PUBLIC POST COMMENTS (Student Page)
-- ============================================================
CREATE TABLE `post_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `commenter_name` varchar(100) DEFAULT 'Anonymous',
  `commenter_email` varchar(100) DEFAULT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `fk_pc_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- EVENTS (Developer Head creates, students register)
-- ============================================================
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `author_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `participant_limit` int DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_closed` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `fk_event_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- EVENT REGISTRATIONS (student form submissions)
-- ============================================================
CREATE TABLE `event_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `student_id` varchar(50) DEFAULT NULL,
  `year_section` varchar(50) DEFAULT NULL,
  `registered_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `fk_er_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- REPOSITORIES
-- ============================================================
CREATE TABLE `repositories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `team_type` enum('multimedia','developer') NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `fk_repo_author` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- UPLOADS (Files inside Repositories)
-- ============================================================
CREATE TABLE `uploads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `repository_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `filetype` varchar(50) NOT NULL,
  `size` int NOT NULL,
  `task_status` enum('not_complete','processing','done') DEFAULT 'not_complete',
  `uploaded_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `repository_id` (`repository_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_upload_repo` FOREIGN KEY (`repository_id`) REFERENCES `repositories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_upload_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROJECT FILES (Developer — GitHub-like)
-- ============================================================
CREATE TABLE `project_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uploader_id` int NOT NULL,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `file_content` longtext DEFAULT NULL COMMENT 'for text/code files — inline editing',
  `folder_path` varchar(500) DEFAULT '/',
  `filetype` varchar(50) DEFAULT 'text',
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploader_id` (`uploader_id`),
  CONSTRAINT `fk_pf_uploader` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROJECT FILE HISTORY (version control)
-- ============================================================
CREATE TABLE `project_file_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL,
  `editor_id` int NOT NULL,
  `old_content` longtext DEFAULT NULL,
  `new_content` longtext DEFAULT NULL,
  `change_summary` varchar(255) DEFAULT NULL,
  `changed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  KEY `editor_id` (`editor_id`),
  CONSTRAINT `fk_pfh_file` FOREIGN KEY (`file_id`) REFERENCES `project_files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pfh_editor` FOREIGN KEY (`editor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROJECT FILE COMMENTS
-- ============================================================
CREATE TABLE `project_file_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL,
  `author_id` int NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `fk_pfc_file` FOREIGN KEY (`file_id`) REFERENCES `project_files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pfc_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(255) NOT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
