(function () {
  const form = document.getElementById('loginForm');
  const errorText = document.getElementById('errorText');
  if (!form) return;

  const scope = String(document.body.dataset.loginScope || 'admin').toLowerCase();

  const roleRedirectMap = {
    superadmin: '/pages/superadmin.html',
    admin: '/pages/admin.html',
    student: '/pages/student.html',
    panelist: '/pages/student.html',
    developer_head: '/pages/developer.html',
    developer_member: '/pages/developer.html',
    developer: '/pages/developer.html',
    multimedia_head: '/pages/multimedia.html',
    photographer: '/pages/multimedia.html',
    videographer: '/pages/multimedia.html',
    graphic_designer: '/pages/multimedia.html',
    documentator: '/pages/multimedia.html',
    multimedia_member: '/pages/multimedia.html',
    multimedia: '/pages/multimedia.html',
    officer: '/pages/officer.html',
    profile: '/pages/profile.html',
  };

  const normalizeRole = (rawRole) => String(rawRole || '').toLowerCase().trim();

  const getRoleGroup = (role) => {
    if (['developer_head', 'developer_member', 'developer'].includes(role)) return 'developer';
    if (
      ['multimedia_head', 'photographer', 'videographer', 'graphic_designer', 'documentator', 'multimedia_member', 'multimedia'].includes(role)
    ) {
      return 'multimedia';
    }
    return role;
  };

  const resolveDashboard = (role) => roleRedirectMap[role] || null;

  const showError = (message) => {
    if (!errorText) return;
    errorText.textContent = message;
    errorText.style.display = 'block';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorText) {
      errorText.style.display = 'none';
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.scope = scope;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      const token = data?.token;
      const user = data?.user || {};
      const role = normalizeRole(data?.user?.role || data?.role || '');
      const roleGroup = getRoleGroup(role);
      const target = resolveDashboard(role);

      if (!token) {
        throw new Error('Login succeeded but no token was returned.');
      }
      if (!target) {
        throw new Error(`Unknown role "${role || 'none'}".`);
      }

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('role_group', roleGroup);
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('role_group', roleGroup);

      window.location.replace(target);
    } catch (error) {
      showError(error.message || 'Login failed');
    }
  });
})();
