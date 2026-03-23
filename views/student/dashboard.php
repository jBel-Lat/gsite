<?php require_once 'includes/header.php'; ?>

<style>
    :root {
        --student-primary: #3b82f6;
        --student-bg: #0f172a;
        --student-card: rgba(30, 41, 59, 0.7);
    }

    .main-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    @media (max-width: 992px) { .main-layout { grid-template-columns: 1fr; } }

    .announcement-section { display: flex; flex-direction: column; gap: 20px; }
    .section-title { font-size: 24px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid var(--student-primary); padding-bottom: 10px; }

    .post-card {
        background: var(--student-card);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 20px;
        transition: all 0.3s ease;
        overflow: hidden;
    }
    .post-card:hover { transform: translateY(-5px); border-color: var(--student-primary); }
    
    .post-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 12px; color: var(--text-muted); }

    .comment-list { margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; }
    .comment-item { background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 10px; margin-bottom: 8px; font-size: 12px; }

    .modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); z-index:1000; align-items:center; justify-content:center; }
    
    .author-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255,255,255,0.1);
    }
    .post-image {
        width: 100%;
        border-radius: 12px;
        margin-top: 15px;
        border: 1px solid rgba(255,255,255,0.05);
    }
</style>

<div class="main-layout">
    <!-- LEFT: Multimedia Announcements -->
    <div class="announcement-section">
        <h2 class="section-title"><i class="fas fa-photo-video" style="color:#f59e0b;"></i> Multimedia Team Announcements</h2>
        
        <?php foreach($multimedia_posts as $p): ?>
        <div class="post-card">
            <div class="post-meta">
                <?php 
                    $authorPic = ($p['author_image'] && $p['author_image'] !== 'default.png') ? BASE_URL . '/' . $p['author_image'] : 'https://ui-avatars.com/api/?name=' . urlencode($p['author_name']) . '&background=f59e0b&color=fff';
                ?>
                <img src="<?= $authorPic ?>" class="author-avatar" alt="Author">
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <span style="color:#f59e0b; font-weight:700; font-size:11px;">MULTIMEDIA TEAM</span>
                    <span style="font-size:10px; opacity:0.7;"><?= date('M d, Y', strtotime($p['created_at'])) ?></span>
                </div>
            </div>
            <h3 style="font-size:18px; margin-bottom:10px;"><?= htmlspecialchars($p['title']) ?></h3>
            
            <?php if($p['image']): ?>
            <img src="<?= BASE_URL ?>/uploads/posts/<?= htmlspecialchars($p['image']) ?>" class="post-image" alt="Post">
            <?php endif; ?>

            <div style="font-size:14px; line-height:1.5; color:rgba(255,255,255,0.8); margin-top:10px;">
                <?= nl2br(htmlspecialchars($p['details'])) ?>
            </div>

            <!-- Comments -->
            <div class="comment-list">
                <?php foreach($comments[$p['id']] ?? [] as $c): ?>
                <div class="comment-item">
                    <strong style="color:var(--student-primary);"><?= htmlspecialchars($c['author_name']) ?></strong>
                    <div style="margin-top:2px; opacity:0.9;"><?= nl2br(htmlspecialchars($c['comment'])) ?></div>
                </div>
                <?php endforeach; ?>

                <form action="<?= BASE_URL ?>/student" method="POST" style="display:flex; gap:8px; margin-top:10px;">
                    <input type="hidden" name="action" value="post_comment">
                    <input type="hidden" name="post_id" value="<?= $p['id'] ?>">
                    <input type="text" name="name" class="form-control form-control-sm" placeholder="Your Name" style="width:100px;" required>
                    <input type="text" name="comment" class="form-control form-control-sm" placeholder="Add comment…" required>
                    <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
        <?php endforeach; ?>
        <?php if(empty($multimedia_posts)): ?><p class="text-muted">No announcements from Multimedia Team.</p><?php endif; ?>
    </div>

    <!-- RIGHT: Developer Announcements -->
    <div class="announcement-section">
        <h2 class="section-title"><i class="fas fa-code" style="color:#3b82f6;"></i> Developer Team Announcements</h2>
        
        <?php foreach($developer_posts as $p): ?>
        <div class="post-card">
            <div class="post-meta">
                <?php 
                    $authorPic = ($p['author_image'] && $p['author_image'] !== 'default.png') ? BASE_URL . '/' . $p['author_image'] : 'https://ui-avatars.com/api/?name=' . urlencode($p['author_name']) . '&background=3b82f6&color=fff';
                ?>
                <img src="<?= $authorPic ?>" class="author-avatar" alt="Author">
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <span style="color:#3b82f6; font-weight:700; font-size:11px;">DEVELOPER TEAM</span>
                    <span style="font-size:10px; opacity:0.7;"><?= date('M d, Y', strtotime($p['created_at'])) ?></span>
                </div>
            </div>
            <h3 style="font-size:18px; margin-bottom:10px;"><?= htmlspecialchars($p['title']) ?></h3>
            
            <?php if($p['image']): ?>
            <img src="<?= BASE_URL ?>/uploads/posts/<?= htmlspecialchars($p['image']) ?>" class="post-image" alt="Post">
            <?php endif; ?>

            <div style="font-size:14px; line-height:1.5; color:rgba(255,255,255,0.8); margin-top:10px;">
                <?= nl2br(htmlspecialchars($p['details'])) ?>
            </div>

            <!-- Comments -->
            <div class="comment-list">
                <?php foreach($comments[$p['id']] ?? [] as $c): ?>
                <div class="comment-item">
                    <strong style="color:var(--student-primary);"><?= htmlspecialchars($c['author_name']) ?></strong>
                    <div style="margin-top:2px; opacity:0.9;"><?= nl2br(htmlspecialchars($c['comment'])) ?></div>
                </div>
                <?php endforeach; ?>

                <form action="<?= BASE_URL ?>/student" method="POST" style="display:flex; gap:8px; margin-top:10px;">
                    <input type="hidden" name="action" value="post_comment">
                    <input type="hidden" name="post_id" value="<?= $p['id'] ?>">
                    <input type="text" name="name" class="form-control form-control-sm" placeholder="Your Name" style="width:100px;" required>
                    <input type="text" name="comment" class="form-control form-control-sm" placeholder="Add comment…" required>
                    <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
        <?php endforeach; ?>
        <?php if(empty($developer_posts)): ?><p class="text-muted">No announcements from Developer Team.</p><?php endif; ?>
    </div>
</div>

<!-- Events Section (Below) -->
<div style="margin-top:50px;">
    <h2 class="section-title"><i class="fas fa-calendar-day"></i> Upcoming Events</h2>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
        <?php foreach($events as $e): ?>
        <div class="post-card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
                <h4 style="margin-bottom:10px;"><?= htmlspecialchars($e['title']) ?></h4>
                <p style="font-size:13px; color:var(--text-muted);"><?= date('M d', strtotime($e['start_date'])) ?> - <?= date('M d, Y', strtotime($e['end_date'])) ?></p>
            </div>
            <button class="btn btn-primary btn-sm w-100" onclick="openRegModal(<?= $e['id'] ?>, '<?= addslashes($e['title']) ?>')">Register Now</button>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<div id="regModal" class="modal-overlay">
    <div class="panel" style="width:100%; max-width:440px;">
        <div class="panel-header">
            <h3 class="panel-title">Register for <span id="eventTitleModal"></span></h3>
            <button onclick="closeRegModal()" style="background:none; border:none; color:var(--text-muted);"><i class="fas fa-times"></i></button>
        </div>
        <form action="<?= BASE_URL ?>/student" method="POST">
            <input type="hidden" name="action" value="register_event">
            <input type="hidden" name="event_id" id="regEventId">
            <div class="form-group"><label>Full Name</label><input type="text" name="full_name" class="form-control" required></div>
            <div class="form-group"><label>Email</label><input type="email" name="email" class="form-control" required></div>
            <div class="form-group"><label>Contact</label><input type="text" name="contact_number" class="form-control" required></div>
            <div class="grid-cards">
                <div class="form-group"><label>ID Number</label><input type="text" name="student_id" class="form-control" required></div>
                <div class="form-group"><label>Year/Section</label><input type="text" name="year_section" class="form-control" required></div>
            </div>
            <button type="submit" class="btn btn-primary w-100 mt-2">Submit</button>
        </form>
    </div>
</div>

<script>
function openRegModal(id, title) {
    document.getElementById('regEventId').value = id;
    document.getElementById('eventTitleModal').innerText = title;
    document.getElementById('regModal').style.display = 'flex';
}
function closeRegModal() { document.getElementById('regModal').style.display = 'none'; }
</script>

<?php require_once 'includes/footer.php'; ?>
