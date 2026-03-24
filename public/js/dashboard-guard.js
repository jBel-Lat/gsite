(function () {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = String(localStorage.getItem('role') || sessionStorage.getItem('role') || '').toLowerCase();
  const roleGroup = String(localStorage.getItem('role_group') || sessionStorage.getItem('role_group') || '').toLowerCase();
  const requiredRoleText = String(document.body.dataset.role || 'any').toLowerCase();
  const roleValue = document.getElementById('roleValue');
  const guardMessage = document.getElementById('guardMessage');

  const redirectToLogin = () => {
    window.location.replace('/');
  };

  const roleAliases = {
    developer: ['developer_head', 'developer_member', 'developer'],
    multimedia: [
      'multimedia_head',
      'photographer',
      'videographer',
      'graphic_designer',
      'documentator',
      'multimedia_member',
      'multimedia',
    ],
  };

  const matchesRequiredRole = (requiredRole) => {
    if (requiredRole === 'any') return true;
    if (requiredRole === role || requiredRole === roleGroup) return true;

    const aliasSet = roleAliases[requiredRole];
    if (Array.isArray(aliasSet) && aliasSet.includes(role)) {
      return true;
    }

    return false;
  };

  if (!token) {
    if (guardMessage) {
      guardMessage.textContent = 'No token found. Redirecting to login...';
    }
    setTimeout(redirectToLogin, 600);
    return;
  }

  if (requiredRoleText !== 'any') {
    const allowedRoles = requiredRoleText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const hasAllowedRole = allowedRoles.some((item) => matchesRequiredRole(item));
    if (!hasAllowedRole) {
      if (guardMessage) {
        guardMessage.textContent = `Access denied for role "${role || 'unknown'}". Redirecting...`;
      }
      setTimeout(redirectToLogin, 1000);
      return;
    }
  }

  if (roleValue) {
    roleValue.textContent = role || roleGroup || 'unknown';
  }

  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', async function () {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('role_group');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('role_group');
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (_error) {
        // Ignore logout request failures and still clear local session.
      }
      redirectToLogin();
    });
  }
})();
