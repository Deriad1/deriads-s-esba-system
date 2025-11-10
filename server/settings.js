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

// bulk update settings (body: { settings: { key1: value1, key2: value2, ... } })
router.put('/bulk', async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'settings object required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `INSERT INTO app_settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value || '']
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true, updated: Object.keys(settings).length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;