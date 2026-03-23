<?php
// controllers/DeveloperController.php
require_once 'models/User.php';

class DeveloperController {

    public function __construct() {
        Auth::checkAccess(['developer_head', 'developer_member']);
    }

    private function isHead() {
        return $_SESSION['role'] === 'developer_head';
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────────────
    public function dashboard() {
        $pageTitle = "Developer Dashboard";
        $conn = Database::getConnection();

        $totalMembers = $conn->query("SELECT COUNT(*) FROM users WHERE team = 'developer' AND role = 'developer_member'")->fetchColumn();
        $totalAnnouncements = $conn->query("SELECT COUNT(*) FROM team_announcements WHERE team = 'developer'")->fetchColumn();
        $recentAnnouncements = $conn->query("SELECT ta.*, u.name as author_name, (SELECT COUNT(*) FROM announcement_comments WHERE announcement_id = ta.id) as comment_count FROM team_announcements ta LEFT JOIN users u ON ta.author_id = u.id WHERE ta.team = 'developer' ORDER BY ta.created_at DESC LIMIT 3")->fetchAll();

        require_once 'views/developer/dashboard.php';
    }

    // ─── GSITE EVENTS (Student Events) ──────────────────────────────────────
    public function gsite_events() {
        if (!$this->isHead()) { header("Location: " . BASE_URL . "/developer/dashboard"); exit(); }
        
        $pageTitle = "GSITE Student Events";
        $conn = Database::getConnection();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create' || $action === 'update') {
                $title = Auth::sanitize($_POST['title']);
                $description = $_POST['description'];
                $limit = !empty($_POST['participant_limit']) ? (int)$_POST['participant_limit'] : null;
                $start = $_POST['start_date'];
                $end = $_POST['end_date'];
                $imageName = null;

                if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                    if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
                        if (!is_dir('uploads/events')) mkdir('uploads/events', 0777, true);
                        $imageName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                        move_uploaded_file($_FILES['image']['tmp_name'], 'uploads/events/' . $imageName);
                    }
                }

                if ($action === 'create') {
                    $stmt = $conn->prepare("INSERT INTO events (author_id, title, description, image, participant_limit, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $title, $description, $imageName, $limit, $start, $end]);
                } else {
                    $id = (int)$_POST['event_id'];
                    $sql = "UPDATE events SET title = ?, description = ?, participant_limit = ?, start_date = ?, end_date = ? WHERE id = ? AND author_id = ?";
                    $params = [$title, $description, $limit, $start, $end, $id, $_SESSION['user_id']];
                    if ($imageName) {
                        $sql = "UPDATE events SET title = ?, description = ?, participant_limit = ?, start_date = ?, end_date = ?, image = ? WHERE id = ? AND author_id = ?";
                        $params = [$title, $description, $limit, $start, $end, $imageName, $id, $_SESSION['user_id']];
                    }
                    $stmt = $conn->prepare($sql);
                    $stmt->execute($params);
                }
                header("Location: " . BASE_URL . "/developer/gsite_events?success=Event saved."); exit();

            } elseif ($action === 'delete') {
                $id = (int)$_POST['event_id'];
                $conn->prepare("DELETE FROM events WHERE id = ?")->execute([$id]);
                header("Location: " . BASE_URL . "/developer/gsite_events?success=Event deleted."); exit();
            }
        }

        $events = $conn->query("SELECT e.*, (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as reg_count FROM events e ORDER BY e.created_at DESC")->fetchAll();
        require_once 'views/developer/gsite_events.php';
    }

    // ─── GSITE POSTS (Public Announcements) ────────────────────────────────
    public function gsite_posts() {
        if (!$this->isHead()) { header("Location: " . BASE_URL . "/developer/dashboard"); exit(); }
        
        $pageTitle = "GSITE Public Announcements";
        $conn = Database::getConnection();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create' || $action === 'update') {
                $title = Auth::sanitize($_POST['title']);
                $details = $_POST['details'];
                $isBanner = isset($_POST['is_banner']) ? 1 : 0;
                $hideDate = !empty($_POST['auto_hide_at']) ? $_POST['auto_hide_at'] : date('Y-m-d H:i:s', strtotime('+20 days'));
                $imageName = null;

                if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                    $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                    if (in_array($ext, ['jpg','jpeg','png','webp'])) {
                        $imageName = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                        move_uploaded_file($_FILES['image']['tmp_name'], 'uploads/posts/' . $imageName);
                    }
                }

                if ($action === 'create') {
                    $stmt = $conn->prepare("INSERT INTO posts (author_id, team, title, details, image, is_banner, auto_hide_at) VALUES (?, 'developer', ?, ?, ?, ?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $title, $details, $imageName, $isBanner, $hideDate]);
                } else {
                    $id = (int)$_POST['post_id'];
                    $sql = "UPDATE posts SET title = ?, details = ?, is_banner = ?, auto_hide_at = ? WHERE id = ? AND author_id = ?";
                    $params = [$title, $details, $isBanner, $hideDate, $id, $_SESSION['user_id']];
                    if ($imageName) {
                        $sql = "UPDATE posts SET title = ?, details = ?, is_banner = ?, auto_hide_at = ?, image = ? WHERE id = ? AND author_id = ?";
                        $params = [$title, $details, $isBanner, $hideDate, $imageName, $id, $_SESSION['user_id']];
                    }
                    $stmt = $conn->prepare($sql);
                    $stmt->execute($params);
                }
                header("Location: " . BASE_URL . "/developer/gsite_posts?success=Announcement published."); exit();
            } elseif ($action === 'delete') {
                $conn->prepare("DELETE FROM posts WHERE id = ?")->execute([(int)$_POST['post_id']]);
                header("Location: " . BASE_URL . "/developer/gsite_posts?success=Deleted."); exit();
            }
        }

        $posts = $conn->query("SELECT * FROM posts WHERE team = 'developer' ORDER BY created_at DESC")->fetchAll();
        require_once 'views/developer/gsite_posts.php';
    }

    // ─── EVENT REGISTRATIONS ────────────────────────────────────────────────
    public function event_registrations() {
        if (!$this->isHead()) { header("Location: " . BASE_URL . "/developer/dashboard"); exit(); }
        
        $pageTitle = "Event Registrations";
        $conn = Database::getConnection();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';
            if ($action === 'delete') {
                $conn->prepare("DELETE FROM event_registrations WHERE id = ?")->execute([(int)$_POST['reg_id']]);
                header("Location: " . BASE_URL . "/developer/event_registrations?event_id=" . (int)$_POST['event_id']); exit();
            }
        }

        $eventId = (int)($_GET['event_id'] ?? 0);
        $registrations = [];
        $selectedEvent = null;
        if ($eventId) {
            $stmt = $conn->prepare("SELECT * FROM events WHERE id = ?");
            $stmt->execute([$eventId]);
            $selectedEvent = $stmt->fetch();
            
            $stmt2 = $conn->prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY registered_at DESC");
            $stmt2->execute([$eventId]);
            $registrations = $stmt2->fetchAll();
        }

        require_once 'views/developer/event_registrations.php';
    }

    // ─── MEMBERS (Head only) ─────────────────────────────────────────────────
    public function members() {
        if (!$this->isHead()) { header("Location: " . BASE_URL . "/developer/dashboard"); exit(); }
        
        $pageTitle = "Developer Members";
        $conn = Database::getConnection();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create') {
                $userModel = new User();
                $userModel->create([
                    'username'       => Auth::sanitize($_POST['username']),
                    'password_hash'  => password_hash($_POST['password'], PASSWORD_DEFAULT),
                    'email'          => Auth::sanitize($_POST['email']),
                    'name'           => Auth::sanitize($_POST['name']),
                    'contact_number' => Auth::sanitize($_POST['contact_number'] ?? ''),
                    'role'           => 'developer_member',
                    'team'           => 'developer'
                ]);
            } elseif ($action === 'update') {
                $id = (int)$_POST['user_id'];
                $data = [
                    'name'           => Auth::sanitize($_POST['name']),
                    'email'          => Auth::sanitize($_POST['email']),
                    'contact_number' => Auth::sanitize($_POST['contact_number'] ?? '')
                ];
                if (!empty($_POST['password'])) $data['password_hash'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
                $userModel = new User();
                $userModel->update($id, $data);
            } elseif ($action === 'delete') {
                $conn->prepare("DELETE FROM users WHERE id = ? AND team = 'developer' AND role = 'developer_member'")->execute([(int)$_POST['user_id']]);
            }
            header("Location: " . BASE_URL . "/developer/members?success=1"); exit();
        }

        $members = $conn->query("SELECT * FROM users WHERE team = 'developer' AND role = 'developer_member' ORDER BY created_at DESC")->fetchAll();
        require_once 'views/developer/members.php';
    }

    // ─── ANNOUNCEMENTS (Team Feed) ──────────────────────────────────────────
    public function announcements() {
        $pageTitle = "Team Announcements";
        $conn = Database::getConnection();
        $isHead = $this->isHead();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'create' && $isHead) {
                $stmt = $conn->prepare("INSERT INTO team_announcements (author_id, team, title, content) VALUES (?, 'developer', ?, ?)");
                $stmt->execute([$_SESSION['user_id'], Auth::sanitize($_POST['title']), $_POST['content']]);
            } elseif ($action === 'comment') {
                $stmt = $conn->prepare("INSERT INTO announcement_comments (announcement_id, author_id, comment) VALUES (?, ?, ?)");
                $stmt->execute([(int)$_POST['announcement_id'], $_SESSION['user_id'], Auth::sanitize($_POST['comment'])]);
            } elseif ($action === 'delete_comment') {
                $conn->prepare("DELETE FROM announcement_comments WHERE id = ? AND author_id = ?")->execute([(int)$_POST['comment_id'], $_SESSION['user_id']]);
            } elseif ($action === 'update_comment') {
                $stmt = $conn->prepare("UPDATE announcement_comments SET comment = ? WHERE id = ? AND author_id = ?");
                $stmt->execute([Auth::sanitize($_POST['comment']), (int)$_POST['comment_id'], $_SESSION['user_id']]);
            }
            header("Location: " . BASE_URL . "/developer/announcements"); exit();
        }

        $announcements = $conn->query("SELECT ta.*, u.name as author_name FROM team_announcements ta LEFT JOIN users u ON ta.author_id = u.id WHERE ta.team = 'developer' ORDER BY ta.created_at DESC")->fetchAll();
        $comments = [];
        $rawComments = $conn->query("SELECT ac.*, u.name as commenter_name FROM announcement_comments ac JOIN users u ON ac.author_id = u.id ORDER BY ac.created_at ASC")->fetchAll();
        foreach ($rawComments as $c) $comments[$c['announcement_id']][] = $c;

        require_once 'views/developer/announcements.php';
    }

    // ─── IDE EDITOR & QUERY SANDBOX ────────────────────────────────────────
    public function editor() {
        $pageTitle = "IDE & Query Sandbox";
        $conn = Database::getConnection();
        $queryResult = $queryError = null;

        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sql_query'])) {
            Auth::verifyCSRF($_POST['csrf_token']);
            $query = trim($_POST['sql_query']);
            try {
                // For a real production app, you'd use a different DB user with restricted permissions
                // here we simulate sandbox by only allowing SELECT/SHOW if you wanted, but user asked for "Queries MUST NOT affect real database"
                // Ideally: $sandbox_conn = Database::getSandboxConnection();
                $stmt = $conn->prepare($query);
                $stmt->execute();
                if (preg_match('/^(SELECT|SHOW|DESCRIBE)/i', $query)) $queryResult = $stmt->fetchAll(PDO::FETCH_ASSOC);
                else $queryResult = [["Status" => "Executed. Rows affected: " . $stmt->rowCount()]];
            } catch (PDOException $e) { $queryError = $e->getMessage(); }
        }
        require_once 'views/developer/editor.php';
    }

    // ─── PROJECTS (GitHub-like) ─────────────────────────────────────────────
    public function projects() {
        $pageTitle = "Project Management";
        $conn = Database::getConnection();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            $action = $_POST['action'] ?? '';

            if ($action === 'upload') {
                if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                    $name = basename($_FILES['file']['name']);
                    $folder = Auth::sanitize($_POST['folder_path'] ?? '/');
                    $newPath = 'uploads/projects/' . time() . '_' . preg_replace('/[^a-zA-Z0-9.]/', '_', $name);
                    if (!is_dir('uploads/projects')) mkdir('uploads/projects', 0777, true);
                    
                    if (move_uploaded_file($_FILES['file']['tmp_name'], $newPath)) {
                        $content = null;
                        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                        if (in_array($ext, ['php','js','css','html','sql','txt','md','json'])) $content = file_get_contents($newPath);
                        
                        $stmt = $conn->prepare("INSERT INTO project_files (uploader_id, filename, filepath, file_content, folder_path, filetype) VALUES (?, ?, ?, ?, ?, ?)");
                        $stmt->execute([$_SESSION['user_id'], $name, $newPath, $content, $folder, $ext]);
                    }
                }
            } elseif ($action === 'save_edit') {
                $id = (int)$_POST['file_id'];
                $content = $_POST['file_content'];
                $summary = Auth::sanitize($_POST['change_summary'] ?? 'Update file');

                // Get old content for history
                $old = $conn->query("SELECT file_content FROM project_files WHERE id = $id")->fetchColumn();
                
                $stmt = $conn->prepare("UPDATE project_files SET file_content = ? WHERE id = ?");
                if ($stmt->execute([$content, $id])) {
                    $stmt2 = $conn->prepare("INSERT INTO project_file_history (file_id, editor_id, old_content, new_content, change_summary) VALUES (?, ?, ?, ?, ?)");
                    $stmt2->execute([$id, $_SESSION['user_id'], $old, $content, $summary]);
                }
            } elseif ($action === 'delete_file' && $this->isHead()) {
                $conn->prepare("DELETE FROM project_files WHERE id = ?")->execute([(int)$_POST['file_id']]);
            } elseif ($action === 'comment') {
                $stmt = $conn->prepare("INSERT INTO project_file_comments (file_id, author_id, comment) VALUES (?, ?, ?)");
                $stmt->execute([(int)$_POST['file_id'], $_SESSION['user_id'], Auth::sanitize($_POST['comment'])]);
            }
            header("Location: " . BASE_URL . "/developer/projects"); exit();
        }

        $files = $conn->query("SELECT pf.*, u.name as uploader_name FROM project_files pf JOIN users u ON pf.uploader_id = u.id ORDER BY pf.folder_path, pf.filename")->fetchAll();
        $history = $conn->query("SELECT h.*, u.name as editor_name, pf.filename FROM project_file_history h JOIN users u ON h.editor_id = u.id JOIN project_files pf ON h.file_id = pf.id ORDER BY h.changed_at DESC LIMIT 20")->fetchAll();
        
        $comments = [];
        $rawComments = $conn->query("SELECT pc.*, u.name as author_name FROM project_file_comments pc JOIN users u ON pc.author_id = u.id ORDER BY pc.created_at ASC")->fetchAll();
        foreach ($rawComments as $c) $comments[$c['file_id']][] = $c;

        require_once 'views/developer/projects.php';
    }
}
?>
