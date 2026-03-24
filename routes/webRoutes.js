const express = require('express');
const path = require('path');

const router = express.Router();
const pagesDir = path.join(process.cwd(), 'public', 'pages');

const sendPage = (pageFile) => {
  return (_req, res) => {
    res.sendFile(path.join(pagesDir, pageFile));
  };
};

const pageRoute = (routePath, pageFile) => {
  router.get(routePath, sendPage(pageFile));
  router.get(`${routePath}.html`, sendPage(pageFile));
};

router.get(['/', '/student', '/student/dashboard'], (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});
router.get('/student/dashboard.html', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

pageRoute('/admin/login', 'admin-login.html');
pageRoute('/superadmin/login', 'superadmin-login.html');

pageRoute('/superadmin/dashboard', 'superadmin-dashboard.html');
pageRoute('/superadmin/users', 'superadmin-users.html');
pageRoute('/superadmin/teams', 'superadmin-teams.html');

pageRoute('/developer/dashboard', 'developer-dashboard.html');
pageRoute('/developer/announcements', 'developer-announcements.html');
pageRoute('/developer/members', 'developer-members.html');
pageRoute('/developer/gsite_posts', 'developer-gsite-posts.html');
pageRoute('/developer/gsite_events', 'developer-gsite-events.html');
pageRoute('/developer/event_registrations', 'developer-event-registrations.html');
pageRoute('/developer/projects', 'developer-projects.html');
pageRoute('/developer/editor', 'developer-editor.html');

pageRoute('/multimedia/dashboard', 'multimedia-dashboard.html');
pageRoute('/multimedia/announcements', 'multimedia-announcements.html');
pageRoute('/multimedia/members', 'multimedia-members.html');
pageRoute('/multimedia/gsite_posts', 'multimedia-gsite-posts.html');
pageRoute('/multimedia/repositories', 'multimedia-repositories.html');

pageRoute('/profile', 'profile.html');

// Compatibility aliases for legacy/alternative role routes.
router.get(['/admin/dashboard', '/admin/dashboard.html'], (_req, res) => res.redirect('/superadmin/dashboard'));
router.get(['/panelist/dashboard', '/panelist/dashboard.html'], (_req, res) => res.redirect('/student/dashboard'));
router.get('/logout', (_req, res) => res.redirect('/admin/login'));

router.get('/officer/developer/:page?', (_req, res) => res.redirect('/developer/dashboard'));
router.get('/officer/multimedia/:page?', (_req, res) => res.redirect('/multimedia/dashboard'));
router.get('/member/developer/:page?', (_req, res) => res.redirect('/developer/dashboard'));
router.get('/member/multimedia/:page?', (_req, res) => res.redirect('/multimedia/dashboard'));

module.exports = router;
