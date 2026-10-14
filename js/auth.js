// routes/auth.js
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { query, run } = require('../database');
const email    = require('../utils/email');
const router   = express.Router();

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
  try {
    const { name, email: userEmail, password, role, university, branch, year, cgpa, companyName, industry } = req.body;

    if (!name || !userEmail || !password || !role)
      return res.status(400).json({ message: 'Name, email, password and role are required.' });

    if (!['student','company'].includes(role))
      return res.status(400).json({ message: 'Invalid role. Only students and companies can register.' });

    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    // Check if email exists
    const existing = query('SELECT id FROM users WHERE email = ?', [userEmail]);
    if (existing.length > 0)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const result = run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', [name, userEmail, hash, role]);
    const userId = result.lastID;

    // Create profile based on role
    if (role === 'student') {
      run('INSERT INTO students (user_id,university,branch,year,cgpa) VALUES (?,?,?,?,?)',
        [userId, university||'', branch||'', year||null, cgpa||null]);
    }
    if (role === 'company') {
      run('INSERT INTO companies (user_id,company_name,industry) VALUES (?,?,?)',
        [userId, companyName||name, industry||'']);
    }

    const user = { id: userId, name, email: userEmail, role };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Send welcome email (async - don't block response)
    if (role === 'student')  email.sendWelcomeStudent(user).catch(console.error);
    if (role === 'company')  email.sendWelcomeCompany(user, companyName||name).catch(console.error);

    res.status(201).json({ token, user, message: 'Account created successfully!' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { email: userEmail, password } = req.body;

    if (!userEmail || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const users = query('SELECT * FROM users WHERE email = ?', [userEmail]);
    if (!users.length)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: payload, message: 'Signed in successfully!' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ── GET /api/auth/me ──
router.get('/me', require('../middleware/auth').auth, (req, res) => {
  const users = query('SELECT id,name,email,role,created_at FROM users WHERE id = ?', [req.user.id]);
  if (!users.length) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: users[0] });
});

module.exports = router;