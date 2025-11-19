const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '../data/results.json');

// Load results file
let results = [];
if (fs.existsSync(RESULTS_FILE)) {
  results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
}

// ===== GET all results =====
router.get('/', (req, res) => {
  res.json(results);
});

// ===== POST new result =====
router.post('/', (req, res) => {
  const { time, characters, wpm, user } = req.body;

  if (!time || !characters || !wpm)
    return res.status(400).json({ error: 'Missing fields' });

  const newResult = {
    id: Date.now(),
    time,
    characters,
    wpm,
    user: user || 'guest',
    timestamp: new Date().toISOString()
  };

  results.push(newResult);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

  res.status(201).json({ message: 'Saved!', result: newResult });
});

module.exports = router;