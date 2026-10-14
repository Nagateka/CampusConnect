// ============================================
//  API.js — Central API helper
//  All backend calls go through this file
// ============================================

const API_BASE = 'http://localhost:3000/api';

const API = {
  async request(method, endpoint, body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);

      // Handle session expired
      if (res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Session expired. Please sign in again.', 'error');
        setTimeout(() => window.location.href = '/login.html', 1500);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      return data;

    } catch (err) {
      // Backend not running
      if (err.message === 'Failed to fetch') {
        showToast('⚠️ Cannot connect to server. Make sure backend is running.', 'error');
        throw new Error('Server not reachable. Run: node server.js in backend folder.');
      }
      throw err;
    }
  },

  get:    (endpoint)       => API.request('GET',    endpoint),
  post:   (endpoint, body) => API.request('POST',   endpoint, body),
  put:    (endpoint, body) => API.request('PUT',    endpoint, body),
  delete: (endpoint)       => API.request('DELETE', endpoint),
};

// ── Toast notifications ──
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--gray-400);margin-left:8px;font-size:1rem;">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Auth guards ──
function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return null;
  }
  return JSON.parse(localStorage.getItem('user') || '{}');
}

function requireRole(role) {
  const user = requireAuth();
  if (!user) return null;
  if (user.role !== role) {
    const routes = {
      admin:   '/admin/dashboard.html',
      student: '/student/dashboard.html',
      company: '/company/dashboard.html'
    };
    window.location.href = routes[user.role] || '/login.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Signed out successfully.', 'info');
  setTimeout(() => window.location.href = '/login.html', 800);
}

// ── Helpers ──
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0)  return `${days}d ago`;
  if (hrs > 0)   return `${hrs}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}

function statusBadge(status) {
  const map = {
    applied:     { cls: 'badge-blue',   label: 'Applied' },
    shortlisted: { cls: 'badge-orange', label: '⭐ Shortlisted' },
    interviewed: { cls: 'badge-blue',   label: '📅 Interviewed' },
    selected:    { cls: 'badge-green',  label: '🏆 Selected' },
    rejected:    { cls: 'badge-red',    label: 'Rejected' },
    open:        { cls: 'badge-green',  label: 'Open' },
    closed:      { cls: 'badge-gray',   label: 'Closed' },
    upcoming:    { cls: 'badge-blue',   label: 'Upcoming' },
  };
  const s = map[status] || { cls: 'badge-gray', label: status };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

function initSidebar(activeId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.name) return;

  const nameEl   = document.getElementById('sidebar-user-name');
  const roleEl   = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');

  if (nameEl)   nameEl.textContent   = user.name;
  if (roleEl)   roleEl.textContent   = user.role?.charAt(0).toUpperCase() + user.role?.slice(1);
  if (avatarEl) avatarEl.textContent = user.name?.charAt(0).toUpperCase();

  if (activeId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(activeId);
    if (el) el.classList.add('active');
  }
}