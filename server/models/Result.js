const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  user: { type: String, default: "guest" },   // later we can link User ID
  time: { type: Number, required: true },
  characters: { type: Number, required: true },
  wpm: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);