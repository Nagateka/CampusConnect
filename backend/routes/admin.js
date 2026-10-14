// routes/admin.js
const express = require('express');
const { query } = require('../database');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/admin/stats
router.get('/stats', auth, requireRole('admin'), (req, res) => {
  try {
    res.json({
      students:       query("SELECT COUNT(*) as c FROM users WHERE role='student'")[0]?.c || 0,
      companies:      query("SELECT COUNT(*) as c FROM users WHERE role='company'")[0]?.c || 0,
      jobs:           query("SELECT COUNT(*) as c FROM jobs WHERE status='open'")[0]?.c || 0,
      placed:         query("SELECT COUNT(*) as c FROM applications WHERE status='selected'")[0]?.c || 0,
      apps:           query("SELECT COUNT(*) as c FROM applications")[0]?.c || 0,
      newToday:       query("SELECT COUNT(*) as c FROM users WHERE DATE(created_at)=DATE('now')"  )[0]?.c || 0,
      placementRate:  Math.round((query("SELECT COUNT(*) as c FROM applications WHERE status='selected'")[0]?.c || 0) /
                      Math.max(query("SELECT COUNT(*) as c FROM users WHERE role='student'")[0]?.c || 1, 1) * 100),
    });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/admin/students
router.get('/students', auth, requireRole('admin'), (req, res) => {
  try {
    const students = query(`
      SELECT u.id, u.name, u.email, u.created_at,
             s.university, s.branch, s.year, s.cgpa, s.skills,
             (SELECT COUNT(*) FROM applications WHERE student_id=s.id) as application_count,
             (SELECT COUNT(*) FROM applications WHERE student_id=s.id AND status='selected') as is_placed
      FROM users u JOIN students s ON u.id=s.user_id
      ORDER BY u.created_at DESC`);
    res.json({ students });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/admin/companies
router.get('/companies', auth, requireRole('admin'), (req, res) => {
  try {
    const companies = query(`
      SELECT c.id, c.company_name as name, c.industry, c.description, u.email as contact_email, u.created_at,
             (SELECT COUNT(*) FROM jobs WHERE company_id=c.id) as job_count,
             (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id=j.id WHERE j.company_id=c.id) as applicant_count,
             (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id=j.id WHERE j.company_id=c.id AND a.status='selected') as hired_count
      FROM companies c JOIN users u ON c.user_id=u.id
      ORDER BY u.created_at DESC`);
    res.json({ companies });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/admin/recent-users
router.get('/recent-users', auth, requireRole('admin'), (req, res) => {
  try {
    const users = query("SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 10");
    res.json({ users });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/admin/recent-applications
router.get('/recent-applications', auth, requireRole('admin'), (req, res) => {
  try {
    const apps = query(`SELECT a.status, u.name as student_name, j.title as job_title
      FROM applications a JOIN students s ON a.student_id=s.id
      JOIN users u ON s.user_id=u.id JOIN jobs j ON a.job_id=j.id
      ORDER BY a.applied_at DESC LIMIT 8`);
    res.json({ applications: apps });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/notifications
router.get('/notifications', auth, (req, res) => {
  try {
    const notifs = query("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20", [req.user.id]);
    res.json({ notifications: notifs });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/admin/jobs — All jobs across all companies
router.get('/jobs', auth, requireRole('admin'), (req, res) => {
  try {
    const jobs = query(`
      SELECT j.*, c.company_name,
        (SELECT COUNT(*) FROM applications WHERE job_id=j.id) as applicant_count,
        (SELECT COUNT(*) FROM applications WHERE job_id=j.id AND status='selected') as hired_count
      FROM jobs j JOIN companies c ON j.company_id = c.id
      ORDER BY j.created_at DESC`);
    res.json({ jobs });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// PUT /api/admin/jobs/:id/status — Admin closes/reopens a job
router.put('/jobs/:id/status', auth, requireRole('admin'), (req, res) => {
  try {
    const { run } = require('../database');
    const { status } = req.body;
    run('UPDATE jobs SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: `Job marked as ${status}.` });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/admin/applications — All applications platform-wide
router.get('/applications', auth, requireRole('admin'), (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT a.*, u.name as student_name, u.email as student_email,
             s.branch, s.cgpa,
             j.title as job_title, c.company_name
      FROM applications a
      JOIN students s  ON a.student_id = s.id
      JOIN users u     ON s.user_id    = u.id
      JOIN jobs j      ON a.job_id     = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    if (search) { sql += ' AND (u.name LIKE ? OR j.title LIKE ? OR c.company_name LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    sql += ' ORDER BY a.applied_at DESC';
    res.json({ applications: query(sql, params) });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/admin/reports — Aggregated report data
router.get('/reports', auth, requireRole('admin'), (req, res) => {
  try {
    const overview = {
      totalStudents:  query("SELECT COUNT(*) as c FROM users WHERE role='student'")[0]?.c || 0,
      totalCompanies: query("SELECT COUNT(*) as c FROM users WHERE role='company'")[0]?.c || 0,
      totalJobs:      query("SELECT COUNT(*) as c FROM jobs")[0]?.c || 0,
      totalApps:      query("SELECT COUNT(*) as c FROM applications")[0]?.c || 0,
      totalPlaced:    query("SELECT COUNT(*) as c FROM applications WHERE status='selected'")[0]?.c || 0,
      totalRejected:  query("SELECT COUNT(*) as c FROM applications WHERE status='rejected'")[0]?.c || 0,
    };

    const byStatus = query(`SELECT status, COUNT(*) as count FROM applications GROUP BY status`);

    const byBranch = query(`
      SELECT s.branch, COUNT(DISTINCT a.id) as applications, 
             SUM(CASE WHEN a.status='selected' THEN 1 ELSE 0 END) as placed
      FROM students s
      LEFT JOIN applications a ON a.student_id = s.id
      WHERE s.branch IS NOT NULL AND s.branch != ''
      GROUP BY s.branch`);

    const byCompany = query(`
      SELECT c.company_name, COUNT(DISTINCT j.id) as jobs_posted,
             COUNT(DISTINCT a.id) as applications,
             SUM(CASE WHEN a.status='selected' THEN 1 ELSE 0 END) as hired
      FROM companies c
      LEFT JOIN jobs j ON j.company_id = c.id
      LEFT JOIN applications a ON a.job_id = j.id
      GROUP BY c.id
      ORDER BY hired DESC`);

    const monthly = query(`
      SELECT strftime('%Y-%m', applied_at) as month, COUNT(*) as count
      FROM applications GROUP BY month ORDER BY month`);

    res.json({ overview, byStatus, byBranch, byCompany, monthly });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to generate report.' }); }
});

// GET /api/admin/settings — current admin profile
router.get('/settings', auth, requireRole('admin'), (req, res) => {
  try {
    const rows = query('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
    res.json({ settings: rows[0] || {} });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// PUT /api/admin/settings — update admin profile / password
router.put('/settings', auth, requireRole('admin'), async (req, res) => {
  try {
    const { run } = require('../database');
    const bcrypt = require('bcryptjs');
    const { name, currentPassword, newPassword } = req.body;

    if (name) run('UPDATE users SET name=? WHERE id=?', [name, req.user.id]);

    if (newPassword) {
      const rows = query('SELECT password FROM users WHERE id=?', [req.user.id]);
      const valid = await bcrypt.compare(currentPassword||'', rows[0]?.password||'');
      if (!valid) return res.status(401).json({ message: 'Current password is incorrect.' });
      const hash = await bcrypt.hash(newPassword, 10);
      run('UPDATE users SET password=? WHERE id=?', [hash, req.user.id]);
    }

    res.json({ message: 'Settings updated successfully.' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update settings.' }); }
});

module.exports = router;