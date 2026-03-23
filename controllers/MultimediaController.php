<?php
// controllers/MultimediaController.php
require_once 'models/User.php';

class MultimediaController {

    public function __construct() {
        Auth::checkAccess(['multimedia_head', 'multimedia_member']); // Blocks any non-multimedia user (403)
    }

    private function isHead() {
        return $_SESSION['role'] === 'multimedia_head';
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────────────
    public function dashboard() {
        $pageTitle = "Multimedia Dashboard";
        $conn = Database::getConnection();

        $totalMembers = $conn->query("SELECT COUNT(*) FROM users WHERE team = 'multimedia' AND role = 'multimedia_member'")->fetchColumn();
        $totalRepos   = $conn->query("SELECT COUNT(*) FROM repositories WHERE team_type = 'multimedia'")->fetchColumn();

        // If member: count own uploads
        $myUploadsStmt = $conn->prepare("SELECT COUNT(*) FROM uploads u JOIN repositories r ON u.repository_id = r.id WHERE u.user_id = ? AND r.team_type = 'multimedia'");
        $myUploadsStmt->execute([$_SESSION['user_id']]);
        $myUploads = $myUploadsStmt->fetchColumn();

        // Recent Announcements
        $recentAnnouncements = $conn->query("SELECT ta.*, u.name as author_name, (SELECT COUNT(*) FROM announcement_comments WHERE announcement_id = ta.id) as comment_count FROM team_announcements ta LEFT JOIN users u ON ta.author_id = u.id WHERE ta.team = 'multimedia' ORDER BY ta.created_at DESC LIMIT 3")->fetchAll();

        require_once 'views/multimedia/dashboard.php';
    }

    // ─── TEAM ANNOUNCEMENTS (internal) ──────────────────────────────────────
    public function announcements() {
        $pageTitle = "Team Announcements";
        $conn = Database::getConnection();
        $isHead = $this->isHead();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create' && $isHead) {
                $stmt = $conn->prepare("INSERT INTO team_announcements (author_id, team, title, content) VALUES (?, 'multimedia', ?, ?)");
                $stmt->execute([$_SESSION['user_id'], Auth::sanitize($_POST['title']), $_POST['content']]);
                header("Location: " . BASE_URL . "/multimedia/announcements?success=Announcement posted."); exit();

            } elseif ($action === 'update' && $isHead) {
                $id = (int)$_POST['id'];
                $stmt = $conn->prepare("UPDATE team_announcements SET title = ?, content = ? WHERE id = ? AND team = 'multimedia'");
                $stmt->execute([Auth::sanitize($_POST['title']), $_POST['content'], $id]);
                header("Location: " . BASE_URL . "/multimedia/announcements?success=Announcement updated."); exit();

            } elseif ($action === 'delete' && $isHead) {
                $id = (int)$_POST['id'];
                $conn->prepare("DELETE FROM team_announcements WHERE id = ? AND team = 'multimedia'")->execute([$id]);
                header("Location: " . BASE_URL . "/multimedia/announcements?success=Announcement deleted."); exit();

            } elseif ($action === 'comment') {
                $stmt = $conn->prepare("INSERT INTO announcement_comments (announcement_id, author_id, comment) VALUES (?, ?, ?)");
                $stmt->execute([(int)$_POST['announcement_id'], $_SESSION['user_id'], Auth::sanitize($_POST['comment'])]);
                header("Location: " . BASE_URL . "/multimedia/announcements?success=Comment added."); exit();

            } elseif ($action === 'update_comment') {
                $id = (int)$_POST['comment_id'];
                $stmt = $conn->prepare("UPDATE announcement_comments SET comment = ? WHERE id = ? AND author_id = ?");
                $stmt->execute([Auth::sanitize($_POST['comment']), $id, $_SESSION['user_id']]);
                header("Location: " . BASE_URL . "/multimedia/announcements?success=Comment updated."); exit();

            } elseif ($action === 'delete_comment') {
                $id = (int)$_POST['comment_id'];
                $conn->prepare("DELETE FROM announcement_comments WHERE id = ? AND author_id = ?")->execute([$id, $_SESSION['user_id']]);
                header("Location: " . BASE_URL . "/multimedia/announcements?success=Comment deleted."); exit();
            }
        }

        $announcements = $conn->query("SELECT ta.*, u.name as author_name FROM team_announcements ta LEFT JOIN users u ON ta.author_id = u.id WHERE ta.team = 'multimedia' ORDER BY ta.created_at DESC")->fetchAll();
        
        $comments = [];
        $rawComments = $conn->query("SELECT ac.*, u.name as commenter_name FROM announcement_comments ac JOIN users u ON ac.author_id = u.id ORDER BY ac.created_at ASC")->fetchAll();
        foreach ($rawComments as $c) {
            $comments[$c['announcement_id']][] = $c;
        }

        require_once 'views/multimedia/announcements.php';
    }

    // ─── GSITE PUBLIC POSTS (student page) ──────────────────────────────────
    public function gsite_posts() {
        if (!$this->isHead()) {
            header("Location: " . BASE_URL . "/multimedia/dashboard"); exit();
        }

        $pageTitle = "GSITE Public Posts";
        $conn = Database::getConnection();
        
        $editPost = null;
        if (isset($_GET['edit'])) {
            $stmt = $conn->prepare("SELECT * FROM posts WHERE id = ? AND team = 'multimedia'");
            $stmt->execute([(int)$_GET['edit']]);
            $editPost = $stmt->fetch();
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create' || $action === 'update') {
                $title     = Auth::sanitize($_POST['title']);
                $details   = $_POST['details'];
                $is_banner = isset($_POST['is_banner']) ? 1 : 0;
                $imageName = null;

                if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                    if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                        if (!is_dir('uploads/posts')) mkdir('uploads/posts', 0777, true);
                        $imageName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                        move_uploaded_file($_FILES['image']['tmp_name'], 'uploads/posts/' . $imageName);
                    }
                }

                if ($action === 'create') {
                    if ($is_banner) $conn->query("UPDATE posts SET is_banner = 0"); // Only one banner
                    $stmt = $conn->prepare("INSERT INTO posts (author_id, team, title, details, image, is_banner, auto_hide_at) VALUES (?, 'multimedia', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 20 DAY))");
                    $stmt->execute([$_SESSION['user_id'], $title, $details, $imageName, $is_banner]);
                } else {
                    $id = (int)$_POST['post_id'];
                    $sql = "UPDATE posts SET title = ?, details = ?, is_banner = ? WHERE id = ? AND team = 'multimedia'";
                    $params = [$title, $details, $is_banner, $id];
                    if ($imageName) {
                        $sql = "UPDATE posts SET title = ?, details = ?, is_banner = ?, image = ? WHERE id = ? AND team = 'multimedia'";
                        $params = [$title, $details, $is_banner, $imageName, $id];
                    }
                    if ($is_banner) $conn->query("UPDATE posts SET is_banner = 0");
                    $stmt = $conn->prepare($sql);
                    $stmt->execute($params);
                }
                header("Location: " . BASE_URL . "/multimedia/gsite_posts?success=Post published."); exit();

            } elseif ($action === 'delete') {
                $id = (int)$_POST['post_id'];
                $conn->prepare("DELETE FROM posts WHERE id = ? AND team = 'multimedia'")->execute([$id]);
                header("Location: " . BASE_URL . "/multimedia/gsite_posts?success=Post deleted."); exit();
            }
        }

        $posts = $conn->query("SELECT * FROM posts WHERE team = 'multimedia' ORDER BY created_at DESC")->fetchAll();
        require_once 'views/multimedia/gsite_posts.php';
    }

    // ─── MEMBERS (Head only) ─────────────────────────────────────────────────
    public function members() {
        if (!$this->isHead()) {
            http_response_code(403); die("403 Forbidden: Only Multimedia Head can manage members.");
        }

        $pageTitle = "Multimedia Members";
        $conn = Database::getConnection();
        $success = $error = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create') {
                $userModel = new User();
                $result = $userModel->create([
                    'username'       => Auth::sanitize($_POST['username']),
                    'password_hash'  => password_hash($_POST['password'], PASSWORD_DEFAULT),
                    'email'          => Auth::sanitize($_POST['email']),
                    'name'           => Auth::sanitize($_POST['name']),
                    'contact_number' => Auth::sanitize($_POST['contact_number'] ?? ''),
                    'role'           => 'multimedia_member',
                    'team'           => 'multimedia',
                    'group_id'       => !empty($_POST['group_id']) ? (int)$_POST['group_id'] : null
                ]);
                $success = $result ? 'Member created successfully.' : 'Failed to create member.';

            } elseif ($action === 'update') {
                $id = (int)$_POST['user_id'];
                $data = [
                    'name'           => Auth::sanitize($_POST['name']),
                    'email'          => Auth::sanitize($_POST['email']),
                    'contact_number' => Auth::sanitize($_POST['contact_number'] ?? ''),
                    'group_id'       => !empty($_POST['group_id']) ? (int)$_POST['group_id'] : null
                ];
                if (!empty($_POST['password'])) {
                    $data['password_hash'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
                }
                
                $userModel = new User();
                $userModel->update($id, $data);
                $success = 'Member updated successfully.';

            } elseif ($action === 'delete') {
                $id = (int)$_POST['user_id'];
                $conn->prepare("DELETE FROM users WHERE id = ? AND team = 'multimedia' AND role = 'multimedia_member'")->execute([$id]);
                $success = 'Member deleted.';
            }

            header("Location: " . BASE_URL . "/multimedia/members?success=" . urlencode($success)); exit();
        }

        $success = $_GET['success'] ?? '';
        $members = $conn->query("SELECT u.*, g.group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.team = 'multimedia' AND u.role = 'multimedia_member' ORDER BY u.created_at DESC")->fetchAll();
        $groups  = $conn->query("SELECT * FROM groups")->fetchAll();

        require_once 'views/multimedia/members.php';
    }

    // ─── REPOSITORIES (Head + Members) ──────────────────────────────────────
    public function repositories() {
        $pageTitle = "Multimedia Repositories";
        $conn = Database::getConnection();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create' && $this->isHead()) {
                $name = Auth::sanitize($_POST['name']);
                $stmt = $conn->prepare("INSERT INTO repositories (name, team_type, created_by) VALUES (?, 'multimedia', ?)");
                $stmt->execute([$name, $_SESSION['user_id']]);

            } elseif ($action === 'upload') {
                $repository_id = (int)$_POST['repository_id'];
                if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                    $tmpPath  = $_FILES['file']['tmp_name'];
                    $fileName = basename($_FILES['image']['name'] ?? $_FILES['file']['name']);
                    $fileSize = $_FILES['file']['size'];
                    $fileType = $_FILES['file']['type'];

                    $newFileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $fileName);
                    if (!is_dir('uploads/files')) mkdir('uploads/files', 0777, true);
                    $destPath = 'uploads/files/' . $newFileName;
                    
                    if (move_uploaded_file($tmpPath, $destPath)) {
                        $stmt = $conn->prepare("INSERT INTO uploads (repository_id, user_id, filename, filepath, filetype, size, task_status) VALUES (?, ?, ?, ?, ?, ?, 'not_complete')");
                        $stmt->execute([$repository_id, $_SESSION['user_id'], $fileName, $destPath, $fileType, $fileSize]);
                    }
                }
            } elseif ($action === 'update_status') {
                $id = (int)$_POST['upload_id'];
                $status = $_POST['task_status'];
                $stmt = $conn->prepare("UPDATE uploads SET task_status = ? WHERE id = ?");
                $stmt->execute([$status, $id]);
            } elseif ($action === 'delete_repo' && $this->isHead()) {
                $id = (int)$_POST['repo_id'];
                $conn->prepare("DELETE FROM repositories WHERE id = ? AND team_type = 'multimedia'")->execute([$id]);
            }

            header("Location: " . BASE_URL . "/multimedia/repositories"); exit();
        }

        $repositories = $conn->query("SELECT r.*, u.name as creator_name FROM repositories r LEFT JOIN users u ON r.created_by = u.id WHERE r.team_type = 'multimedia' ORDER BY r.created_at DESC")->fetchAll();
        $uploads = $conn->query("SELECT up.*, u.name as uploader_name, r.name as repo_name FROM uploads up LEFT JOIN users u ON up.user_id = u.id LEFT JOIN repositories r ON up.repository_id = r.id WHERE r.team_type = 'multimedia' ORDER BY up.uploaded_at DESC LIMIT 50")->fetchAll();
        $isHead = $this->isHead();

        require_once 'views/multimedia/repositories.php';
    }
}
?>
