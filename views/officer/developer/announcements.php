<?php require_once 'includes/header.php'; ?>

<div class="grid-cards" style="grid-template-columns: 1fr 2fr;">
    
    <!-- Create Announcement Form -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-plus-circle"></i> New Announcement</h3>
        </div>
        <form action="<?= BASE_URL ?>/officer/developer/announcements" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="create">
            
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Content</label>
                <textarea name="content" class="form-control" rows="5" required></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary mt-4 w-100"><i class="fas fa-paper-plane"></i> Publish</button>
        </form>
    </div>

    <!-- Announcements Feed -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title">Announcements Feed</h3>
        </div>
        <div class="announcements-list">
            <?php foreach($announcements as $a): ?>
            <div class="announcement-card" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid var(--border-color);">
                <h4 style="margin: 0 0 10px 0; color: var(--primary);"><?= htmlspecialchars($a['title']) ?></h4>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 15px;">
                    <i class="fas fa-user"></i> <?= htmlspecialchars($a['author_name']) ?> &bull; <i class="fas fa-clock"></i> <?= date('M d, Y H:i', strtotime($a['created_at'])) ?>
                </div>
                <div class="content" style="line-height: 1.6; font-size: 14px;">
                    <?= nl2br(htmlspecialchars($a['content'])) ?>
                </div>
                <!-- Comments can be added here mirroring the member view -->
            </div>
            <?php endforeach; ?>
            <?php if(empty($announcements)): ?>
            <p class="text-muted">No announcements posted yet.</p>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
