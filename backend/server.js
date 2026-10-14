// ============================================
//  server.js — CampusConnect(UTB) Backend
//  Node.js + Express + SQLite + Nodemailer
// ============================================

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { initDB } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', '*'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/jobs',         require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/interviews',   require('./routes/interviews'));
app.use('/api/students',     require('./routes/students'));
app.use('/api/companies',    require('./routes/companies'));
app.use('/api/admin',        require('./routes/admin'));

// Notifications (also in admin router for convenience)
app.get('/api/notifications', require('./middleware/auth').auth, (req, res) => {
  const { query } = require('./database');
  try {
    const notifs = query("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20", [req.user.id]);
    res.json({ notifications: notifs.map(n => ({ ...n, read: n.read === 1 })) });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

app.put('/api/notifications/:id/read', require('./middleware/auth').auth, (req, res) => {
  const { run } = require('./database');
  try {
    run('UPDATE notifications SET read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read.' });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

app.put('/api/notifications/read-all', require('./middleware/auth').auth, (req, res) => {
  const { run } = require('./database');
  try {
    run('UPDATE notifications SET read=1 WHERE user_id=?', [req.user.id]);
    res.json({ message: 'All marked as read.' });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status:  'ok',
    message: '✅ CampusConnect(UTB) API is running',
    time:    new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── 404 handler ──
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ message: 'Internal server error. Please try again.' });
});

// ── Start server ──
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log('\n🚀 ================================');
      console.log(`   CampusConnect(UTB) API — Running!`);
      console.log(`   http://localhost:${PORT}/api/health`);
      console.log('================================\n');
      console.log('📌 Demo accounts:');
      console.log('   Admin:   admin@CampusConnect(UTB).com   / admin123');
      console.log('   Student: student@demo.com       / student123');
      console.log('   Company: company@demo.com       / company123\n');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();