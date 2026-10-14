// routes/students.js
const express = require('express');
const { query, run } = require('../database');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/students/profile
router.get('/profile', auth, requireRole('student'), (req, res) => {
  try {
    const rows = query(`SELECT s.*, u.name, u.email FROM students s
      JOIN users u ON s.user_id = u.id WHERE s.user_id = ?`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Profile not found.' });
    res.json({ profile: rows[0] });
  } catch (e) { res.status(500).json({ message: 'Failed to fetch profile.' }); }
});

// PUT /api/students/profile
router.put('/profile', auth, requireRole('student'), (req, res) => {
  try {
    const { name, phone, location, university, branch, year, cgpa, skills, bio } = req.body;
    run('UPDATE users SET name=? WHERE id=?', [name, req.user.id]);
    run(`UPDATE students SET university=?,branch=?,year=?,cgpa=?,skills=?,bio=?,phone=?,location=?
         WHERE user_id=?`, [university, branch, year, cgpa, skills, bio, phone, location, req.user.id]);
    res.json({ message: 'Profile updated successfully.' });
  } catch (e) { res.status(500).json({ message: 'Failed to update profile.' }); }
});

// GET /api/students/stats
router.get('/stats', auth, requireRole('student'), (req, res) => {
  try {
    const student = query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (!student.length) return res.json({ applied:0, shortlisted:0, interviews:0, selected:0 });
    const sid = student[0].id;
    const stats = {
      applied:     query("SELECT COUNT(*) as c FROM applications WHERE student_id=?", [sid])[0]?.c || 0,
      shortlisted: query("SELECT COUNT(*) as c FROM applications WHERE student_id=? AND status='shortlisted'", [sid])[0]?.c || 0,
      interviews:  query("SELECT COUNT(*) as c FROM applications WHERE student_id=? AND status='interviewed'", [sid])[0]?.c || 0,
      selected:    query("SELECT COUNT(*) as c FROM applications WHERE student_id=? AND status='selected'", [sid])[0]?.c || 0,
    };
    res.json(stats);
  } catch (e) { res.status(500).json({ message: 'Failed to fetch stats.' }); }
});

module.exports = router;