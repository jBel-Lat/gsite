<?php require_once 'includes/header.php'; ?>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title">Developer Announcements</h3>
    </div>
    
    <div class="announcements-list">
        <?php foreach($announcements as $a): ?>
        <div class="announcement-card" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid var(--border-color);">
            <h4 style="margin: 0 0 10px 0; color: var(--primary);"><?= htmlspecialchars($a['title']) ?></h4>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 15px;">
                <i class="fas fa-user"></i> <?= htmlspecialchars($a['author_name']) ?> &bull; <i class="fas fa-clock"></i> <?= date('M d, Y H:i', strtotime($a['created_at'])) ?>
            </div>
            <div class="content" style="line-height: 1.6; font-size: 14px; margin-bottom: 20px;">
                <?= nl2br(htmlspecialchars($a['content'])) ?>
            </div>
            
            <div class="comments-section" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                <h5 style="margin: 0 0 10px 0; font-size: 13px; color: var(--text-muted);">Comments</h5>
                <?php if(!empty($comments[$a['id']])): ?>
                    <?php foreach($comments[$a['id']] as $c): ?>
                    <div class="comment" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px;">
                        <strong><?= htmlspecialchars($c['commenter_name']) ?>:</strong> <?= htmlspecialchars($c['comment']) ?>
                        <span style="float: right; font-size: 11px; color: var(--text-muted);"><?= date('M d, H:i', strtotime($c['created_at'])) ?></span>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p style="font-size: 13px; color: var(--text-muted);">No comments yet.</p>
                <?php endif; ?>
                
                <form action="<?= BASE_URL ?>/member/developer/announcements" method="POST" style="margin-top: 10px; display: flex; gap: 10px;">
                    <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                    <input type="hidden" name="action" value="comment">
                    <input type="hidden" name="announcement_id" value="<?= $a['id'] ?>">
                    <input type="text" name="comment" class="form-control" placeholder="Write a comment..." style="flex:1; padding: 6px 10px; font-size: 13px;" required>
                    <button type="submit" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">Post</button>
                </form>
            </div>
        </div>
        <?php endforeach; ?>
        <?php if(empty($announcements)): ?>
        <p class="text-muted">No announcements posted yet.</p>
        <?php endif; ?>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
