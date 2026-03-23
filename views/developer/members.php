<?php require_once 'includes/header.php'; ?>

<!-- Add New Developer Member -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-user-plus"></i> Add Developer Member</h3>
    </div>
    <form action="<?= BASE_URL ?>/developer/members" method="POST">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="create">
        <div class="grid-cards">
            <div class="form-group"><label>Username</label><input type="text" name="username" class="form-control" required placeholder="e.g. dev_jane"></div>
            <div class="form-group"><label>Full Name</label><input type="text" name="name" class="form-control" required placeholder="e.g. Jane Smith"></div>
            <div class="form-group"><label>Email Address</label><input type="email" name="email" class="form-control" required></div>
            <div class="form-group"><label>Contact Number</label><input type="text" name="contact_number" class="form-control" placeholder="e.g. 09123456789"></div>
            <div class="form-group"><label>Password</label><input type="password" name="password" class="form-control" required></div>
        </div>
        <button type="submit" class="btn btn-primary mt-4"><i class="fas fa-plus"></i> Create Member</button>
    </form>
</div>

<!-- Members Table -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-code"></i> Developer Members (<?= count($members) ?>)</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Username</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($members as $m): ?>
                <tr>
                    <td>
                        <img src="<?= BASE_URL ?>/uploads/profiles/<?= htmlspecialchars($m['profile_picture']) ?>" 
                             onerror="this.src='<?= BASE_URL ?>/assets/images/default-avatar.png'"
                             style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid var(--border-color);">
                    </td>
                    <td><strong><?= htmlspecialchars($m['name']) ?></strong></td>
                    <td><?= htmlspecialchars($m['email']) ?></td>
                    <td><?= htmlspecialchars($m['contact_number'] ?? 'N/A') ?></td>
                    <td><span class="badge badge-info">@<?= htmlspecialchars($m['username']) ?></span></td>
                    <td style="font-size:12px; color:var(--text-muted);"><?= date('M d, Y', strtotime($m['created_at'])) ?></td>
                    <td style="display:flex; gap:6px;">
                        <button class="btn btn-warning btn-sm" onclick="editMember(<?= $m['id'] ?>, '<?= addslashes($m['name']) ?>', '<?= addslashes($m['email']) ?>', '<?= addslashes($m['contact_number'] ?? '') ?>')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <form action="<?= BASE_URL ?>/developer/members" method="POST" onsubmit="return confirm('Delete <?= addslashes($m['name']) ?>?')">
                            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="user_id" value="<?= $m['id'] ?>">
                            <button type="submit" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($members)): ?>
                <tr><td colspan="7" class="text-muted text-center" style="padding:40px;">No members yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Edit Modal -->
<div id="editModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center;">
    <div style="background:var(--bg-card); border-radius:16px; padding:30px; width:100%; max-width:480px; border:1px solid var(--border-color); max-height:90vh; overflow-y:auto;">
        <h3 style="margin-bottom:20px;"><i class="fas fa-user-edit"></i> Edit Developer Member</h3>
        <form action="<?= BASE_URL ?>/developer/members" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="update">
            <input type="hidden" name="user_id" id="editUserId">
            <div class="form-group"><label>Full Name</label><input type="text" name="name" id="editName" class="form-control" required></div>
            <div class="form-group"><label>Email Address</label><input type="email" name="email" id="editEmail" class="form-control" required></div>
            <div class="form-group"><label>Contact Number</label><input type="text" name="contact_number" id="editContact" class="form-control"></div>
            <div class="form-group"><label>New Password <small style="color:var(--text-muted)">(leave blank to keep current)</small></label><input type="password" name="password" class="form-control"></div>
            <div style="display:flex; gap:10px; margin-top:16px;">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save</button>
                <button type="button" class="btn btn-warning" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<script>
function editMember(id, name, email, contact) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editEmail').value = email;
    document.getElementById('editContact').value = contact;
    document.getElementById('editModal').style.display = 'flex';
}
function closeModal() { document.getElementById('editModal').style.display = 'none'; }
</script>

<?php require_once 'includes/footer.php'; ?>
