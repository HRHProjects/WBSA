// Vercel Serverless Function: /api/contact
// Sends email using Resend (recommended) or logs to console if not configured.
//
// ENV (Vercel):
// - RESEND_API_KEY
// - CONTACT_TO (default: Info@wbsa.ca)
// - CONTACT_FROM (e.g., "WBSA Website <no-reply@wbsa.ca>" or your verified sender)
// - ALLOWED_ORIGINS (optional, comma-separated: https://wbsa.ca,https://www.wbsa.ca)
//
// Docs: https://resend.com/docs/api-reference/emails/send-email

const DEFAULT_ALLOWED = [
  'https://wbsa.ca',
  'https://www.wbsa.ca',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];

function getAllowedOrigins() {
  const env = process.env.ALLOWED_ORIGINS;
  if (!env) return DEFAULT_ALLOWED;
  return env.split(',').map((s) => s.trim()).filter(Boolean);
}

function cors(res, origin) {
  const allowed = getAllowedOrigins();
  const isAllowed = origin && allowed.includes(origin);
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function clean(v, max = 2000) {
  if (v == null) return '';
  return String(v).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
}

function isEmail(s) {
  const v = String(s || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function sendResendEmail({ to, from, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'missing_key' };

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  });

  if (!r.ok) {
    const t = await r.text().catch(() => '');
    return { ok: false, reason: 'resend_error', detail: t.slice(0, 500) };
  }

  return { ok: true };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  cors(res, origin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  // Basic spam checks (must match front-end)
  const body = req.body || {};
  const hp = clean(body.company || '', 200);
  if (hp) {
    res.status(200).json({ ok: true }); // pretend success
    return;
  }

  const ts = Number(body.ts || 0);
  if (!Number.isFinite(ts) || Date.now() - ts < 2500) {
    res.status(400).json({ ok: false, error: 'Too fast' });
    return;
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 160);
  const subjectRaw = clean(body.subject, 160);
  const message = clean(body.message, 5000);
  const page = clean(body.page, 80);

  if (!name || !isEmail(email) || !subjectRaw || !message) {
    res.status(400).json({ ok: false, error: 'Invalid input' });
    return;
  }

  const to = process.env.CONTACT_TO || 'Info@wbsa.ca';
  const from = process.env.CONTACT_FROM || 'WBSA Website <no-reply@wbsa.ca>';
  const subject = `WBSA Website: ${subjectRaw}`;

  const text =
`New message from WBSA website

Name: ${name}
Email: ${email}
Page: ${page}

Message:
${message}
`;

  // Attempt email send
  const sent = await sendResendEmail({ to, from, subject, text });

  if (!sent.ok) {
    // Avoid leaking config details to the client; still return 200 so the site doesn't break.
    console.error('Contact form send failed:', sent);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(200).json({ ok: true });
}
