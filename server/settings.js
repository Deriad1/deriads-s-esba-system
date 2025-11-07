const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const router = express.Router();
router.use(bodyParser.json());

// get all settings
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM app_settings");
    const obj = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update a setting (body: { key: 'logo_url', value: 'https://...' })
router.post('/', async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  try {
    await pool.query(
      `INSERT INTO app_settings (key, value) VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value || '']
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;