<?php require_once 'includes/header.php'; ?>

<?php if(isset($_GET['success'])): ?><div class="alert alert-success"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($_GET['success']) ?></div><?php endif; ?>
<?php if(isset($_GET['error'])): ?><div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($_GET['error']) ?></div><?php endif; ?>

<!-- Only Head can post -->
<?php if($_SESSION['role'] === 'multimedia_head'): ?>
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-plus-circle"></i> Post Team Announcement</h3>
    </div>
    <form action="<?= BASE_URL ?>/multimedia/announcements" method="POST">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="create">
        <div class="form-group"><label>Title</label><input type="text" name="title" class="form-control" required placeholder="Announcement title"></div>
        <div class="form-group"><label>Content</label><textarea name="content" class="form-control" rows="5" required placeholder="Write the announcement details…"></textarea></div>
        <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Publish Announcement</button>
    </form>
</div>
<?php endif; ?>

<!-- Announcements Feed -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-bullhorn"></i> Multimedia Team Announcements (<?= count($announcements) ?>)</h3>
    </div>

    <?php foreach($announcements as $a): ?>
    <div class="announcement-card" id="announcement-<?= $a['id'] ?>">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px;">
            <div style="flex:1;">
                <h4 style="margin:0 0 6px; color:var(--primary); font-size:16px;"><?= htmlspecialchars($a['title']) ?></h4>
                <div style="font-size:12px; color:var(--text-muted);">
                    <i class="fas fa-user"></i> <?= htmlspecialchars($a['author_name']) ?>
                    &bull; <i class="fas fa-clock"></i> <?= date('M d, Y H:i', strtotime($a['created_at'])) ?>
                    <?php if($a['updated_at'] !== $a['created_at']): ?>
                    &bull; <em style="color:var(--text-muted); font-size:11px;">(edited)</em>
                    <?php endif; ?>
                </div>
            </div>
            <?php if($_SESSION['role'] === 'multimedia_head'): ?>
            <div style="display:flex; gap:8px; flex-shrink:0; margin-left:12px;">
                <button class="btn btn-warning btn-sm" onclick="editAnnouncement(<?= $a['id'] ?>, '<?= addslashes(htmlspecialchars($a['title'])) ?>', '<?= addslashes(htmlspecialchars($a['content'])) ?>')">
                    <i class="fas fa-edit"></i>
                </button>
                <form action="<?= BASE_URL ?>/multimedia/announcements" method="POST" onsubmit="return confirm('Delete this announcement?')">
                    <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="<?= $a['id'] ?>">
                    <button type="submit" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                </form>
            </div>
            <?php endif; ?>
        </div>

        <div style="font-size:14px; line-height:1.7; color:var(--text-primary); margin-bottom:16px; padding: 12px; background: rgba(0,0,0,0.15); border-radius:8px;">
            <?= nl2br(htmlspecialchars($a['content'])) ?>
        </div>

        <!-- Comments Section -->
        <div style="border-top:1px solid var(--border-color); padding-top:14px;">
            <h5 style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">
                <i class="fas fa-comments"></i> Comments (<?= count($comments[$a['id']] ?? []) ?>)
            </h5>
            <?php foreach($comments[$a['id']] ?? [] as $c): ?>
            <div style="display:flex; gap:10px; margin-bottom:12px; align-items:flex-start;">
                <div style="width:32px; height:32px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:13px; font-weight:600;">
                    <?= strtoupper(substr($c['commenter_name'], 0, 1)) ?>
                </div>
                <div style="flex:1; background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <strong style="font-size:13px; color:var(--text-primary);"><?= htmlspecialchars($c['commenter_name']) ?></strong>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <span style="font-size:11px; color:var(--text-muted);"><?= date('M d H:i', strtotime($c['created_at'])) ?></span>
                            <?php if($c['author_id'] == $_SESSION['user_id']): ?>
                                <button class="btn btn-warning btn-sm" style="padding:2px 8px;" onclick="editComment(<?= $c['id'] ?>, '<?= addslashes(htmlspecialchars($c['comment'])) ?>')"><i class="fas fa-edit"></i></button>
                                <form action="<?= BASE_URL ?>/multimedia/announcements" method="POST" style="display:inline;">
                                    <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                                    <input type="hidden" name="action" value="delete_comment">
                                    <input type="hidden" name="comment_id" value="<?= $c['id'] ?>">
                                    <button type="submit" class="btn btn-danger btn-sm" style="padding:2px 8px;"><i class="fas fa-times"></i></button>
                                </form>
                            <?php endif; ?>
                        </div>
                    </div>
                    <div style="font-size:13px; color:var(--text-muted);"><?= nl2br(htmlspecialchars($c['comment'])) ?></div>
                </div>
            </div>
            <?php endforeach; ?>

            <!-- Add Comment -->
            <form action="<?= BASE_URL ?>/multimedia/announcements" method="POST" style="display:flex; gap:8px; margin-top:10px;">
                <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                <input type="hidden" name="action" value="comment">
                <input type="hidden" name="announcement_id" value="<?= $a['id'] ?>">
                <input type="text" name="comment" class="form-control" placeholder="Add a comment…" required>
                <button type="submit" class="btn btn-primary btn-sm" style="white-space:nowrap;">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    </div>
    <?php endforeach; ?>

    <?php if(empty($announcements)): ?>
    <div style="text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fas fa-bell-slash" style="font-size:40px; margin-bottom:12px; display:block;"></i>
        No team announcements yet.
        <?php if($_SESSION['role'] === 'multimedia_head'): ?> Post one above!<?php endif; ?>
    </div>
    <?php endif; ?>
</div>

<!-- Edit Announcement Modal -->
<div id="editModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center;">
    <div style="background:var(--bg-card); border-radius:16px; padding:30px; width:100%; max-width:580px; border:1px solid var(--border-color); max-height:90vh; overflow-y:auto;">
        <h3 style="margin-bottom:20px;"><i class="fas fa-edit"></i> Edit Announcement</h3>
        <form action="<?= BASE_URL ?>/multimedia/announcements" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="update">
            <input type="hidden" name="id" id="editId">
            <div class="form-group"><label>Title</label><input type="text" name="title" id="editTitle" class="form-control" required></div>
            <div class="form-group"><label>Content</label><textarea name="content" id="editContent" class="form-control" rows="6" required></textarea></div>
            <div style="display:flex; gap:10px; margin-top:16px;">
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update</button>
                <button type="button" class="btn btn-warning" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- Edit Comment Modal -->
<div id="editCommentModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center;">
    <div style="background:var(--bg-card); border-radius:16px; padding:28px; width:100%; max-width:460px; border:1px solid var(--border-color);">
        <h3 style="margin-bottom:16px; font-size:16px;"><i class="fas fa-edit"></i> Edit Comment</h3>
        <form action="<?= BASE_URL ?>/multimedia/announcements" method="POST">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="update_comment">
            <input type="hidden" name="comment_id" id="editCommentId">
            <div class="form-group"><textarea name="comment" id="editCommentText" class="form-control" rows="3" required></textarea></div>
            <div style="display:flex; gap:10px;">
                <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-save"></i> Save</button>
                <button type="button" class="btn btn-warning btn-sm" onclick="closeCommentModal()">Cancel</button>
            </div>
        </form>
    </div>
</div>

<script>
function editAnnouncement(id, title, content) {
    document.getElementById('editId').value = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editContent').value = content;
    document.getElementById('editModal').style.display = 'flex';
}
function closeModal() { document.getElementById('editModal').style.display = 'none'; }

function editComment(id, text) {
    document.getElementById('editCommentId').value = id;
    document.getElementById('editCommentText').value = text;
    document.getElementById('editCommentModal').style.display = 'flex';
}
function closeCommentModal() { document.getElementById('editCommentModal').style.display = 'none'; }
</script>

<?php require_once 'includes/footer.php'; ?>
