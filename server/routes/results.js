const express = require('express');
const router = express.Router();
const Result = require('../models/Result');

// ===== GET all results =====
router.get('/', async (req, res) => {
  try {
    const results = await Result.find().sort({ timestamp: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== POST new result =====
router.post('/', async (req, res) => {
  try {
    const { time, characters, wpm, user } = req.body;

    if (!time || !characters || !wpm)
      return res.status(400).json({ error: "Missing fields" });

    const newResult = await Result.create({
      time,
      characters,
      wpm,
      user: user || 'guest'
    });

    res.json({ message: "Saved!", result: newResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;