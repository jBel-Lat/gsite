<?php require_once 'includes/header.php'; ?>

<div class="grid-cards" style="grid-template-columns: 1fr 2fr;">
    
    <!-- Upload Form -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-upload"></i> Upload File</h3>
        </div>
        <form action="<?= BASE_URL ?>/member/multimedia/repositories" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
            <input type="hidden" name="action" value="upload">
            
            <div class="form-group">
                <label>Select Repository</label>
                <select name="repository_id" class="form-control" required>
                    <option value="">-- Choose Repository --</option>
                    <?php foreach($repositories as $rep): ?>
                    <option value="<?= $rep['id'] ?>"><?= htmlspecialchars($rep['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label>File to Upload</label>
                <!-- Limit typical multimedia files -->
                <input type="file" name="file" class="form-control" accept="image/*,video/*,.psd,.ai,.zip,.pdf" required>
                <small class="text-muted" style="display:block; margin-top:5px;">Allowed: Images, Videos, PSD, AI, ZIP. Max size configured in php.ini</small>
            </div>
            
            <button type="submit" class="btn btn-primary mt-4 w-100"><i class="fas fa-cloud-upload-alt"></i> Upload Now</button>
        </form>
    </div>

    <!-- Recent Uploads Table -->
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title">Recent Team Uploads</h3>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Filename</th>
                        <th>Repository</th>
                        <th>Uploader</th>
                        <th>Size</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($recent_uploads as $up): ?>
                    <tr>
                        <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            <?= htmlspecialchars($up['filename']) ?>
                        </td>
                        <td><span class="badge badge-warning"><?= htmlspecialchars($up['repo_name']) ?></span></td>
                        <td><?= htmlspecialchars($up['uploader_name']) ?></td>
                        <td><?= round($up['size'] / 1024 / 1024, 2) ?> MB</td>
                        <td>
                            <a href="<?= BASE_URL ?>/<?= htmlspecialchars($up['filepath']) ?>" target="_blank" class="btn btn-success" style="padding: 4px 8px; font-size: 11px;">View</a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if(empty($recent_uploads)): ?>
                    <tr><td colspan="5" class="text-muted">No files uploaded yet. Be the first!</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
