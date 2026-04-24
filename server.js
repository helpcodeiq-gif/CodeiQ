const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many requests' });
app.use('/api/', limiter);

app.use(async (req, res, next) => {
  req.ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  next();
});

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

app.use('/api/', async (req, res, next) => {
  if (req.user) {
    const user = await pool.query(`SELECT banned, suspended FROM users WHERE id=$1`, [req.user.id]);
    if (user.rows[0]?.banned) return res.status(403).json({ error: 'Account banned' });
    if (user.rows[0]?.suspended) return res.status(429).json({ error: 'Account suspended' });
  }
  // Serve frontend folder
app.use(express.static('frontend'));
});

async function verifyCaptcha(token) {
  if (token === 'test') return true;
  const res = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`);
  return res.data.success && res.data.score > 0.5;
}

app.post('/api/signup', async (req, res) => {
  const { email, password, ref, captcha_token } = req.body;
  try {
    if (!await verifyCaptcha(captcha_token)) return res.status(403).json({ error: 'Bot detected' });
    const hashedPass = await bcrypt.hash(password, 10);
    let credits = 50;
    let referred_by = null;
    if (ref) {
      const refUser = await pool.query(`SELECT id FROM users WHERE referral_code=$1`, [ref]);
      if (refUser.rows.length > 0) {
        credits = 250;
        referred_by = ref;
        await pool.query(`UPDATE users SET credits = credits + 200 WHERE referral_code=$1`, [ref]);
      }
    }
    const referral_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newUser = await pool.query(
      `INSERT INTO users (email, password, credits, referred_by, referral_code, ip_address, role) VALUES ($1,$2,$3,$4,$5,$6,'user') RETURNING id`,
      [email, hashedPass, credits, referred_by, referral_code, req.ip_address]
    );
    await pool.query(`INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, 'signup', $2)`, [newUser.rows[0].id, req.ip_address]);
    res.json({ msg: 'Signup Success! 250 Credits Added' });
  } catch (err) {
    res.status(500).json({ error: 'Email exists or Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, captcha_token } = req.body;
  if (!await verifyCaptcha(captcha_token)) return res.status(403).json({ error: 'Bot detected' });
  const user = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
  if (user.rows.length === 0) return res.status(401).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, user.rows[0].password);
  if (!valid) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  await pool.query(`INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, 'login', $2)`, [user.rows[0].id, req.ip_address]);
  res.json({ token, msg: 'Login Success' });
});

app.post('/api/feedback', verifyToken, async (req, res) => {
  const { type, rating, message, page } = req.body;
  await pool.query(`INSERT INTO feedback (user_id, type, rating, message, page) VALUES ($1,$2,$3,$4,$5)`, [req.user.id, type, rating, message, page]);
  res.json({ msg: 'Thanks for feedback!' });
});

app.get('/api/my-profile', verifyToken, async (req, res) => {
  const user = await pool.query(`SELECT email, credits, referral_code, plan FROM users WHERE id=$1`, [req.user.id]);
  const refCount = await pool.query(`SELECT COUNT(*) FROM users WHERE referred_by=$1`, [user.rows[0].referral_code]);
  res.json({
   ...user.rows[0],
    referral_link: `https://codeiq.onrender.com/signup?ref=${user.rows[0].referral_code}`,
    total_referrals: refCount.rows[0].count
  });
});

app.get('/api/admin/stats', verifyToken, async (req, res) => {
  if (req.user.role!== 'admin') return res.status(403).json({ error: 'Admin only' });
  const total = await pool.query(`SELECT COUNT(*) FROM users`);
  const active = await pool.query(`SELECT COUNT(*) FROM audit_logs WHERE action='login' AND created_at > NOW() - INTERVAL '1 day'`);
  const banned = await pool.query(`SELECT COUNT(*) FROM users WHERE banned=true`);
  const users = await pool.query(`SELECT id, email, plan, credits, banned FROM users ORDER BY created_at DESC LIMIT 50`);
  res.json({
    total_users: total.rows[0].count,
    active_today: active.rows[0].count,
    mrr: 0,
    banned: banned.rows[0].count,
    users: users.rows
  });
});

app.post('/api/admin/ban-user', verifyToken, async (req, res) => {
  if (req.user.role!== 'admin') return res.status(403).json({ error: 'Admin only' });
  await pool.query(`UPDATE users SET banned=true WHERE id=$1`, [req.body.user_id]);
  res.json({ msg: 'User banned' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CodeIQ Server Running on ${PORT}`));
127  });  // nee last API route end
128
129  app.get('*', (req, res) => {  // ✅ LINE 129 NUNDI START CHEY
130    res.sendFile(__dirname + '/frontend/index.html');
131  });
132
133  app.listen(port, () => {
134    console.log(`Server running on port ${port}`);
135  });
      
