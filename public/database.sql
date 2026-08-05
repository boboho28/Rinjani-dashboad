-- ============================================================
-- DATABASE SCHEMA & SEED DATA UNTUK INFINITYFREE (MYSQL)
-- Import file ini ke phpMyAdmin di InfinityFree Control Panel
-- ============================================================

-- Hapus tabel lama jika ada agar struktur kolom ter-update dengan benar
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `templates`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `main_menus`;

CREATE TABLE `main_menus` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `order_num` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `categories` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `main_menu_id` VARCHAR(50) NOT NULL DEFAULT 'menu-pk-live-chat',
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `color` VARCHAR(20) DEFAULT '#8b5cf6',
  `order_num` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `templates` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `main_menu_id` VARCHAR(50) NOT NULL DEFAULT 'menu-pk-live-chat',
  `category_id` VARCHAR(50) NOT NULL,
  `category_name` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `info` VARCHAR(150) NOT NULL,
  `perihal` VARCHAR(200) NOT NULL,
  `ket` TEXT NOT NULL,
  `image_url` LONGTEXT DEFAULT NULL,
  `link_url` TEXT DEFAULT NULL,
  `links_json` TEXT DEFAULT NULL,
  `tag` VARCHAR(50) DEFAULT NULL,
  `is_pinned` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `reports` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `template_id` VARCHAR(50) NOT NULL,
  `template_title` VARCHAR(200) NOT NULL,
  `user` VARCHAR(100) NOT NULL,
  `note` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `main_menus` (`id`, `name`, `code`, `icon`, `order_num`) VALUES
('menu-pk-live-chat', 'PK LIVE CHAT', 'PK_LC', 'MessageSquare', 1),
('menu-pk-memo', 'PK MEMO', 'PK_MEMO', 'FileText', 2),
('menu-pk-whatsapp', 'PK WHATSAPP', 'PK_WA', 'Phone', 3),
('menu-operasionals', 'OPERASIONAL', 'OPERATIONAL', 'Briefcase', 4),
('menu-bookmarks', 'BOOKMARK PROMO & LINK', 'BOOKMARK', 'Bookmark', 5),
('menu-image-gallery', 'GALERI GAMBAR', 'IMAGE_GALLERY', 'Image', 6)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
