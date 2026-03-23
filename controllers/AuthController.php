<?php
// controllers/AuthController.php
require_once 'models/User.php';

class AuthController {

    // ─── SUPERADMIN LOGIN ────────────────────────────────────────────────────

    public function superAdminLogin() {
        if (Auth::isLoggedIn() && Auth::hasRole('superadmin')) {
            header("Location: " . BASE_URL . "/superadmin/dashboard"); exit();
        }
        $error = '';
        if (isset($_SESSION['login_error'])) { $error = $_SESSION['login_error']; unset($_SESSION['login_error']); }
        require_once 'views/superadmin/login.php';
    }

    public function superAdminAuthenticate() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $username = Auth::sanitize($_POST['username']);
            $password = $_POST['password'];

            $userModel = new User();
            $user = $userModel->findByUsername($username);

            if ($user && password_verify($password, $user['password_hash']) && $user['role'] === 'superadmin') {
                session_regenerate_id(true);
                $_SESSION['user_id']  = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role']     = $user['role'];
                $_SESSION['team']     = null;
                header("Location: " . BASE_URL . "/superadmin/dashboard"); exit();
            } else {
                $_SESSION['login_error'] = 'Invalid superadmin credentials or unauthorized.';
                header("Location: " . BASE_URL . "/superadmin/login"); exit();
            }
        }
    }

    // ─── ADMIN (HEAD) LOGIN ──────────────────────────────────────────────────

    public function adminLogin() {
        if (Auth::isLoggedIn() && Auth::hasRole(['multimedia_head', 'developer_head'])) {
            $this->_redirectToTeamDashboard($_SESSION['role']);
        }
        $error = '';
        if (isset($_SESSION['login_error'])) { $error = $_SESSION['login_error']; unset($_SESSION['login_error']); }
        require_once 'views/admin/login.php';
    }

    public function adminAuthenticate() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $username = Auth::sanitize($_POST['username']);
            $password = $_POST['password'];

            $userModel = new User();
            $user = $userModel->findByUsername($username);

            $allowedRoles = ['multimedia_head', 'developer_head', 'multimedia_member', 'developer_member'];
            if ($user && password_verify($password, $user['password_hash']) && in_array($user['role'], $allowedRoles)) {
                session_regenerate_id(true);
                $_SESSION['user_id']  = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role']     = $user['role'];
                $_SESSION['team']     = Auth::teamFromRole($user['role']);
                $this->_redirectToTeamDashboard($user['role']);
            } else {
                $_SESSION['login_error'] = 'Invalid admin credentials or unauthorized.';
                header("Location: " . BASE_URL . "/admin/login"); exit();
            }
        }
    }

    // ─── LOGOUT ─────────────────────────────────────────────────────────────

    public function logout() {
        session_unset();
        session_destroy();
        header("Location: " . BASE_URL . "/student/dashboard"); exit();
    }

    // ─── HELPER ─────────────────────────────────────────────────────────────

    private function _redirectToTeamDashboard($role) {
        if (in_array($role, ['multimedia_head', 'multimedia_member'])) {
            header("Location: " . BASE_URL . "/multimedia/dashboard");
        } elseif (in_array($role, ['developer_head', 'developer_member'])) {
            header("Location: " . BASE_URL . "/developer/dashboard");
        } else {
            header("Location: " . BASE_URL . "/superadmin/dashboard");
        }
        exit();
    }
}
?>
