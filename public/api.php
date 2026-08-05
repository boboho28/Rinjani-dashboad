<?php
// api.php - Full REST API for Rinjani Dashboard (InfinityFree PHP Backend)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Fetch Main Menus
        $menuStmt = $pdo->query("SELECT * FROM main_menus ORDER BY order_num ASC");
        $mainMenus = array_map(function($m) {
            return [
                'id' => $m['id'],
                'name' => $m['name'],
                'code' => $m['code'],
                'icon' => $m['icon'] ?? '',
                'order' => (int)$m['order_num']
            ];
        }, $menuStmt->fetchAll());

        // Fetch Categories
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

        // Fetch Templates
        $tplStmt = $pdo->query("SELECT * FROM templates ORDER BY is_pinned DESC, created_at DESC");
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
        }, $tplStmt->fetchAll());

        // Fetch Reports
        $repStmt = $pdo->query("SELECT * FROM reports ORDER BY created_at DESC");
        $reports = array_map(function($r) {
            return [
                'id' => $r['id'],
                'templateId' => $r['template_id'],
                'templateTitle' => $r['template_title'],
                'user' => $r['user'],
                'note' => $r['note'],
                'createdAt' => $r['created_at']
            ];
        }, $repStmt->fetchAll());

        echo json_encode([
            'mainMenus' => $mainMenus,
            'categories' => $categories,
            'templates' => $templates,
            'reports' => $reports
        ]);
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
        echo json_encode(['error' => 'Invalid JSON body']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Sync Main Menus if provided
        if (isset($data['mainMenus']) && is_array($data['mainMenus'])) {
            $pdo->exec("DELETE FROM main_menus");
            $mStmt = $pdo->prepare("INSERT INTO main_menus (id, name, code, icon, order_num) VALUES (?, ?, ?, ?, ?)");
            foreach ($data['mainMenus'] as $m) {
                $mStmt->execute([
                    $m['id'],
                    $m['name'],
                    $m['code'],
                    $m['icon'] ?? '',
                    $m['order'] ?? 0
                ]);
            }
        }

        // 2. Sync Categories if provided
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

        // 3. Sync Templates if provided
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

        // 4. Sync Reports if provided
        if (isset($data['reports']) && is_array($data['reports'])) {
            $pdo->exec("DELETE FROM reports");
            $rStmt = $pdo->prepare("INSERT INTO reports (id, template_id, template_title, user, note, created_at) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data['reports'] as $r) {
                $rStmt->execute([
                    $r['id'],
                    $r['templateId'],
                    $r['templateTitle'],
                    $r['user'],
                    $r['note'],
                    $r['createdAt'] ?? date('Y-m-d H:i:s')
                ]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Data tersimpan ke MySQL InfinityFree']);
        exit;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Gagal menyimpan ke MySQL: ' . $e->getMessage()]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
