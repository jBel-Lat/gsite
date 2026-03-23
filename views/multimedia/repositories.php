<?php require_once 'includes/header.php'; ?>

<!-- Create Repository (Head Only) -->
<?php if($_SESSION['role'] === 'multimedia_head'): ?>
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-folder-plus"></i> Create Repository</h3>
    </div>
    <form action="<?= BASE_URL ?>/multimedia/repositories" method="POST" style="max-width:460px;">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="create">
        <div class="form-group">
            <label>Repository Name</label>
            <input type="text" name="name" class="form-control" placeholder="e.g. 2024 Intramurals" required>
        </div>
        <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Create</button>
    </form>
</div>
<?php endif; ?>

<!-- Upload File -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-upload"></i> Upload File</h3>
    </div>
    <?php if(!empty($repositories)): ?>
    <form action="<?= BASE_URL ?>/multimedia/repositories" method="POST" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="upload">
        <div class="grid-cards">
            <div class="form-group">
                <label>Repository</label>
                <select name="repository_id" class="form-control" required>
                    <option value="">— Select Repository —</option>
                    <?php foreach($repositories as $r): ?>
                    <option value="<?= $r['id'] ?>"><?= htmlspecialchars($r['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-group">
                <label>File</label>
                <input type="file" name="file" class="form-control" required>
            </div>
        </div>
        <button type="submit" class="btn btn-success mt-4"><i class="fas fa-cloud-upload-alt"></i> Upload to Repo</button>
    </form>
    <?php else: ?>
        <p class="text-muted">No repositories yet. <?= $_SESSION['role'] === 'multimedia_head' ? 'Create one above.' : 'Contact head to create repositories.' ?></p>
    <?php endif; ?>
</div>

<!-- Repositories List -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-folder-open"></i> Multimedia Repositories</h3>
    </div>

    <?php foreach($repositories as $repo): ?>
    <div style="border:1px solid var(--border-color); border-radius:12px; padding:20px; margin-bottom:20px; background:rgba(255,255,255,0.02);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
            <div>
                <strong style="font-size:18px; color:var(--primary);"><i class="fas fa-folder" style="color:#fbbf24; margin-right:8px;"></i><?= htmlspecialchars($repo['name']) ?></strong>
                <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Created by <?= htmlspecialchars($repo['creator_name']) ?> · <?= date('M d, Y', strtotime($repo['created_at'])) ?></div>
            </div>
            <?php if($isHead): ?>
            <form action="<?= BASE_URL ?>/multimedia/repositories" method="POST" onsubmit="return confirm('Delete repository and all files?')">
                <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                <input type="hidden" name="action" value="delete_repo">
                <input type="hidden" name="repo_id" value="<?= $repo['id'] ?>">
                <button type="submit" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i> Delete Repo</button>
            </form>
            <?php endif; ?>
        </div>

        <?php $repoFiles = array_filter($uploads, fn($u) => $u['repository_id'] == $repo['id']); ?>
        <?php if(!empty($repoFiles)): ?>
        <div class="table-responsive">
            <table class="table" style="font-size:13px;">
                <thead>
                    <tr>
                        <th>Filename</th>
                        <th>Uploader</th>
                        <th>Size</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($repoFiles as $uf): ?>
                    <tr>
                        <td>
                            <a href="<?= BASE_URL ?>/<?= htmlspecialchars($uf['filepath']) ?>" target="_blank" style="color:var(--text-primary); text-decoration:none; display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-file-alt" style="color:var(--primary);"></i>
                                <span><?= htmlspecialchars($uf['filename']) ?></span>
                            </a>
                        </td>
                        <td><?= htmlspecialchars($uf['uploader_name']) ?></td>
                        <td><?= number_format($uf['size'] / 1024, 1) ?> KB</td>
                        <td>
                            <form action="<?= BASE_URL ?>/multimedia/repositories" method="POST" style="margin:0;">
                                <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                                <input type="hidden" name="action" value="update_status">
                                <input type="hidden" name="upload_id" value="<?= $uf['id'] ?>">
                                <select name="task_status" class="form-control form-control-sm" onchange="this.form.submit()" 
                                        style="width:auto; min-width:120px; font-size:11px; padding:2px 8px; border-radius:4px;
                                               background: <?= $uf['task_status'] === 'done' ? 'rgba(74,222,128,0.2)' : ($uf['task_status'] === 'processing' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)') ?>;
                                               color: <?= $uf['task_status'] === 'done' ? '#4ade80' : ($uf['task_status'] === 'processing' ? '#fbbf24' : '#f87171') ?>;">
                                    <option value="not_complete" <?= $uf['task_status'] === 'not_complete' ? 'selected' : '' ?>>Not Complete</option>
                                    <option value="processing" <?= $uf['task_status'] === 'processing' ? 'selected' : '' ?>>Processing</option>
                                    <option value="done" <?= $uf['task_status'] === 'done' ? 'selected' : '' ?>>Done</option>
                                </select>
                            </form>
                        </td>
                        <td><?= date('M d, Y', strtotime($uf['uploaded_at'])) ?></td>
                        <td>
                            <a href="<?= BASE_URL ?>/<?= htmlspecialchars($uf['filepath']) ?>" download class="btn btn-info btn-xs" title="Download"><i class="fas fa-download"></i></a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php else: ?>
            <div style="text-align:center; padding:20px; color:var(--text-muted); font-style:italic;">No files uploaded in this repository.</div>
        <?php endif; ?>
    </div>
    <?php endforeach; ?>

    <?php if(empty($repositories)): ?>
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-folder-open" style="font-size:48px; margin-bottom:12px; display:block; opacity:0.3;"></i>
            No repositories found.
        </div>
    <?php endif; ?>
</div>

<?php require_once 'includes/footer.php'; ?>
