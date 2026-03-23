<?php
// controllers/StudentController.php

class StudentController {

    public function dashboard() {
        $pageTitle = "GSITE Student Hub";
        $conn = Database::getConnection();

        // Handle Comment Submission (Public)
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
            $action = $_POST['action'];

            if ($action === 'post_comment') {
                $stmt = $conn->prepare("INSERT INTO post_comments (post_id, author_name, comment) VALUES (?, ?, ?)");
                $stmt->execute([(int)$_POST['post_id'], Auth::sanitize($_POST['name'] ?? 'Guest'), Auth::sanitize($_POST['comment'])]);
                header("Location: " . BASE_URL . "/student?success=Comment added."); exit();

            } elseif ($action === 'register_event') {
                $eventId = (int)$_POST['event_id'];
                
                // Check limit
                $limitStmt = $conn->prepare("SELECT participant_limit, (SELECT COUNT(*) FROM event_registrations WHERE event_id = ?) as current FROM events WHERE id = ?");
                $limitStmt->execute([$eventId, $eventId]);
                $evt = $limitStmt->fetch();

                if ($evt['participant_limit'] && $evt['current'] >= $evt['participant_limit']) {
                    header("Location: " . BASE_URL . "/student?error=Event is full."); exit();
                }

                $stmt = $conn->prepare("INSERT INTO event_registrations (event_id, full_name, email, contact_number, student_id, year_section) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $eventId,
                    Auth::sanitize($_POST['full_name']),
                    Auth::sanitize($_POST['email']),
                    Auth::sanitize($_POST['contact_number']),
                    Auth::sanitize($_POST['student_id']),
                    Auth::sanitize($_POST['year_section'])
                ]);
                header("Location: " . BASE_URL . "/student?success=Registered successfully!"); exit();
            }
        }

        // Fetch Banner (Latest pinned post or latest post)
        $banner = $conn->query("SELECT * FROM posts WHERE is_banner = 1 AND (auto_hide_at IS NULL OR auto_hide_at > NOW()) ORDER BY created_at DESC LIMIT 1")->fetch();
        if (!$banner) {
            $banner = $conn->query("SELECT * FROM posts WHERE (auto_hide_at IS NULL OR auto_hide_at > NOW()) ORDER BY created_at DESC LIMIT 1")->fetch();
        }

        // Fetch Posts (Excluding banner if possible, or just all)
        $multimedia_posts = $conn->query("
            SELECT p.*, u.name as author_name, u.profile_picture as author_image,
            (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count 
            FROM posts p 
            JOIN users u ON p.author_id = u.id
            WHERE p.team = 'multimedia' AND (auto_hide_at IS NULL OR auto_hide_at > NOW()) 
            ORDER BY p.created_at DESC
        ")->fetchAll();

        $developer_posts = $conn->query("
            SELECT p.*, u.name as author_name, u.profile_picture as author_image,
            (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count 
            FROM posts p 
            JOIN users u ON p.author_id = u.id
            WHERE p.team = 'developer' AND (auto_hide_at IS NULL OR auto_hide_at > NOW()) 
            ORDER BY p.created_at DESC
        ")->fetchAll();

        // Fetch Events
        $events = $conn->query("SELECT e.*, (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as reg_count FROM events e WHERE end_date >= DATE(NOW()) ORDER BY start_date ASC")->fetchAll();

        // Fetch Comments for all posts
        $comments = [];
        $rawComments = $conn->query("SELECT * FROM post_comments ORDER BY created_at ASC")->fetchAll();
        foreach ($rawComments as $c) $comments[$c['post_id']][] = $c;

        require_once 'views/student/dashboard.php';
    }
}
?>
