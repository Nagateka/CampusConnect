// routes/applications.js
const express = require('express');
const { query, run } = require('../database');
const { auth, requireRole } = require('../middleware/auth');
const emailService = require('../utils/email');
const router = express.Router();

// POST /api/applications — Student applies
router.post('/', auth, requireRole('student'), async (req, res) => {
  try {
    const { job_id, cover_letter } = req.body;
    if (!job_id) return res.status(400).json({ message: 'Job ID is required.' });

    // Get student profile
    const students = query('SELECT s.*, u.name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.user_id = ?', [req.user.id]);
    if (!students.length) return res.status(404).json({ message: 'Student profile not found.' });
    const student = students[0];

    // Get job + company
    const jobs = query(`SELECT j.*, c.company_name, c.id as comp_id, u.email as company_email
      FROM jobs j JOIN companies c ON j.company_id = c.id JOIN users u ON c.user_id = u.id
      WHERE j.id = ? AND j.status = 'open'`, [job_id]);
    if (!jobs.length) return res.status(404).json({ message: 'Job not found or no longer accepting applications.' });
    const job = jobs[0];

    // Check deadline
    if (new Date(job.deadline) < new Date())
      return res.status(400).json({ message: 'The application deadline for this job has passed.' });

    // Check already applied
    const existing = query('SELECT id FROM applications WHERE student_id = ? AND job_id = ?', [student.id, job_id]);
    if (existing.length) return res.status(409).json({ message: 'You have already applied for this job.' });

    // Create application
    const result = run('INSERT INTO applications (student_id,job_id,cover_letter) VALUES (?,?,?)',
      [student.id, job_id, cover_letter||'']);

    // Add notification for student
    run('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)',
      [req.user.id, 'applied', `✅ Application submitted to ${job.company_name} — ${job.title}`]);

    // Send emails
    emailService.sendApplicationConfirmation(student, job, job).catch(console.error);
    emailService.sendNewApplicantNotification(job.company_email, job.company_name, student, job).catch(console.error);

    res.status(201).json({ application: { id: result.lastID }, message: 'Application submitted! Check your email for confirmation.' });
  } catch (e) {
    console.error(e);
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ message: 'You have already applied for this job.' });
    res.status(500).json({ message: 'Failed to submit application.' });
  }
});

// GET /api/applications/mine — Student's own applications
router.get('/mine', auth, requireRole('student'), (req, res) => {
  try {
    const students = query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!students.length) return res.json({ applications: [] });

    const apps = query(`
      SELECT a.*, j.title as job_title, j.type, j.location, j.salary, j.deadline,
             c.company_name, i.scheduled_at as interview_date, i.mode as interview_mode, i.notes as interview_notes
      FROM applications a
      JOIN jobs j      ON a.job_id     = j.id
      JOIN companies c ON j.company_id = c.id
      LEFT JOIN interviews i ON i.application_id = a.id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC`, [students[0].id]);

    res.json({ applications: apps });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
});

// PUT /api/applications/:id/status — Company updates status
router.put('/:id/status', auth, requireRole('company','admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['applied','shortlisted','interviewed','selected','rejected'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status.' });

    // Get full application info
    const apps = query(`
      SELECT a.*, s.id as student_id, u.name as student_name, u.email as student_email,
             s.branch, s.cgpa, s.university,
             j.title as job_title, j.type, j.location, j.salary,
             c.company_name
      FROM applications a
      JOIN students s  ON a.student_id = s.id
      JOIN users u     ON s.user_id    = u.id
      JOIN jobs j      ON a.job_id     = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = ?`, [req.params.id]);

    if (!apps.length) return res.status(404).json({ message: 'Application not found.' });
    const app = apps[0];

    run("UPDATE applications SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", [status, req.params.id]);

    // Get student user_id for notification
    const studentUser = query('SELECT user_id FROM students WHERE id = ?', [app.student_id]);
    if (studentUser.length) {
      const notifMessages = {
        shortlisted: `⭐ You've been shortlisted at ${app.company_name} for ${app.job_title}!`,
        selected:    `🏆 Congratulations! You've been selected at ${app.company_name} for ${app.job_title}!`,
        rejected:    `📩 Application update from ${app.company_name} — ${app.job_title}`,
      };
      if (notifMessages[status]) {
        run('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)',
          [studentUser[0].user_id, status, notifMessages[status]]);
      }
    }

    // Send email notification
    const student  = { name: app.student_name, email: app.student_email };
    const job      = { title: app.job_title, type: app.type, location: app.location };
    const company  = { company_name: app.company_name };
    emailService.sendStatusUpdate(student, job, company, status).catch(console.error);

    res.json({ message: `Application marked as ${status}. Student has been notified by email.` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update status.' });
  }
});

module.exports = router;