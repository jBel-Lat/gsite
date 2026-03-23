<?php
// controllers/ProfileController.php
require_once 'models/User.php';

class ProfileController {
    public function __construct() {
        Auth::requireLogin();
    }

    public function index() {
        $pageTitle = "My Profile";
        $conn = Database::getConnection();
        
        $user_id = $_SESSION['user_id'];
        $userModel = new User();
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            Auth::verifyCSRF($_POST['csrf_token']);
            
            if (isset($_POST['action'])) {
                if ($_POST['action'] == 'update_profile') {
                    $name = trim($_POST['name']);
                    $email = trim($_POST['email']);
                    $userModel->updateProfileDetails($user_id, $name, $email);
                    $_SESSION['profile_msg'] = "Profile details updated successfully.";
                } elseif ($_POST['action'] == 'update_picture') {
                    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
                        $file = $_FILES['profile_picture'];
                        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
                        
                        if (in_array($file['type'], $allowedTypes)) {
                            // Max size 5MB
                            if ($file['size'] <= 5 * 1024 * 1024) {
                                $uploadDir = 'uploads/profiles/';
                                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                                
                                $fileName = time() . '_' . basename($file['name']);
                                $destPath = $uploadDir . $fileName;
                                
                                if (move_uploaded_file($file['tmp_name'], $destPath)) {
                                    $userModel->updateProfilePicture($user_id, $destPath);
                                    $_SESSION['profile_msg'] = "Profile picture updated successfully.";
                                } else {
                                    $_SESSION['profile_error'] = "Upload failed.";
                                }
                            } else {
                                $_SESSION['profile_error'] = "File size exceeds 5MB limit.";
                            }
                        } else {
                            $_SESSION['profile_error'] = "Invalid file type. Only JPG, PNG, WEBP allowed.";
                        }
                    } else {
                        $_SESSION['profile_error'] = "Please select a valid image.";
                    }
                }
                header("Location: " . BASE_URL . "/profile");
                exit();
            }
        }
        
        $stmt = $conn->prepare("SELECT u.*, g.group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        $msg = isset($_SESSION['profile_msg']) ? $_SESSION['profile_msg'] : '';
        $err = isset($_SESSION['profile_error']) ? $_SESSION['profile_error'] : '';
        unset($_SESSION['profile_msg']);
        unset($_SESSION['profile_error']);

        require_once 'views/profile/index.php';
    }
}
?>
