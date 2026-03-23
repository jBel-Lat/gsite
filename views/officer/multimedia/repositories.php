<?php require_once 'includes/header.php'; ?>

<!-- Create Repository Form -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-folder-plus"></i> Create Repository</h3>
    </div>
    <form action="<?= BASE_URL ?>/officer/multimedia/repositories" method="POST" style="max-width: 460px;">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="create">
        <div class="form-group">
            <label>Repository Name</label>
            <input type="text" name="name" class="form-control" placeholder="e.g. 2024 Intramurals Photos" required>
        </div>
        <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Create Repository</button>
    </form>
</div>

<!-- Repositories List -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-folder-open"></i> File Repositories</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Repository Name</th>
                    <th>Created By</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($repositories as $rep): ?>
                <tr>
                    <td><strong><i class="fas fa-folder" style="color:#fbbf24; margin-right:8px;"></i> <?= htmlspecialchars($rep['name']) ?></strong></td>
                    <td><?= htmlspecialchars($rep['creator_name']) ?></td>
                    <td><?= date('M d, Y', strtotime($rep['created_at'])) ?></td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($repositories)): ?>
                <tr><td colspan="3" class="text-muted text-center" style="padding: 30px;">No repositories yet. Create one above.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
