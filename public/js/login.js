(function () {
  const form = document.getElementById('loginForm');
  const errorText = document.getElementById('errorText');
  if (!form) return;

  const scope = String(document.body.dataset.loginScope || 'admin').toLowerCase();

  const roleRedirectMap = {
    admin: '/pages/admin.html',
    student: '/pages/student.html',
    panelist: '/pages/student.html',
    developer: '/pages/developer.html',
    multimedia: '/pages/multimedia.html',
    officer: '/pages/officer.html',
    profile: '/pages/profile.html',
    superadmin: '/pages/superadmin.html',
  };

  const normalizeRole = (rawRole) => {
    const role = String(rawRole || '').toLowerCase();
    if (!role) return '';
    if (role === 'developer_head' || role === 'developer_member') return 'developer';
    if (role === 'multimedia_head' || role === 'multimedia_member') return 'multimedia';
    if (role.startsWith('officer')) return 'officer';
    return role;
  };

  const resolveDashboard = (role) => roleRedirectMap[normalizeRole(role)] || null;

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
      const target = resolveDashboard(role);

      if (!token) {
        throw new Error('Login succeeded but no token was returned.');
      }
      if (!target) {
        throw new Error(`Unknown role "${role || 'none'}".`);
      }

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);

      window.location.replace(target);
    } catch (error) {
      showError(error.message || 'Login failed');
    }
  });
})();
