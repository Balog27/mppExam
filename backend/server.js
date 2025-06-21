const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 4000;

const app = express();

app.use(cors());
app.use(express.json());

// In-memory candidate data
let candidates = [
  {
    id: 1,
    name: 'Alice Johnson',
    imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    party: 'Progressive Party',
    description: 'Alice is a passionate advocate for education reform and environmental sustainability.'
  },
  {
    id: 2,
    name: 'Bob Smith',
    imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    party: 'Conservative Union',
    description: 'Bob has 20 years of experience in public service and focuses on economic growth.'
  },
  {
    id: 3,
    name: 'Carla Gomez',
    imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    party: 'Green Future',
    description: 'Carla is dedicated to renewable energy and social justice initiatives.'
  }
];
let nextId = 4;
let generatorInterval = null;

const PARTIES = [
  'Progressive Party',
  'Conservative Union',
  'Green Future',
  'Liberal Alliance',
  'Social Democrats',
  "People's Voice"
];

function getRandomName() {
  const firstNames = ['John', 'Jane', 'Alex', 'Maria', 'Chris', 'Sofia', 'David', 'Emma', 'Liam', 'Olivia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}
function getRandomImageUrl() {
  const gender = Math.random() > 0.5 ? 'men' : 'women';
  const num = Math.floor(Math.random() * 90) + 1;
  return `https://randomuser.me/api/portraits/${gender}/${num}.jpg`;
}
function getRandomParty() {
  return PARTIES[Math.floor(Math.random() * PARTIES.length)];
}
function getRandomDescription() {
  const descs = [
    'A passionate advocate for change.',
    'Experienced in public service.',
    'Focuses on economic growth.',
    'Dedicated to renewable energy.',
    'Believes in social justice.',
    'Committed to education reform.',
    'Supports healthcare for all.',
    'Champion of technology and innovation.'
  ];
  return descs[Math.floor(Math.random() * descs.length)];
}

function broadcast(wsServer, data) {
  wsServer.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// REST API
app.get('/candidates', (req, res) => {
  res.json(candidates);
});

app.post('/candidates', (req, res) => {
  const { name, imageUrl, party, description } = req.body;
  const candidate = { id: nextId++, name, imageUrl, party, description };
  candidates.push(candidate);
  broadcast(wsServer, { type: 'update', candidates });
  res.status(201).json(candidate);
});

app.put('/candidates/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, imageUrl, party, description } = req.body;
  const idx = candidates.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  candidates[idx] = { id, name, imageUrl, party, description };
  broadcast(wsServer, { type: 'update', candidates });
  res.json(candidates[idx]);
});

app.delete('/candidates/:id', (req, res) => {
  const id = parseInt(req.params.id);
  candidates = candidates.filter(c => c.id !== id);
  broadcast(wsServer, { type: 'update', candidates });
  res.status(204).end();
});

// Generation control
app.post('/generate/start', (req, res) => {
  if (generatorInterval) return res.status(400).json({ error: 'Already generating' });
  generatorInterval = setInterval(() => {
    const candidate = {
      id: nextId++,
      name: getRandomName(),
      imageUrl: getRandomImageUrl(),
      party: getRandomParty(),
      description: getRandomDescription()
    };
    candidates.push(candidate);
    broadcast(wsServer, { type: 'update', candidates });
  }, 500);
  res.json({ status: 'started' });
});

app.post('/generate/stop', (req, res) => {
  if (generatorInterval) {
    clearInterval(generatorInterval);
    generatorInterval = null;
    res.json({ status: 'stopped' });
  } else {
    res.status(400).json({ error: 'Not generating' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`REST API and WebSocket listening on http://localhost:${PORT}`);
});

// WebSocket server (on same port as REST for Railway)
const wsServer = new WebSocketServer({ server });
wsServer.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'update', candidates }));
}); 