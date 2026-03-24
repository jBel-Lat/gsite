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
    multimedia_head: '/pages/multimedia-head.html',
    photographer: '/pages/multimedia-team.html',
    videographer: '/pages/multimedia-team.html',
    graphic_designer: '/pages/multimedia-team.html',
    documentator: '/pages/multimedia-team.html',
    multimedia_member: '/pages/multimedia-team.html',
    multimedia: '/pages/multimedia-team.html',
    officer: '/pages/officer.html',
    profile: '/pages/profile.html',
  };

  const normalizeRole = (rawRole) => {
    const role = String(rawRole || '').toLowerCase().trim().replace(/\s+/g, '_');
    if (!role) return '';

    const aliases = {
      'multimedia-head': 'multimedia_head',
      multimedia: 'multimedia_head',
      media_head: 'multimedia_head',
    };

    return aliases[role] || role;
  };

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
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      console.log('[login] response payload:', data);
      if (!response.ok || data.success !== true) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      const token = data?.token;
      const user = data?.user || {};
      const roleFromUser = normalizeRole(data?.user?.role || '');
      const role = roleFromUser || normalizeRole(data?.role || '');
      const roleGroup = getRoleGroup(role);
      const target = resolveDashboard(role);

      if (!token) {
        throw new Error('Login succeeded but no token was returned.');
      }
      if (!target) {
        throw new Error(`Unknown role "${role || 'none'}".`);
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', roleFromUser || role);
      localStorage.setItem('role_group', roleGroup);
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('role', roleFromUser || role);
      sessionStorage.setItem('role_group', roleGroup);

      console.log('[login] saved token:', data.token);
      console.log('[login] saved role:', roleFromUser || role);
      console.log('[login] saved role_group:', roleGroup);

      window.location.replace(target);
    } catch (error) {
      showError(error.message || 'Login failed');
    }
  });
})();
