const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(session({
  secret: 'secretkey',
  resave: false,
  saveUninitialized: true
}));

// Helper function to read/write JSON file
function readUsers() {
  if (!fs.existsSync('users.json')) return [];
  return JSON.parse(fs.readFileSync('users.json'));
}

function writeUsers(users) {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Root route → open frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'queue-management.html'));
});

// Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();

  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).send('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  writeUsers(users);

  res.send('User registered successfully!');
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).send('User not found');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).send('Invalid password');
  }

  req.session.user = user;
  res.send('Login successful!');
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('Logged out successfully!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
