# PHP to Node/Express Migration Map

This project now uses Node/Express routes and API controllers for the major PHP modules.

## 1. Authentication

- Old PHP: `controllers/AuthController.php`, `includes/auth.php`
- New Node routes:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- New controller: `controllers/api/authController.js`
- Session model: `express-session` (`ccs_sid` cookie)

## 2. Student Dashboard

- Old PHP: `controllers/StudentController.php`, `views/student/dashboard.php`
- New Node routes:
  - `GET /api/student/dashboard-data`
  - `POST /api/student/comments`
  - `POST /api/student/register-event`
- New controller: `controllers/api/studentController.js`
- Frontend: `public/index.html`

## 3. Superadmin / Admin Module

- Old PHP:
  - `controllers/AdminController.php`
  - `views/admin/*.php`
  - `views/superadmin/*.php`
- New Node routes:
  - `GET /api/admin/dashboard`
  - `GET /api/admin/groups`
  - `GET /api/admin/users`
  - `POST /api/admin/users`
  - `PUT /api/admin/users/:id`
  - `DELETE /api/admin/users/:id`
  - `GET /api/admin/teams`
- New controller: `controllers/api/adminController.js`
- Frontend pages:
  - `public/pages/superadmin-dashboard.html`
  - `public/pages/superadmin-users.html`
  - `public/pages/superadmin-teams.html`

## 4. Developer Module

- Old PHP: `controllers/DeveloperController.php`, `views/developer/*.php`
- New Node routes:
  - `/api/developer/dashboard`
  - `/api/developer/announcements...`
  - `/api/developer/members...`
  - `/api/developer/gsite-posts...`
  - `/api/developer/events...`
  - `/api/developer/event-registrations/:registrationId`
  - `/api/developer/projects...`
  - `/api/developer/editor/query`
- New controller: `controllers/api/teamController.js` (developer handlers)
- Frontend pages:
  - `public/pages/developer-dashboard.html`
  - `public/pages/developer-announcements.html`
  - `public/pages/developer-members.html`
  - `public/pages/developer-gsite-posts.html`
  - `public/pages/developer-gsite-events.html`
  - `public/pages/developer-event-registrations.html`
  - `public/pages/developer-projects.html`
  - `public/pages/developer-editor.html`

## 5. Multimedia Module

- Old PHP: `controllers/MultimediaController.php`, `views/multimedia/*.php`
- New Node routes:
  - `/api/multimedia/dashboard`
  - `/api/multimedia/announcements...`
  - `/api/multimedia/members...`
  - `/api/multimedia/gsite-posts...`
  - `/api/multimedia/repositories...`
  - `/api/multimedia/uploads/:uploadId/status`
- New controller: `controllers/api/teamController.js` (multimedia handlers)
- Frontend pages:
  - `public/pages/multimedia-dashboard.html`
  - `public/pages/multimedia-announcements.html`
  - `public/pages/multimedia-members.html`
  - `public/pages/multimedia-gsite-posts.html`
  - `public/pages/multimedia-repositories.html`

## 6. Profile Module

- Old PHP: `controllers/ProfileController.php`, `views/profile/index.php`
- New Node routes:
  - `GET /api/profile/me`
  - `PUT /api/profile/me`
  - `POST /api/profile/picture`
- New controller: `controllers/api/profileController.js`
- Frontend page: `public/pages/profile.html`

## 7. Web Route Mapping

- New route file: `routes/webRoutes.js`
- Examples:
  - `/superadmin/dashboard` -> `public/pages/superadmin-dashboard.html`
  - `/developer/dashboard` -> `public/pages/developer-dashboard.html`
  - `/multimedia/dashboard` -> `public/pages/multimedia-dashboard.html`
  - `/profile` -> `public/pages/profile.html`

## 8. Express Structure

- `routes/api/*.js`
- `controllers/api/*.js`
- `middleware/*.js`
- `utils/*.js`
- `public/pages/*.html`
- `public/js/app-shell.js`
- `public/js/page-modules.js`

