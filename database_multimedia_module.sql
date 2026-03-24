-- Multimedia Head Module Migration (MySQL 8+)
-- Apply this on your Render MySQL database.

-- 1) Expand users.role so multimedia team roles can log in directly.
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

-- 2) Multimedia member profile/accounts table.
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

-- 3) Multimedia file management table.
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

-- 4) Announcements table for multimedia head posts visible to students.
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

-- 5) Activity logs table used by multimedia head features.
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  user_role VARCHAR(50) DEFAULT NULL,
  user_name VARCHAR(120) DEFAULT NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_logs_created_at (created_at),
  KEY idx_activity_logs_user_role (user_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- For older activity_logs schema, add missing columns safely.
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT NULL AFTER user_id;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_name VARCHAR(120) DEFAULT NULL AFTER user_role;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS details TEXT DEFAULT NULL AFTER action;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER details;

-- 6) Optional notifications feed table.
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

-- 7) Optional indexes (skip these if they already exist in your schema).
-- ALTER TABLE users ADD INDEX idx_users_role (role);
-- ALTER TABLE users ADD INDEX idx_users_email (email);
-- ALTER TABLE users ADD INDEX idx_users_username (username);
