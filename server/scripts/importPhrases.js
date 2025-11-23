require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Phrase = require('../models/Phrase');

async function importPhrases() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 2. Load phrases.json
    const filePath = path.join(__dirname, '../data/phrases.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');

    // the JSON has a { phrases: [...] } structure
    const phrasesArray = JSON.parse(rawData).phrases;

    if (!Array.isArray(phrasesArray)) {
      throw new Error("phrases.json must contain an array in the 'phrases' field");
    }

    // 3. Convert strings to MongoDB documents
    const formatted = phrasesArray.map(text => ({ text }));

    // 4. Clear existing phrases
    await Phrase.deleteMany();
    console.log("Cleared old phrases");

    // 5. Insert new phrases
    await Phrase.insertMany(formatted);
    console.log("Inserted new phrases");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

importPhrases();