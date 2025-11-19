const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// --- File paths ---
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Utility functions
function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ===== Signup =====
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  const users = loadUsers();

  if (users.find(u => u.username === username))
    return res.status(400).json({ error: "Username already exists" });

  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    username,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });

  saveUsers(users);

  res.json({ message: "Signup successful" });
});

// ===== Login =====
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (!user)
    return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(400).json({ error: "Invalid password" });

  res.json({ message: "Login successful" });
});

module.exports = router;