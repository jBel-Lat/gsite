<?php require_once 'includes/header.php'; ?>

<?php if(isset($_GET['success'])): ?><div class="alert alert-success"><i class="fas fa-check-circle"></i> <?= htmlspecialchars($_GET['success']) ?></div><?php endif; ?>

<!-- Create / Edit Event Form -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-calendar-plus"></i> <?= isset($editEvent) ? 'Edit Event' : 'Create Student Event' ?></h3>
    </div>
    <form action="<?= BASE_URL ?>/developer/gsite_events" method="POST" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        <input type="hidden" name="action" value="<?= isset($editEvent) ? 'update' : 'create' ?>">
        <?php if(isset($editEvent)): ?><input type="hidden" name="event_id" value="<?= $editEvent['id'] ?>"><?php endif; ?>
        
        <div class="grid-cards" style="grid-template-columns: 2fr 1fr;">
            <div class="form-group">
                <label>Event Title</label>
                <input type="text" name="title" class="form-control" required value="<?= isset($editEvent) ? htmlspecialchars($editEvent['title']) : '' ?>" placeholder="e.g. Hackathon 2024">
            </div>
            <div class="form-group">
                <label>Participant Limit</label>
                <input type="number" name="participant_limit" class="form-control" value="<?= isset($editEvent) ? $editEvent['participant_limit'] : '' ?>" placeholder="Leave blank for unlimited">
            </div>
        </div>

        <div class="grid-cards">
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" name="start_date" class="form-control" required value="<?= isset($editEvent) ? $editEvent['start_date'] : '' ?>">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" name="end_date" class="form-control" required value="<?= isset($editEvent) ? $editEvent['end_date'] : '' ?>">
            </div>
            <div class="form-group">
                <label>Event Image</label>
                <input type="file" name="image" class="form-control" accept="image/*">
            </div>
        </div>

        <div class="form-group">
            <label>Description & Registration Info</label>
            <textarea name="description" class="form-control" rows="5" required placeholder="Event details and what students need to provide…"><?= isset($editEvent) ? htmlspecialchars($editEvent['description']) : '' ?></textarea>
        </div>

        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> <?= isset($editEvent) ? 'Update Event' : 'Publish Event' ?></button>
    </form>
</div>

<!-- Events Table -->
<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-calendar-alt"></i> Managed Events (<?= count($events) ?>)</h3>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Event Title</th>
                    <th>Participants</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($events as $e): ?>
                <tr>
                    <td>
                        <?php if($e['image']): ?>
                        <img src="<?= BASE_URL ?>/uploads/events/<?= htmlspecialchars($e['image']) ?>" style="width:60px; height:45px; object-fit:cover; border-radius:6px;">
                        <?php else: ?>
                        <div style="width:60px; height:45px; background:rgba(255,255,255,0.05); border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:20px;"><i class="fas fa-calendar"></i></div>
                        <?php endif; ?>
                    </td>
                    <td>
                        <strong><?= htmlspecialchars($e['title']) ?></strong>
                        <div style="font-size:11px; color:var(--text-muted);"><?= (int)$e['participant_limit'] ?: 'Unlimited' ?> spots available</div>
                    </td>
                    <td>
                        <a href="<?= BASE_URL ?>/developer/event_registrations?event_id=<?= $e['id'] ?>" class="badge badge-info" style="text-decoration:none;">
                            <i class="fas fa-users"></i> <?= (int)$e['reg_count'] ?> Registered
                        </a>
                    </td>
                    <td style="font-size:12px; color:var(--text-muted);">
                        <?= date('M d', strtotime($e['start_date'])) ?> - <?= date('M d, Y', strtotime($e['end_date'])) ?>
                    </td>
                    <td>
                        <?php 
                            $today = date('Y-m-d');
                            if($e['is_closed'] || ($e['participant_limit'] && $e['reg_count'] >= $e['participant_limit'])) echo '<span class="badge badge-danger">Closed</span>';
                            elseif($today > $e['end_date']) echo '<span class="badge badge-warning">Ended</span>';
                            else echo '<span class="badge badge-success">Active</span>';
                        ?>
                    </td>
                    <td style="display:flex; gap:6px;">
                        <a href="<?= BASE_URL ?>/developer/gsite_events?edit=<?= $e['id'] ?>" class="btn btn-warning btn-sm"><i class="fas fa-edit"></i></a>
                        <form action="<?= BASE_URL ?>/developer/gsite_events" method="POST" onsubmit="return confirm('Delete this event?')">
                            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="event_id" value="<?= $e['id'] ?>">
                            <button type="submit" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($events)): ?>
                <tr><td colspan="6" class="text-muted text-center" style="padding:30px;">No events created yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
