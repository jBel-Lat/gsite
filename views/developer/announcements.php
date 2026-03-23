<?php require_once 'includes/header.php'; ?>

<div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">
    <!-- Post Announcement (Head only) -->
    <?php if($_SESSION['role'] === 'developer_head'): ?>
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-plus-circle"></i> Post Team Announcement</h3>
        </div>
        <form action="<?= BASE_URL ?>/developer/announcements" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="create">
            <div class="form-group"><label>Title</label><input type="text" name="title" class="form-control" required></div>
            <div class="form-group"><label>Content</label><textarea name="content" class="form-control" rows="5" required></textarea></div>
            <button type="submit" class="btn btn-primary w-100"><i class="fas fa-paper-plane"></i> Publish</button>
        </form>
    </div>
    <?php else: ?>
    <div><!-- empty for members layout --></div>
    <?php endif; ?>

    <!-- Feed -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-bullhorn"></i> Developer Announcements Feed</h3>
        </div>
        <?php foreach($announcements as $a): ?>
        <div class="announcement-card" style="margin-bottom:20px; border:1px solid var(--border-color); border-radius:12px; padding:20px; background:rgba(255,255,255,0.02);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 style="margin:0 0 6px; color:var(--primary);"><?= htmlspecialchars($a['title']) ?></h4>
                    <div style="font-size:12px; color:var(--text-muted);">
                        By <?= htmlspecialchars($a['author_name']) ?> &bull; <?= date('M d, Y H:i', strtotime($a['created_at'])) ?>
                    </div>
                </div>
            </div>
            <div style="font-size:14px; line-height:1.7; margin-top:12px; color:var(--text-primary);">
                <?= nl2br(htmlspecialchars($a['content'])) ?>
            </div>

            <!-- Comments Section -->
            <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:12px;">
                <h5 style="font-size:13px; color:var(--text-muted); margin-bottom:10px;"><i class="fas fa-comments"></i> Discussion</h5>
                <?php foreach($comments[$a['id']] ?? [] as $c): ?>
                <div style="background:rgba(0,0,0,0.2); border-radius:8px; padding:10px; margin-bottom:8px; font-size:13px; position:relative;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong><?= htmlspecialchars($c['commenter_name']) ?>:</strong>
                        <?php if($c['author_id'] == $_SESSION['user_id']): ?>
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-warning btn-xs" style="padding:1px 5px;" onclick="editDevComment(<?= $c['id'] ?>, '<?= addslashes(htmlspecialchars($c['comment'])) ?>')"><i class="fas fa-edit"></i></button>
                            <form action="<?= BASE_URL ?>/developer/announcements" method="POST" style="display:inline;">
                                <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                                <input type="hidden" name="action" value="delete_comment">
                                <input type="hidden" name="comment_id" value="<?= $c['id'] ?>">
                                <button type="submit" class="btn btn-danger btn-xs" style="padding:1px 5px;"><i class="fas fa-times"></i></button>
                            </form>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div style="margin-top:4px; color:var(--text-muted);"><?= nl2br(htmlspecialchars($c['comment'])) ?></div>
                    <span style="font-size:10px; color:var(--text-muted); display:block; margin-top:4px;"><?= date('M d H:i', strtotime($c['created_at'])) ?></span>
                </div>
                <?php endforeach; ?>
                
                <form action="<?= BASE_URL ?>/developer/announcements" method="POST" style="display:flex; gap:8px; margin-top:10px;">
                    <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                    <input type="hidden" name="action" value="comment">
                    <input type="hidden" name="announcement_id" value="<?= $a['id'] ?>">
                    <input type="text" name="comment" class="form-control" placeholder="Add a comment…" required>
                    <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
        <?php endforeach; ?>
        <?php if(empty($announcements)): ?><p class="text-muted text-center">No announcements yet.</p><?php endif; ?>
    </div>
</div>

<!-- Edit Comment Modal -->
<div id="editCommentModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center;">
    <div style="background:var(--bg-card); border-radius:16px; padding:28px; width:100%; max-width:460px; border:1px solid var(--border-color);">
        <h3 style="margin-bottom:16px; font-size:16px;"><i class="fas fa-edit"></i> Edit Comment</h3>
        <form action="<?= BASE_URL ?>/developer/announcements" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="update_comment">
            <input type="hidden" name="comment_id" id="editCommentId">
            <div class="form-group"><textarea name="comment" id="editCommentText" class="form-control" rows="3" required></textarea></div>
            <div style="display:flex; gap:10px; margin-top:12px;">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save</button>
                <button type="button" class="btn btn-warning" onclick="closeCommModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<script>
function editDevComment(id, text) {
    document.getElementById('editCommentId').value = id;
    document.getElementById('editCommentText').value = text;
    document.getElementById('editCommentModal').style.display = 'flex';
}
function closeCommModal() { document.getElementById('editCommentModal').style.display = 'none'; }
</script>

<?php require_once 'includes/footer.php'; ?>
