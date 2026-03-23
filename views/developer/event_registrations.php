<?php require_once 'includes/header.php'; ?>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-users"></i> Registrations for: <?= $selectedEvent ? htmlspecialchars($selectedEvent['title']) : 'Select an Event' ?></h3>
        <a href="<?= BASE_URL ?>/developer/gsite_events" class="btn btn-warning btn-sm">Back to Events</a>
    </div>

    <?php if($selectedEvent): ?>
    <div style="margin-bottom:20px; padding:15px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <div>
            <span class="badge badge-info">Total: <?= count($registrations) ?></span>
            <?php if($selectedEvent['participant_limit']): ?>
            <span class="badge badge-warning">Limit: <?= $selectedEvent['participant_limit'] ?></span>
            <?php endif; ?>
        </div>
        <button class="btn btn-success btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Export to PDF/Print</button>
    </div>

    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Student ID</th>
                    <th>Year/Section</th>
                    <th>Date Registered</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($registrations as $i => $r): ?>
                <tr>
                    <td><?= $i + 1 ?></td>
                    <td><strong><?= htmlspecialchars($r['full_name']) ?></strong></td>
                    <td><?= htmlspecialchars($r['email']) ?></td>
                    <td><?= htmlspecialchars($r['contact_number'] ?? 'N/A') ?></td>
                    <td><span class="badge badge-primary"><?= htmlspecialchars($r['student_id'] ?? 'N/A') ?></span></td>
                    <td><?= htmlspecialchars($r['year_section'] ?? 'N/A') ?></td>
                    <td style="font-size:12px; color:var(--text-muted);"><?= date('M d, Y H:i', strtotime($r['registered_at'])) ?></td>
                    <td>
                        <form action="<?= BASE_URL ?>/developer/event_registrations" method="POST" onsubmit="return confirm('Remove registration?')">
                            <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="reg_id" value="<?= $r['id'] ?>">
                            <input type="hidden" name="event_id" value="<?= $selectedEvent['id'] ?>">
                            <button type="submit" class="btn btn-danger btn-sm"><i class="fas fa-trash-alt"></i> Delete</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if(empty($registrations)): ?>
                <tr><td colspan="8" class="text-muted text-center" style="padding:40px;">No students registered for this event yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php else: ?>
    <div style="text-align:center; padding:60px; color:var(--text-muted);">
        <i class="fas fa-mouse-pointer" style="font-size:48px; margin-bottom:15px; display:block; opacity:0.3;"></i>
        Please select an event from the events page to view its registrations.
    </div>
    <?php endif; ?>
</div>

<?php require_once 'includes/footer.php'; ?>
