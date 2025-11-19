DROP DATABASE IF EXISTS task_manager;

-- Create database
CREATE DATABASE task_manager;
USE task_manager;

-- Users table for authentication/registration
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task statuses lookup table
CREATE TABLE task_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(20) UNIQUE NOT NULL
);

-- Insert default statuses
INSERT INTO task_statuses (status_name) VALUES 
('ToDo'),
('InProgress'),
('Ready For Review'),
('Done');

-- Tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    FOREIGN KEY (status_id) REFERENCES task_statuses(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status_id),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at),
    INDEX idx_user_id (user_id)
);

-- Таблица для тегов
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь многие-ко-многим между задачами и тегами
CREATE TABLE task_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_tag (task_id, tag_id)
);

-- Таблица для комментариев/ответов
CREATE TABLE task_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Добавляем поле приоритета к задачам
ALTER TABLE tasks ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium';

-- Вставляем теги по умолчанию
INSERT INTO tags (name, color) VALUES 
('tech issue', '#dc3545'),
('tech question', '#007bff'),
('fatal error', '#dc3545'),
('sales question', '#28a745'),
('feature request', '#6f42c1'),
('bug report', '#fd7e14'),
('urgent', '#e83e8c');

-- Создаем админа (пароль: admin123)
INSERT INTO users (username, password_hash) VALUES 
('admin', '$2y$12$wcrkkQRgT18GdBnsxAINh.2LY6UzHsa8YXZPnB136Cuc5Q42lriTK');

-- Добавляем поле роли пользователя
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user';

-- Обновляем существующего админа
UPDATE users SET role = 'admin' WHERE username = 'admin';

-- Добавляем поле типа комментария (user или admin)
ALTER TABLE task_comments ADD COLUMN comment_type ENUM('user', 'admin') DEFAULT 'user';