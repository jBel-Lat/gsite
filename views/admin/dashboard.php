<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <div class="stat-card">
        <div class="stat-icon primary"><i class="fas fa-users"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalUsers ?></h3>
            <p>Total Users</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon success"><i class="fas fa-photo-video"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalMultimedia ?></h3>
            <p>Multimedia Members</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon warning"><i class="fas fa-code"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalDeveloper ?></h3>
            <p>Developer Members</p>
        </div>
    </div>
</div>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">System Overview</h3>
    </div>
    <p>Welcome to the Super Admin Dashboard. You have full control over the Organization Management System. Use the sidebar to manage users and view team details.</p>
</div>

<?php require_once 'includes/footer.php'; ?>
