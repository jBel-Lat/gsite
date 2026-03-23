<?php
// controllers/OfficerController.php
require_once 'models/User.php';

class OfficerController {
    public function __construct() {
        Auth::requireRole(['multimedia_head', 'developer_head']);
    }

    public function multimedia($page = 'dashboard') {
        if ($_SESSION['role'] !== 'multimedia_head') {
            die("Access Denied: Not a Multimedia Head.");
        }

        $conn = Database::getConnection();

        switch ($page) {
            case 'dashboard':
                $pageTitle = "Multimedia Dashboard";
                $totalMembers = $conn->query("SELECT COUNT(*) FROM users WHERE role = 'multimedia_member'")->fetchColumn();
                $totalRepos = $conn->query("SELECT COUNT(*) FROM repositories WHERE team_type = 'multimedia'")->fetchColumn();
                require_once 'views/officer/multimedia/dashboard.php';
                break;

            case 'members':
                $pageTitle = "Manage Multimedia Members";
                
                // Allow them to add members
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    Auth::verifyCSRF($_POST['csrf_token']);
                    
                    if (isset($_POST['action']) && $_POST['action'] == 'create') {
                        $userModel = new User();
                        $data = [
                            'username' => trim($_POST['username']),
                            'password_hash' => password_hash($_POST['password'], PASSWORD_DEFAULT),
                            'email' => trim($_POST['email']),
                            'name' => trim($_POST['name']),
                            'role' => 'multimedia_member'
                        ];
                        $userModel->create($data);
                        header("Location: " . BASE_URL . "/officer/multimedia/members");
                        exit();
                    }
                    
                    if (isset($_POST['action']) && $_POST['action'] == 'update_group') {
                        $user_id = (int)$_POST['user_id'];
                        $group_id = (int)$_POST['group_id'];
                        $stmt = $conn->prepare("UPDATE users SET group_id = :group_id WHERE id = :user_id AND role = 'multimedia_member'");
                        $stmt->bindParam(':group_id', $group_id);
                        $stmt->bindParam(':user_id', $user_id);
                        $stmt->execute();
                        header("Location: " . BASE_URL . "/officer/multimedia/members");
                        exit();
                    }
                }

                $stmt = $conn->query("SELECT u.*, g.group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.role = 'multimedia_member'");
                $members = $stmt->fetchAll();
                
                $groups = $conn->query("SELECT * FROM groups")->fetchAll();
                require_once 'views/officer/multimedia/members.php';
                break;

            case 'repositories':
                $pageTitle = "Manage Repositories";
                
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    Auth::verifyCSRF($_POST['csrf_token']);
                    if (isset($_POST['action']) && $_POST['action'] == 'create') {
                        $name = Auth::sanitize($_POST['name']);
                        $created_by = $_SESSION['user_id'];
                        
                        $stmt = $conn->prepare("INSERT INTO repositories (name, team_type, created_by) VALUES (:name, 'multimedia', :created_by)");
                        $stmt->bindParam(':name', $name);
                        $stmt->bindParam(':created_by', $created_by);
                        $stmt->execute();
                        header("Location: " . BASE_URL . "/officer/multimedia/repositories");
                        exit();
                    }
                }

                $stmt = $conn->query("SELECT r.*, u.name as creator_name FROM repositories r LEFT JOIN users u ON r.created_by = u.id WHERE r.team_type = 'multimedia'");
                $repositories = $stmt->fetchAll();
                require_once 'views/officer/multimedia/repositories.php';
                break;
                
            default:
                header("HTTP/1.0 404 Not Found");
                die("Page not found");
        }
    }
    
    public function developer($page = 'dashboard', $id = null) {
        if ($_SESSION['role'] !== 'developer_head') {
            die("Access Denied: Not a Developer Head.");
        }
        
        $conn = Database::getConnection();

        switch ($page) {
            case 'dashboard':
                $pageTitle = "Developer Dashboard";
                $totalMembers = $conn->query("SELECT COUNT(*) FROM users WHERE role = 'developer_member'")->fetchColumn();
                $totalAnnouncements = $conn->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
                require_once 'views/officer/developer/dashboard.php';
                break;

            case 'members':
                $pageTitle = "Developer Team Members";
                
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    Auth::verifyCSRF($_POST['csrf_token']);
                    if (isset($_POST['action']) && $_POST['action'] == 'create') {
                        $userModel = new User();
                        $data = [
                            'username' => trim($_POST['username']),
                            'password_hash' => password_hash($_POST['password'], PASSWORD_DEFAULT),
                            'email' => trim($_POST['email']),
                            'name' => trim($_POST['name']),
                            'role' => 'developer_member'
                        ];
                        $userModel->create($data);
                        header("Location: " . BASE_URL . "/officer/developer/members");
                        exit();
                    }
                }
                
                $stmt = $conn->query("SELECT u.* FROM users u WHERE u.role = 'developer_member'");
                $members = $stmt->fetchAll();
                require_once 'views/officer/developer/members.php';
                break;

            case 'announcements':
                $pageTitle = "Developer Announcements";
                
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    Auth::verifyCSRF($_POST['csrf_token']);
                    if (isset($_POST['action']) && $_POST['action'] == 'create') {
                        $title = trim($_POST['title']);
                        $content = trim($_POST['content']);
                        $author_id = $_SESSION['user_id'];
                        
                        $stmt = $conn->prepare("INSERT INTO announcements (author_id, title, content) VALUES (?, ?, ?)");
                        $stmt->execute([$author_id, $title, $content]);
                        header("Location: " . BASE_URL . "/officer/developer/announcements");
                        exit();
                    }
                }
                
                $stmt = $conn->query("SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id ORDER BY a.created_at DESC");
                $announcements = $stmt->fetchAll();
                require_once 'views/officer/developer/announcements.php';
                break;

            case 'editor':
                $pageTitle = "IDE Code Editor & Database Query Tools";
                require_once 'views/officer/developer/editor.php';
                break;
                
            default:
                header("HTTP/1.0 404 Not Found");
                die("Page not found");
        }
    }
}
?>
