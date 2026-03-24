USE cc_gsite_db;

ALTER TABLE users
  MODIFY COLUMN role ENUM(
    'superadmin',
    'admin',
    'member',
    'student',
    'multimedia_head',
    'developer_head',
    'developer_member',
    'photographer',
    'videographer',
    'graphic_designer',
    'documentator',
    'multimedia_member',
    'officer',
    'profile'
  ) NOT NULL;

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS user_name VARCHAR(120) NULL AFTER user_role,
  ADD COLUMN IF NOT EXISTS details TEXT NULL AFTER action,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER details;

ALTER TABLE activity_logs
  MODIFY COLUMN user_id INT NULL;

CREATE TABLE IF NOT EXISTS multimedia_members (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  photo VARCHAR(255) DEFAULT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  username VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('photographer', 'videographer', 'graphic_designer', 'documentator') NOT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_multimedia_members_email (email),
  UNIQUE KEY uq_multimedia_members_username (username),
  KEY idx_multimedia_members_role (role),
  KEY idx_multimedia_members_user_id (user_id),
  KEY idx_multimedia_members_created_by (created_by),
  CONSTRAINT fk_multimedia_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_multimedia_members_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS multimedia_files (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) DEFAULT NULL,
  file_size INT DEFAULT 0,
  assigned_team ENUM('photographer', 'videographer', 'graphic_designer', 'documentator', 'all_teams') NOT NULL DEFAULT 'all_teams',
  status ENUM('pending', 'processing', 'done') NOT NULL DEFAULT 'pending',
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_multimedia_files_status (status),
  KEY idx_multimedia_files_assigned_team (assigned_team),
  KEY idx_multimedia_files_uploaded_by (uploaded_by),
  CONSTRAINT fk_multimedia_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcements (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  posted_by INT NOT NULL,
  target_audience ENUM('students', 'multimedia_team', 'all') NOT NULL DEFAULT 'students',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_announcements_posted_by (posted_by),
  KEY idx_announcements_created_at (created_at),
  KEY idx_announcements_target_audience (target_audience),
  CONSTRAINT fk_announcements_posted_by FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT NOT NULL AUTO_INCREMENT,
  type ENUM('file_uploaded', 'file_status_changed', 'announcement_posted') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT DEFAULT NULL,
  reference_id INT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_type (type),
  KEY idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS repositories;
