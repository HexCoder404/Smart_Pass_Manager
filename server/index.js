require('dotenv').config({ path: './server/.env' });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'brevo').toLowerCase(); // brevo | resend
const OTP_FROM_EMAIL = process.env.OTP_FROM_EMAIL || 'no-reply@hashsecure.app';
const OTP_FROM_NAME = process.env.OTP_FROM_NAME || 'HashSecure';

// Root route for health check / Render deployment fix
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: EMAIL_PROVIDER,
    hasBrevoKey: Boolean(process.env.BREVO_API_KEY),
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasSupabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
  });
});

// Initialize Supabase Client (Service Role for Admin Access if available)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

function buildOtpTemplate(otp) {
  return `
    <div style="margin:0;padding:0;background:#0b1220;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:36px 18px;">
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <div style="width:36px;height:36px;border-radius:12px;background:rgba(16,185,129,0.18);border:1px solid rgba(16,185,129,0.35);display:flex;align-items:center;justify-content:center;">
              <span style="color:#10b981;font-weight:800;">HS</span>
            </div>
            <div style="color:#e5e7eb;font-weight:900;font-size:18px;letter-spacing:-0.02em;">
              Hash<span style="color:#10b981;">Secure</span>
            </div>
          </div>
          <h1 style="margin:0 0 8px 0;color:#f9fafb;font-size:22px;line-height:1.25;">Your one-time code</h1>
          <p style="margin:0 0 18px 0;color:#cbd5e1;font-size:14px;line-height:1.65;">
            Enter this code in HashSecure to finish signing in.
          </p>
          <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px;text-align:center;margin:18px 0;">
            <div style="font-size:28px;letter-spacing:10px;font-weight:900;color:#10b981;">${otp}</div>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
            This code expires in 10 minutes. If you did not request this, ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendOtpWithBrevo(email, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is missing.');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: OTP_FROM_NAME, email: OTP_FROM_EMAIL },
      to: [{ email }],
      subject: 'Your OTP for HashSecure',
      htmlContent: buildOtpTemplate(otp),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Brevo API error (${response.status}).`);
  }
}

async function sendOtpWithResend(email, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is missing.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${OTP_FROM_NAME} <${OTP_FROM_EMAIL}>`,
      to: [email],
      subject: 'Your OTP for HashSecure',
      html: buildOtpTemplate(otp),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.message || errorData?.error || `Resend API error (${response.status}).`;
    throw new Error(msg);
  }
}

async function sendOtpEmail(email, otp) {
  if (EMAIL_PROVIDER === 'resend') return sendOtpWithResend(email, otp);
  return sendOtpWithBrevo(email, otp);
}

/**
 * Endpoint: Send OTP
 */
app.post('/api/otp/send', async (appReq, appRes) => {
  const { email } = appReq.body;
  if (!email) return appRes.status(400).json({ error: 'Email is required' });

  // 1. Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 2. Start Database & Email operations simultaneously for speed
    const dbPromise = supabase
      .from('user_otps')
      .upsert({ email, otp, created_at: new Date().toISOString() }, { onConflict: 'email' });

    // 4. Send Email via selected provider
    try {
      await sendOtpEmail(email, otp);
      console.log(`OTP email sent via ${EMAIL_PROVIDER} to ${email}`);
    } catch (sendError) {
      console.error(`${EMAIL_PROVIDER} delivery failed:`, sendError);
      return appRes.status(500).json({
        error: `Email delivery failed: ${sendError.message}`,
      });
    }

    // 5. Wait for Database to confirm storage
    const { error: dbError } = await dbPromise;

    if (dbError) {
      console.error('Database error:', dbError);
      return appRes.status(500).json({ error: 'Failed to store OTP in database.' });
    }

    // 6. Respond immediately (OTP is sent via Email ONLY for security)
    appRes.json({ 
      success: true, 
      message: 'OTP generated and sent to your email.'
    });

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
