<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <a href="<?= BASE_URL ?>/multimedia/members" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon success"><i class="fas fa-users"></i></div>
            <div class="stat-details">
                <h3><?= (int)$totalMembers ?></h3>
                <p>Team Members</p>
            </div>
        </div>
    </a>
    <a href="<?= BASE_URL ?>/multimedia/repositories" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon primary"><i class="fas fa-folder-open"></i></div>
            <div class="stat-details">
                <h3><?= (int)$totalRepos ?></h3>
                <p>Repositories</p>
            </div>
        </div>
    </a>
    <div class="stat-card">
        <div class="stat-icon warning"><i class="fas fa-cloud-upload-alt"></i></div>
        <div class="stat-details">
            <h3><?= (int)$myUploads ?></h3>
            <p>My Uploads</p>
        </div>
    </div>
</div>

<div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
    <!-- Recent Announcements -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-bullhorn"></i> Recent Team Announcements</h3>
            <a href="<?= BASE_URL ?>/multimedia/announcements" class="btn btn-warning btn-sm">View All</a>
        </div>
        <?php if(!empty($recentAnnouncements)): ?>
            <?php foreach($recentAnnouncements as $a): ?>
            <div class="announcement-card" style="margin-bottom:12px; padding:12px; border:1px solid var(--border-color); border-radius:8px; background:rgba(255,255,255,0.02);">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <strong style="font-size:14px; color:var(--primary);"><?= htmlspecialchars($a['title']) ?></strong>
                    <span style="font-size:11px; color:var(--text-muted);"><?= date('M d', strtotime($a['created_at'])) ?></span>
                </div>
                <div style="font-size:13px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <?= htmlspecialchars(strip_tags($a['content'])) ?>
                </div>
                <div style="margin-top:8px; font-size:11px; color:var(--text-muted);">
                    <i class="fas fa-comment"></i> <?= (int)$a['comment_count'] ?> comments &bull; By <?= htmlspecialchars($a['author_name']) ?>
                </div>
            </div>
            <?php endforeach; ?>
        <?php else: ?>
            <p class="text-muted">No announcements yet.</p>
        <?php endif; ?>
    </div>

    <!-- Quick Links -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-bolt"></i> Quick Actions</h3>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
            <a href="<?= BASE_URL ?>/multimedia/repositories" class="btn btn-primary w-100"><i class="fas fa-upload"></i> Upload Files</a>
            <a href="<?= BASE_URL ?>/multimedia/announcements" class="btn btn-warning w-100"><i class="fas fa-comment"></i> Join Discussions</a>
            <?php if($_SESSION['role'] === 'multimedia_head'): ?>
            <a href="<?= BASE_URL ?>/multimedia/gsite_posts" class="btn btn-success w-100"><i class="fas fa-globe"></i> Manage Public Posts</a>
            <a href="<?= BASE_URL ?>/multimedia/members" class="btn btn-info w-100"><i class="fas fa-user-plus"></i> Manage Members</a>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
