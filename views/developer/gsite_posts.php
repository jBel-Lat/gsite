<?php require_once 'includes/header.php'; ?>

<?php if(isset($_GET['success'])): ?><div class="alert alert-success"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($_GET['success']) ?></div><?php endif; ?>

<!-- Create / Edit Post Form -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-newspaper"></i> <?= isset($editPost) ? 'Edit Post' : 'Create Public Announcement' ?></h3>
        <?php if(isset($editPost)): ?><a href="<?= BASE_URL ?>/developer/gsite_posts" class="btn btn-warning btn-sm">Cancel Edit</a><?php endif; ?>
    </div>
    <form action="<?= BASE_URL ?>/developer/gsite_posts" method="POST" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="<?= isset($editPost) ? 'update' : 'create' ?>">
        <?php if(isset($editPost)): ?><input type="hidden" name="post_id" value="<?= $editPost['id'] ?>"><?php endif; ?>
        <div class="grid-cards" style="grid-template-columns:1fr 1fr;">
            <div class="form-group">
                <label>Announcement Title</label>
                <input type="text" name="title" class="form-control" required value="<?= isset($editPost) ? htmlspecialchars($editPost['title']) : '' ?>" placeholder="Visible on student dashboard">
            </div>
            <div class="form-group">
                <label>Image (optional)</label>
                <input type="file" name="image" class="form-control" accept="image/*">
            </div>
        </div>
        <div class="form-group">
            <label>Announcement Details</label>
            <textarea name="details" class="form-control" rows="5" required placeholder="Write your announcement here…"><?= isset($editPost) ? htmlspecialchars($editPost['details']) : '' ?></textarea>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
            <button type="submit" class="btn btn-primary"><i class="fas fa-<?= isset($editPost) ? 'save' : 'bullhorn' ?>"></i> <?= isset($editPost) ? 'Update Announcement' : 'Publish to Student Page' ?></button>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; color:var(--text-muted);">
                <input type="checkbox" name="is_banner" value="1" <?= isset($editPost) && $editPost['is_banner'] ? 'checked' : '' ?>>
                Pin as Banner
            </label>
        </div>
    </form>
</div>

<!-- Announcements Table -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-list"></i> Your Public Announcements (<?= count($posts) ?>)</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Pinned</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($posts as $p): ?>
                <tr>
                    <td>
                        <?php if($p['image']): ?>
                        <img src="<?= BASE_URL ?>/uploads/posts/<?= htmlspecialchars($p['image']) ?>" style="width:60px; height:45px; object-fit:cover; border-radius:6px;">
                        <?php else: ?>
                        <div style="width:60px; height:45px; background:rgba(255,255,255,0.05); border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);"><i class="fas fa-image"></i></div>
                        <?php endif; ?>
                    </td>
                    <td><strong><?= htmlspecialchars($p['title']) ?></strong></td>
                    <td style="font-size:13px; color:var(--text-muted);"><?= date('M d, Y', strtotime($p['created_at'])) ?></td>
                    <td><?= $p['is_banner'] ? '<span class="badge badge-warning">Yes</span>' : 'No' ?></td>
                    <td style="display:flex; gap:6px;">
                        <!-- Edit feature not fully implemented in controller yet but following template -->
                        <a href="<?= BASE_URL ?>/developer/gsite_posts?edit=<?= $p['id'] ?>" class="btn btn-warning btn-sm"><i class="fas fa-edit"></i></a>
                        <form action="<?= BASE_URL ?>/developer/gsite_posts" method="POST" onsubmit="return confirm('Delete this announcement?')">
                            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="post_id" value="<?= $p['id'] ?>">
                            <button type="submit" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
