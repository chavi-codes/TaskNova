const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve favicon statically on server
app.get('/favicon.png', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'favicon.png'));
});
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'favicon.png'));
});

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
function defaultData() {
  return { users: [], sessions: {}, workspaces: {} };
}

function readData() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // Migrate legacy single-board shape (pre-auth) into the new structure.
    if (!parsed.users) {
      return defaultData();
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return defaultData();
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}

function verifyPassword(password, record) {
  const [salt, hash] = record.split(':');
  if (!salt || !hash) return false;
  const check = hashPassword(password, salt);
  // timing-safe compare
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(check, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getInitials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';
}

function stripPassword(user) {
  const { passwordRecord, ...safe } = user;
  return safe;
}

function createDefaultBoard() {
  const COLUMN_TITLES = ['Backlog', 'Todo', 'In Progress', 'Testing', 'Done'];
  const COLUMN_COLORS = ['#334155', '#1e293b', '#0c4a6e', '#3f2d1d', '#064e3b'];
  return {
    title: 'My Board',
    background: 'linear-gradient(135deg, #2b1055 0%, #7597de 50%, #462066 100%)',
    labels: [],
    lists: [
      { id: 'list-inbox', title: 'Inbox', color: '#1e293b', isInbox: true, cards: [] },
      ...COLUMN_TITLES.map((title, i) => ({
        id: `list-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
        title,
        color: COLUMN_COLORS[i],
        isInbox: false,
        cards: []
      }))
    ]
  };
}

// Ensures the given user has a workspace/board, creating a fresh empty one if needed.
function getUserBoard(data, userId) {
  if (!data.workspaces[userId]) {
    data.workspaces[userId] = { board: createDefaultBoard() };
  }
  return data.workspaces[userId].board;
}

// Middleware: requires a valid Bearer token, attaches req.userId
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  const data = readData();
  const userId = data.sessions[token];
  if (!userId || !data.users.some((u) => u.id === userId)) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  req.userId = userId;
  req.token = token;
  req._data = data; // reuse the same read for this request
  next();
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------
app.post('/api/auth/signup', (req, res) => {
  const { fullName, email, password, confirmPassword, avatar } = req.body || {};

  if (!fullName || !fullName.trim()) return res.status(400).json({ error: 'Full name is required.' });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'A valid email address is required.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const data = readData();
  const cleanEmail = email.trim().toLowerCase();

  if (data.users.some((u) => u.email === cleanEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: `user-${crypto.randomBytes(8).toString('hex')}`,
    name: fullName.trim(),
    email: cleanEmail,
    passwordRecord: createPasswordRecord(password),
    avatar: avatar || null,
    initials: getInitials(fullName),
    workspaceName: `${fullName.trim().split(' ')[0]}'s Workspace`,
    onboardingDone: false,
    createdAt: new Date().toISOString()
  };

  data.users.push(newUser);
  // Every new account starts with its own fresh, empty workspace/board.
  data.workspaces[newUser.id] = { board: createDefaultBoard() };

  const token = crypto.randomBytes(32).toString('hex');
  data.sessions[token] = newUser.id;

  saveData(data);
  res.status(201).json({ token, user: stripPassword(newUser) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const data = readData();
  const cleanEmail = email.trim().toLowerCase();
  const user = data.users.find((u) => u.email === cleanEmail);

  if (!user || !verifyPassword(password, user.passwordRecord)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  data.sessions[token] = user.id;
  saveData(data);

  res.json({ token, user: stripPassword(user) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const data = req._data;
  delete data.sessions[req.token];
  saveData(data);
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const data = req._data;
  const user = data.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: stripPassword(user) });
});

app.post('/api/auth/onboarding-complete', requireAuth, (req, res) => {
  const data = req._data;
  const user = data.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  user.onboardingDone = true;
  saveData(data);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Board routes — every route below is scoped to req.userId via requireAuth
// ---------------------------------------------------------------------------
app.get('/api/board', requireAuth, (req, res) => {
  const data = req._data;
  const board = getUserBoard(data, req.userId);
  saveData(data);
  res.json(board);
});

app.put('/api/board', requireAuth, (req, res) => {
  const data = req._data;
  data.workspaces[req.userId] = { board: req.body };
  saveData(data);
  res.json({ success: true, board: data.workspaces[req.userId].board });
});

// Get all labels for the current board
app.get('/api/labels', requireAuth, (req, res) => {
  const data = req._data;
  const board = getUserBoard(data, req.userId);
  if (!board.labels) board.labels = [];
  res.json({ labels: board.labels });
});

// Create a new label on the current board
app.post('/api/labels', requireAuth, (req, res) => {
  const { name, color } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Label name is required' });

  const data = req._data;
  const board = getUserBoard(data, req.userId);
  if (!board.labels) board.labels = [];

  const newLabel = {
    id: `label-${crypto.randomBytes(6).toString('hex')}`,
    name,
    color: color || '#3b82f6',
    system: false
  };

  board.labels.push(newLabel);
  saveData(data);
  res.status(201).json({ label: newLabel });
});

// Update a label on the current board
app.put('/api/labels/:labelId', requireAuth, (req, res) => {
  const { labelId } = req.params;
  const { name, color } = req.body || {};

  const data = req._data;
  const board = getUserBoard(data, req.userId);
  if (!board.labels) board.labels = [];

  const label = board.labels.find((l) => l.id === labelId);
  if (!label) return res.status(404).json({ error: 'Label not found' });

  if (name !== undefined) label.name = name;
  if (color !== undefined) label.color = color;

  saveData(data);
  res.json({ label });
});

// Delete a label on the current board
app.delete('/api/labels/:labelId', requireAuth, (req, res) => {
  const { labelId } = req.params;

  const data = req._data;
  const board = getUserBoard(data, req.userId);
  if (!board.labels) board.labels = [];

  const index = board.labels.findIndex((l) => l.id === labelId);
  if (index === -1) return res.status(404).json({ error: 'Label not found' });

  board.labels.splice(index, 1);

  // Also remove this label from all cards on the board
  for (const list of board.lists) {
    for (const card of list.cards) {
      if (Array.isArray(card.labels)) {
        card.labels = card.labels.filter((l) => l.id !== labelId);
      }
    }
  }

  saveData(data);
  res.json({ success: true });
});

app.post('/api/lists', requireAuth, (req, res) => {
  const { title, color } = req.body || {};
  if (!title) return res.status(400).json({ error: 'List title required' });

  const data = req._data;
  const board = getUserBoard(data, req.userId);
  const newList = {
    id: `list-${crypto.randomBytes(6).toString('hex')}`,
    title,
    color: color || '#1e293b',
    isInbox: false,
    cards: []
  };

  board.lists.push(newList);
  saveData(data);
  res.status(201).json(newList);
});

app.put('/api/lists/:listId', requireAuth, (req, res) => {
  const { listId } = req.params;
  const { title, color } = req.body || {};

  const data = req._data;
  const board = getUserBoard(data, req.userId);
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  if (title !== undefined) list.title = title;
  if (color !== undefined) list.color = color;

  saveData(data);
  res.json(list);
});

app.delete('/api/lists/:listId', requireAuth, (req, res) => {
  const { listId } = req.params;
  const data = req._data;
  const board = getUserBoard(data, req.userId);
  board.lists = board.lists.filter((l) => l.id !== listId);
  saveData(data);
  res.json({ success: true, listId });
});

app.post('/api/cards', requireAuth, (req, res) => {
  const { listId, title, description, labels, dueDate } = req.body || {};
  if (!listId || !title) return res.status(400).json({ error: 'listId and title required' });

  const data = req._data;
  const board = getUserBoard(data, req.userId);
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const user = data.users.find((u) => u.id === req.userId);
  const newCard = {
    id: `card-${crypto.randomBytes(6).toString('hex')}`,
    title,
    description: description || '',
    labels: labels || [],
    dueDate: dueDate || '',
    checklist: [],
    cover: '',
    members: [user ? user.initials : ''],
    comments: []
  };

  list.cards.push(newCard);
  saveData(data);
  res.status(201).json(newCard);
});

app.put('/api/cards/:cardId', requireAuth, (req, res) => {
  const { cardId } = req.params;
  const updates = req.body || {};
  const data = req._data;
  const board = getUserBoard(data, req.userId);

  let targetCard = null;
  for (const list of board.lists) {
    const cardIndex = list.cards.findIndex((c) => c.id === cardId);
    if (cardIndex !== -1) {
      list.cards[cardIndex] = { ...list.cards[cardIndex], ...updates };
      targetCard = list.cards[cardIndex];
      break;
    }
  }

  if (!targetCard) return res.status(404).json({ error: 'Card not found' });

  saveData(data);
  res.json(targetCard);
});

app.delete('/api/cards/:cardId', requireAuth, (req, res) => {
  const { cardId } = req.params;
  const data = req._data;
  const board = getUserBoard(data, req.userId);

  let deleted = false;
  for (const list of board.lists) {
    const initialLen = list.cards.length;
    list.cards = list.cards.filter((c) => c.id !== cardId);
    if (list.cards.length < initialLen) deleted = true;
  }

  if (!deleted) return res.status(404).json({ error: 'Card not found' });

  saveData(data);
  res.json({ success: true, cardId });
});

app.post('/api/cards/move', requireAuth, (req, res) => {
  const { cardId, sourceListId, targetListId, targetIndex } = req.body || {};
  const data = req._data;
  const board = getUserBoard(data, req.userId);

  const sourceList = board.lists.find((l) => l.id === sourceListId);
  const targetList = board.lists.find((l) => l.id === targetListId);

  if (!sourceList || !targetList) {
    return res.status(404).json({ error: 'Source or Target list not found' });
  }

  const cardIndex = sourceList.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' });

  const [movedCard] = sourceList.cards.splice(cardIndex, 1);
  const insertAt = (targetIndex !== undefined && targetIndex !== null) ? targetIndex : targetList.cards.length;
  targetList.cards.splice(insertAt, 0, movedCard);

  saveData(data);
  res.json({ success: true, board });
});

// ---------------------------------------------------------------------------
// Serve built React UI statically if available
// ---------------------------------------------------------------------------
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`TaskNova server running at http://localhost:${PORT}`);
});
