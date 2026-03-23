<?php
// config/database.php
require_once __DIR__ . '/env.php';

$dbHost = (string) env('DB_HOST', 'localhost');
$dbPort = (string) env('DB_PORT', '3306');
$dbUser = (string) env('DB_USER', 'root');
$dbPass = (string) env('DB_PASS', '');
$dbName = (string) env('DB_NAME', 'cc_gsite_db');
$dbCharset = (string) env('DB_CHARSET', 'utf8mb4');

// Optional connection string support: mysql://user:pass@host:3306/dbname
$databaseUrl = (string) env('DATABASE_URL', '');
if ($databaseUrl !== '') {
    $parts = parse_url($databaseUrl);
    if ($parts !== false) {
        if (isset($parts['host'])) {
            $dbHost = (string) $parts['host'];
        }
        if (isset($parts['port'])) {
            $dbPort = (string) $parts['port'];
        }
        if (isset($parts['user'])) {
            $dbUser = urldecode((string) $parts['user']);
        }
        if (isset($parts['pass'])) {
            $dbPass = urldecode((string) $parts['pass']);
        }
        if (isset($parts['path']) && $parts['path'] !== '') {
            $dbName = ltrim((string) $parts['path'], '/');
        }
    }
}

$baseUrl = (string) env('BASE_URL', '/CCS-GSITE-Website');
$baseUrl = rtrim($baseUrl, '/');
if ($baseUrl === '/') {
    $baseUrl = '';
}
if ($baseUrl !== '' && $baseUrl[0] !== '/') {
    $baseUrl = '/' . $baseUrl;
}

if (!defined('DB_HOST')) define('DB_HOST', $dbHost);
if (!defined('DB_PORT')) define('DB_PORT', $dbPort);
if (!defined('DB_USER')) define('DB_USER', $dbUser);
if (!defined('DB_PASS')) define('DB_PASS', $dbPass);
if (!defined('DB_NAME')) define('DB_NAME', $dbName);
if (!defined('DB_CHARSET')) define('DB_CHARSET', $dbCharset);
if (!defined('BASE_URL')) define('BASE_URL', $baseUrl);
if (!defined('DB_DSN')) define('DB_DSN', 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET);

class Database {
    private static $connection = null;

    public static function getConnection() {
        if (self::$connection === null) {
            try {
                self::$connection = new PDO(DB_DSN, DB_USER, DB_PASS);
                self::$connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch(PDOException $e) {
                die("Database Connection failed: " . $e->getMessage());
            }
        }
        return self::$connection;
    }
}
?>
