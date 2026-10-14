// ============================================
//  utils/email.js — All Email Notifications
// ============================================

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Base email template ──
function baseTemplate(content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#F1F5F9; color:#1E293B; }
    .wrapper { max-width:580px; margin:32px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:#0A1628; padding:28px 32px; display:flex; align-items:center; gap:12px; }
    .header-logo { background:#2563EB; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; }
    .header-name { color:white; font-size:1.1rem; font-weight:700; }
    .header-tagline { color:rgba(255,255,255,0.5); font-size:0.75rem; }
    .body { padding:32px; }
    .greeting { font-size:1.1rem; font-weight:700; margin-bottom:16px; }
    .text { font-size:0.9rem; line-height:1.7; color:#475569; margin-bottom:16px; }
    .btn { display:inline-block; background:#2563EB; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:0.875rem; margin:8px 0; }
    .info-box { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:18px; margin:20px 0; }
    .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #F1F5F9; font-size:0.875rem; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:#94A3B8; font-weight:500; }
    .info-value { font-weight:600; }
    .status-badge { display:inline-block; padding:4px 14px; border-radius:99px; font-size:0.8rem; font-weight:700; }
    .badge-green  { background:#ECFDF5; color:#10B981; }
    .badge-blue   { background:#EFF6FF; color:#2563EB; }
    .badge-orange { background:#FFFBEB; color:#F59E0B; }
    .badge-red    { background:#FEF2F2; color:#EF4444; }
    .divider { height:1px; background:#F1F5F9; margin:24px 0; }
    .footer { background:#F8FAFC; padding:20px 32px; border-top:1px solid #E2E8F0; }
    .footer-text { font-size:0.78rem; color:#94A3B8; line-height:1.6; }
    .footer-links { margin-top:8px; }
    .footer-link { color:#2563EB; font-size:0.78rem; text-decoration:none; margin-right:12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">🎓</div>
      <div>
        <div class="header-name">CampusConnect(UTB)</div>
        <div class="header-tagline">Campus Recruitment Platform</div>
      </div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <div class="footer-text">
        This email was sent by CampusConnect(UTB) — Campus Recruitment Management System.<br>
        If you didn't expect this email, please ignore it or contact support.
      </div>
      <div class="footer-links">
        <a href="#" class="footer-link">Help Center</a>
        <a href="#" class="footer-link">Privacy Policy</a>
        <a href="#" class="footer-link">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    // Don't throw — email failure shouldn't break the API
  }
}

// ══════════════════════════════════════════
// 1. WELCOME — Student Registration
// ══════════════════════════════════════════
async function sendWelcomeStudent(user) {
  const html = baseTemplate(`
    <div class="greeting">Welcome to CampusConnect(UTB), ${user.name}! 🎉</div>
    <p class="text">Your student account has been created successfully. You're now part of Rwanda's #1 campus recruitment platform.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Account Email</span><span class="info-value">${user.email}</span></div>
      <div class="info-row"><span class="info-label">Account Type</span><span class="info-value">Student</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge badge-green">Active ✓</span></span></div>
    </div>
    <p class="text"><strong>Here's what to do next:</strong></p>
    <p class="text">1️⃣ Complete your profile (university, CGPA, skills, resume)<br>
    2️⃣ Browse available job openings<br>
    3️⃣ Apply with one click and track your applications</p>
    <a href="${process.env.FRONTEND_URL}/student/dashboard.html" class="btn">Go to My Dashboard →</a>
    <div class="divider"></div>
    <p class="text" style="font-size:0.82rem;color:#94A3B8;">You'll receive email notifications for every update — shortlisted, interview scheduled, and final decisions.</p>
  `);
  await sendEmail(user.email, '🎉 Welcome to CampusConnect(UTB) — Your Account is Ready!', html);
}

// ══════════════════════════════════════════
// 2. WELCOME — Company Registration
// ══════════════════════════════════════════
async function sendWelcomeCompany(user, companyName) {
  const html = baseTemplate(`
    <div class="greeting">Welcome to CampusConnect(UTB), ${companyName}! 🏢</div>
    <p class="text">Your company account has been created. You can now post jobs and connect with top university talent across Rwanda.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Company</span><span class="info-value">${companyName}</span></div>
      <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${user.email}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge badge-green">Active ✓</span></span></div>
    </div>
    <p class="text"><strong>Get started in 3 steps:</strong></p>
    <p class="text">1️⃣ Complete your company profile<br>
    2️⃣ Post your first job opening<br>
    3️⃣ Review applicants and schedule interviews</p>
    <a href="${process.env.FRONTEND_URL}/company/dashboard.html" class="btn">Go to Company Dashboard →</a>
  `);
  await sendEmail(user.email, `🏢 Welcome to CampusConnect(UTB) — ${companyName} is now live!`, html);
}

// ══════════════════════════════════════════
// 3. APPLICATION SUBMITTED — Student
// ══════════════════════════════════════════
async function sendApplicationConfirmation(student, job, company) {
  const html = baseTemplate(`
    <div class="greeting">Application Submitted! 📋</div>
    <p class="text">Great news, ${student.name}! Your application has been successfully submitted. The company will review it and you'll be notified of any updates.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Position</span><span class="info-value">${job.title}</span></div>
      <div class="info-row"><span class="info-label">Company</span><span class="info-value">${company.company_name}</span></div>
      <div class="info-row"><span class="info-label">Location</span><span class="info-value">${job.location || 'Kigali, Rwanda'}</span></div>
      <div class="info-row"><span class="info-label">Job Type</span><span class="info-value">${job.type || 'Full-time'}</span></div>
      <div class="info-row"><span class="info-label">Applied On</span><span class="info-value">${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-badge badge-blue">Applied</span></span></div>
    </div>
    <p class="text">You can track your application status anytime from your dashboard. We'll email you the moment anything changes.</p>
    <a href="${process.env.FRONTEND_URL}/student/applications.html" class="btn">Track My Application →</a>
  `);
  await sendEmail(student.email, `📋 Application Submitted — ${job.title} at ${company.company_name}`, html);
}

// ══════════════════════════════════════════
// 4. NEW APPLICANT — Company Notification
// ══════════════════════════════════════════
async function sendNewApplicantNotification(companyEmail, companyName, student, job) {
  const html = baseTemplate(`
    <div class="greeting">New Application Received! 👤</div>
    <p class="text">A student has applied for one of your job openings on CampusConnect(UTB).</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Applicant</span><span class="info-value">${student.name}</span></div>
      <div class="info-row"><span class="info-label">Applied For</span><span class="info-value">${job.title}</span></div>
      <div class="info-row"><span class="info-label">CGPA</span><span class="info-value">${student.cgpa || 'Not provided'}</span></div>
      <div class="info-row"><span class="info-label">Branch</span><span class="info-value">${student.branch || 'Not provided'}</span></div>
      <div class="info-row"><span class="info-label">University</span><span class="info-value">${student.university || 'Not provided'}</span></div>
      <div class="info-row"><span class="info-label">Applied</span><span class="info-value">Just now</span></div>
    </div>
    <p class="text">Log in to your dashboard to review the application, view their profile, and take action.</p>
    <a href="${process.env.FRONTEND_URL}/company/applicants.html" class="btn">Review Application →</a>
  `);
  await sendEmail(companyEmail, `👤 New Applicant — ${student.name} applied for ${job.title}`, html);
}

// ══════════════════════════════════════════
// 5. STATUS UPDATE — Student (Shortlisted / Rejected)
// ══════════════════════════════════════════
async function sendStatusUpdate(student, job, company, status) {
  const isShortlisted = status === 'shortlisted';
  const isSelected    = status === 'selected';
  const isRejected    = status === 'rejected';

  let emoji, title, headline, message, badgeClass;

  if (isShortlisted) {
    emoji = '⭐'; title = 'You\'ve Been Shortlisted!';
    headline = `Congratulations ${student.name}! You've been shortlisted! ⭐`;
    message = `Great news! <strong>${company.company_name}</strong> has reviewed your application for <strong>${job.title}</strong> and shortlisted you. This means you're one step closer to getting hired!`;
    badgeClass = 'badge-orange';
  } else if (isSelected) {
    emoji = '🏆'; title = 'You\'ve Been Selected! Congratulations!';
    headline = `Amazing news, ${student.name}! You got the job! 🏆`;
    message = `Congratulations! <strong>${company.company_name}</strong> has selected you for the position of <strong>${job.title}</strong>. They will contact you soon with next steps and offer details.`;
    badgeClass = 'badge-green';
  } else {
    emoji = '📩'; title = 'Application Update';
    headline = `Application Update — ${job.title}`;
    message = `Thank you for applying to <strong>${job.title}</strong> at <strong>${company.company_name}</strong>. After careful review, they have decided to move forward with other candidates at this time. Don't be discouraged — keep applying!`;
    badgeClass = 'badge-red';
  }

  const html = baseTemplate(`
    <div class="greeting">${headline}</div>
    <p class="text">${message}</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Position</span><span class="info-value">${job.title}</span></div>
      <div class="info-row"><span class="info-label">Company</span><span class="info-value">${company.company_name}</span></div>
      <div class="info-row"><span class="info-label">New Status</span><span class="info-value"><span class="status-badge ${badgeClass}">${status.charAt(0).toUpperCase()+status.slice(1)}</span></span></div>
      <div class="info-row"><span class="info-label">Updated</span><span class="info-value">${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span></div>
    </div>
    ${!isRejected ? `<a href="${process.env.FRONTEND_URL}/student/applications.html" class="btn">View My Application →</a>` : `<a href="${process.env.FRONTEND_URL}/student/jobs.html" class="btn">Browse More Jobs →</a>`}
  `);
  await sendEmail(student.email, `${emoji} ${title} — ${job.title} at ${company.company_name}`, html);
}

// ══════════════════════════════════════════
// 6. INTERVIEW SCHEDULED — Student
// ══════════════════════════════════════════
async function sendInterviewScheduled(student, job, company, interview) {
  const interviewDate = new Date(interview.scheduled_at);
  const formattedDate = interviewDate.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const formattedTime = interviewDate.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

  const modeIcons = { 'In-person':'🏢', 'Video Call':'💻', 'Phone':'📞' };
  const modeIcon  = modeIcons[interview.mode] || '📅';

  const html = baseTemplate(`
    <div class="greeting">Interview Scheduled! 📅</div>
    <p class="text">Exciting news, ${student.name}! <strong>${company.company_name}</strong> has scheduled an interview with you for the position of <strong>${job.title}</strong>.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Position</span><span class="info-value">${job.title}</span></div>
      <div class="info-row"><span class="info-label">Company</span><span class="info-value">${company.company_name}</span></div>
      <div class="info-row"><span class="info-label">📅 Date</span><span class="info-value"><strong>${formattedDate}</strong></span></div>
      <div class="info-row"><span class="info-label">⏰ Time</span><span class="info-value"><strong>${formattedTime}</strong></span></div>
      <div class="info-row"><span class="info-label">${modeIcon} Mode</span><span class="info-value">${interview.mode || 'In-person'}</span></div>
      ${interview.location ? `<div class="info-row"><span class="info-label">📍 Location</span><span class="info-value">${interview.location}</span></div>` : ''}
      ${interview.duration ? `<div class="info-row"><span class="info-label">⏱ Duration</span><span class="info-value">${interview.duration} minutes</span></div>` : ''}
    </div>
    ${interview.notes ? `
    <div class="info-box" style="background:#FFFBEB;border-color:#FDE68A;">
      <div style="font-weight:700;margin-bottom:8px;font-size:0.875rem;">📝 Notes from the Company</div>
      <p style="font-size:0.875rem;color:#475569;line-height:1.6;">${interview.notes}</p>
    </div>` : ''}
    <p class="text"><strong>Tips to prepare:</strong><br>
    ✅ Research the company before the interview<br>
    ✅ Review your application and cover letter<br>
    ✅ Prepare questions to ask the interviewer<br>
    ✅ ${interview.mode === 'Video Call' ? 'Test your camera and microphone beforehand' : 'Arrive 10 minutes early'}</p>
    <a href="${process.env.FRONTEND_URL}/student/applications.html" class="btn">View Application Details →</a>
  `);
  await sendEmail(student.email, `📅 Interview Scheduled — ${job.title} at ${company.company_name} on ${formattedDate}`, html);
}

// ══════════════════════════════════════════
// 7. NEW JOB POSTED — Admin notification
// ══════════════════════════════════════════
async function sendJobPostedAdmin(adminEmail, job, company) {
  const html = baseTemplate(`
    <div class="greeting">New Job Posted 💼</div>
    <p class="text">A company has posted a new job on CampusConnect(UTB) that is now live for students.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Job Title</span><span class="info-value">${job.title}</span></div>
      <div class="info-row"><span class="info-label">Company</span><span class="info-value">${company.company_name}</span></div>
      <div class="info-row"><span class="info-label">Type</span><span class="info-value">${job.type}</span></div>
      <div class="info-row"><span class="info-label">Deadline</span><span class="info-value">${job.deadline}</span></div>
      <div class="info-row"><span class="info-label">Openings</span><span class="info-value">${job.openings}</span></div>
    </div>
    <a href="${process.env.FRONTEND_URL}/admin/dashboard.html" class="btn">View Admin Dashboard →</a>
  `);
  await sendEmail(adminEmail, `💼 New Job Posted — ${job.title} by ${company.company_name}`, html);
}

// ══════════════════════════════════════════
// 8. NEW JOB ALERT — All Students
// ══════════════════════════════════════════
async function sendNewJobAlert(student, job, company) {
  const html = baseTemplate(`
    <div class="greeting">New Job Opportunity! 💼</div>
    <p class="text">Hi ${student.name}, a new job was just posted on CampusConnect(UTB) that might interest you!</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Position</span><span class="info-value">${job.title}</span></div>
      <div class="info-row"><span class="info-label">Company</span><span class="info-value">${company.company_name}</span></div>
      <div class="info-row"><span class="info-label">Location</span><span class="info-value">${job.location || 'Kigali, Rwanda'}</span></div>
      <div class="info-row"><span class="info-label">Type</span><span class="info-value">${job.type || 'Full-time'}</span></div>
      <div class="info-row"><span class="info-label">Salary</span><span class="info-value">${job.salary || 'Competitive'}</span></div>
      <div class="info-row"><span class="info-label">Deadline</span><span class="info-value"><strong>${job.deadline}</strong></span></div>
    </div>
    <p class="text">Don't miss out — apply before the deadline!</p>
    <a href="${process.env.FRONTEND_URL}/student/jobs.html" class="btn">View & Apply Now →</a>
    <div class="divider"></div>
    <p class="text" style="font-size:0.78rem;color:#94A3B8;">You're receiving this because you're registered as a student on CampusConnect. You can manage notification preferences from your profile settings.</p>
  `);
  await sendEmail(student.email, `💼 New Job Alert — ${job.title} at ${company.company_name}`, html);
}

module.exports = {
  sendWelcomeStudent,
  sendWelcomeCompany,
  sendApplicationConfirmation,
  sendNewApplicantNotification,
  sendStatusUpdate,
  sendInterviewScheduled,
  sendJobPostedAdmin,
  sendNewJobAlert,
};