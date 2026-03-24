window.pageModules = (() => {
  const htmlEscape = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  const collectForm = (formElement) => Object.fromEntries(new FormData(formElement).entries());

  const table = (headers, rowsHtml) => `
    <div class="panel">
      <div class="table-responsive">
        <table class="table">
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rowsHtml || '<tr><td colspan="99" class="text-muted">No records found.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;

  const adminDashboard = async ({ fetchJSON, root }) => {
    const { summary } = await fetchJSON('/api/admin/dashboard');
    root.innerHTML = `
      <div class="grid-cards">
        <div class="stat-card"><div class="stat-icon primary"><i class="fas fa-users"></i></div><div class="stat-details"><h3>${summary.totalUsers}</h3><p>Total Users</p></div></div>
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-photo-video"></i></div><div class="stat-details"><h3>${summary.totalMultimedia}</h3><p>Multimedia Team</p></div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-code"></i></div><div class="stat-details"><h3>${summary.totalDeveloper}</h3><p>Developer Team</p></div></div>
      </div>
    `;
  };

  const adminUsers = async ({ fetchJSON, root, toast }) => {
    const render = async () => {
      const [{ users }, groupsResp] = await Promise.all([
        fetchJSON('/api/admin/users'),
        fetchJSON('/api/admin/groups').catch(() => ({ groups: [] })),
      ]);
      const groups = groupsResp.groups || [];

      root.innerHTML = `
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Create User</h3></div>
          <form id="createUserForm" class="grid-cards">
            <div class="form-group"><label>Username</label><input class="form-control" name="username" required></div>
            <div class="form-group"><label>Password</label><input class="form-control" name="password" type="password" required></div>
            <div class="form-group"><label>Name</label><input class="form-control" name="name" required></div>
            <div class="form-group"><label>Email</label><input class="form-control" name="email" type="email" required></div>
            <div class="form-group">
              <label>Role</label>
              <select class="form-control" name="role" required>
                <option value="superadmin">superadmin</option>
                <option value="developer_head">developer_head</option>
                <option value="developer_member">developer_member</option>
                <option value="multimedia_head">multimedia_head</option>
                <option value="multimedia_member">multimedia_member</option>
              </select>
            </div>
            <div class="form-group">
              <label>Group (multimedia only)</label>
              <select class="form-control" name="group_id">
                <option value="">None</option>
                ${groups.map((g) => `<option value="${g.id}">${htmlEscape(g.group_name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><button class="btn btn-primary" type="submit">Create User</button></div>
          </form>
        </div>
      `;

      const rowsHtml = users
        .map(
          (u) => `
          <tr>
            <td>${u.id}</td>
            <td>${htmlEscape(u.username)}</td>
            <td>${htmlEscape(u.name)}</td>
            <td>${htmlEscape(u.email)}</td>
            <td>${htmlEscape(u.role)}</td>
            <td>${htmlEscape(u.team || '-')}</td>
            <td>${htmlEscape(u.group_name || '-')}</td>
            <td>
              <button class="btn btn-sm btn-warning edit-user-btn" data-user='${JSON.stringify(u).replace(/'/g, '&#039;')}'>Edit</button>
              <button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.id}">Delete</button>
            </td>
          </tr>
        `
        )
        .join('');
      root.insertAdjacentHTML(
        'beforeend',
        table(['ID', 'Username', 'Name', 'Email', 'Role', 'Team', 'Group', 'Actions'], rowsHtml)
      );

      document.getElementById('createUserForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectForm(event.currentTarget)),
        });
        toast('User created');
        await render();
      });

      root.querySelectorAll('.delete-user-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          if (!confirm('Delete this user?')) return;
          await fetchJSON(`/api/admin/users/${button.getAttribute('data-id')}`, { method: 'DELETE' });
          toast('User deleted');
          await render();
        });
      });

      root.querySelectorAll('.edit-user-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const user = JSON.parse(button.getAttribute('data-user'));
          const name = prompt('Name', user.name);
          if (name === null) return;
          const email = prompt('Email', user.email);
          if (email === null) return;
          const role = prompt('Role', user.role);
          if (role === null) return;
          await fetchJSON(`/api/admin/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...user,
              name,
              email,
              role,
              team: role.includes('developer') ? 'developer' : role.includes('multimedia') ? 'multimedia' : null,
            }),
          });
          toast('User updated');
          await render();
        });
      });
    };

    await render();
  };

  const adminTeams = async ({ fetchJSON, root }) => {
    const { teams } = await fetchJSON('/api/admin/teams');
    const multimediaRows = teams.multimedia
      .map(
        (u) => `
      <tr><td>${u.id}</td><td>${htmlEscape(u.name)}</td><td>${htmlEscape(u.role)}</td><td>${htmlEscape(
          u.group_name || '-'
        )}</td></tr>
    `
      )
      .join('');
    const developerRows = teams.developer
      .map((u) => `<tr><td>${u.id}</td><td>${htmlEscape(u.name)}</td><td>${htmlEscape(u.role)}</td></tr>`)
      .join('');

    root.innerHTML = `
      <h3 style="margin-bottom:12px;">Multimedia Team</h3>
      ${table(['ID', 'Name', 'Role', 'Group'], multimediaRows)}
      <h3 style="margin:24px 0 12px;">Developer Team</h3>
      ${table(['ID', 'Name', 'Role'], developerRows)}
    `;
  };

  const teamDashboard = (team) => async ({ fetchJSON, root }) => {
    const { dashboard } = await fetchJSON(`/api/${team}/dashboard`);
    const extra =
      team === 'multimedia'
        ? `
      <div class="stat-card"><div class="stat-icon success"><i class="fas fa-folder-open"></i></div><div class="stat-details"><h3>${dashboard.totalRepositories}</h3><p>Repositories</p></div></div>
      <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-upload"></i></div><div class="stat-details"><h3>${dashboard.myUploads}</h3><p>My Uploads</p></div></div>
    `
        : '';
    root.innerHTML = `
      <div class="grid-cards">
        <div class="stat-card"><div class="stat-icon primary"><i class="fas fa-users"></i></div><div class="stat-details"><h3>${dashboard.totalMembers}</h3><p>Team Members</p></div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-bullhorn"></i></div><div class="stat-details"><h3>${dashboard.totalAnnouncements}</h3><p>Announcements</p></div></div>
        ${extra}
      </div>
      <div class="panel">
        <div class="panel-header"><h3 class="panel-title">Recent Announcements</h3></div>
        ${(dashboard.recentAnnouncements || [])
          .map(
            (a) => `
          <div class="announcement-card">
            <h4>${htmlEscape(a.title)}</h4>
            <p class="text-muted">${htmlEscape(a.author_name || 'Unknown')} | ${formatDate(a.created_at)}</p>
            <p>${htmlEscape(a.content)}</p>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  };

  const announcementsPage = (team) => async ({ fetchJSON, root, user, toast }) => {
    const render = async () => {
      const { announcements, comments } = await fetchJSON(`/api/${team}/announcements`);
      const canCreate = user.role === `${team}_head`;

      root.innerHTML = `
        ${
          canCreate
            ? `
          <div class="panel">
            <div class="panel-header"><h3 class="panel-title">Post Announcement</h3></div>
            <form id="announcementForm">
              <div class="form-group"><label>Title</label><input class="form-control" name="title" required></div>
              <div class="form-group"><label>Content</label><textarea class="form-control" name="content" required></textarea></div>
              <button class="btn btn-primary" type="submit">Publish</button>
            </form>
          </div>
        `
            : ''
        }
        <div id="announcementFeed"></div>
      `;

      const feed = document.getElementById('announcementFeed');
      feed.innerHTML = announcements
        .map((a) => {
          const commentRows = (comments[String(a.id)] || [])
            .map(
              (c) => `
            <div class="comment-item">
              <strong>${htmlEscape(c.commenter_name)}</strong>: ${htmlEscape(c.comment)}
              ${
                c.author_id === user.id
                  ? `<button class="btn btn-sm btn-danger delete-comment-btn" data-comment-id="${c.id}">Delete</button>`
                  : ''
              }
            </div>
          `
            )
            .join('');
          return `
          <div class="panel">
            <h3>${htmlEscape(a.title)}</h3>
            <p class="text-muted">${htmlEscape(a.author_name || 'Unknown')} | ${formatDate(a.created_at)}</p>
            <p>${htmlEscape(a.content)}</p>
            ${
              canCreate
                ? `<div style="margin-top:8px;">
                  <button class="btn btn-sm btn-warning edit-announcement-btn" data-id="${a.id}">Edit</button>
                  <button class="btn btn-sm btn-danger delete-announcement-btn" data-id="${a.id}">Delete</button>
                </div>`
                : ''
            }
            <div class="comment-list">${commentRows}</div>
            <form class="comment-form" data-id="${a.id}" style="margin-top:8px;">
              <input class="form-control" name="comment" placeholder="Add comment..." required>
              <button class="btn btn-primary btn-sm mt-4" type="submit">Comment</button>
            </form>
          </div>
        `;
        })
        .join('');

      document.getElementById('announcementForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON(`/api/${team}/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectForm(event.currentTarget)),
        });
        toast('Announcement posted');
        await render();
      });

      feed.querySelectorAll('.comment-form').forEach((form) => {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const id = form.getAttribute('data-id');
          const payload = collectForm(form);
          await fetchJSON(`/api/${team}/announcements/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          toast('Comment added');
          await render();
        });
      });

      feed.querySelectorAll('.delete-comment-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/${team}/announcement-comments/${button.getAttribute('data-comment-id')}`, {
            method: 'DELETE',
          });
          toast('Comment deleted');
          await render();
        });
      });

      feed.querySelectorAll('.delete-announcement-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/${team}/announcements/${button.getAttribute('data-id')}`, {
            method: 'DELETE',
          });
          toast('Announcement deleted');
          await render();
        });
      });

      feed.querySelectorAll('.edit-announcement-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = button.getAttribute('data-id');
          const title = prompt('New title');
          if (title === null) return;
          const content = prompt('New content');
          if (content === null) return;
          await fetchJSON(`/api/${team}/announcements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
          });
          toast('Announcement updated');
          await render();
        });
      });
    };

    await render();
  };

  const membersPage = (team) => async ({ fetchJSON, root, user, toast }) => {
    const canManage = user.role === `${team}_head`;
    const render = async () => {
      const payload = await fetchJSON(`/api/${team}/members`);
      const members = payload.members || [];
      const groups = payload.groups || [];

      root.innerHTML = `
        ${
          canManage
            ? `
          <div class="panel">
            <div class="panel-header"><h3 class="panel-title">Add ${team} member</h3></div>
            <form id="memberCreateForm" class="grid-cards">
              <div class="form-group"><label>Username</label><input class="form-control" name="username" required></div>
              <div class="form-group"><label>Password</label><input class="form-control" name="password" type="password" required></div>
              <div class="form-group"><label>Name</label><input class="form-control" name="name" required></div>
              <div class="form-group"><label>Email</label><input class="form-control" name="email" type="email" required></div>
              <div class="form-group"><label>Contact</label><input class="form-control" name="contact_number"></div>
              ${
                team === 'multimedia'
                  ? `<div class="form-group"><label>Group</label>
                  <select class="form-control" name="group_id">
                    <option value="">None</option>
                    ${groups.map((g) => `<option value="${g.id}">${htmlEscape(g.group_name)}</option>`).join('')}
                  </select>
                 </div>`
                  : ''
              }
              <div class="form-group"><button class="btn btn-primary" type="submit">Create Member</button></div>
            </form>
          </div>
        `
            : ''
        }
      `;

      const rows = members
        .map(
          (m) => `
        <tr>
          <td>${m.id}</td>
          <td>${htmlEscape(m.username)}</td>
          <td>${htmlEscape(m.name)}</td>
          <td>${htmlEscape(m.email)}</td>
          <td>${htmlEscape(m.contact_number || '-')}</td>
          <td>${htmlEscape(m.group_name || '-')}</td>
          <td>
            ${
              canManage
                ? `<button class="btn btn-sm btn-warning member-edit-btn" data-id="${m.id}">Edit</button>
                   <button class="btn btn-sm btn-danger member-delete-btn" data-id="${m.id}">Delete</button>`
                : '-'
            }
          </td>
        </tr>
      `
        )
        .join('');
      root.insertAdjacentHTML(
        'beforeend',
        table(['ID', 'Username', 'Name', 'Email', 'Contact', 'Group', 'Actions'], rows)
      );

      document.getElementById('memberCreateForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON(`/api/${team}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectForm(event.currentTarget)),
        });
        toast('Member created');
        await render();
      });

      root.querySelectorAll('.member-delete-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/${team}/members/${button.getAttribute('data-id')}`, { method: 'DELETE' });
          toast('Member deleted');
          await render();
        });
      });

      root.querySelectorAll('.member-edit-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const id = button.getAttribute('data-id');
          const name = prompt('Name');
          if (!name) return;
          const email = prompt('Email');
          if (!email) return;
          const contact_number = prompt('Contact Number');
          await fetchJSON(`/api/${team}/members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, contact_number }),
          });
          toast('Member updated');
          await render();
        });
      });
    };

    await render();
  };

  const gsitePostsPage = (team) => async ({ fetchJSON, root, user, toast }) => {
    const canManage = user.role === `${team}_head`;

    const render = async () => {
      const { posts } = await fetchJSON(`/api/${team}/gsite-posts`);
      root.innerHTML = `
        ${
          canManage
            ? `
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Publish GSITE Post</h3></div>
          <form id="postForm">
            <div class="form-group"><label>Title</label><input class="form-control" name="title" required></div>
            <div class="form-group"><label>Details</label><textarea class="form-control" name="details" required></textarea></div>
            <div class="form-group"><label>Auto Hide At</label><input class="form-control" name="auto_hide_at" type="datetime-local"></div>
            <div class="form-group"><label><input type="checkbox" name="is_banner" value="1"> Pin as banner</label></div>
            <div class="form-group"><label>Image</label><input class="form-control" name="image" type="file"></div>
            <button class="btn btn-primary" type="submit">Publish</button>
          </form>
        </div>
      `
            : ''
        }
        <div id="postsList"></div>
      `;

      document.getElementById('postForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        await fetchJSON(`/api/${team}/gsite-posts`, { method: 'POST', body: fd });
        toast('Post published');
        await render();
      });

      document.getElementById('postsList').innerHTML = posts
        .map(
          (p) => `
        <div class="panel">
          <h4>${htmlEscape(p.title)}</h4>
          <p class="text-muted">${formatDate(p.created_at)} ${p.is_banner ? '| Banner' : ''}</p>
          <p>${htmlEscape(p.details)}</p>
          ${p.image ? `<img src="/uploads/posts/${encodeURIComponent(p.image)}" class="post-image" alt="post-image">` : ''}
          ${
            canManage
              ? `<button class="btn btn-sm btn-danger delete-post-btn" data-id="${p.id}" style="margin-top:8px;">Delete</button>`
              : ''
          }
        </div>
      `
        )
        .join('');

      root.querySelectorAll('.delete-post-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/${team}/gsite-posts/${button.getAttribute('data-id')}`, { method: 'DELETE' });
          toast('Post deleted');
          await render();
        });
      });
    };

    await render();
  };

  const developerEvents = async ({ fetchJSON, root, user, toast }) => {
    const canManage = user.role === 'developer_head';

    const render = async () => {
      const { events } = await fetchJSON('/api/developer/events');
      root.innerHTML = `
        ${
          canManage
            ? `
          <div class="panel">
            <div class="panel-header"><h3 class="panel-title">Create Event</h3></div>
            <form id="eventForm" class="grid-cards">
              <div class="form-group"><label>Title</label><input class="form-control" name="title" required></div>
              <div class="form-group"><label>Description</label><textarea class="form-control" name="description" required></textarea></div>
              <div class="form-group"><label>Participant Limit</label><input class="form-control" name="participant_limit" type="number"></div>
              <div class="form-group"><label>Start Date</label><input class="form-control" name="start_date" type="date" required></div>
              <div class="form-group"><label>End Date</label><input class="form-control" name="end_date" type="date" required></div>
              <div class="form-group"><label>Image</label><input class="form-control" name="image" type="file"></div>
              <div class="form-group"><button class="btn btn-primary" type="submit">Save Event</button></div>
            </form>
          </div>
        `
            : ''
        }
      `;

      const rows = events
        .map(
          (eventItem) => `
        <tr>
          <td>${eventItem.id}</td>
          <td>${htmlEscape(eventItem.title)}</td>
          <td>${eventItem.participant_limit ?? '-'}</td>
          <td>${eventItem.reg_count}</td>
          <td>${htmlEscape(eventItem.start_date)} - ${htmlEscape(eventItem.end_date)}</td>
          <td>
            <a class="btn btn-sm btn-info" href="/developer/event_registrations?event_id=${eventItem.id}">Registrations</a>
            ${
              canManage
                ? `<button class="btn btn-sm btn-danger delete-event-btn" data-id="${eventItem.id}">Delete</button>`
                : ''
            }
          </td>
        </tr>
      `
        )
        .join('');
      root.insertAdjacentHTML(
        'beforeend',
        table(['ID', 'Title', 'Limit', 'Registered', 'Dates', 'Actions'], rows)
      );

      document.getElementById('eventForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON('/api/developer/events', {
          method: 'POST',
          body: new FormData(event.currentTarget),
        });
        toast('Event created');
        await render();
      });

      root.querySelectorAll('.delete-event-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/developer/events/${button.getAttribute('data-id')}`, { method: 'DELETE' });
          toast('Event deleted');
          await render();
        });
      });
    };

    await render();
  };

  const developerEventRegistrations = async ({ fetchJSON, root, user, toast }) => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event_id');
    if (!eventId) {
      root.innerHTML = '<div class="panel"><p>Select an event first from GSITE Events page.</p></div>';
      return;
    }

    const render = async () => {
      const { event, registrations } = await fetchJSON(`/api/developer/events/${eventId}/registrations`);
      root.innerHTML = `
        <div class="panel">
          <h3>${htmlEscape(event?.title || 'Unknown Event')}</h3>
          <p class="text-muted">${htmlEscape(event?.start_date || '')} - ${htmlEscape(event?.end_date || '')}</p>
        </div>
      `;

      const rows = registrations
        .map(
          (r) => `
        <tr>
          <td>${r.id}</td>
          <td>${htmlEscape(r.full_name)}</td>
          <td>${htmlEscape(r.email)}</td>
          <td>${htmlEscape(r.contact_number || '-')}</td>
          <td>${htmlEscape(r.student_id || '-')}</td>
          <td>${htmlEscape(r.year_section || '-')}</td>
          <td>${formatDate(r.registered_at)}</td>
          <td>${user.role === 'developer_head' ? `<button class="btn btn-sm btn-danger del-reg-btn" data-id="${r.id}">Delete</button>` : '-'}</td>
        </tr>
      `
        )
        .join('');
      root.insertAdjacentHTML(
        'beforeend',
        table(['ID', 'Name', 'Email', 'Contact', 'Student ID', 'Year/Section', 'Registered', 'Actions'], rows)
      );

      root.querySelectorAll('.del-reg-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/developer/event-registrations/${button.getAttribute('data-id')}`, {
            method: 'DELETE',
          });
          toast('Registration deleted');
          await render();
        });
      });
    };

    await render();
  };

  const developerProjects = async ({ fetchJSON, root, user, toast }) => {
    const render = async () => {
      const { files, history, comments } = await fetchJSON('/api/developer/projects');
      root.innerHTML = `
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Upload Project File</h3></div>
          <form id="uploadProjectForm" class="grid-cards">
            <div class="form-group"><label>Folder Path</label><input class="form-control" name="folder_path" value="/"></div>
            <div class="form-group"><label>File</label><input class="form-control" name="file" type="file" required></div>
            <div class="form-group"><button class="btn btn-primary" type="submit">Upload</button></div>
          </form>
        </div>
      `;

      const rows = files
        .map((f) => {
          const cmts = comments[String(f.id)] || [];
          return `
          <tr>
            <td>${f.id}</td>
            <td>${htmlEscape(f.folder_path || '/')}</td>
            <td>${htmlEscape(f.filename)}</td>
            <td>${htmlEscape(f.filetype || '-')}</td>
            <td>${htmlEscape(f.uploader_name || '-')}</td>
            <td>
              <button class="btn btn-sm btn-info edit-file-btn" data-id="${f.id}">Edit</button>
              ${
                user.role.endsWith('_head')
                  ? `<button class="btn btn-sm btn-danger delete-file-btn" data-id="${f.id}">Delete</button>`
                  : ''
              }
              <button class="btn btn-sm btn-success comment-file-btn" data-id="${f.id}">Comment (${cmts.length})</button>
            </td>
          </tr>
        `;
        })
        .join('');
      root.insertAdjacentHTML('beforeend', table(['ID', 'Folder', 'Filename', 'Type', 'Uploader', 'Actions'], rows));

      root.insertAdjacentHTML(
        'beforeend',
        `
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Recent File History</h3></div>
          ${(history || [])
            .map(
              (h) => `
            <div class="announcement-card">
              <strong>${htmlEscape(h.filename)}</strong> - ${htmlEscape(h.change_summary || 'Update')}<br>
              <span class="text-muted">${htmlEscape(h.editor_name || 'Unknown')} | ${formatDate(h.changed_at)}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `
      );

      document.getElementById('uploadProjectForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON('/api/developer/projects/upload', {
          method: 'POST',
          body: new FormData(event.currentTarget),
        });
        toast('Project file uploaded');
        await render();
      });

      root.querySelectorAll('.delete-file-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/developer/projects/files/${button.getAttribute('data-id')}`, { method: 'DELETE' });
          toast('File deleted');
          await render();
        });
      });

      root.querySelectorAll('.edit-file-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const fileId = button.getAttribute('data-id');
          const content = prompt('Paste new file content');
          if (content === null) return;
          const change_summary = prompt('Change summary', 'Update file') || 'Update file';
          await fetchJSON(`/api/developer/projects/files/${fileId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_content: content, change_summary }),
          });
          toast('File saved');
          await render();
        });
      });

      root.querySelectorAll('.comment-file-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const fileId = button.getAttribute('data-id');
          const comment = prompt('Comment');
          if (!comment) return;
          await fetchJSON(`/api/developer/projects/files/${fileId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment }),
          });
          toast('Comment added');
          await render();
        });
      });
    };

    await render();
  };

  const developerEditor = async ({ fetchJSON, root, toast }) => {
    root.innerHTML = `
      <div class="panel">
        <div class="panel-header"><h3 class="panel-title">SQL Query Sandbox (Read-Only)</h3></div>
        <form id="sqlForm">
          <div class="form-group">
            <textarea class="form-control" name="sql_query" rows="6" placeholder="SELECT * FROM users LIMIT 10;" required></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Run Query</button>
        </form>
      </div>
      <div class="panel">
        <pre id="sqlOutput" style="white-space:pre-wrap;"></pre>
      </div>
    `;

    document.getElementById('sqlForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = collectForm(event.currentTarget);
      const result = await fetchJSON('/api/developer/editor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      document.getElementById('sqlOutput').textContent = JSON.stringify(result.rows, null, 2);
      toast('Query executed');
    });
  };

  const multimediaRepositories = async ({ fetchJSON, root, user, toast }) => {
    const canCreate = user.role === 'multimedia_head';

    const render = async () => {
      const { repositories, uploads } = await fetchJSON('/api/multimedia/repositories');
      root.innerHTML = `
        ${
          canCreate
            ? `
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Create Repository</h3></div>
          <form id="repoForm" class="grid-cards">
            <div class="form-group"><label>Name</label><input class="form-control" name="name" required></div>
            <div class="form-group"><button class="btn btn-primary" type="submit">Create</button></div>
          </form>
        </div>
      `
            : ''
        }
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Upload File</h3></div>
          <form id="uploadForm" class="grid-cards">
            <div class="form-group"><label>Repository</label>
              <select class="form-control" name="repository_id" required>
                ${repositories.map((r) => `<option value="${r.id}">${htmlEscape(r.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>File</label><input class="form-control" name="file" type="file" required></div>
            <div class="form-group"><button class="btn btn-primary" type="submit">Upload</button></div>
          </form>
        </div>
      `;

      const repoRows = repositories
        .map(
          (r) => `
        <tr>
          <td>${r.id}</td>
          <td>${htmlEscape(r.name)}</td>
          <td>${htmlEscape(r.creator_name || '-')}</td>
          <td>${formatDate(r.created_at)}</td>
          <td>${canCreate ? `<button class="btn btn-sm btn-danger del-repo-btn" data-id="${r.id}">Delete</button>` : '-'}</td>
        </tr>
      `
        )
        .join('');
      root.insertAdjacentHTML('beforeend', table(['ID', 'Name', 'Created By', 'Created At', 'Actions'], repoRows));

      const uploadRows = uploads
        .map(
          (u) => `
        <tr>
          <td>${u.id}</td>
          <td>${htmlEscape(u.repo_name || '-')}</td>
          <td>${htmlEscape(u.filename)}</td>
          <td>${htmlEscape(u.uploader_name || '-')}</td>
          <td>${htmlEscape(u.task_status)}</td>
          <td>
            <select class="form-control upload-status" data-id="${u.id}">
              ${['not_complete', 'processing', 'done']
                .map((s) => `<option value="${s}" ${u.task_status === s ? 'selected' : ''}>${s}</option>`)
                .join('')}
            </select>
          </td>
        </tr>
      `
        )
        .join('');
      root.insertAdjacentHTML(
        'beforeend',
        table(['ID', 'Repository', 'Filename', 'Uploader', 'Status', 'Update Status'], uploadRows)
      );

      document.getElementById('repoForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON('/api/multimedia/repositories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectForm(event.currentTarget)),
        });
        toast('Repository created');
        await render();
      });

      document.getElementById('uploadForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON('/api/multimedia/repositories/uploads', {
          method: 'POST',
          body: new FormData(event.currentTarget),
        });
        toast('File uploaded');
        await render();
      });

      root.querySelectorAll('.del-repo-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          await fetchJSON(`/api/multimedia/repositories/${button.getAttribute('data-id')}`, { method: 'DELETE' });
          toast('Repository deleted');
          await render();
        });
      });

      root.querySelectorAll('.upload-status').forEach((select) => {
        select.addEventListener('change', async () => {
          await fetchJSON(`/api/multimedia/uploads/${select.getAttribute('data-id')}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_status: select.value }),
          });
          toast('Upload status updated');
        });
      });
    };

    await render();
  };

  const profilePage = async ({ fetchJSON, root, toast }) => {
    const render = async () => {
      const { profile } = await fetchJSON('/api/profile/me');
      root.innerHTML = `
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Profile Details</h3></div>
          <form id="profileForm" class="grid-cards">
            <div class="form-group"><label>Username</label><input class="form-control" value="${htmlEscape(
              profile.username
            )}" disabled></div>
            <div class="form-group"><label>Name</label><input class="form-control" name="name" value="${htmlEscape(
              profile.name
            )}" required></div>
            <div class="form-group"><label>Email</label><input class="form-control" name="email" type="email" value="${htmlEscape(
              profile.email
            )}" required></div>
            <div class="form-group"><label>Contact</label><input class="form-control" name="contact_number" value="${htmlEscape(
              profile.contact_number || ''
            )}"></div>
            <div class="form-group"><button class="btn btn-primary" type="submit">Save Profile</button></div>
          </form>
        </div>
        <div class="panel">
          <div class="panel-header"><h3 class="panel-title">Profile Picture</h3></div>
          <img src="/${(profile.profile_picture || 'assets/images/default-avatar.png').replace(/^\/+/, '')}" alt="Profile Picture" style="width:96px;height:96px;border-radius:50%;object-fit:cover;margin-bottom:12px;">
          <form id="pictureForm">
            <div class="form-group"><input class="form-control" name="profile_picture" type="file" required></div>
            <button class="btn btn-primary" type="submit">Upload Picture</button>
          </form>
        </div>
      `;

      document.getElementById('profileForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON('/api/profile/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectForm(event.currentTarget)),
        });
        toast('Profile updated');
        await render();
      });

      document.getElementById('pictureForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        await fetchJSON('/api/profile/picture', {
          method: 'POST',
          body: new FormData(event.currentTarget),
        });
        toast('Profile picture updated');
        await render();
      });
    };

    await render();
  };

  return {
    'superadmin-dashboard': adminDashboard,
    'superadmin-users': adminUsers,
    'superadmin-teams': adminTeams,
    'developer-dashboard': teamDashboard('developer'),
    'developer-announcements': announcementsPage('developer'),
    'developer-members': membersPage('developer'),
    'developer-gsite-posts': gsitePostsPage('developer'),
    'developer-gsite-events': developerEvents,
    'developer-event-registrations': developerEventRegistrations,
    'developer-projects': developerProjects,
    'developer-editor': developerEditor,
    'multimedia-dashboard': teamDashboard('multimedia'),
    'multimedia-announcements': announcementsPage('multimedia'),
    'multimedia-members': membersPage('multimedia'),
    'multimedia-gsite-posts': gsitePostsPage('multimedia'),
    'multimedia-repositories': multimediaRepositories,
    profile: profilePage,
  };
})();
