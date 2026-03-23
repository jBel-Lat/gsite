<?php
// Router for `php -S` development server.
// Serves existing files directly; routes everything else to index.php.

$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$filePath = __DIR__ . $requestPath;

if ($requestPath !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false;
}

$_GET['url'] = trim($requestPath, '/');
require __DIR__ . '/index.php';

