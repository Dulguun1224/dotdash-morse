const express = require('express');
const router = express.Router();
const Phrase = require('../models/Phrase');

// ===== Get all phrases =====
router.get('/', async (req, res) => {
  try {
    const phrases = await Phrase.find();
    res.json(phrases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Add new phrase (optional admin feature) =====
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const phrase = await Phrase.create({ text });
    res.json(phrase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;