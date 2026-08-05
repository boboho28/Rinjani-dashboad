<?php
// db.php - Database connection for InfinityFree / MySQL
// Detail MySQL otomatis disesuaikan dari Dashboard InfinityFree Anda

$host     = 'sql206.infinityfree.com';
$dbname   = 'if0_41333856_db_respon';
$username = 'if0_41333856';
$password = 'G0Q88xv6Sq';

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
?>
