<?php
// includes/auth.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

class Auth {

    public static function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }

    public static function user() {
        if (!self::isLoggedIn()) return null;
        return [
            'id'       => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role'     => $_SESSION['role'],
            'team'     => $_SESSION['team'] ?? null,
        ];
    }

    public static function hasRole($roles) {
        if (!self::isLoggedIn()) return false;
        if (!is_array($roles)) $roles = [$roles];
        return in_array($_SESSION['role'], $roles);
    }

    /**
     * Derive team from role string.
     * Returns 'multimedia', 'developer', or null.
     */
    public static function teamFromRole($role) {
        if (in_array($role, ['multimedia_head', 'multimedia_member'])) return 'multimedia';
        if (in_array($role, ['developer_head', 'developer_member']))   return 'developer';
        return null;
    }

    /**
     * Require a specific team. Blocks cross-team access.
     */
    public static function requireTeam($team) {
        self::requireLogin();
        $userTeam = $_SESSION['team'] ?? null;
        if ($userTeam !== $team) {
            http_response_code(403);
            die("
            <!DOCTYPE html><html><head>
            <title>Access Denied</title>
            <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap' rel='stylesheet'>
            <style>
                body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { text-align: center; padding: 50px; border: 1px solid rgba(239,68,68,0.3); border-radius: 16px; background: rgba(239,68,68,0.05); max-width: 400px; }
                h1 { color: #ef4444; font-size: 28px; margin-bottom: 12px; }
                p { color: #94a3b8; margin-bottom: 24px; }
                a { background: #3b82f6; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; }
            </style></head>
            <body><div class='box'>
                <h1>&#x26D4; Access Denied</h1>
                <p>You do not have permission to view this page. You are restricted to your assigned team area.</p>
                <a href='javascript:history.back()'>Go Back</a>
            </div></body></html>
            ");
        }
    }

    public static function generateCSRF() {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function verifyCSRF($token) {
        if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
            die("CSRF token validation failed.");
        }
        return true;
    }

    public static function sanitize($input) {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    public static function requireLogin($target = 'admin/login') {
        if (!self::isLoggedIn()) {
            header("Location: " . BASE_URL . "/" . $target);
            exit();
        }
    }

    public static function requireRole($roles) {
        if (!self::isLoggedIn()) {
            header("Location: " . BASE_URL . "/admin/login");
            exit();
        }
        if (!self::hasRole($roles)) {
            header("Location: " . BASE_URL . "/student?error=Unauthorized+access");
            exit();
        }
    }

    /**
     * Middleware-style check for protected controllers.
     * Redirects to student dashboard if unauthorized.
     */
    public static function checkAccess($allowedRoles = []) {
        if (!self::isLoggedIn()) {
            header("Location: " . BASE_URL . "/student?error=Please+login+as+Officer");
            exit();
        }
        
        if (!empty($allowedRoles) && !self::hasRole($allowedRoles)) {
            header("Location: " . BASE_URL . "/student?error=Access+Denied");
            exit();
        }
    }
}
?>
