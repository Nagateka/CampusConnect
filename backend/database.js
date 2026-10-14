// ============================================
//  database.js — SQLite Database Setup
//  Uses sql.js (pure JS, no native bindings)
// ============================================

const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

let db;

const DB_PATH = path.join(__dirname, 'db', 'campusconnect(UTB).db');

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB from disk or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  seedDemoData();
  saveDB();

  console.log('✅ Database initialized');
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    UNIQUE NOT NULL,
      password    TEXT    NOT NULL,
      role        TEXT    CHECK(role IN ('admin','student','company')) NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER UNIQUE NOT NULL,
      university  TEXT,
      branch      TEXT,
      year        INTEGER,
      cgpa        REAL,
      skills      TEXT,
      bio         TEXT,
      phone       TEXT,
      location    TEXT,
      resume_url  TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS companies (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER UNIQUE NOT NULL,
      company_name  TEXT NOT NULL,
      industry      TEXT,
      description   TEXT,
      logo_url      TEXT,
      website       TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id    INTEGER NOT NULL,
      title         TEXT    NOT NULL,
      description   TEXT,
      requirements  TEXT,
      type          TEXT    DEFAULT 'Full-time',
      industry      TEXT,
      location      TEXT    DEFAULT 'Kigali, Rwanda',
      salary        TEXT,
      min_cgpa      REAL,
      openings      INTEGER DEFAULT 1,
      deadline      DATE,
      status        TEXT    DEFAULT 'open',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id    INTEGER NOT NULL,
      job_id        INTEGER NOT NULL,
      status        TEXT    DEFAULT 'applied',
      cover_letter  TEXT,
      resume_url    TEXT,
      applied_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, job_id),
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(job_id)     REFERENCES jobs(id)     ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id  INTEGER NOT NULL,
      scheduled_at    DATETIME,
      mode            TEXT    DEFAULT 'In-person',
      location        TEXT,
      notes           TEXT,
      duration        INTEGER DEFAULT 60,
      result          TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      type        TEXT,
      message     TEXT,
      read        INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function seedDemoData() {
  const bcrypt = require('bcryptjs');

  // Check if already seeded
  const existing = db.exec("SELECT COUNT(*) as c FROM users");
  const count = existing[0]?.values[0][0];
  if (count > 0) return;

  const adminPass = bcrypt.hashSync('admin123', 10);

  // Seed ONLY the admin account — no demo students/companies/jobs
  db.run(`INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)`,
    ['Admin User','admin@campusconnect(UTB).com', adminPass, 'admin']);

  console.log('✅ Admin account seeded (no demo data)');
}

// ── DB Helper Methods ──
function query(sql, params = []) {
  try {
    const stmt   = db.prepare(sql);
    const result = stmt.getAsObject ? [] : null;
    stmt.bind(params);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('DB query error:', e.message, sql);
    throw e;
  }
}

function run(sql, params = []) {
  try {
    db.run(sql, params);
    const lastId = db.exec("SELECT last_insert_rowid() as id");
    saveDB();
    return { lastID: lastId[0]?.values[0][0] };
  } catch (e) {
    console.error('DB run error:', e.message);
    throw e;
  }
}

function saveDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { initDB, query, run, saveDB };