const express = require('express');
const path = require('path');

const router = express.Router();
const pagesDir = path.join(process.cwd(), 'public', 'pages');

const sendPage = (pageFile) => {
  return (_req, res) => {
    res.sendFile(path.join(pagesDir, pageFile));
  };
};

router.get(['/', '/student', '/student/dashboard'], (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

router.get('/admin/login', sendPage('admin-login.html'));
router.get('/superadmin/login', sendPage('superadmin-login.html'));

router.get('/superadmin/dashboard', sendPage('superadmin-dashboard.html'));
router.get('/superadmin/users', sendPage('superadmin-users.html'));
router.get('/superadmin/teams', sendPage('superadmin-teams.html'));

router.get('/developer/dashboard', sendPage('developer-dashboard.html'));
router.get('/developer/announcements', sendPage('developer-announcements.html'));
router.get('/developer/members', sendPage('developer-members.html'));
router.get('/developer/gsite_posts', sendPage('developer-gsite-posts.html'));
router.get('/developer/gsite_events', sendPage('developer-gsite-events.html'));
router.get('/developer/event_registrations', sendPage('developer-event-registrations.html'));
router.get('/developer/projects', sendPage('developer-projects.html'));
router.get('/developer/editor', sendPage('developer-editor.html'));

router.get('/multimedia/dashboard', sendPage('multimedia-dashboard.html'));
router.get('/multimedia/announcements', sendPage('multimedia-announcements.html'));
router.get('/multimedia/members', sendPage('multimedia-members.html'));
router.get('/multimedia/gsite_posts', sendPage('multimedia-gsite-posts.html'));
router.get('/multimedia/repositories', sendPage('multimedia-repositories.html'));

router.get('/profile', sendPage('profile.html'));
router.get('/logout', (_req, res) => res.redirect('/admin/login'));

router.get('/officer/developer/:page?', (_req, res) => res.redirect('/developer/dashboard'));
router.get('/officer/multimedia/:page?', (_req, res) => res.redirect('/multimedia/dashboard'));
router.get('/member/developer/:page?', (_req, res) => res.redirect('/developer/dashboard'));
router.get('/member/multimedia/:page?', (_req, res) => res.redirect('/multimedia/dashboard'));

module.exports = router;
