require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve the public frontend
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', require('./routes/auth'));        // signup, login
app.use('/api/results', require('./routes/results'));  // results
app.use('/api/phrases', require('./routes/phrases'));  // phrases

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});