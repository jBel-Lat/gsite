<?php
// controllers/AdminController.php
require_once 'models/User.php';

class AdminController {
    public function __construct() {
        Auth::checkAccess(['superadmin']);
    }

    public function dashboard() {
        $pageTitle = "Super Admin Dashboard";
        $conn = Database::getConnection();
        
        $totalUsers = $conn->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $totalMultimedia = $conn->query("SELECT COUNT(*) FROM users WHERE role IN ('multimedia_head', 'multimedia_member')")->fetchColumn();
        $totalDeveloper = $conn->query("SELECT COUNT(*) FROM users WHERE role IN ('developer_head', 'developer_member')")->fetchColumn();
        
        // Route to the correct view depending on URL prefix
        $urlPrefix = explode('/', isset($_GET['url']) ? $_GET['url'] : '')[0];
        if ($urlPrefix === 'superadmin') {
            require_once 'views/superadmin/dashboard.php';
        } else {
            require_once 'views/admin/dashboard.php';
        }
    }

    public function users() {
        $pageTitle = "Manage Users";
        $conn = Database::getConnection();
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            if (isset($_POST['action'])) {
                $userModel = new User();
                $action = $_POST['action'];

                if ($action == 'create') {
                    $data = [
                        'username' => trim($_POST['username']),
                        'password_hash' => password_hash($_POST['password'], PASSWORD_DEFAULT),
                        'email' => trim($_POST['email']),
                        'name' => trim($_POST['name']),
                        'role' => $_POST['role']
                    ];
                    $userModel->create($data);

                } elseif ($action == 'update') {
                    $id = (int)$_POST['user_id'];
                    $data = [
                        'name' => trim($_POST['name']),
                        'email' => trim($_POST['email']),
                        'role' => $_POST['role']
                    ];
                    if (!empty($_POST['password'])) {
                        $data['password_hash'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
                    }
                    $userModel->update($id, $data);

                } elseif ($action == 'delete') {
                    $id = (int)$_POST['user_id'];
                    // Prevent self-deletion
                    if ($id != $_SESSION['user_id']) {
                        $conn->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
                    }
                }
                header("Location: " . BASE_URL . "/superadmin/users?success=1");
                exit();
            }
        }

        $stmt = $conn->query("
            SELECT u.*, g.group_name 
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id 
            ORDER BY u.created_at DESC
        ");
        $users = $stmt->fetchAll();
        
        
        // Use the same view regardless of prefix, but ensure it exists under views/admin or superadmin
        if (file_exists('views/superadmin/users.php')) {
            require_once 'views/superadmin/users.php';
        } else {
            require_once 'views/admin/users.php';
        }
    }

    public function teams() {
        $pageTitle = "Teams Overview";
        $conn = Database::getConnection();
        
        $stmt_multimedia = $conn->query("
            SELECT u.*, g.group_name 
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id
            WHERE u.role IN ('multimedia_head', 'multimedia_member')
        ");
        $multimedia_users = $stmt_multimedia->fetchAll();

        $stmt_developer = $conn->query("
            SELECT u.* 
            FROM users u 
            WHERE u.role IN ('developer_head', 'developer_member')
        ");
        $developer_users = $stmt_developer->fetchAll();

        if (file_exists('views/superadmin/teams.php')) {
            require_once 'views/superadmin/teams.php';
        } else {
            require_once 'views/admin/teams.php';
        }
    }
}
?>
