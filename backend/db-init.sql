-- db-init.sql
-- For XAMPP MySQL on port 3307.
-- Supports Django local Notes CRUD + task DB (project-specific).

-- 1) MySQL safe mode (8.x)
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- 2) Project databases
CREATE DATABASE IF NOT EXISTS `djangodatabase` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `notesapp_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `task_management_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `customer_orders_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5) Optional root full-right admin (learning / quick setup)
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;


-- ==============================================================================
-- POSTGRESQL SETUP (FOR KNOWLEDGE MESH AI)
-- ==============================================================================
-- WARNING: Do not run the following commands in MySQL! 
-- Run these in your PostgreSQL terminal (psql) or pgAdmin:

/*
CREATE DATABASE ai_chat_db;

\c ai_chat_db;

CREATE EXTENSION IF NOT EXISTS vector;
*/