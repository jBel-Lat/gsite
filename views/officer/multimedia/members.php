<?php require_once 'includes/header.php'; ?>

<!-- Add Member Form -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-user-plus"></i> Add New Member</h3>
    </div>
    <form action="<?= BASE_URL ?>/officer/multimedia/members" method="POST">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="create">
        <div class="grid-cards" style="margin-bottom:0;">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" class="form-control" required placeholder="e.g. john_doe">
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" class="form-control" required placeholder="e.g. John Doe">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" class="form-control" required>
            </div>
        </div>
        <button type="submit" class="btn btn-primary mt-4"><i class="fas fa-plus"></i> Create Member</button>
    </form>
</div>

<!-- Members Table -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-users"></i> Multimedia Members (<?= count($members) ?>)</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Current Group</th>
                    <th>Assign Group</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($members as $m): ?>
                <tr>
                    <td><?= htmlspecialchars($m['name']) ?></td>
                    <td><?= htmlspecialchars($m['email']) ?></td>
                    <td>
                        <span class="badge <?= $m['group_name'] ? 'badge-success' : 'badge-warning' ?>">
                            <?= $m['group_name'] ? htmlspecialchars($m['group_name']) : 'Unassigned' ?>
                        </span>
                    </td>
                    <td>
                        <form action="<?= BASE_URL ?>/officer/multimedia/members" method="POST" style="display:flex; gap:8px; align-items:center;">
                            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                            <input type="hidden" name="action" value="update_group">
                            <input type="hidden" name="user_id" value="<?= $m['id'] ?>">
                            <select name="group_id" class="form-control" style="width: auto; padding: 5px 10px; font-size: 13px;">
                                <option value="">Pick Group</option>
                                <?php foreach($groups as $g): ?>
                                <option value="<?= $g['id'] ?>" <?= $m['group_id'] == $g['id'] ? 'selected' : '' ?>><?= htmlspecialchars($g['group_name']) ?></option>
                                <?php endforeach; ?>
                            </select>
                            <button type="submit" class="btn btn-success btn-sm">Save</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($members)): ?>
                <tr><td colspan="4" class="text-muted text-center" style="padding: 30px;">No members yet. Add one above.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
