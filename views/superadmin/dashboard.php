<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <a href="<?= BASE_URL ?>/admin/users" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon primary"><i class="fas fa-users"></i></div>
            <div class="stat-details">
                <h3><?= (int)$totalUsers ?></h3>
                <p>Total Users</p>
            </div>
        </div>
    </a>
    <a href="<?= BASE_URL ?>/admin/teams" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon success"><i class="fas fa-photo-video"></i></div>
            <div class="stat-details">
                <h3><?= (int)$totalMultimedia ?></h3>
                <p>Multimedia Team</p>
            </div>
        </div>
    </a>
    <a href="<?= BASE_URL ?>/admin/teams" style="text-decoration:none;">
        <div class="stat-card">
            <div class="stat-icon warning"><i class="fas fa-code"></i></div>
            <div class="stat-details">
                <h3><?= (int)$totalDeveloper ?></h3>
                <p>Developer Team</p>
            </div>
        </div>
    </a>
</div>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-shield-alt"></i> Super Admin Control Center</h3>
    </div>
    <p style="color: var(--text-muted); margin-bottom: 20px;">
        You have full system control. Manage all users, create head accounts, and oversee both teams below.
    </p>
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="<?= BASE_URL ?>/admin/users" class="btn btn-primary"><i class="fas fa-user-plus"></i> Manage Users</a>
        <a href="<?= BASE_URL ?>/admin/teams" class="btn btn-info"><i class="fas fa-layer-group"></i> View Teams</a>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
