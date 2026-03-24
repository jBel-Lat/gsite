(function () {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = String(localStorage.getItem('role') || sessionStorage.getItem('role') || '').toLowerCase();
  const roleGroup = String(localStorage.getItem('role_group') || sessionStorage.getItem('role_group') || '').toLowerCase();

  const multimediaRoles = [
    'superadmin',
    'admin',
    'multimedia_head',
    'photographer',
    'videographer',
    'graphic_designer',
    'documentator',
    'multimedia_member',
    'multimedia',
  ];

  if (!token) {
    window.location.replace('/');
    return;
  }

  if (!multimediaRoles.includes(role) && roleGroup !== 'multimedia') {
    window.location.replace('/');
    return;
  }

  const state = {
    role,
    isHead: role === 'multimedia_head' || role === 'superadmin',
    members: [],
    files: [],
    announcements: [],
    logs: [],
    reports: null,
    notifications: [],
  };

  const API_BASE = '/api/multimedia';

  const els = {
    guardMessage: document.getElementById('guardMessage'),
    noticePanel: document.getElementById('noticePanel'),
    pageTitle: document.getElementById('pageTitle'),
    navButtons: Array.from(document.querySelectorAll('.mm-nav-item[data-section]')),
    sections: Array.from(document.querySelectorAll('.mm-section')),
    sidebarRoleText: document.getElementById('sidebarRoleText'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebar: document.getElementById('mmSidebar'),
    refreshBtn: document.getElementById('refreshBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    headOnly: Array.from(document.querySelectorAll('.head-only')),

    memberForm: document.getElementById('memberForm'),
    memberId: document.getElementById('memberId'),
    memberPassword: document.getElementById('memberPassword'),
    memberSubmitBtn: document.getElementById('memberSubmitBtn'),
    memberCancelBtn: document.getElementById('memberCancelBtn'),
    memberSearch: document.getElementById('memberSearch'),
    memberRoleFilter: document.getElementById('memberRoleFilter'),
    membersTableBody: document.querySelector('#membersTable tbody'),
    membersEmpty: document.getElementById('membersEmpty'),

    fileForm: document.getElementById('fileForm'),
    fileId: document.getElementById('fileId'),
    fileSubmitBtn: document.getElementById('fileSubmitBtn'),
    fileCancelBtn: document.getElementById('fileCancelBtn'),
    fileSearch: document.getElementById('fileSearch'),
    fileTeamFilter: document.getElementById('fileTeamFilter'),
    fileStatusFilter: document.getElementById('fileStatusFilter'),
    filesTableBody: document.querySelector('#filesTable tbody'),
    filesEmpty: document.getElementById('filesEmpty'),

    announcementForm: document.getElementById('announcementForm'),
    announcementId: document.getElementById('announcementId'),
    announcementSubmitBtn: document.getElementById('announcementSubmitBtn'),
    announcementCancelBtn: document.getElementById('announcementCancelBtn'),
    announcementSearch: document.getElementById('announcementSearch'),
    announcementsTableBody: document.querySelector('#announcementsTable tbody'),
    announcementsEmpty: document.getElementById('announcementsEmpty'),

    logSearch: document.getElementById('logSearch'),
    logsTableBody: document.querySelector('#logsTable tbody'),
    logsEmpty: document.getElementById('logsEmpty'),

    sumMembers: document.getElementById('sumMembers'),
    sumFiles: document.getElementById('sumFiles'),
    sumPending: document.getElementById('sumPending'),
    sumProcessing: document.getElementById('sumProcessing'),
    sumDone: document.getElementById('sumDone'),
    sumAnnouncements: document.getElementById('sumAnnouncements'),
    notificationsList: document.getElementById('notificationsList'),
    quickReports: document.getElementById('quickReports'),

    reportStatusList: document.getElementById('reportStatusList'),
    reportTeamList: document.getElementById('reportTeamList'),
    reportMemberList: document.getElementById('reportMemberList'),
    reportMonthlyList: document.getElementById('reportMonthlyList'),
    exportReportBtn: document.getElementById('exportReportBtn'),

    profileForm: document.getElementById('profileForm'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    passwordForm: document.getElementById('passwordForm'),
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const debounce = (fn, delay = 300) => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const clearNotice = () => {
    if (!els.noticePanel) return;
    els.noticePanel.innerHTML = '';
  };

  const showNotice = (type, message) => {
    if (!els.noticePanel) return;
    if (!message) {
      clearNotice();
      return;
    }
    els.noticePanel.innerHTML = `<div class="alert ${type}">${escapeHtml(message)}</div>`;
  };

  const roleLabel = (roleValue) => {
    return roleValue.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const apiFetch = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const isFormData = options.body instanceof FormData;
    if (!isFormData && options.body && typeof options.body === 'object') {
      headers.set('Content-Type', 'application/json');
      options.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch (_error) {
      payload = {};
    }

    if (!response.ok) {
      const message = payload.error || payload.message || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return payload;
  };

  const activateSection = (sectionId) => {
    els.sections.forEach((section) => {
      section.classList.toggle('active', section.id === sectionId);
    });

    els.navButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.section === sectionId);
    });

    const activeNav = els.navButtons.find((button) => button.dataset.section === sectionId);
    if (activeNav && els.pageTitle) {
      els.pageTitle.textContent = activeNav.textContent.trim();
    }
  };

  const mountCommonEvents = () => {
    els.navButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activateSection(button.dataset.section);
      });
    });

    if (els.sidebarToggle) {
      els.sidebarToggle.addEventListener('click', () => {
        els.sidebar.classList.toggle('open');
      });
    }

    if (els.refreshBtn) {
      els.refreshBtn.addEventListener('click', async () => {
        await loadEverything();
      });
    }

    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('role_group');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('role_group');
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (_error) {
          // Continue local logout even when request fails.
        }
        window.location.replace('/');
      });
    }
  };
  const renderMembers = () => {
    if (!els.membersTableBody) return;
    els.membersTableBody.innerHTML = state.members
      .map((member) => {
        const photoPath = member.photo ? `/${member.photo.replace(/^\/+/, '')}` : '/assets/images/default-avatar.png';
        return `
          <tr>
            <td><img src="${escapeHtml(photoPath)}" class="avatar" alt="${escapeHtml(member.name)}"></td>
            <td>${escapeHtml(member.name)}</td>
            <td>${escapeHtml(member.email)}</td>
            <td>${escapeHtml(member.username)}</td>
            <td>${escapeHtml(member.password || '********')}</td>
            <td>${escapeHtml(roleLabel(member.role))}</td>
            <td>
              <div class="mini-actions">
                <button class="mini-btn" data-action="member-edit" data-id="${member.id}">Edit</button>
                <button class="mini-btn danger" data-action="member-delete" data-id="${member.id}">Delete</button>
                <button class="mini-btn" data-action="member-reset" data-id="${member.id}">Reset Password</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    if (els.membersEmpty) {
      els.membersEmpty.style.display = state.members.length ? 'none' : 'block';
    }
  };

  const loadMembers = async () => {
    if (!state.isHead) return;

    const params = new URLSearchParams();
    const search = els.memberSearch?.value?.trim();
    const roleFilter = els.memberRoleFilter?.value || '';
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch(`/members${query}`);
    state.members = Array.isArray(data.members) ? data.members : [];
    renderMembers();
  };

  const resetMemberForm = () => {
    if (!els.memberForm) return;
    els.memberForm.reset();
    if (els.memberId) els.memberId.value = '';
    if (els.memberSubmitBtn) els.memberSubmitBtn.textContent = 'Create Account';
    if (els.memberPassword) els.memberPassword.required = true;
  };

  const renderFiles = () => {
    if (!els.filesTableBody) return;

    els.filesTableBody.innerHTML = state.files
      .map((file) => {
        const statusClass = `status-${file.status}`;
        const headActions = state.isHead
          ? `
            <button class="mini-btn" data-action="file-edit" data-id="${file.id}">Edit</button>
            <button class="mini-btn danger" data-action="file-delete" data-id="${file.id}">Delete</button>
          `
          : '';

        return `
          <tr>
            <td>${escapeHtml(file.title)}</td>
            <td>${escapeHtml(file.description || '-')}</td>
            <td>${escapeHtml(file.file_name)}</td>
            <td>${escapeHtml(file.uploaded_by_name || '-')}</td>
            <td>${escapeHtml(roleLabel(file.assigned_team))}</td>
            <td>
              <span class="status-pill ${statusClass}">${escapeHtml(file.status)}</span>
              <div style="margin-top:6px; display:flex; gap:6px;">
                <select data-file-status="${file.id}">
                  <option value="pending" ${file.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="processing" ${file.status === 'processing' ? 'selected' : ''}>Processing</option>
                  <option value="done" ${file.status === 'done' ? 'selected' : ''}>Done</option>
                </select>
                <button class="mini-btn success" data-action="file-status" data-id="${file.id}">Update</button>
              </div>
            </td>
            <td>${escapeHtml(formatDate(file.created_at))}</td>
            <td>
              <div class="mini-actions">
                <button class="mini-btn" data-action="file-view" data-id="${file.id}">View</button>
                <button class="mini-btn" data-action="file-download" data-id="${file.id}">Download</button>
                ${headActions}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    if (els.filesEmpty) {
      els.filesEmpty.style.display = state.files.length ? 'none' : 'block';
    }
  };

  const loadFiles = async () => {
    const params = new URLSearchParams();
    const search = els.fileSearch?.value?.trim();
    const team = els.fileTeamFilter?.value || '';
    const status = els.fileStatusFilter?.value || '';
    if (search) params.set('search', search);
    if (team) params.set('assigned_team', team);
    if (status) params.set('status', status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch(`/files${query}`);
    state.files = Array.isArray(data.files) ? data.files : [];
    renderFiles();
  };

  const resetFileForm = () => {
    if (!els.fileForm) return;
    els.fileForm.reset();
    if (els.fileId) els.fileId.value = '';
    if (els.fileSubmitBtn) els.fileSubmitBtn.textContent = 'Upload File';
  };

  const mountMemberEvents = () => {
    if (!state.isHead || !els.memberForm) return;

    els.memberForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(els.memberForm);
      const memberId = els.memberId?.value;

      if (!memberId && !formData.get('password')) {
        showNotice('error', 'Password is required for new member accounts.');
        return;
      }

      if (memberId && !formData.get('password')) {
        formData.delete('password');
      }

      try {
        if (memberId) {
          await apiFetch(`/members/${memberId}`, { method: 'PUT', body: formData });
          showNotice('success', 'Member updated successfully.');
        } else {
          await apiFetch('/members', { method: 'POST', body: formData });
          showNotice('success', 'Member created successfully.');
        }

        resetMemberForm();
        await loadMembers();
      } catch (error) {
        showNotice('error', error.message);
      }
    });

    els.memberCancelBtn?.addEventListener('click', resetMemberForm);

    els.membersTableBody?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const memberId = Number(button.dataset.id);
      const member = state.members.find((item) => Number(item.id) === memberId);
      if (!member) return;

      if (action === 'member-edit') {
        els.memberId.value = String(member.id);
        els.memberForm.name.value = member.name || '';
        els.memberForm.email.value = member.email || '';
        els.memberForm.username.value = member.username || '';
        els.memberForm.role.value = member.role || 'photographer';
        els.memberForm.password.value = '';
        els.memberPassword.required = false;
        els.memberSubmitBtn.textContent = 'Update Member';
        activateSection('membersSection');
        return;
      }

      if (action === 'member-delete') {
        const confirmed = window.confirm(`Delete member ${member.name}?`);
        if (!confirmed) return;

        try {
          await apiFetch(`/members/${member.id}`, { method: 'DELETE' });
          showNotice('success', 'Member deleted.');
          await loadMembers();
        } catch (error) {
          showNotice('error', error.message);
        }
        return;
      }

      if (action === 'member-reset') {
        const newPassword = window.prompt('Enter new password (leave blank for auto-generated):', '');
        if (newPassword === null) return;

        try {
          const payload = newPassword.trim() ? { new_password: newPassword.trim() } : {};
          const response = await apiFetch(`/members/${member.id}/reset-password`, { method: 'PUT', body: payload });
          const message = response.temporary_password
            ? `Password reset. Temporary password: ${response.temporary_password}`
            : 'Password reset successfully.';
          showNotice('success', message);
        } catch (error) {
          showNotice('error', error.message);
        }
      }
    });

    const reloadMembers = debounce(loadMembers, 320);
    els.memberSearch?.addEventListener('input', reloadMembers);
    els.memberRoleFilter?.addEventListener('change', loadMembers);
  };

  const mountFileEvents = () => {
    if (state.isHead && els.fileForm) {
      els.fileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(els.fileForm);
        const fileId = els.fileId?.value;

        if (fileId && !(formData.get('file') && formData.get('file').size > 0)) {
          formData.delete('file');
        }

        try {
          if (fileId) {
            await apiFetch(`/files/${fileId}`, { method: 'PUT', body: formData });
            showNotice('success', 'File updated successfully.');
          } else {
            await apiFetch('/files', { method: 'POST', body: formData });
            showNotice('success', 'File uploaded successfully.');
          }
          resetFileForm();
          await loadFiles();
        } catch (error) {
          showNotice('error', error.message);
        }
      });

      els.fileCancelBtn?.addEventListener('click', resetFileForm);
    }

    els.filesTableBody?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const fileId = Number(button.dataset.id);
      const file = state.files.find((item) => Number(item.id) === fileId);
      if (!file) return;

      if (action === 'file-view') {
        window.open(file.view_url, '_blank', 'noopener');
        return;
      }

      if (action === 'file-download') {
        window.location.href = file.download_url;
        return;
      }

      if (action === 'file-edit' && state.isHead) {
        els.fileId.value = String(file.id);
        els.fileForm.title.value = file.title || '';
        els.fileForm.description.value = file.description || '';
        els.fileForm.assigned_team.value = file.assigned_team || 'all_teams';
        els.fileSubmitBtn.textContent = 'Update File';
        activateSection('filesSection');
        return;
      }

      if (action === 'file-delete' && state.isHead) {
        const confirmed = window.confirm(`Delete file ${file.title}?`);
        if (!confirmed) return;
        try {
          await apiFetch(`/files/${file.id}`, { method: 'DELETE' });
          showNotice('success', 'File deleted.');
          await loadFiles();
        } catch (error) {
          showNotice('error', error.message);
        }
        return;
      }

      if (action === 'file-status') {
        const select = els.filesTableBody.querySelector(`select[data-file-status="${file.id}"]`);
        const nextStatus = select?.value;
        try {
          await apiFetch(`/files/${file.id}/status`, { method: 'PUT', body: { status: nextStatus } });
          showNotice('success', 'File status updated.');
          await loadFiles();
        } catch (error) {
          showNotice('error', error.message);
        }
      }
    });

    const reloadFiles = debounce(loadFiles, 320);
    els.fileSearch?.addEventListener('input', reloadFiles);
    els.fileStatusFilter?.addEventListener('change', loadFiles);
    els.fileTeamFilter?.addEventListener('change', loadFiles);
  };
  const renderAnnouncements = () => {
    if (!els.announcementsTableBody) return;

    els.announcementsTableBody.innerHTML = state.announcements
      .map((item) => {
        const imagePath = item.image ? `/${item.image.replace(/^\/+/, '')}` : '/assets/images/default-avatar.png';
        const headActions = state.isHead
          ? `
            <button class="mini-btn" data-action="announcement-edit" data-id="${item.id}">Edit</button>
            <button class="mini-btn danger" data-action="announcement-delete" data-id="${item.id}">Delete</button>
          `
          : '';

        return `
          <tr>
            <td><img src="${escapeHtml(imagePath)}" class="avatar" alt="Announcement"></td>
            <td>${escapeHtml(item.title)}</td>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(roleLabel(item.target_audience || 'students'))}</td>
            <td>${escapeHtml(formatDate(item.created_at))}</td>
            <td>
              <div class="mini-actions">
                <button class="mini-btn" data-action="announcement-view" data-id="${item.id}">View</button>
                ${headActions}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    if (els.announcementsEmpty) {
      els.announcementsEmpty.style.display = state.announcements.length ? 'none' : 'block';
    }
  };

  const loadAnnouncements = async () => {
    const params = new URLSearchParams();
    const search = els.announcementSearch?.value?.trim();
    if (search) params.set('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch(`/announcements${query}`);
    state.announcements = Array.isArray(data.announcements) ? data.announcements : [];
    renderAnnouncements();
  };

  const resetAnnouncementForm = () => {
    if (!els.announcementForm) return;
    els.announcementForm.reset();
    if (els.announcementId) els.announcementId.value = '';
    if (els.announcementSubmitBtn) els.announcementSubmitBtn.textContent = 'Post Announcement';
  };

  const mountAnnouncementEvents = () => {
    if (state.isHead && els.announcementForm) {
      els.announcementForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(els.announcementForm);
        const announcementId = els.announcementId?.value;

        if (announcementId && !(formData.get('image') && formData.get('image').size > 0)) {
          formData.delete('image');
        }

        try {
          if (announcementId) {
            await apiFetch(`/announcements/${announcementId}`, { method: 'PUT', body: formData });
            showNotice('success', 'Announcement updated.');
          } else {
            await apiFetch('/announcements', { method: 'POST', body: formData });
            showNotice('success', 'Announcement posted.');
          }

          resetAnnouncementForm();
          await loadAnnouncements();
        } catch (error) {
          showNotice('error', error.message);
        }
      });

      els.announcementCancelBtn?.addEventListener('click', resetAnnouncementForm);
    }

    els.announcementsTableBody?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const id = Number(button.dataset.id);
      const announcement = state.announcements.find((item) => Number(item.id) === id);
      if (!announcement) return;

      if (action === 'announcement-view') {
        window.alert(`${announcement.title}\n\n${announcement.description}`);
        return;
      }

      if (action === 'announcement-edit' && state.isHead) {
        els.announcementId.value = String(announcement.id);
        els.announcementForm.title.value = announcement.title || '';
        els.announcementForm.description.value = announcement.description || '';
        els.announcementForm.target_audience.value = announcement.target_audience || 'students';
        els.announcementSubmitBtn.textContent = 'Update Announcement';
        activateSection('announcementsSection');
        return;
      }

      if (action === 'announcement-delete' && state.isHead) {
        const confirmed = window.confirm(`Delete announcement "${announcement.title}"?`);
        if (!confirmed) return;

        try {
          await apiFetch(`/announcements/${announcement.id}`, { method: 'DELETE' });
          showNotice('success', 'Announcement deleted.');
          await loadAnnouncements();
        } catch (error) {
          showNotice('error', error.message);
        }
      }
    });

    const reloadAnnouncements = debounce(loadAnnouncements, 320);
    els.announcementSearch?.addEventListener('input', reloadAnnouncements);
  };

  const renderLogs = () => {
    if (!els.logsTableBody) return;

    els.logsTableBody.innerHTML = state.logs
      .map((log) => `
        <tr>
          <td>${escapeHtml(log.action || '-')}</td>
          <td>${escapeHtml(log.user_name || '-')}</td>
          <td>${escapeHtml(log.user_role || '-')}</td>
          <td>${escapeHtml(log.details || '-')}</td>
          <td>${escapeHtml(formatDate(log.created_at))}</td>
        </tr>
      `)
      .join('');

    if (els.logsEmpty) {
      els.logsEmpty.style.display = state.logs.length ? 'none' : 'block';
    }
  };

  const loadLogs = async () => {
    if (!state.isHead) return;

    const params = new URLSearchParams();
    const search = els.logSearch?.value?.trim();
    if (search) params.set('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await apiFetch(`/logs${query}`);
    state.logs = Array.isArray(data.logs) ? data.logs : [];
    renderLogs();
  };

  const renderSummary = async () => {
    if (!state.isHead) {
      if (els.sumMembers) els.sumMembers.textContent = '-';
      if (els.sumFiles) els.sumFiles.textContent = '-';
      if (els.sumPending) els.sumPending.textContent = '-';
      if (els.sumProcessing) els.sumProcessing.textContent = '-';
      if (els.sumDone) els.sumDone.textContent = '-';
      if (els.sumAnnouncements) els.sumAnnouncements.textContent = '-';
      return;
    }

    const data = await apiFetch('/dashboard/summary');
    const summary = data.summary || {};
    els.sumMembers.textContent = String(summary.total_multimedia_team_members || 0);
    els.sumFiles.textContent = String(summary.total_uploaded_files || 0);
    els.sumPending.textContent = String(summary.pending_files || 0);
    els.sumProcessing.textContent = String(summary.processing_files || 0);
    els.sumDone.textContent = String(summary.done_files || 0);
    els.sumAnnouncements.textContent = String(summary.total_announcements || 0);
  };

  const renderNotifications = (items) => {
    if (!els.notificationsList) return;
    if (!items.length) {
      els.notificationsList.innerHTML = '<p class="muted">No notifications yet.</p>';
      return;
    }

    els.notificationsList.innerHTML = items
      .map((item) => `
        <article class="mm-list-item">
          <strong>${escapeHtml(item.title || item.type || 'Notification')}</strong>
          <p>${escapeHtml(item.message || '-')}</p>
          <small class="muted">${escapeHtml(formatDate(item.created_at))}</small>
        </article>
      `)
      .join('');
  };

  const renderReports = (reports) => {
    const addItems = (target, items, labelKey, valueKey = 'total') => {
      if (!target) return;
      if (!items || !items.length) {
        target.innerHTML = '<li>No data.</li>';
        return;
      }
      target.innerHTML = items
        .map((item) => `<li><strong>${escapeHtml(roleLabel(item[labelKey] || 'unknown'))}</strong>: ${escapeHtml(String(item[valueKey] || 0))}</li>`)
        .join('');
    };

    addItems(els.reportStatusList, reports?.uploads_by_status, 'status');
    addItems(els.reportTeamList, reports?.uploads_by_team, 'assigned_team');
    addItems(els.reportMemberList, reports?.members_by_role, 'role');
    addItems(els.reportMonthlyList, reports?.monthly_uploads, 'month');

    if (els.quickReports) {
      const quick = reports?.uploads_by_status || [];
      els.quickReports.innerHTML = quick.length
        ? quick.map((row) => `<article class="mm-list-item"><strong>${escapeHtml(roleLabel(row.status))}</strong>: ${row.total}</article>`).join('')
        : '<p class="muted">No report data yet.</p>';
    }
  };

  const loadNotificationsAndReports = async () => {
    if (!state.isHead) {
      renderNotifications([]);
      if (els.quickReports) {
        els.quickReports.innerHTML = '<p class="muted">Reports are available for Multimedia Head only.</p>';
      }
      return;
    }

    const [notificationsData, reportData] = await Promise.all([
      apiFetch('/notifications'),
      apiFetch('/reports'),
    ]);

    state.notifications = Array.isArray(notificationsData.notifications) ? notificationsData.notifications : [];
    state.reports = reportData.reports || null;

    renderNotifications(state.notifications);
    renderReports(state.reports);
  };

  const loadProfile = async () => {
    if (!state.isHead || !els.profileForm) return;
    const data = await apiFetch('/profile');
    const profile = data.profile || {};
    els.profileName.value = profile.name || '';
    els.profileEmail.value = profile.email || '';
  };

  const mountProfileEvents = () => {
    if (!state.isHead || !els.profileForm) return;

    els.profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(els.profileForm);
      try {
        await apiFetch('/profile', { method: 'PUT', body: formData });
        showNotice('success', 'Profile updated successfully.');
      } catch (error) {
        showNotice('error', error.message);
      }
    });

    els.passwordForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(els.passwordForm);
      const payload = Object.fromEntries(formData.entries());
      try {
        await apiFetch('/profile/password', { method: 'PUT', body: payload });
        els.passwordForm.reset();
        showNotice('success', 'Password changed successfully.');
      } catch (error) {
        showNotice('error', error.message);
      }
    });
  };

  const mountReportEvents = () => {
    if (!state.isHead || !els.exportReportBtn) return;

    els.exportReportBtn.addEventListener('click', () => {
      const payload = {
        exported_at: new Date().toISOString(),
        reports: state.reports || {},
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'multimedia-reports.json';
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const loadEverything = async () => {
    try {
      showNotice('', '');
      await Promise.all([
        renderSummary(),
        loadNotificationsAndReports(),
        loadFiles(),
        loadAnnouncements(),
        loadMembers(),
        loadLogs(),
        loadProfile(),
      ]);
      if (els.guardMessage) {
        els.guardMessage.textContent = `Signed in as ${roleLabel(state.role)}.`;
      }
    } catch (error) {
      showNotice('error', error.message || 'Failed to load dashboard data.');
      if (els.guardMessage) {
        els.guardMessage.textContent = 'Dashboard loaded with partial data.';
      }
    }
  };

  const mountSearchEvents = () => {
    const reloadLogs = debounce(loadLogs, 320);
    els.logSearch?.addEventListener('input', reloadLogs);
  };

  const init = async () => {
    if (els.sidebarRoleText) {
      els.sidebarRoleText.textContent = roleLabel(state.role);
    }

    if (!state.isHead) {
      els.headOnly.forEach((el) => el.classList.add('hidden'));
    }

    mountCommonEvents();
    mountMemberEvents();
    mountFileEvents();
    mountAnnouncementEvents();
    mountProfileEvents();
    mountReportEvents();
    mountSearchEvents();
    await loadEverything();
  };

  init();
})();
