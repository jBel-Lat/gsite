<?php require_once 'includes/header.php'; ?>

<div class="grid-cards">
    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-photo-video" style="color:var(--success);margin-right:8px;"></i> Multimedia Team</h3>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Sub-Group</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($multimedia_users as $mu): ?>
                    <tr>
                        <td><?= htmlspecialchars($mu['name']) ?></td>
                        <td><span class="badge badge-primary"><?= htmlspecialchars(ucwords(str_replace('_', ' ', $mu['role']))) ?></span></td>
                        <td><?= $mu['group_name'] ? htmlspecialchars($mu['group_name']) : '<span class="text-muted">None</span>' ?></td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if(empty($multimedia_users)): ?>
                    <tr><td colspan="3" class="text-muted">No members found.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <h3 class="panel-title"><i class="fas fa-code" style="color:var(--warning);margin-right:8px;"></i> Developer Team</h3>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($developer_users as $du): ?>
                    <tr>
                        <td><?= htmlspecialchars($du['name']) ?></td>
                        <td><span class="badge badge-primary"><?= htmlspecialchars(ucwords(str_replace('_', ' ', $du['role']))) ?></span></td>
                        <td><?= htmlspecialchars($du['email']) ?></td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if(empty($developer_users)): ?>
                    <tr><td colspan="3" class="text-muted">No members found.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
