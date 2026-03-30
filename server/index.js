require('dotenv').config({ path: './server/.env' });
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

// Root route for health check / Render deployment fix
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// Initialize Supabase Client (Service Role for Admin Access)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Endpoint: Send OTP
 */
app.post('/api/otp/send', async (appReq, appRes) => {
  const { email } = appReq.body;
  if (!email) return appRes.status(400).json({ error: 'Email is required' });

  // 1. Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 2. Store OTP in Supabase (we'll ensure the table exists or prompt user)
    // We'll use a table named 'user_otps'
    const { error: dbError } = await supabase
      .from('user_otps')
      .upsert({ email, otp, created_at: new Date().toISOString() }, { onConflict: 'email' });

    if (dbError) {
      console.error('Database error:', dbError);
      return appRes.status(500).json({ error: 'Failed to store OTP in database.' });
    }

    // 3. Send Email
    const mailOptions = {
      from: `"HashSecure" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for HashSecure',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">HashSecure Access</h2>
          <p>You requested a one-time password to access your vault.</p>
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This code will expire shortly. If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER or EMAIL_PASS not set. Falling back to console log for development.');
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return appRes.json({ success: true, message: 'OTP logged to server console (SMTP not configured).', otp });
    }

    // For the demo, we send the OTP immediately without waiting for SMTP
    // This fixes the "too much time" issue on Render free tier
    try {
      transporter.sendMail(mailOptions).catch(err => console.error("Background SMTP Error:", err));
      appRes.json({ 
        success: true, 
        message: 'OTP generated successfully (check your console if email delays).', 
        otp 
      });
    } catch (err) {
      console.error('Submission Error:', err);
      appRes.json({ success: true, message: 'OTP generated (Email error).', otp });
    }

  } catch (err) {
    console.error('Server error:', err);
    appRes.status(500).json({ error: 'Failed to send OTP.' });
  }
});

/**
 * Endpoint: Verify OTP
 */
app.post('/api/otp/verify', async (appReq, appRes) => {
  const { email, otp } = appReq.body;
  if (!email || !otp) return appRes.status(400).json({ error: 'Email and OTP are required' });

  try {
    // 1. Fetch OTP from database
    const { data, error } = await supabase
      .from('user_otps')
      .select('otp, created_at')
      .eq('email', email)
      .single();

    if (error || !data) {
      return appRes.status(400).json({ error: 'OTP not found or expired.' });
    }

    // 2. Check if OTP matches
    if (data.otp !== otp) {
      return appRes.status(400).json({ error: 'Invalid OTP code.' });
    }

    // 3. (Optional) Check expiration - e.g., 10 minutes
    const createdAt = new Date(data.created_at);
    const now = new Date();
    if (now - createdAt > 10 * 60 * 1000) {
      return appRes.status(400).json({ error: 'OTP has expired.' });
    }

    // 4. Success! Return "session" info
    // In a real app, we'd sign them into Supabase or issue a JWT.
    // For this simple project, returning the email is enough for the frontend.
    appRes.json({ success: true, email });

  } catch (err) {
    console.error('Server error:', err);
    appRes.status(500).json({ error: 'Verification failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
