<?php
// models/User.php
class User {

    private $conn;

    public function __construct() {
        $this->conn = Database::getConnection();
    }

    /**
     * Find user by username.
     */
    public function findByUsername($username) {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        return $stmt->fetch();
    }

    /**
     * Find user by ID.
     */
    public function findById($id) {
        $stmt = $this->conn->prepare("SELECT u.*, g.group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Get all users with optional role filter.
     */
    public function getAllUsers($role = null) {
        if ($role) {
            $stmt = $this->conn->prepare("SELECT u.*, g.group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id WHERE u.role = ? ORDER BY u.created_at DESC");
            $stmt->execute([$role]);
        } else {
            $stmt = $this->conn->query("SELECT u.*, g.group_name FROM users u LEFT JOIN groups g ON u.group_id = g.id ORDER BY u.role, u.created_at DESC");
        }
        return $stmt->fetchAll();
    }

    /**
     * Create a new user. Auto-derives team from role.
     */
    public function create($data) {
        // Auto-derive team from role if not passed
        if (!isset($data['team'])) {
            $data['team'] = Auth::teamFromRole($data['role'] ?? '');
        }

        $stmt = $this->conn->prepare(
            "INSERT INTO users (username, password_hash, email, name, contact_number, role, team, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        return $stmt->execute([
            $data['username'],
            $data['password_hash'],
            $data['email'],
            $data['name'],
            $data['contact_number'] ?? null,
            $data['role'],
            $data['team'] ?? null,
            $data['group_id'] ?? null
        ]);
    }

    /**
     * Update user info.
     */
    public function update($id, $data) {
        $fields = [];
        $values = [];
        $allowed = ['name', 'email', 'contact_number', 'role', 'team', 'group_id', 'password_hash', 'profile_picture'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        if (empty($fields)) return false;
        $values[] = $id;
        $stmt = $this->conn->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?");
        return $stmt->execute($values);
    }

    /**
     * Delete a user by ID.
     */
    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM users WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Update profile details (name and email).
     */
    public function updateProfileDetails($id, $name, $email) {
        $stmt = $this->conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        return $stmt->execute([$name, $email, $id]);
    }

    /**
     * Update profile picture for a user.
     */
    public function updateProfilePicture($userId, $filePath) {
        $stmt = $this->conn->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
        return $stmt->execute([$filePath, $userId]);
    }
}
?>
