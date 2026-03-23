<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <div class="stat-card">
        <div class="stat-icon primary"><i class="fas fa-users"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalMembers ?></h3>
            <p>Dev Team Members</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon warning"><i class="fas fa-bullhorn"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalAnnouncements ?></h3>
            <p>Announcements</p>
        </div>
    </div>
</div>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">Developer Officer Dashboard</h3>
    </div>
    <p>Manage your developer team members, post announcements, and access the built-in IDE editor for site modifications.</p>
</div>

<?php require_once 'includes/footer.php'; ?>
