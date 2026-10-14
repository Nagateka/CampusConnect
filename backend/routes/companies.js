// routes/companies.js
const express = require('express');
const { query, run } = require('../database');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/companies/stats
router.get('/stats', auth, requireRole('company'), (req, res) => {
  try {
    const comp = query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
    if (!comp.length) return res.json({ jobs:0, apps:0, interviews:0, hired:0 });
    const cid = comp[0].id;
    res.json({
      jobs:       query("SELECT COUNT(*) as c FROM jobs WHERE company_id=? AND status='open'", [cid])[0]?.c || 0,
      apps:       query("SELECT COUNT(*) as c FROM applications a JOIN jobs j ON a.job_id=j.id WHERE j.company_id=?", [cid])[0]?.c || 0,
      interviews: query("SELECT COUNT(*) as c FROM applications a JOIN jobs j ON a.job_id=j.id WHERE j.company_id=? AND a.status='interviewed'", [cid])[0]?.c || 0,
      hired:      query("SELECT COUNT(*) as c FROM applications a JOIN jobs j ON a.job_id=j.id WHERE j.company_id=? AND a.status='selected'", [cid])[0]?.c || 0,
    });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/companies/jobs
router.get('/jobs', auth, requireRole('company'), (req, res) => {
  try {
    const comp = query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
    if (!comp.length) return res.json({ jobs: [] });
    const jobs = query(`SELECT j.*, (SELECT COUNT(*) FROM applications WHERE job_id=j.id) as applicant_count
      FROM jobs j WHERE j.company_id=? ORDER BY j.created_at DESC`, [comp[0].id]);
    res.json({ jobs });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/companies/applicants
router.get('/applicants', auth, requireRole('company'), (req, res) => {
  try {
    const comp = query('SELECT id FROM companies WHERE user_id=?', [req.user.id]);
    if (!comp.length) return res.json({ applications: [] });
    const { job_id, status, limit } = req.query;
    let sql = `SELECT a.*, u.name as student_name, u.email as student_email,
      s.branch, s.cgpa, s.university, s.skills, j.title as job_title
      FROM applications a
      JOIN students s ON a.student_id=s.id
      JOIN users u ON s.user_id=u.id
      JOIN jobs j ON a.job_id=j.id
      WHERE j.company_id=?`;
    const params = [comp[0].id];
    if (job_id) { sql += ' AND j.id=?'; params.push(job_id); }
    if (status) { sql += ' AND a.status=?'; params.push(status); }
    sql += ' ORDER BY a.applied_at DESC';
    if (limit)  { sql += ' LIMIT ?'; params.push(parseInt(limit)); }
    res.json({ applications: query(sql, params) });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// GET /api/companies/settings
router.get('/settings', auth, requireRole('company'), (req, res) => {
  try {
    const rows = query(`SELECT u.id,u.name,u.email,c.company_name,c.industry,c.description,c.website
      FROM users u JOIN companies c ON c.user_id=u.id WHERE u.id=?`, [req.user.id]);
    res.json({ settings: rows[0] || {} });
  } catch (e) { res.status(500).json({ message: 'Failed.' }); }
});

// PUT /api/companies/settings
router.put('/settings', auth, requireRole('company'), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, companyName, industry, description, website, currentPassword, newPassword } = req.body;

    if (name) run('UPDATE users SET name=? WHERE id=?', [name, req.user.id]);
    run('UPDATE companies SET company_name=?,industry=?,description=?,website=? WHERE user_id=?',
      [companyName, industry, description, website, req.user.id]);

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