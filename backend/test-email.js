// test-email.js — Run this to test your email is working
// Usage: node test-email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

async function test() {
  console.log('📧 Testing email connection...');
  console.log('   From:', process.env.EMAIL_USER);

  try {
    await transporter.verify();
    console.log('✅ Gmail connection successful!\n');

    await transporter.sendMail({
      from: `CampusConnect(UTB) <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ CampusConnect(UTB) Email Test — Working!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#F8FAFC;border-radius:12px;">
          <div style="background:#0A1628;padding:20px;border-radius:10px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;margin:0;font-size:1.5rem;">🎓 CampusConnect(UTB)</h1>
          </div>
          <h2 style="color:#1E293B;">✅ Email System is Working!</h2>
          <p style="color:#475569;line-height:1.7;">
            Your CampusConnect(UTB) platform email notifications are fully configured and working.
            Real emails will be sent to users when they:
          </p>
          <ul style="color:#475569;line-height:2;">
            <li>📝 Register on the platform</li>
            <li>📋 Submit a job application</li>
            <li>⭐ Get shortlisted by a company</li>
            <li>📅 Have an interview scheduled</li>
            <li>🏆 Get selected for a job</li>
          </ul>
          <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:16px;margin-top:20px;">
            <strong style="color:#10B981;">🚀 Your platform is ready!</strong>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Check your inbox:', process.env.EMAIL_USER);
    console.log('\n🚀 Your platform email system is 100% working!\n');
  } catch (err) {
    console.error('❌ Email test failed:', err.message);
    console.log('\n💡 Common fixes:');
    console.log('   1. Make sure 2-Step Verification is ON in Gmail');
    console.log('   2. Check your App Password in .env file');
    console.log('   3. Make sure EMAIL_USER matches your Gmail exactly\n');
  }
}

test();