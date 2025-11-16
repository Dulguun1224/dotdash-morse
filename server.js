const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ======== Files ========
const DATA_FILE = 'results.json';
const PHRASES_FILE = 'phrases.json';
const USERS_FILE = 'data/users.json'; // new file for accounts

// ======== Load results ========
let results = [];
if (fs.existsSync(DATA_FILE)) {
  results = JSON.parse(fs.readFileSync(DATA_FILE));
}

// ======== Load users ========
if (!fs.existsSync('data')) fs.mkdirSync('data');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ======== API: Results ========
app.get('/api/results', (req, res) => {
  res.json(results);
});

app.post('/api/results', (req, res) => {
  const { time, characters, wpm, user } = req.body;

  if (time && characters && wpm) {
    const newResult = {
      id: Date.now(),
      time,
      characters,
      wpm,
      user: user || 'guest',      // <-- associate with user or default 'guest'
      timestamp: new Date().toISOString()
    };

    results.push(newResult);
    fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));

    res.status(201).json({ message: 'Saved!', result: newResult });
  } else {
    res.status(400).json({ error: 'Missing fields' });
  }
});


// ======== API: Phrases ========
app.get('/api/phrases', (req, res) => {
  if (fs.existsSync(PHRASES_FILE)) {
    const phrases = JSON.parse(fs.readFileSync(PHRASES_FILE));
    res.json(phrases);
  } else {
    res.status(404).json({ error: 'Phrases file not found' });
  }
});

// ======== API: Signup ========
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const users = loadUsers();

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword });
  saveUsers(users);

  res.json({ message: 'Signup successful' });
});

// ======== API: Login ========
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ error: 'Invalid password' });
  }

  res.json({ message: 'Login successful' });
});

// ======== Start server ========
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
