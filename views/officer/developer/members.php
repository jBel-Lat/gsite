<?php require_once 'includes/header.php'; ?>

<!-- Add New Developer Member Form -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-user-plus"></i> Add New Developer</h3>
    </div>
    <form action="<?= BASE_URL ?>/officer/developer/members" method="POST">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="create">
        <div class="grid-cards" style="margin-bottom:0;">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" class="form-control" required placeholder="e.g. dev_member1">
            </div>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" class="form-control" required placeholder="e.g. Jane Smith">
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
        <button type="submit" class="btn btn-primary mt-4"><i class="fas fa-plus"></i> Create Developer Member</button>
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Joined</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($members as $m): ?>
                <tr>
                    <td><?= htmlspecialchars($m['name']) ?></td>
                    <td><?= htmlspecialchars($m['email']) ?></td>
                    <td><span class="badge badge-info">@<?= htmlspecialchars($m['username']) ?></span></td>
                    <td><?= date('M d, Y', strtotime($m['created_at'])) ?></td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($members)): ?>
                <tr><td colspan="4" class="text-muted text-center" style="padding: 30px;">No developer members yet. Add one above.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
