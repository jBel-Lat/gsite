<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <div class="stat-card">
        <div class="stat-icon warning"><i class="fas fa-bullhorn"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalAnnouncements ?></h3>
            <p>Team Announcements</p>
        </div>
    </div>
</div>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">Developer Team Hub</h3>
    </div>
    <p>Welcome to the Developer Member Dashboard. Check announcements, coordinate with the dev officer, and utilize the IDE to inspect code.</p>
</div>

<?php require_once 'includes/footer.php'; ?>
