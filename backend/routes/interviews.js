// routes/interviews.js
const express = require('express');
const { query, run } = require('../database');
const { auth, requireRole } = require('../middleware/auth');
const emailService = require('../utils/email');
const router = express.Router();

// POST /api/interviews — Schedule interview
router.post('/', auth, requireRole('company'), async (req, res) => {
  try {
    const { application_id, scheduled_at, mode, location, notes, duration } = req.body;
    if (!application_id || !scheduled_at)
      return res.status(400).json({ message: 'Application ID and scheduled date are required.' });

    const result = run(`INSERT INTO interviews (application_id,scheduled_at,mode,location,notes,duration)
      VALUES (?,?,?,?,?,?)`, [application_id, scheduled_at, mode||'In-person', location||'', notes||'', duration||60]);

    // Update application status to interviewed
    run("UPDATE applications SET status='interviewed', updated_at=CURRENT_TIMESTAMP WHERE id=?", [application_id]);

    // Get full info for email
    const apps = query(`
      SELECT a.*, u.name as student_name, u.email as student_email,
             j.title as job_title, c.company_name
      FROM applications a
      JOIN students s  ON a.student_id = s.id
      JOIN users u     ON s.user_id    = u.id
      JOIN jobs j      ON a.job_id     = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = ?`, [application_id]);

    if (apps.length) {
      const app = apps[0];
      const student = { name: app.student_name, email: app.student_email };
      const job     = { title: app.job_title };
      const company = { company_name: app.company_name };
      const interview = { scheduled_at, mode, location, notes, duration };

      // Add notification
      const studentUser = query('SELECT user_id FROM students WHERE id = ?', [app.student_id]);
      if (studentUser.length) {
        run('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)',
          [studentUser[0].user_id, 'interview', `📅 Interview scheduled — ${app.company_name} · ${new Date(scheduled_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`]);
      }

      emailService.sendInterviewScheduled(student, job, company, interview).catch(console.error);
    }

    res.status(201).json({ interview: { id: result.lastID }, message: 'Interview scheduled! Candidate has been notified by email.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to schedule interview.' });
  }
});

// GET /api/interviews — Company's interviews
router.get('/', auth, requireRole('company'), (req, res) => {
  try {
    const companies = query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (!companies.length) return res.json({ interviews: [] });

    const interviews = query(`
      SELECT i.*, u.name as student_name, u.email as student_email,
             j.title as job_title, a.status as app_status
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN students s     ON a.student_id = s.id
      JOIN users u        ON s.user_id    = u.id
      JOIN jobs j         ON a.job_id     = j.id
      WHERE j.company_id = ?
      ORDER BY i.scheduled_at ASC`, [companies[0].id]);

    res.json({ interviews });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch interviews.' });
  }
});

// PUT /api/interviews/:id/result
router.put('/:id/result', auth, requireRole('company'), async (req, res) => {
  try {
    const { result } = req.body;
    run('UPDATE interviews SET result=? WHERE id=?', [result, req.params.id]);

    // Get interview info to update application
    const interviews = query(`SELECT i.*, a.id as app_id, a.student_id,
      u.name as student_name, u.email as student_email,
      j.title as job_title, c.company_name
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE i.id = ?`, [req.params.id]);

    if (interviews.length) {
      const iv = interviews[0];
      const newStatus = result === 'selected' ? 'selected' : 'rejected';
      run('UPDATE applications SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [newStatus, iv.app_id]);

      const student = { name: iv.student_name, email: iv.student_email };
      const job     = { title: iv.job_title };
      const company = { company_name: iv.company_name };
      emailService.sendStatusUpdate(student, job, company, newStatus).catch(console.error);
    }

    res.json({ message: 'Result saved. Student notified by email.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to save result.' });
  }
});

module.exports = router;