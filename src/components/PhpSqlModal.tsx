import React, { useState } from 'react';
import JSZip from 'jszip';
import { CategoryItem, TemplateItem } from '../types';
import { X, Copy, Check, Code, Database, FileCode, Download, Loader2 } from 'lucide-react';

interface PhpSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  templates: TemplateItem[];
}

export const PhpSqlModal: React.FC<PhpSqlModalProps> = ({
  isOpen,
  onClose,
  categories,
  templates,
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'sql' | 'php-db' | 'php-api' | 'htaccess'>('html');
  const [copied, setCopied] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  if (!isOpen) return null;

  const currentJsAsset = 'app.js';
  const currentCssAsset = 'app.css';

  const indexHtmlScript = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rinjani System</title>
    <script type="module" src="assets/app.js"></script>
    <link rel="stylesheet" href="assets/app.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

  // Generate MySQL Schema and Initial Data
  const sqlScript = `-- ============================================================
-- DATABASE SCHEMA & SEED DATA UNTUK INFINITYFREE (MYSQL)
-- Generated Date: ${new Date().toISOString()}
-- ============================================================

DROP TABLE IF EXISTS \`reports\`;
DROP TABLE IF EXISTS \`templates\`;
DROP TABLE IF EXISTS \`categories\`;
DROP TABLE IF EXISTS \`main_menus\`;

CREATE TABLE \`main_menus\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL,
  \`icon\` VARCHAR(50) DEFAULT NULL,
  \`order_num\` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`categories\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`main_menu_id\` VARCHAR(50) NOT NULL DEFAULT 'menu-pk-live-chat',
  \`name\` VARCHAR(100) NOT NULL,
  \`code\` VARCHAR(50) NOT NULL,
  \`color\` VARCHAR(20) DEFAULT '#8b5cf6',
  \`order_num\` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`templates\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`main_menu_id\` VARCHAR(50) NOT NULL DEFAULT 'menu-pk-live-chat',
  \`category_id\` VARCHAR(50) NOT NULL,
  \`category_name\` VARCHAR(100) NOT NULL,
  \`title\` VARCHAR(200) NOT NULL,
  \`info\` VARCHAR(150) NOT NULL,
  \`perihal\` VARCHAR(200) NOT NULL,
  \`ket\` TEXT NOT NULL,
  \`image_url\` LONGTEXT DEFAULT NULL,
  \`link_url\` TEXT DEFAULT NULL,
  \`links_json\` TEXT DEFAULT NULL,
  \`tag\` VARCHAR(50) DEFAULT NULL,
  \`is_pinned\` TINYINT(1) DEFAULT 0,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`reports\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`template_id\` VARCHAR(50) NOT NULL,
  \`template_title\` VARCHAR(200) NOT NULL,
  \`user\` VARCHAR(100) NOT NULL,
  \`note\` TEXT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSERT SEED DATA KATEGORI
INSERT INTO \`categories\` (\`id\`, \`main_menu_id\`, \`name\`, \`code\`, \`color\`, \`order_num\`) VALUES
${categories
  .map(
    (c, i) =>
      `('${c.id}', '${c.mainMenuId || 'menu-pk-live-chat'}', '${c.name.replace(/'/g, "\\'")}', '${c.code}', '${c.color || '#8b5cf6'}', ${i + 1})`
  )
  .join(',\n')}
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);

-- INSERT SEED DATA TEMPLATES
INSERT INTO \`templates\` (\`id\`, \`main_menu_id\`, \`category_id\`, \`category_name\`, \`title\`, \`info\`, \`perihal\`, \`ket\`, \`tag\`, \`is_pinned\`) VALUES
${templates
  .map(
    (t) =>
      `('${t.id}', '${t.mainMenuId || 'menu-pk-live-chat'}', '${t.categoryId}', '${t.categoryName.replace(/'/g, "\\'")}', '${t.title.replace(/'/g, "\\'")}', '${t.info.replace(/'/g, "\\'")}', '${t.perihal.replace(/'/g, "\\'")}', '${t.ket.replace(/'/g, "\\'")}', ${t.tag ? `'${t.tag}'` : 'NULL'}, ${t.isPinned ? 1 : 0})`
  )
  .join(',\n')}
ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);
`;

  // PHP Database Connection Script
  const phpDbScript = `<?php
// db.php - Koneksi Database MySQL InfinityFree untuk rinjani.infinityfreeapp.com

$host     = 'sql206.infinityfree.com'; // MySQL Hostname dari InfinityFree
$dbname   = 'if0_41333856_db_respon';  // MySQL Database Name
$username = 'if0_41333856';           // MySQL Username
$password = 'G0Q88xv6Sq';           // MySQL Password dari vPanel

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Koneksi database MySQL gagal: ' . $e->getMessage()]);
    exit;
}
?>`;

  // PHP API Endpoint Script
  const phpApiScript = `<?php
// api.php - REST API Backend PHP & MySQL untuk InfinityFree Hosting
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $catStmt = $pdo->query("SELECT * FROM categories ORDER BY order_num ASC");
        $categories = array_map(function($c) {
            return [
                'id' => $c['id'],
                'mainMenuId' => $c['main_menu_id'] ?? 'menu-pk-live-chat',
                'name' => $c['name'],
                'code' => $c['code'],
                'color' => $c['color'] ?? '#8b5cf6',
                'order' => (int)$c['order_num']
            ];
        }, $catStmt->fetchAll());

        $tplStmt = $pdo->query("SELECT * FROM templates ORDER BY is_pinned DESC, created_at DESC");
        $rawTemplates = $tplStmt->fetchAll();

        $templates = array_map(function($t) {
            return [
                'id' => $t['id'],
                'mainMenuId' => $t['main_menu_id'] ?? 'menu-pk-live-chat',
                'categoryId' => $t['category_id'],
                'categoryName' => $t['category_name'],
                'title' => $t['title'],
                'info' => $t['info'],
                'perihal' => $t['perihal'],
                'ket' => $t['ket'],
                'imageUrl' => $t['image_url'] ?? '',
                'linkUrl' => $t['link_url'] ?? '',
                'links' => !empty($t['links_json']) ? json_decode($t['links_json'], true) : [],
                'tag' => $t['tag'] ?? '',
                'isPinned' => (bool)$t['is_pinned'],
                'createdAt' => $t['created_at'],
                'updatedAt' => $t['updated_at']
            ];
        }, $rawTemplates);

        echo json_encode(['categories' => $categories, 'templates' => $templates]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Data tidak valid']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        if (isset($data['categories']) && is_array($data['categories'])) {
            $pdo->exec("DELETE FROM categories");
            $cStmt = $pdo->prepare("INSERT INTO categories (id, main_menu_id, name, code, color, order_num) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['categories'] as $c) {
                $cStmt->execute([
                    $c['id'],
                    $c['mainMenuId'] ?? 'menu-pk-live-chat',
                    $c['name'],
                    $c['code'],
                    $c['color'] ?? '#8b5cf6',
                    $c['order'] ?? 0
                ]);
            }
        }

        if (isset($data['templates']) && is_array($data['templates'])) {
            $pdo->exec("DELETE FROM templates");
            $tStmt = $pdo->prepare("INSERT INTO templates (id, main_menu_id, category_id, category_name, title, info, perihal, ket, image_url, link_url, links_json, tag, is_pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['templates'] as $t) {
                $tStmt->execute([
                    $t['id'],
                    $t['mainMenuId'] ?? 'menu-pk-live-chat',
                    $t['categoryId'],
                    $t['categoryName'],
                    $t['title'],
                    $t['info'],
                    $t['perihal'],
                    $t['ket'],
                    $t['imageUrl'] ?? null,
                    $t['linkUrl'] ?? null,
                    !empty($t['links']) ? json_encode($t['links']) : null,
                    $t['tag'] ?? null,
                    !empty($t['isPinned']) ? 1 : 0,
                    $t['createdAt'] ?? date('Y-m-d H:i:s'),
                    $t['updatedAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Berhasil menyimpan ke MySQL']);
        exit;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}
?>`;

  const htaccessScript = `# Rules .htaccess untuk Server Apache InfinityFree
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Forward /api/data ke api.php
  RewriteRule ^api/data/?$ api.php [L,QSA]

  # Direct SPA Fallback ke index.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`;

  const getContentToCopy = () => {
    if (activeTab === 'html') return indexHtmlScript;
    if (activeTab === 'sql') return sqlScript;
    if (activeTab === 'php-db') return phpDbScript;
    if (activeTab === 'php-api') return phpApiScript;
    return htaccessScript;
  };

  const getFilename = () => {
    if (activeTab === 'html') return 'index.html';
    if (activeTab === 'sql') return 'database.sql';
    if (activeTab === 'php-db') return 'db.php';
    if (activeTab === 'php-api') return 'api.php';
    return '.htaccess';
  };

  const handleDownloadAssetJs = async () => {
    try {
      const res = await fetch(`/assets/${currentJsAsset}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentJsAsset;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('File JS belum terkompilasi.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadAssetCss = async () => {
    try {
      const res = await fetch(`/assets/${currentCssAsset}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentCssAsset;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('File CSS belum terkompilasi.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContentToCopy());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const content = getContentToCopy();
    const filename = getFilename();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      // 1. Try fetching from server first
      try {
        const res = await fetch('/api/download-zip');
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const u8 = new Uint8Array(arrayBuffer);
          // Check ZIP header PK\x03\x04
          if (u8.length > 4 && u8[0] === 0x50 && u8[1] === 0x4B && u8[2] === 0x03 && u8[3] === 0x04) {
            const blob = new Blob([arrayBuffer], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'rinjani-infinityfree.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsDownloadingZip(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Server download zip fallback triggered:', err);
      }

      // 2. Client-side zip creation with JSZip
      const zip = new JSZip();
      zip.file('.htaccess', htaccessScript);
      zip.file('db.php', phpDbScript);
      zip.file('api.php', phpApiScript);
      zip.file('database.sql', sqlScript);

      let htmlText = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rinjani System</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

      try {
        const htmlRes = await fetch('/index.html');
        if (htmlRes.ok) {
          htmlText = await htmlRes.text();
        }
      } catch (e) {
        console.warn('Could not fetch /index.html:', e);
      }
      zip.file('index.html', htmlText);

      // Extract asset filenames from index.html if found
      const jsMatch = htmlText.match(/src=["']\/?assets\/([^"']+)["']/);
      const cssMatch = htmlText.match(/href=["']\/?assets\/([^"']+)["']/);

      const assetsFolder = zip.folder('assets');
      if (assetsFolder) {
        if (jsMatch && jsMatch[1]) {
          try {
            const jsRes = await fetch(`/assets/${jsMatch[1]}`);
            if (jsRes.ok) {
              const jsBlob = await jsRes.blob();
              assetsFolder.file(jsMatch[1], jsBlob);
            }
          } catch (e) {}
        }
        if (cssMatch && cssMatch[1]) {
          try {
            const cssRes = await fetch(`/assets/${cssMatch[1]}`);
            if (cssRes.ok) {
              const cssBlob = await cssRes.blob();
              assetsFolder.file(cssMatch[1], cssBlob);
            }
          } catch (e) {}
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'rinjani-infinityfree.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error generating ZIP:', error);
      alert('Gagal mendownload ZIP. Gunakan tombol "Download File ' + getFilename() + '" atau salin script secara manual.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131422] border border-[#2b2e47] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0e0f1a] px-6 py-4 border-b border-[#212338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-lime-400" />
            <div>
              <h2 className="text-sm font-black text-lime-400">
                HOSTING INFINITYFREE — PHP & MYSQL BACKEND
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Script PHP, MySQL Database & .htaccess siap upload ke htdocs InfinityFree
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1c1e30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#212338] bg-[#181a2c] px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'html'
                ? 'bg-[#131422] text-amber-400 border-[#2b2e47]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>1. index.html (Halaman Utama)</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-[#131422] text-lime-400 border-[#2b2e47]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-lime-400" />
            <span>2. database.sql (phpMyAdmin)</span>
          </button>

          <button
            onClick={() => setActiveTab('php-db')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'php-db'
                ? 'bg-[#131422] text-lime-300 border-[#2b2e47]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-lime-400" />
            <span>3. db.php (Koneksi PDO)</span>
          </button>

          <button
            onClick={() => setActiveTab('php-api')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'php-api'
                ? 'bg-[#131422] text-emerald-300 border-[#2b2e47]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. api.php (REST API)</span>
          </button>

          <button
            onClick={() => setActiveTab('htaccess')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl border-t border-x transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'htaccess'
                ? 'bg-[#131422] text-sky-300 border-[#2b2e47]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>5. .htaccess (Apache Routing)</span>
          </button>
        </div>

        {/* Code Content Area */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-3">
          <div className="bg-[#181a2e] border border-[#2b2e4d] rounded-xl p-4 text-slate-300 text-[11px] leading-relaxed space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-lg text-amber-200 space-y-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                💡 ALASAN WEB BLANK PUTIH & SOLUSI 2 MENIT (TANPA PERLU EXTRAK ZIP):
              </span>
              <p className="text-[11px] text-slate-300 leading-normal">
                Website Anda <strong>BLANK PUTIH</strong> di screenshot karena file <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">index.html</code> di htdocs memanggil nama file JavaScript lama yang tidak ada di folder <code className="text-white">assets/</code> (Error 404).
              </p>
              
              <div className="bg-slate-900/90 p-3 rounded-lg border border-amber-500/30 space-y-2">
                <span className="font-bold text-white text-[11px] block">Langkah 1: Download 2 File Ini & Upload ke Folder <code className="text-amber-300">htdocs/assets/</code></span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    onClick={handleDownloadAssetJs}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>1. Download app.js</span>
                  </button>

                  <button
                    onClick={handleDownloadAssetCss}
                    className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>2. Download app.css</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-sky-500/30 space-y-1">
                <span className="font-bold text-sky-300 text-[11px] block">Langkah 2: Update File <code className="text-white">index.html</code> di htdocs</span>
                <p className="text-[10px] text-slate-300">
                  Klik tab <strong className="text-amber-300">"1. index.html"</strong> di atas, lalu salin kodenya / klik tombol <strong>Download index.html</strong> di kanan bawah, lalu ganti (replace) file <code className="text-white">index.html</code> lama Anda di InfinityFree!
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/40 p-3.5 rounded-lg space-y-2">
              <span className="font-bold text-emerald-400 block text-xs">✅ DAFTAR TOTAL HANYA 5 FILE + 1 FOLDER YANG DI-UPLOAD KE htdocs:</span>
              <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-sky-300">
                  📁 <strong>assets/</strong> <span className="text-slate-400 font-sans text-[10px] block">(folder berisi file .js & .css di atas)</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-lime-300">
                  📄 <strong>index.html</strong> <span className="text-slate-400 font-sans text-[10px] block">(halaman utama web)</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-lime-300">
                  📄 <strong>db.php</strong> <span className="text-slate-400 font-sans text-[10px] block">(koneksi database)</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-lime-300">
                  📄 <strong>api.php</strong> <span className="text-slate-400 font-sans text-[10px] block">(backend API)</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-lime-300">
                  📄 <strong>.htaccess</strong> <span className="text-slate-400 font-sans text-[10px] block">(routing URL)</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-amber-500/40 text-amber-300">
                  🗄️ <strong>database.sql</strong> <span className="text-slate-400 font-sans text-[10px] block">(import di phpMyAdmin)</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-lg space-y-1.5">
                <span className="font-bold text-sky-400 block text-xs">🚀 CARA 1: Upload via FileZilla (Di-Reconnect)</span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                  <li>Klik tombol <strong className="text-sky-300">Quickconnect</strong> di FileZilla sampai tersambung lagi.</li>
                  <li>Di panel kiri (Komputer Anda), buka folder hasil ekstrak ZIP.</li>
                  <li>Blok file <code className="text-lime-300">index.html</code>, <code className="text-lime-300">db.php</code>, <code className="text-lime-300">api.php</code>, <code className="text-lime-300">.htaccess</code>, dan folder <code className="text-lime-300">assets</code>.</li>
                  <li><strong>Klik kanan &rarr; Upload</strong> ke panel kanan (<code className="text-amber-300">/htdocs</code>).</li>
                </ol>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-lg space-y-1.5">
                <span className="font-bold text-emerald-400 block text-xs">📝 CARA 2: Upload / Buat File Satu Per Satu</span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                  <li>Masuk File Manager InfinityFree &rarr; folder <strong className="text-white">htdocs</strong>.</li>
                  <li>Klik <strong className="text-sky-300">Upload &rarr; Upload Files</strong> untuk upload file satu per satu (<code className="text-lime-300">index.html</code>, <code className="text-lime-300">db.php</code>, <code className="text-lime-300">api.php</code>, <code className="text-lime-300">.htaccess</code>).</li>
                  <li>Atau klik <strong className="text-emerald-300">+ New File</strong>, beri nama file lalu paste kodenya dari tab di atas!</li>
                  <li>Klik <strong className="text-sky-300">Upload &rarr; Upload Folder</strong> untuk folder <code className="text-lime-300">assets</code>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-700/50 flex items-center gap-2 text-slate-400 text-[11px]">
              <span className="font-bold text-rose-400">💡 Penting:</span> Jangan lupa import file <code className="text-lime-300">database.sql</code> ke <strong>phpMyAdmin</strong> InfinityFree!
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#0b0c16] border border-[#23253d] rounded-xl p-4 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-80 leading-relaxed">
              {getContentToCopy()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0e0f1a] px-6 py-3 border-t border-[#212338] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c1e30] hover:bg-[#282a45] text-slate-300 text-xs font-bold transition-colors"
          >
            Tutup
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-sky-700 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              {isDownloadingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengekstrak & Menyiapkan ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download ZIP Production (rinjani-infinityfree.zip)</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSingleFile}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
              title={`Download file ${getFilename()} saja`}
            >
              <Download className="w-4 h-4" />
              <span>Download {getFilename()}</span>
            </button>

            <button
              onClick={handleCopy}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-lime-400 hover:bg-lime-300 text-slate-950'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Script Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Script {activeTab.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
