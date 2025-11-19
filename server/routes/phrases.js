const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PHRASES_FILE = path.join(__dirname, '../data/phrases.json');

// GET phrases
router.get('/', (req, res) => {
  if (!fs.existsSync(PHRASES_FILE))
    return res.status(404).json({ error: "Phrases file not found" });

  const phrases = JSON.parse(fs.readFileSync(PHRASES_FILE, 'utf8'));
  res.json(phrases);
});

module.exports = router;