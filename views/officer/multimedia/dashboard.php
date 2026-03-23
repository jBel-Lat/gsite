<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <div class="stat-card">
        <div class="stat-icon primary"><i class="fas fa-users"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalMembers ?></h3>
            <p>Team Members</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon success"><i class="fas fa-folder-open"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalRepos ?></h3>
            <p>Repositories</p>
        </div>
    </div>
</div>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">Multimedia Team Hub</h3>
    </div>
    <p>Welcome to the Multimedia Officer Dashboard. From here you can manage your team members, categorize them into specific groups (Videographer, Photographer, Graphic Designer), and oversee file repositories.</p>
</div>

<?php require_once 'includes/footer.php'; ?>
