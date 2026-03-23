<?php require_once 'includes/header.php'; ?>

<!-- Add New User Panel -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-user-plus"></i> Add New User</h3>
    </div>
    <form action="<?= BASE_URL ?>/admin/users" method="POST">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="create">
        
        <div class="grid-cards" style="margin-bottom: 0;">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" class="form-control" required placeholder="e.g. admin_mark">
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" class="form-control" required placeholder="e.g. Mark Anthony">
            </div>
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <select name="role" class="form-control" required>
                    <option value="multimedia_head">Multimedia Head (Admin)</option>
                    <option value="developer_head">Developer Head (Admin)</option>
                    <option value="multimedia_member">Multimedia Member</option>
                    <option value="developer_member">Developer Member</option>
                    <option value="superadmin">Super Admin</option>
                </select>
            </div>
        </div>
        <button type="submit" class="btn btn-primary mt-4"><i class="fas fa-plus"></i> Create User Account</button>
    </form>
</div>

<!-- Users Table Panel -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-users-cog"></i> User Management</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($users as $u): ?>
                <tr>
                    <td><strong>@<?= htmlspecialchars($u['username']) ?></strong></td>
                    <td><?= htmlspecialchars($u['name']) ?></td>
                    <td><?= htmlspecialchars($u['email']) ?></td>
                    <td>
                        <span class="badge <?= strpos($u['role'], 'head') !== false || $u['role'] === 'superadmin' ? 'badge-success' : 'badge-primary' ?>">
                            <?= htmlspecialchars(ucwords(str_replace('_', ' ', $u['role']))) ?>
                        </span>
                    </td>
                    <td><?= date('M d, Y', strtotime($u['created_at'])) ?></td>
                    <td style="display:flex; gap:8px;">
                        <!-- Edit Button -->
                        <button class="btn btn-warning btn-sm" onclick="editUser(<?= $u['id'] ?>, '<?= addslashes($u['name']) ?>', '<?= addslashes($u['email']) ?>', '<?= $u['role'] ?>')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        
                        <!-- Delete Button (Prevent self-deletion) -->
                        <?php if($u['id'] != $_SESSION['user_id']): ?>
                        <form action="<?= BASE_URL ?>/admin/users" method="POST" onsubmit="return confirm('Are you sure you want to delete this user? This cannot be undone.')">
                            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                            <button type="submit" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                        </form>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Edit User Modal -->
<div id="editUserModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center;">
    <div style="background:var(--bg-card); border-radius:16px; padding:30px; width:100%; max-width:480px; border:1px solid var(--border-color);">
        <h3 style="margin-bottom:20px;"><i class="fas fa-user-edit"></i> Edit User Account</h3>
        <form action="<?= BASE_URL ?>/admin/users" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="update">
            <input type="hidden" name="user_id" id="editUserId">
            
            <div class="form-group"><label>Full Name</label><input type="text" name="name" id="editName" class="form-control" required></div>
            <div class="form-group"><label>Email Address</label><input type="email" name="email" id="editEmail" class="form-control" required></div>
            
            <div class="form-group">
                <label>Role</label>
                <select name="role" id="editRole" class="form-control" required>
                    <option value="multimedia_head">Multimedia Head (Admin)</option>
                    <option value="developer_head">Developer Head (Admin)</option>
                    <option value="multimedia_member">Multimedia Member</option>
                    <option value="developer_member">Developer Member</option>
                    <option value="superadmin">Super Admin</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>New Password <small style="color:var(--text-muted)">(leave blank to keep current)</small></label>
                <input type="password" name="password" class="form-control" placeholder="Optional">
            </div>
            
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
                <button type="button" class="btn btn-warning" onclick="closeEditModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<script>
function editUser(id, name, email, role) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editEmail').value = email;
    document.getElementById('editRole').value = role;
    document.getElementById('editUserModal').style.display = 'flex';
}
function closeEditModal() {
    document.getElementById('editUserModal').style.display = 'none';
}
</script>

<?php require_once 'includes/footer.php'; ?>
