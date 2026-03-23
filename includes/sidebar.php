<?php
// includes/sidebar.php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
$role = $_SESSION['role'] ?? '';
$team = $_SESSION['team'] ?? '';
$base = BASE_URL;
?>
<nav id="sidebar" class="sidebar">
    <div class="sidebar-header"><i class="fas fa-network-wired"></i> OMS</div>
    <div class="sidebar-nav">
        <ul>

        <?php if ($role === 'superadmin'): ?>
            <li class="nav-heading">Super Admin</li>
            <li><a href="<?= $base ?>/superadmin/dashboard"><i class="fas fa-tachometer-alt"></i><span>Dashboard</span></a></li>
            <li><a href="<?= $base ?>/superadmin/users"><i class="fas fa-users-cog"></i><span>All Users</span></a></li>
            <li><a href="<?= $base ?>/superadmin/teams"><i class="fas fa-layer-group"></i><span>Teams</span></a></li>

        <?php elseif ($team === 'multimedia'): ?>
            <li class="nav-heading">Multimedia<?= $role === 'multimedia_head' ? ' (Head)' : '' ?></li>
            <li><a href="<?= $base ?>/multimedia/dashboard"><i class="fas fa-photo-video"></i><span>Dashboard</span></a></li>
            <?php if ($role === 'multimedia_head'): ?>
            <li><a href="<?= $base ?>/multimedia/members"><i class="fas fa-users"></i><span>Members</span></a></li>
            <?php endif; ?>
            <li><a href="<?= $base ?>/multimedia/repositories"><i class="fas fa-folder-open"></i><span>Repositories</span></a></li>

        <?php elseif ($team === 'developer'): ?>
            <li class="nav-heading">Developer<?= $role === 'developer_head' ? ' (Head)' : '' ?></li>
            <li><a href="<?= $base ?>/developer/dashboard"><i class="fas fa-code"></i><span>Dashboard</span></a></li>
            <?php if ($role === 'developer_head'): ?>
            <li><a href="<?= $base ?>/developer/members"><i class="fas fa-users"></i><span>Members</span></a></li>
            <?php endif; ?>
            <li><a href="<?= $base ?>/developer/gsite_posts"><i class="fas fa-globe"></i><span>GSITE Post</span></a></li>
            <li><a href="<?= $base ?>/developer/editor"><i class="fas fa-file-code"></i><span>IDE Editor</span></a></li>
        <?php endif; ?>

        </ul>

        <!-- ACCOUNT Section -->
        <ul style="margin-top: auto;">
            <li class="nav-heading">Account</li>
            <li><a href="<?= $base ?>/profile"><i class="fas fa-user-circle"></i><span>My Profile</span></a></li>
            <li><a href="<?= $base ?>/logout" style="color: var(--danger);"><i class="fas fa-sign-out-alt"></i><span>Logout</span></a></li>
        </ul>
    </div>
</nav>
