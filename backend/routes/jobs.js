// routes/jobs.js
const express = require('express');
const { query, run } = require('../database');
const { auth, requireRole } = require('../middleware/auth');
const emailService = require('../utils/email');
const router  = express.Router();

// GET /api/jobs — All open jobs (public)
router.get('/', (req, res) => {
  try {
    const { status, limit, search } = req.query;
    let sql = `
      SELECT j.*, c.company_name, c.id as company_table_id
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (status)  { sql += ' AND j.status = ?'; params.push(status); }
    if (search)  { sql += ' AND (j.title LIKE ? OR j.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY j.created_at DESC';
    if (limit)   { sql += ' LIMIT ?'; params.push(parseInt(limit)); }

    const jobs = query(sql, params);
    res.json({ jobs });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch jobs.' });
  }
});

// GET /api/jobs/:id
router.get('/:id', (req, res) => {
  try {
    const jobs = query(`
      SELECT j.*, c.company_name, c.description as company_desc, c.industry as company_industry
      FROM jobs j JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?`, [req.params.id]);
    if (!jobs.length) return res.status(404).json({ message: 'Job not found.' });
    res.json({ job: jobs[0] });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch job.' });
  }
});

// POST /api/jobs — Company posts a job
router.post('/', auth, requireRole('company'), async (req, res) => {
  try {
    const { title, description, requirements, type, industry, location, salary, min_cgpa, openings, deadline } = req.body;
    if (!title || !description || !deadline)
      return res.status(400).json({ message: 'Title, description and deadline are required.' });

    // Get company
    const companies = query('SELECT * FROM companies WHERE user_id = ?', [req.user.id]);
    if (!companies.length) return res.status(404).json({ message: 'Company profile not found.' });
    const company = companies[0];

    const result = run(`
      INSERT INTO jobs (company_id,title,description,requirements,type,industry,location,salary,min_cgpa,openings,deadline)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [company.id, title, description, requirements||'', type||'Full-time', industry||'', location||'Kigali, Rwanda', salary||'', min_cgpa||null, openings||1, deadline]);

    const job = { id: result.lastID, title, type, location, salary, deadline, openings };

    // Notify admin
    const admins = query("SELECT email FROM users WHERE role='admin'");
    admins.forEach(a => emailService.sendJobPostedAdmin(a.email, job, company).catch(console.error));

    // Notify ALL students with a new job alert email
    const students = query(`SELECT u.id as user_id, u.name, u.email FROM users u
      JOIN students s ON s.user_id = u.id WHERE u.role='student'`);
    students.forEach(stu => {
      emailService.sendNewJobAlert(stu, job, company).catch(console.error);
      run('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)',
        [stu.user_id, 'new_job', `💼 New job posted — ${title} at ${company.company_name}`]);
    });

    res.status(201).json({ job, message: `Job posted successfully! ${students.length} student(s) notified by email.` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to post job.' });
  }
});

// PUT /api/jobs/:id — Update job
router.put('/:id', auth, requireRole('company'), (req, res) => {
  try {
    const { title, description, requirements, type, location, salary, deadline, status } = req.body;
    run(`UPDATE jobs SET title=?,description=?,requirements=?,type=?,location=?,salary=?,deadline=?,status=?
         WHERE id=?`,
      [title, description, requirements, type, location, salary, deadline, status, req.params.id]);
    res.json({ message: 'Job updated successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update job.' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', auth, requireRole('company','admin'), (req, res) => {
  try {
    run('UPDATE jobs SET status=? WHERE id=?', ['closed', req.params.id]);
    res.json({ message: 'Job closed successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to close job.' });
  }
});

module.exports = router;