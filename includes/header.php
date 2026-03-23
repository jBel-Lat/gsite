<?php
// includes/header.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$currentUser = Auth::user();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($pageTitle) ? htmlspecialchars($pageTitle) : 'Organization System' ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard-wrapper">
        <?php if($currentUser): ?>
            <?php require_once 'includes/sidebar.php'; ?>
        <?php endif; ?>
        
        <div class="main-content <?= !$currentUser ? 'full-width' : '' ?>">
            <?php if($currentUser): ?>
            <header class="top-header">
                <div class="header-left">
                    <button id="sidebar-toggle" class="btn-icon"><i class="fas fa-bars"></i></button>
                    <h2 class="page-title"><?= isset($pageTitle) ? htmlspecialchars($pageTitle) : 'Dashboard' ?></h2>
                </div>
                <div class="header-right">
                    <div class="user-profile-menu">
                        <!-- Profile Pic will go here later -->
                        <span class="username"><?= htmlspecialchars($currentUser['username']) ?></span>
                        <a href="<?= BASE_URL ?>/logout" class="btn-logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            </header>
            <?php endif; ?>
            <main class="content-area">
