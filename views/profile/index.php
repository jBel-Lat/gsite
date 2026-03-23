<?php require_once 'includes/header.php'; ?>

<div class="grid-cards" style="grid-template-columns: 1fr 2fr;">
    <!-- Profile Card -->
    <div class="panel text-center">
        <?php if(!empty($msg)): ?>
            <div style="background: rgba(16,185,129,0.1); color: var(--success); padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 13px;"><?= htmlspecialchars($msg) ?></div>
        <?php endif; ?>
        <?php if(!empty($err)): ?>
            <div style="background: rgba(239,68,68,0.1); color: var(--danger); padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 13px;"><?= htmlspecialchars($err) ?></div>
        <?php endif; ?>
        
        <div style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.1); margin: 0 auto 15px; overflow: hidden; background: #fff;">
            <?php 
                $picPath = ($user['profile_picture'] !== 'default.png') ? BASE_URL . '/' . $user['profile_picture'] : 'https://ui-avatars.com/api/?name=' . urlencode($user['name']) . '&background=3b82f6&color=fff';
            ?>
            <img src="<?= htmlspecialchars($picPath) ?>" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <h3 style="margin:0 0 5px 0;"><?= htmlspecialchars($user['name']) ?></h3>
        <p style="color:var(--text-muted); margin:0 0 15px 0; font-size: 14px;">@<?= htmlspecialchars($user['username']) ?></p>
        
        <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin-bottom: 20px;">
            <span class="badge badge-primary"><?= htmlspecialchars(ucwords(str_replace('_', ' ', $user['role']))) ?></span>
            <?php if($user['group_name']): ?>
                <span class="badge badge-warning"><?= htmlspecialchars($user['group_name']) ?></span>
            <?php endif; ?>
        </div>

        <form action="<?= BASE_URL ?>/profile" method="POST" enctype="multipart/form-data" style="text-align:left;">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="update_picture">
            <div class="form-group">
                <label style="font-size: 12px;">Update Profile Picture</label>
                <input type="file" name="profile_picture" class="form-control" accept="image/*" required style="font-size: 12px; padding: 6px;">
            </div>
            <button type="submit" class="btn btn-primary w-100" style="padding: 6px; font-size: 13px;"><i class="fas fa-upload"></i> Upload Image</button>
        </form>
    </div>

    <!-- Edit Profile -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-user-edit"></i> Edit Details</h3>
        </div>
        <form action="<?= BASE_URL ?>/profile" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="update_profile">
            
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" name="name" class="form-control" value="<?= htmlspecialchars($user['name']) ?>" required>
            </div>
            
            <div class="form-group">
                <label>Email Address</label>
                <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($user['email']) ?>" required>
            </div>
            
            <div class="form-group">
                <label>Username (Immutable)</label>
                <input type="text" class="form-control" value="<?= htmlspecialchars($user['username']) ?>" disabled style="opacity: 0.6; cursor: not-allowed;">
            </div>
            
            <button type="submit" class="btn btn-success mt-4"><i class="fas fa-save"></i> Save Changes</button>
        </form>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
