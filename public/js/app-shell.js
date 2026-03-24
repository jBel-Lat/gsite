(function () {
  const routeRoleMap = {
    '/superadmin': ['superadmin'],
    '/admin': ['superadmin', 'admin'],
    '/developer': ['developer_head', 'developer_member'],
    '/multimedia': ['multimedia_head', 'multimedia_member'],
    '/student': ['student'],
    '/panelist': ['panelist'],
    '/profile': [
      'superadmin',
      'admin',
      'developer_head',
      'developer_member',
      'multimedia_head',
      'multimedia_member',
      'student',
      'panelist',
    ],
  };

  const roleRedirectMap = {
    superadmin: '/superadmin/dashboard',
    admin: '/admin/dashboard.html',
    developer_head: '/developer/dashboard',
    developer_member: '/developer/dashboard',
    multimedia_head: '/multimedia/dashboard',
    multimedia_member: '/multimedia/dashboard',
    student: '/student/dashboard.html',
    panelist: '/panelist/dashboard.html',
  };

  function getStoredToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
  }

  function clearStoredAuth() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  }

  function dashboardPathForRole(role) {
    return roleRedirectMap[String(role || '').toLowerCase()] || null;
  }

  const linksByRole = {
    admin: [
      { href: '/admin/dashboard.html', label: 'Dashboard', icon: 'fa-tachometer-alt' },
      { href: '/profile', label: 'Profile', icon: 'fa-user-circle' },
    ],
    superadmin: [
      { href: '/superadmin/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
      { href: '/superadmin/users', label: 'Users', icon: 'fa-users-cog' },
      { href: '/superadmin/teams', label: 'Teams', icon: 'fa-layer-group' },
      { href: '/profile', label: 'Profile', icon: 'fa-user-circle' },
    ],
    developer_head: [
      { href: '/developer/dashboard', label: 'Dashboard', icon: 'fa-code' },
      { href: '/developer/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
      { href: '/developer/members', label: 'Members', icon: 'fa-users' },
      { href: '/developer/gsite_posts', label: 'GSITE Posts', icon: 'fa-globe' },
      { href: '/developer/gsite_events', label: 'Events', icon: 'fa-calendar-day' },
      { href: '/developer/projects', label: 'Projects', icon: 'fa-folder-open' },
      { href: '/developer/editor', label: 'SQL Editor', icon: 'fa-database' },
      { href: '/profile', label: 'Profile', icon: 'fa-user-circle' },
    ],
    developer_member: [
      { href: '/developer/dashboard', label: 'Dashboard', icon: 'fa-code' },
      { href: '/developer/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
      { href: '/developer/projects', label: 'Projects', icon: 'fa-folder-open' },
      { href: '/developer/editor', label: 'SQL Editor', icon: 'fa-database' },
      { href: '/profile', label: 'Profile', icon: 'fa-user-circle' },
    ],
    multimedia_head: [
      { href: '/multimedia/dashboard', label: 'Dashboard', icon: 'fa-photo-video' },
      { href: '/multimedia/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
      { href: '/multimedia/members', label: 'Members', icon: 'fa-users' },
      { href: '/multimedia/gsite_posts', label: 'GSITE Posts', icon: 'fa-globe' },
      { href: '/multimedia/repositories', label: 'Repositories', icon: 'fa-folder-open' },
      { href: '/profile', label: 'Profile', icon: 'fa-user-circle' },
    ],
    multimedia_member: [
      { href: '/multimedia/dashboard', label: 'Dashboard', icon: 'fa-photo-video' },
      { href: '/multimedia/announcements', label: 'Announcements', icon: 'fa-bullhorn' },
      { href: '/multimedia/repositories', label: 'Repositories', icon: 'fa-folder-open' },
      { href: '/profile', label: 'Profile', icon: 'fa-user-circle' },
    ],
    student: [{ href: '/student/dashboard.html', label: 'Dashboard', icon: 'fa-home' }],
    panelist: [{ href: '/panelist/dashboard.html', label: 'Dashboard', icon: 'fa-clipboard-check' }],
  };

  function roleAllowedForPath(role, pathname) {
    const matchKey = Object.keys(routeRoleMap).find((prefix) => pathname.startsWith(prefix));
    if (!matchKey) return true;
    return routeRoleMap[matchKey].includes(role);
  }

  async function fetchJSON(url, options) {
    const token = getStoredToken();
    const requestOptions = options ? { ...options } : {};
    const headers = new Headers(requestOptions.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    requestOptions.headers = headers;

    const response = await fetch(url, requestOptions);
    const maybeJson = await response
      .json()
      .catch(() => ({ ok: false, error: `Unexpected response from ${url}` }));
    if (!response.ok || maybeJson.ok === false) {
      throw new Error(maybeJson.error || `Request failed with status ${response.status}`);
    }
    return maybeJson;
  }

  function toast(message, isError) {
    const el = document.getElementById('flashMessage');
    if (!el) return;
    el.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
    }, 3500);
  }

  function buildSidebarLinks(user) {
    const list = linksByRole[user.role] || [];
    return list
      .map((item) => {
        const active = window.location.pathname === item.href ? 'active' : '';
        return `<li><a class="${active}" href="${item.href}"><i class="fas ${item.icon}"></i><span>${item.label}</span></a></li>`;
      })
      .join('');
  }

  function renderShell(user) {
    const app = document.getElementById('appShell');
    if (!app) return;
    const pageTitle = document.body.getAttribute('data-title') || 'Dashboard';
    app.innerHTML = `
      <div class="dashboard-wrapper">
        <nav id="sidebar" class="sidebar">
          <div class="sidebar-header"><i class="fas fa-network-wired"></i> OMS</div>
          <div class="sidebar-nav">
            <ul>${buildSidebarLinks(user)}</ul>
            <ul style="margin-top:auto;">
              <li class="nav-heading">Session</li>
              <li><a href="#" id="logoutBtn" style="color:var(--danger);"><i class="fas fa-sign-out-alt"></i><span>Logout</span></a></li>
            </ul>
          </div>
        </nav>
        <div class="main-content">
          <header class="top-header">
            <div class="header-left">
              <button id="sidebar-toggle" class="btn-icon"><i class="fas fa-bars"></i></button>
              <h2 class="page-title">${pageTitle}</h2>
            </div>
            <div class="header-right">
              <div class="user-profile-menu">
                <span class="username">${user.name} (${user.role})</span>
              </div>
            </div>
          </header>
          <main class="content-area">
            <div id="flashMessage" style="display:none;"></div>
            <div id="pageContent"></div>
          </main>
        </div>
      </div>
    `;

    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    sidebarToggle?.addEventListener('click', () => sidebar?.classList.toggle('collapsed'));

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await fetchJSON('/api/auth/logout', { method: 'POST' });
      } finally {
        clearStoredAuth();
        window.location.href = '/admin/login';
      }
    });
  }

  async function initShell() {
    const loginPage = document.body.getAttribute('data-login') === 'true';
    if (loginPage) return;

    let me;
    try {
      me = await fetchJSON('/api/auth/me');
    } catch (_err) {
      window.location.href = '/admin/login';
      return;
    }

    if (!me.user) {
      clearStoredAuth();
      window.location.href = '/admin/login';
      return;
    }

    if (!roleAllowedForPath(me.user.role, window.location.pathname)) {
      const fallbackPath = dashboardPathForRole(me.user.role);
      if (fallbackPath && fallbackPath !== window.location.pathname) {
        window.location.href = fallbackPath;
        return;
      }
      clearStoredAuth();
      window.location.href = '/admin/login';
      return;
    }

    renderShell(me.user);
    const pageKey = document.body.getAttribute('data-page');
    if (pageKey && window.pageModules && window.pageModules[pageKey]) {
      await window.pageModules[pageKey]({
        user: me.user,
        fetchJSON,
        toast,
        root: document.getElementById('pageContent'),
      });
    }
  }

  window.appShell = {
    fetchJSON,
    initShell,
    toast,
  };

  document.addEventListener('DOMContentLoaded', initShell);
})();
