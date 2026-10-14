/* ============================================
   CAMPUSHIRE — upgrades.js
   All 6 professional features
============================================ */

// ══════════════════════════════════════════
// 1. DARK MODE
// ══════════════════════════════════════════
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('theme') || 'light';
    this.apply(saved);
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    this.apply(current === 'dark' ? 'light' : 'dark');
  }
};

// ══════════════════════════════════════════
// 2. SKELETON LOADERS
// ══════════════════════════════════════════
const Skeleton = {
  // Skeleton for stats grid (4 cards)
  stats() {
    return Array(4).fill(0).map(() => `
      <div class="skeleton-stat">
        <div class="skeleton" style="width:48px;height:48px;border-radius:10px;flex-shrink:0;"></div>
        <div style="flex:1;">
          <div class="skeleton skeleton-title" style="width:50%;height:28px;"></div>
          <div class="skeleton skeleton-text" style="width:70%;"></div>
        </div>
      </div>`).join('');
  },

  // Skeleton for table rows
  tableRows(count = 4) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton-row">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton-row-info">
          <div class="skeleton skeleton-text" style="width:55%;"></div>
          <div class="skeleton skeleton-text" style="width:35%;"></div>
        </div>
        <div class="skeleton skeleton-btn" style="margin-left:auto;"></div>
      </div>`).join('');
  },

  // Skeleton for job cards
  jobCards(count = 4) {
    return Array(count).fill(0).map(() => `
      <div class="card skeleton-card">
        <div style="display:flex;gap:14px;margin-bottom:14px;">
          <div class="skeleton" style="width:48px;height:48px;border-radius:10px;flex-shrink:0;"></div>
          <div style="flex:1;">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text" style="width:50%;"></div>
          </div>
        </div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:80%;"></div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <div class="skeleton" style="width:70px;height:22px;border-radius:99px;"></div>
          <div class="skeleton" style="width:90px;height:22px;border-radius:99px;"></div>
        </div>
      </div>`).join('');
  },

  // Show skeletons in a container, then replace with real content
  show(containerId, type = 'tableRows', count = 4) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const types = { stats: this.stats, tableRows: this.tableRows, jobCards: this.jobCards };
    el.innerHTML = (types[type] || this.tableRows).call(this, count);
  }
};

// ══════════════════════════════════════════
// 3. NOTIFICATION BELL
// ══════════════════════════════════════════
const Notifications = {
  items: [],

  async init(role) {
    this.role = role;
    await this.load();
    this.render();
    // Poll every 60s for new notifications
    setInterval(() => this.load().then(() => this.render()), 60000);
  },

  async load() {
    try {
      const res = await API.get('/notifications');
      this.items = res.notifications || [];
    } catch (e) {
      // Demo notifications
      this.items = this.getDemoNotifs();
    }
  },

  getDemoNotifs() {
    const role = this.role;
    if (role === 'student') return [
      { id:1, type:'shortlisted', message:'🎉 You were shortlisted at MTN Rwanda for Software Engineer', time: new Date(Date.now()-3600000).toISOString(), read: false, color:'#FFFBEB' },
      { id:2, type:'interview',   message:'📅 Interview scheduled — Bank of Kigali · Tomorrow 10:00 AM', time: new Date(Date.now()-7200000).toISOString(), read: false, color:'#EFF6FF' },
      { id:3, type:'applied',     message:'✅ Application submitted to Irembo — Data Analyst', time: new Date(Date.now()-86400000).toISOString(), read: true, color:'#ECFDF5' },
    ];
    if (role === 'company') return [
      { id:1, type:'application', message:'📋 New applicant — Alice Mukamana applied for Software Engineer', time: new Date(Date.now()-1800000).toISOString(), read: false, color:'#EFF6FF' },
      { id:2, type:'application', message:'📋 New applicant — Bob Nzeyimana applied for Software Engineer', time: new Date(Date.now()-3600000).toISOString(), read: false, color:'#EFF6FF' },
    ];
    return [
      { id:1, type:'system', message:'👤 New student registered — Alice Mukamana', time: new Date(Date.now()-1800000).toISOString(), read: false, color:'#EFF6FF' },
      { id:2, type:'system', message:'🏢 New company registered — MTN Rwanda', time: new Date(Date.now()-3600000).toISOString(), read: false, color:'#FFFBEB' },
      { id:3, type:'system', message:'💼 New job posted — Software Engineer at Irembo', time: new Date(Date.now()-7200000).toISOString(), read: true, color:'#ECFDF5' },
    ];
  },

  unreadCount() {
    return this.items.filter(n => !n.read).length;
  },

  render() {
    const wrapper = document.getElementById('notif-wrapper');
    if (!wrapper) return;

    const count = this.unreadCount();
    // Bell is always just the icon + count badge. Dropdown is closed by default (no 'open' class).
    wrapper.innerHTML = `
      <button class="icon-btn" onclick="Notifications.toggle()" id="notif-btn" style="position:relative;" aria-label="Notifications">
        🔔${count > 0 ? `<span class="notif-count">${count > 9 ? '9+' : count}</span>` : ''}
      </button>
      <div class="notif-dropdown" id="notif-dropdown">
        <div class="notif-header">
          <h4>Notifications ${count > 0 ? `<span style="color:var(--blue);font-size:0.8rem;font-weight:600;">(${count} new)</span>` : ''}</h4>
          ${count > 0 ? `<button class="notif-mark-read" onclick="Notifications.markAllRead()">Mark all read</button>` : ''}
        </div>
        <div class="notif-list">
          ${this.items.length === 0
            ? `<div class="notif-empty">🎉 You're all caught up!</div>`
            : this.items.map(n => `
              <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Notifications.markRead(${n.id})">
                <div class="notif-icon-wrap" style="background:${n.color || '#EFF6FF'}">
                  ${n.type === 'shortlisted' ? '⭐' : n.type === 'interview' ? '📅' : n.type === 'application' ? '📋' : n.type === 'selected' ? '🏆' : '🔔'}
                </div>
                <div class="notif-content">
                  <div class="notif-msg">${n.message}</div>
                  <div class="notif-time">${timeAgo(n.time)}</div>
                </div>
              </div>`).join('')
          }
        </div>
        <div class="notif-footer"><a href="#">View all notifications</a></div>
      </div>`;
    // Ensure dropdown always starts closed when re-rendered
    document.getElementById('notif-dropdown')?.classList.remove('open');
  },

  toggle() {
    const dd = document.getElementById('notif-dropdown');
    if (!dd) return;
    dd.classList.toggle('open');
    // Close on outside click
    if (dd.classList.contains('open')) {
      setTimeout(() => {
        document.addEventListener('click', this._outsideClick = (e) => {
          if (!document.getElementById('notif-wrapper')?.contains(e.target)) {
            dd.classList.remove('open');
            document.removeEventListener('click', this._outsideClick);
          }
        });
      }, 0);
    }
  },

  markRead(id) {
    const n = this.items.find(n => n.id === id);
    if (n) n.read = true;
    this.render();
    try { API.put(`/notifications/${id}/read`, {}); } catch (e) {}
  },

  markAllRead() {
    this.items.forEach(n => n.read = true);
    this.render();
    try { API.put('/notifications/read-all', {}); } catch (e) {}
  }
};

// ══════════════════════════════════════════
// 4. MOBILE SIDEBAR
// ══════════════════════════════════════════
const MobileSidebar = {
  init() {
    // Add overlay div if not present
    if (!document.getElementById('sidebar-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      overlay.onclick = () => this.close();
      document.body.appendChild(overlay);
    }
  },

  open() {
    document.querySelector('.sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  },

  toggle() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar?.classList.contains('open')) this.close();
    else this.open();
  }
};

// ══════════════════════════════════════════
// 5. CHARTS (using Canvas API — no library needed)
// ══════════════════════════════════════════
const Charts = {
  // Simple bar chart
  bar(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#8B949E' : '#94A3B8';
    const gridColor = isDark ? '#21262D' : '#F1F5F9';

    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = options.height || 220;
    ctx.clearRect(0, 0, W, H);

    const pad = { top:20, right:20, bottom:40, left:44 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const maxVal = Math.max(...data, 1);
    const barW   = (chartW / data.length) * 0.6;
    const gap    = chartW / data.length;

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(t => {
      const y = pad.top + chartH * (1 - t);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * t), pad.left - 6, y + 4);
    });

    // Bars
    const colors = options.colors || ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];
    data.forEach((val, i) => {
      const x = pad.left + gap * i + (gap - barW) / 2;
      const barH = (val / maxVal) * chartH;
      const y = pad.top + chartH - barH;

      // Bar
      const color = options.singleColor ? colors[0] : colors[i % colors.length];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4,4,0,0]);
      ctx.fill();

      // Value on top
      if (val > 0) {
        ctx.fillStyle = isDark ? '#C9D1D9' : '#1E293B';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val, x + barW/2, y - 6);
      }

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = labels[i] || '';
      ctx.fillText(label.length > 8 ? label.slice(0,8)+'…' : label, x + barW/2, H - pad.bottom + 16);
    });
  },

  // Donut chart
  donut(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = options.height || 200;
    ctx.clearRect(0, 0, W, H);

    const colors = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6'];
    const total  = data.reduce((a,b) => a+b, 0) || 1;
    const cx = W / 2, cy = H / 2;
    const r  = Math.min(W, H) * 0.38;
    const ir = r * 0.6;
    let angle = -Math.PI / 2;

    data.forEach((val, i) => {
      const slice = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      angle += slice;
    });

    // Inner circle (donut hole)
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.beginPath();
    ctx.arc(cx, cy, ir, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#161B22' : 'white';
    ctx.fill();

    // Center text
    ctx.fillStyle = isDark ? '#C9D1D9' : '#1E293B';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 2);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#6E7681' : '#94A3B8';
    ctx.fillText('Total', cx, cy + 18);
  },

  // Line chart
  line(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#8B949E' : '#94A3B8';
    const gridColor = isDark ? '#21262D' : '#F1F5F9';

    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = options.height || 200;
    ctx.clearRect(0, 0, W, H);

    const pad = { top:20, right:20, bottom:36, left:44 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const allVals = datasets.flatMap(d => d.data);
    const maxVal  = Math.max(...allVals, 1);

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach(t => {
      const y = pad.top + chartH * (1 - t);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = textColor; ctx.font = '11px Inter'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * t), pad.left - 6, y + 4);
    });

    // X labels
    labels.forEach((l, i) => {
      const x = pad.left + (i / (labels.length - 1)) * chartW;
      ctx.fillStyle = textColor; ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(l, x, H - pad.bottom + 16);
    });

    // Lines
    const colors = ['#2563EB','#10B981','#F59E0B'];
    datasets.forEach((dataset, di) => {
      const color = dataset.color || colors[di % colors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      dataset.data.forEach((val, i) => {
        const x = pad.left + (i / (dataset.data.length - 1)) * chartW;
        const y = pad.top  + chartH * (1 - val / maxVal);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Dots
      dataset.data.forEach((val, i) => {
        const x = pad.left + (i / (dataset.data.length - 1)) * chartW;
        const y = pad.top  + chartH * (1 - val / maxVal);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = isDark ? '#161B22' : 'white';
        ctx.lineWidth = 2; ctx.stroke();
      });
    });
  }
};

// ══════════════════════════════════════════
// 6. PRINT / PDF EXPORT
// ══════════════════════════════════════════
const Printer = {
  // Print current page with report header
  print(title = 'CampusHire Report') {
    // Inject print header temporarily
    const header = document.createElement('div');
    header.className = 'print-header';
    header.id = 'print-header-inject';
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex:1;">
        <div style="width:40px;height:40px;background:#2563EB;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;">🎓</div>
        <div>
          <h1 style="font-size:1.25rem;font-weight:800;margin:0;">CampusHire</h1>
          <p style="margin:0;font-size:0.8rem;color:#666;">Campus Recruitment Management System</p>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;">${title}</div>
        <div style="font-size:0.8rem;color:#666;">Generated: ${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</div>
      </div>`;
    const content = document.querySelector('.page-content');
    if (content) content.prepend(header);

    window.print();

    setTimeout(() => header.remove(), 500);
  },

  // Export table data as CSV
  exportCSV(data, filename = 'report') {
    if (!data.length) { showToast('No data to export.', 'error'); return; }
    const headers = Object.keys(data[0]);
    const rows = [headers, ...data.map(row => headers.map(h => `"${(row[h]||'').toString().replace(/"/g,'""')}"`))]
      .map(r => r.join(',')).join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('✅ CSV exported!', 'success');
  }
};

// ══════════════════════════════════════════
// INIT — call this on every dashboard page
// ══════════════════════════════════════════
function initUpgrades(role) {
  // Dark mode removed — platform stays on the original light theme always
  document.documentElement.removeAttribute('data-theme');

  // Mobile sidebar
  MobileSidebar.init();

  // Notifications
  Notifications.init(role);

  // Inject topbar buttons (mobile menu + notifications only, no theme toggle)
  injectTopbarControls();
}

function injectTopbarControls() {
  const actions = document.querySelector('.topbar-actions');
  if (!actions) return;

  // Mobile menu button (prepend)
  const menuBtn = document.createElement('button');
  menuBtn.className = 'mobile-menu-btn';
  menuBtn.innerHTML = '☰';
  menuBtn.onclick = () => MobileSidebar.toggle();
  actions.prepend(menuBtn);

  // Notification wrapper (replace existing bell)
  const existingBell = actions.querySelector('.icon-btn');
  const notifWrapper = document.createElement('div');
  notifWrapper.id = 'notif-wrapper';
  notifWrapper.className = 'notif-wrapper';
  if (existingBell) existingBell.replaceWith(notifWrapper);
  else actions.insertBefore(notifWrapper, menuBtn.nextSibling);
}