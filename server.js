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

