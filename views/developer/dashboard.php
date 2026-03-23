<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <a href="<?= BASE_URL ?>/developer/members" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon primary"><i class="fas fa-code"></i></div>
            <div class="stat-details">
                <h3><?= (int)$totalMembers ?></h3>
                <p>Dev Members</p>
            </div>
        </div>
    </a>
    <a href="<?= BASE_URL ?>/developer/announcements" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon warning"><i class="fas fa-bullhorn"></i></div>
            <div class="stat-details">
                <h3><?= (int)$totalAnnouncements ?></h3>
                <p>Announcements</p>
            </div>
        </div>
    </a>
    <a href="<?= BASE_URL ?>/developer/editor" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon info"><i class="fas fa-file-code"></i></div>
            <div class="stat-details">
                <h3>IDE</h3>
                <p>Code Editor</p>
            </div>
        </div>
    </a>
</div>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-terminal"></i> Developer Team Hub</h3>
        <?php if($_SESSION['role'] === 'developer_head'): ?>
        <a href="<?= BASE_URL ?>/developer/members" class="btn btn-primary btn-sm"><i class="fas fa-user-plus"></i> Add Member</a>
        <?php endif; ?>
    </div>
    <p style="color:var(--text-muted); margin-bottom:20px;">
        Welcome, <strong><?= htmlspecialchars($_SESSION['username']) ?></strong>!
        Your role: <span class="badge badge-primary"><?= ucfirst(str_replace('_', ' ', $_SESSION['role'])) ?></span>
    </p>

    <?php if(!empty($recentAnnouncements)): ?>
    <h4 style="margin-bottom:12px; font-size:14px; color:var(--text-muted);">Latest Announcements</h4>
    <?php foreach($recentAnnouncements as $a): ?>
    <div class="announcement-card">
        <strong><?= htmlspecialchars($a['title']) ?></strong>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;"><i class="fas fa-user"></i> <?= htmlspecialchars($a['author_name']) ?> &bull; <?= date('M d, Y', strtotime($a['created_at'])) ?></div>
    </div>
    <?php endforeach; ?>
    <?php else: ?>
    <p class="text-muted">No announcements yet.</p>
    <?php endif; ?>

    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:20px;">
        <a href="<?= BASE_URL ?>/developer/announcements" class="btn btn-warning"><i class="fas fa-bullhorn"></i> View All</a>
        <a href="<?= BASE_URL ?>/developer/editor" class="btn btn-info"><i class="fas fa-file-code"></i> Open IDE</a>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
