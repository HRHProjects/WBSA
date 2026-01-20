// Vercel Serverless Function: /api/subscribe
// Stores email subscription request by emailing Info@wbsa.ca via Resend.
// ENV: RESEND_API_KEY, CONTACT_TO, CONTACT_FROM, ALLOWED_ORIGINS

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

  const body = req.body || {};
  const email = clean(body.email, 160);

  if (!isEmail(email)) {
    res.status(400).json({ ok: false, error: 'Invalid email' });
    return;
  }

  const to = process.env.CONTACT_TO || 'Info@wbsa.ca';
  const from = process.env.CONTACT_FROM || 'WBSA Website <no-reply@wbsa.ca>';
  const subject = 'WBSA Website: Newsletter subscribe';
  const text =
`Newsletter subscription request:

Email: ${email}
Timestamp: ${new Date().toISOString()}
`;

  const sent = await sendResendEmail({ to, from, subject, text });

  if (!sent.ok) {
    console.error('Subscribe send failed:', sent);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(200).json({ ok: true });
}
