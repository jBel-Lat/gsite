<?php
// index.php — Front Controller
require_once 'config/database.php';
require_once 'includes/auth.php';

$url = isset($_GET['url']) ? rtrim($_GET['url'], '/') : 'student/dashboard';
$url = filter_var($url, FILTER_SANITIZE_URL);
$parts = explode('/', $url);

$controllerClass = '';
$method = 'index';
$params = [];

switch (true) {

    // ── Public: Student Dashboard ──────────────────────────────────────────
    case ($parts[0] === 'student'):
        $controllerClass = 'StudentController';
        $method = 'dashboard';
        break;

    // ── Super Admin ────────────────────────────────────────────────────────
    case ($url === 'superadmin/login'):
        $controllerClass = 'AuthController'; $method = 'superAdminLogin'; break;
    case ($url === 'superadmin/authenticate'):
        $controllerClass = 'AuthController'; $method = 'superAdminAuthenticate'; break;
    case ($parts[0] === 'superadmin'):
        $controllerClass = 'AdminController';
        $method = isset($parts[1]) && $parts[1] !== '' ? $parts[1] : 'dashboard';
        break;

    // ── Admin (Head) Login ─────────────────────────────────────────────────
    case ($url === 'admin/login'):
        $controllerClass = 'AuthController'; $method = 'adminLogin'; break;
    case ($url === 'admin/authenticate'):
        $controllerClass = 'AuthController'; $method = 'adminAuthenticate'; break;

    // ── Multimedia Team: /multimedia/{page} ───────────────────────────────
    case ($parts[0] === 'multimedia'):
        $controllerClass = 'MultimediaController';
        $method = isset($parts[1]) && $parts[1] !== '' ? $parts[1] : 'dashboard';
        break;

    // ── Developer Team: /developer/{page} ────────────────────────────────
    case ($parts[0] === 'developer'):
        $controllerClass = 'DeveloperController';
        $method = isset($parts[1]) && $parts[1] !== '' ? $parts[1] : 'dashboard';
        break;

    // ── Profile ───────────────────────────────────────────────────────────
    case ($parts[0] === 'profile'):
        $controllerClass = 'ProfileController'; $method = 'index'; break;

    // ── Logout ────────────────────────────────────────────────────────────
    case ($url === 'logout'):
        $controllerClass = 'AuthController'; $method = 'logout'; break;

    // ── Legacy officer/member routes — redirect cleanly ───────────────────
    case ($parts[0] === 'officer' || $parts[0] === 'member'):
        $team = $parts[1] ?? '';
        $redirectTarget = ($team === 'developer') ? 'developer' : 'multimedia';
        header("Location: " . BASE_URL . "/" . $redirectTarget . "/dashboard");
        exit();

    // ─── 404 ─────────────────────────────────────────────────────────────
    default:
        http_response_code(404);
        die("404: Page not found.");
}

// ── Dispatch Controller ────────────────────────────────────────────────────
if ($controllerClass) {
    $file = "controllers/{$controllerClass}.php";
    if (file_exists($file)) {
        require_once $file;
        $controller = new $controllerClass();
        if (method_exists($controller, $method)) {
            call_user_func_array([$controller, $method], $params);
        } else {
            die("404: Method '$method' not found in $controllerClass.");
        }
    } else {
        die("500: Controller '$controllerClass' not found.");
    }
}
?>
