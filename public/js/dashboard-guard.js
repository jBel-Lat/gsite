(function () {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = String(localStorage.getItem('role') || sessionStorage.getItem('role') || '').toLowerCase();
  const requiredRoleText = String(document.body.dataset.role || 'any').toLowerCase();
  const roleValue = document.getElementById('roleValue');
  const guardMessage = document.getElementById('guardMessage');

  const redirectToLogin = () => {
    window.location.replace('/');
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

    if (!role || !allowedRoles.includes(role)) {
      if (guardMessage) {
        guardMessage.textContent = `Access denied for role "${role || 'unknown'}". Redirecting...`;
      }
      setTimeout(redirectToLogin, 1000);
      return;
    }
  }

  if (roleValue) {
    roleValue.textContent = role || 'unknown';
  }

  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', async function () {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (_error) {
        // Ignore logout request failures and still clear local session.
      }
      redirectToLogin();
    });
  }
})();
