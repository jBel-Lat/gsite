<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <div class="stat-card">
        <div class="stat-icon primary"><i class="fas fa-layer-group"></i></div>
        <div class="stat-details">
            <h3><?= $my_group ? htmlspecialchars($my_group) : 'Unassigned' ?></h3>
            <p>My Role Group</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon success"><i class="fas fa-folder-open"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalRepos ?></h3>
            <p>Active Repositories</p>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon warning"><i class="fas fa-cloud-upload-alt"></i></div>
        <div class="stat-details">
            <h3><?= (int)@$totalUploads ?></h3>
            <p>My Uploads</p>
        </div>
    </div>
</div>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">Welcome to the Multimedia Hub</h3>
    </div>
    <p>Upload your photos, videos, and graphic design assets to the appropriate team repositories. Keep your files organized and follow the naming conventions provided by your superiors.</p>
</div>

<?php require_once 'includes/footer.php'; ?>
