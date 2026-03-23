<?php
// controllers/MemberController.php
require_once 'models/User.php';

class MemberController {
    public function __construct() {
        Auth::requireRole(['multimedia_member', 'developer_member']);
    }

    public function multimedia($page = 'dashboard', $repo_id = null) {
        if ($_SESSION['role'] !== 'multimedia_member') die("Access Denied: Not a Multimedia Member.");
        
        $conn = Database::getConnection();

        switch ($page) {
            case 'dashboard':
                $pageTitle = "Multimedia Team Hub";
                $group_query = $conn->prepare("SELECT g.group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.id = ?");
                $group_query->execute([$_SESSION['user_id']]);
                $my_group = $group_query->fetchColumn();
                
                $totalRepos = $conn->query("SELECT COUNT(*) FROM repositories WHERE team_type = 'multimedia'")->fetchColumn();
                $myUploads = $conn->prepare("SELECT COUNT(*) FROM uploads WHERE user_id = ?");
                $myUploads->execute([$_SESSION['user_id']]);
                $totalUploads = $myUploads->fetchColumn();
                
                require_once 'views/member/multimedia/dashboard.php';
                break;

            case 'repositories':
                $pageTitle = "Team Repositories & Uploads";
                
                // Handle Uploads
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    Auth::verifyCSRF($_POST['csrf_token']);
                    if (isset($_POST['action']) && $_POST['action'] == 'upload') {
                        $repository_id = (int)$_POST['repository_id'];
                        $user_id = $_SESSION['user_id'];
                        
                        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                            $fileTmpPath = $_FILES['file']['tmp_name'];
                            $fileName = $_FILES['file']['name'];
                            $fileSize = $_FILES['file']['size'];
                            $fileType = $_FILES['file']['type'];
                            
                            $uploadDir = 'uploads/files/';
                            $newFileName = time() . '-' . basename($fileName);
                            $destPath = $uploadDir . $newFileName;
                            
                            if (move_uploaded_file($fileTmpPath, $destPath)) {
                                $stmt = $conn->prepare("INSERT INTO uploads (repository_id, user_id, filename, filepath, filetype, size) VALUES (?, ?, ?, ?, ?, ?)");
                                $stmt->execute([$repository_id, $user_id, $fileName, $destPath, $fileType, $fileSize]);
                            }
                        }
                        header("Location: " . BASE_URL . "/member/multimedia/repositories");
                        exit();
                    }
                }

                $stmt = $conn->query("SELECT r.*, u.name as creator_name FROM repositories r LEFT JOIN users u ON r.created_by = u.id WHERE r.team_type = 'multimedia'");
                $repositories = $stmt->fetchAll();
                
                $uploads_stmt = $conn->query("
                    SELECT up.*, u.name as uploader_name, r.name as repo_name 
                    FROM uploads up 
                    LEFT JOIN users u ON up.user_id = u.id 
                    LEFT JOIN repositories r ON up.repository_id = r.id 
                    WHERE r.team_type = 'multimedia' 
                    ORDER BY up.uploaded_at DESC LIMIT 50
                ");
                $recent_uploads = $uploads_stmt->fetchAll();

                require_once 'views/member/multimedia/repositories.php';
                break;

            default:
                header("HTTP/1.0 404 Not Found");
                die("Page not found");
        }
    }
    
    public function developer($page = 'dashboard') {
        if ($_SESSION['role'] !== 'developer_member') die("Access Denied: Not a Developer Member.");
        
        $conn = Database::getConnection();

        switch ($page) {
            case 'dashboard':
                $pageTitle = "Developer Hub";
                $totalAnnouncements = $conn->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
                require_once 'views/member/developer/dashboard.php';
                break;

            case 'announcements':
                $pageTitle = "Announcements";
                
                if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    Auth::verifyCSRF($_POST['csrf_token']);
                    if (isset($_POST['action']) && $_POST['action'] == 'comment') {
                        $announcement_id = (int)$_POST['announcement_id'];
                        $comment = trim($_POST['comment']);
                        $author_id = $_SESSION['user_id'];
                        
                        $stmt = $conn->prepare("INSERT INTO comments (announcement_id, author_id, comment) VALUES (?, ?, ?)");
                        $stmt->execute([$announcement_id, $author_id, $comment]);
                        header("Location: " . BASE_URL . "/member/developer/announcements");
                        exit();
                    }
                }

                $stmt = $conn->query("SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id ORDER BY a.created_at DESC");
                $announcements = $stmt->fetchAll();
                
                // Fetch comments
                $comments = [];
                $cstmt = $conn->query("SELECT c.*, u.name as commenter_name FROM comments c LEFT JOIN users u ON c.author_id = u.id ORDER BY c.created_at ASC");
                foreach($cstmt->fetchAll() as $c) {
                    $comments[$c['announcement_id']][] = $c;
                }
                
                require_once 'views/member/developer/announcements.php';
                break;

            case 'editor':
                $pageTitle = "IDE Code Editor & Database Query Tools";
                require_once 'views/member/developer/editor.php';
                break;

            default:
                header("HTTP/1.0 404 Not Found");
                die("Page not found");
        }
    }
}
?>
