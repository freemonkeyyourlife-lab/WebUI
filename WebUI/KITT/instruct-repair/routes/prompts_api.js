const express = require('express');
const fs = require('fs');
const path = require('path');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();
const CATALOG_FILE = path.join(__dirname, '..', '..', 'prompts', 'catalog.json');

router.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many local requests; try again shortly.' }
}));

router.get('/', (req, res) => {
  try {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
    const prompts = Array.isArray(catalog) ? catalog : catalog.prompts;
    if (!Array.isArray(prompts)) return res.status(500).json({ error: 'Invalid local prompt catalog' });
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLocaleLowerCase() : '';
    const results = query
      ? prompts.filter((prompt) => JSON.stringify(prompt).toLocaleLowerCase().includes(query))
      : prompts;
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Could not read local prompt catalog' });
  }
});

module.exports = router;
