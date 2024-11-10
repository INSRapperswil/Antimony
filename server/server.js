import express from 'express';
import http from 'http';
import fs from 'fs';
import YAML from 'yaml';
import jwt from 'jsonwebtoken';
import bearerToken from 'express-bearer-token';
import {Server} from 'socket.io';
import {lorem} from 'txtgen';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;
const secret = 'thisismylittlesecret';

const store = {
  topologies: [],
  labs: [],
  devices: [],
  groups: [],
  users: [],
  notifications: {},
};

await loadTestData();

app.use(express.json());
app.use(bearerToken());

app.get('/', (req, res) => {
  res.send('Failed to find');
});

app.get('/devices', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  res.send({payload: store.devices});
});

app.get('/topologies', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  res.send({payload: getUserTopologies(user)});
});

app.post('/topologies', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  const newTopology = req.body;

  const targetGroup = store.groups.find(group => group.id === req.body.groupId);

  if (!targetGroup) {
    res.send(generateError('Specified group does not exist.'));
    return;
  }

  const topologyId = uuidv4();

  store.topologies.push({
    id: topologyId,
    creatorId: user.id,
    groupId: targetGroup.id,
    definition: newTopology.definition,
  });

  res.send({payload: {id: topologyId}});
});

app.patch('/topologies/:topologyId', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  const updatedDefinition = req.body.definition;
  const targetTopology = store.topologies.find(
    topology => topology.id === req.params.topologyId
  );

  if (!targetTopology) {
    res.send(generateError('Specified topology does not exist.'));
    return;
  }

  targetTopology.definition = updatedDefinition;

  res.send({});
});

app.delete('/topologies/:topologyId', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  const targetTopology = store.topologies.find(
    topology => topology.id === req.params.topologyId
  );

  if (!targetTopology) {
    res.send(generateError('Specified topology does not exist.'));
    return;
  }

  store.topologies.splice(store.topologies.indexOf(targetTopology), 1);

  res.send({});
});

app.get('/groups', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  res.send({payload: getUserGroups(user)});
});

app.post('/groups', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  const newGroup = req.body;

  if (store.groups.filter(group => group.name === newGroup.name) > 0) {
    res.send(generateError('A group with that name already exists.'));
    return;
  }

  const groupId = uuidv4();

  store.groups.push({
    id: groupId,
    name: newGroup.name,
    canWrite: newGroup.canWrite,
    canRun: newGroup.canRun,
  });

  user.groups.push(groupId);

  res.send({});
});

app.delete('/groups/:groupId', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  const targetGroup = store.groups.find(
    group => group.id === req.params.groupId
  );

  if (!targetGroup) {
    res.send(generateError('Specified group does not exist.'));
    return;
  }

  store.groups = store.groups.toSpliced(store.groups.indexOf(targetGroup), 1);

  res.send({});
});

app.patch('/groups/:groupId', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  const updatedGroup = req.body;
  const targetGroup = store.groups.find(
    group => group.id === req.params.groupId
  );

  if (!targetGroup) {
    res.send(generateError('Specified group does not exist.'));
    return;
  }

  if (store.groups.filter(group => group.name === updatedGroup.name) > 1) {
    res.send(generateError('A group with that name already exists.'));
    return;
  }

  targetGroup.name = updatedGroup.name;
  targetGroup.canWrite = updatedGroup.canWrite;
  targetGroup.canRun = updatedGroup.canRun;

  res.send({});
});

app.get('/notifications', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  res.send({payload: getUserNotifications(user)});
});

app.get('/labs', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  res.send({
    payload: filterLabs(
      getUserLabs(user),
      req.query.limit,
      req.query.offset,
      req.query.searchQuery,
      req.query.stateFilter,
      req.query.groupFilter,
      req.query.startDate,
      req.query.endDate
    ).toSorted((a, b) => a.name.localeCompare(b.name)),
  });

  // void addRandomNotification(user.id);
});

app.post('/labs', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  const newLab = req.body;
  const targetTopology = store.topologies.find(
    topology => topology.id === req.body.topologyId
  );

  const lab = {
    name: newLab.name,
    startDate: newLab.startDate,
    endDate: newLab.endDate,
    groupId: targetTopology.groupId,
    topologyId: targetTopology.id,
    nodeMeta: {
      'srl/nokia_srlinux': {
        user: 'ins',
        host: 'example.com',
        port: 9003,
        webSsh: 'console.ltb3.network.garden/whatever/stuff',
      },
    },
    edgesharkLink: 'edgeshark.example.com/whatever',
    runnerId: user.id,
    latestStateChange: new Date().toISOString(),
    state: 0,
  };

  store.labs.push(lab);

  // TODO(kian): Maybe change this to actually take scheduling into account
  labQueue.push([lab, Date.now(), randomNumber(2000, 4000)]);

  res.send({});
});

app.post('/users/auth', (req, res) => {
  const body = req.body;
  const user = findUser(body.username, body.password);
  if (!user) {
    res.send(generateError('Invalid credentials'));
    return;
  }

  res.send({
    payload: {
      token: jwt.sign({user: user.id}, secret),
      isAdmin: user.isAdmin,
    },
  });
});

const labQueue = [];
const notificationQueue = [];
const socketMap = new Map();

io.on('connection', socket => {
  console.log('[SIO] A new client connected via socket.io');
  const user = authenticateUser(socket.handshake.auth.token);
  if (!user) {
    socket.disconnect();
    return;
  }

  socketMap.set(user.id, socket);

  socket.on('disconnect', () => {
    console.log('[SIO] A client has disconnected from socket.io');
    socketMap.delete(user.id);
  });
});

server.listen(port, () => {
  console.log('[APP] Antimony server ready...');
});

function generateError(message) {
  return {
    code: 400,
    message: message,
  };
}

function authenticateUser(token) {
  try {
    return store.users.find(user => user.id === jwt.verify(token, secret).user);
  } catch (err) {
    console.error('[APP] Failed to decode JWT. Skipping.');
    return null;
  }
}

function findUser(username, password) {
  for (let user of store.users) {
    if (user.username === username && user.password === password) {
      return user;
    }
  }
  return null;
}

function filterLabs(
  labs,
  limit,
  offset,
  query,
  stateFilter,
  groupFilter,
  startDate,
  endDate
) {
  let filteredLabs = labs;

  try {
    stateFilter = JSON.parse(stateFilter).map(id => Number(id));
    if (stateFilter.length > 0) {
      filteredLabs = filteredLabs.filter(lab =>
        stateFilter.includes(lab.state)
      );
    }
  } catch (err) {}

  try {
    groupFilter = JSON.parse(groupFilter);
    if (groupFilter.length > 0) {
      filteredLabs = filteredLabs.filter(lab =>
        groupFilter.includes(lab.groupId)
      );
    }
  } catch (err) {}

  if (startDate && !isNaN(Date.parse(startDate))) {
    startDate = Date.parse(startDate);
    filteredLabs = filteredLabs.filter(
      lab => Date.parse(lab.startDate) > startDate
    );
  }

  if (endDate && !isNaN(Date.parse(endDate))) {
    endDate = Date.parse(endDate);
    filteredLabs = filteredLabs.filter(
      lab => Date.parse(lab.startDate) < endDate
    );
  }

  if (offset !== undefined && !isNaN(Number(offset))) {
    filteredLabs = filteredLabs.slice(Number(offset), filteredLabs.length);
  }

  if (limit !== undefined && !isNaN(Number(limit))) {
    filteredLabs = filteredLabs.slice(0, Number(limit));
  }

  return filteredLabs;
}

function getUserLabs(user) {
  return user.groups
    .map(groupId => store.groups.find(group => group.id === groupId))
    .filter(group => group)
    .flatMap(group => store.labs.filter(lab => lab.groupId === group.id));
}

function getUserGroups(user) {
  return user.groups
    .map(groupId => store.groups.find(group => group.id === groupId))
    .filter(group => group);
}

function getUserNotifications(user) {
  return store.notifications[user.id] ?? [];
}

function getUserTopologies(user) {
  return user.groups
    .map(groupId => store.groups.find(group => group && group.id === groupId))
    .filter(group => group && (user.isAdmin || group.canRun || group.canWrite))
    .flatMap(group =>
      store.topologies.filter(topology => topology.groupId === group.id)
    );
}

async function addRandomNotification(userId) {
  const notification = await generateRandomNotification();
  notificationQueue.push({
    userId: userId,
    data: notification,
  });

  if (userId in store.notifications) {
    store.notifications[userId].push(notification);
  } else {
    store.notifications[userId] = [notification];
  }

  if (store.notifications[userId].length > 20) {
    store.notifications[userId].splice(0, 1);
  }
}

async function generateRandomNotification() {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    summary: makeTitle(lorem(4, 8)) + '.',
    detail: (await (await fetch('https://meowfacts.herokuapp.com/')).json())[
      'data'
    ][0],
    severity: Math.floor(Math.random() * 4),
  };
}

async function generateNotificationTestData(users) {
  const notifications = {};

  for (const user of users) {
    notifications[user.id] = [];
    const amount = Math.floor(Math.random() * 10);
    for (let i = 0; i < amount; i++) {
      notifications[user.id].push(await generateRandomNotification());
    }
  }

  return notifications;
}

function makeTitle(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

async function loadTestData() {
  store.topologies = readDataFile('topologies.yaml');
  store.labs = readDataFile('labs.yaml');
  store.devices = readDataFile('devices.yaml');
  store.groups = readDataFile('groups.yaml');
  store.users = readDataFile('users.yaml');
  store.notifications = await generateNotificationTestData(store.users);

  for (const userId in store.notifications) {
    for (const notif of store.notifications[userId]) {
      notif.detail = (
        await (await fetch('https://meowfacts.herokuapp.com/')).json()
      )['data'][0];
    }
  }
}

function readDataFile(fileName) {
  try {
    return YAML.parse(fs.readFileSync(`./data/${fileName}`, 'utf8'));
  } catch (err) {
    console.error(`[APP] Failed to read data from '${fileName}'. Aborting.`);
    console.error(`[APP]   Error info: ${err}`);
    process.exit(1);
  }
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function uuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

function executeLabStep() {
  if (labQueue.length === 0) return;

  const [lab] = labQueue.find(
    ([, start, cooldown]) => start - Date.now() < cooldown
  );
  if (!lab) return;

  labQueue.splice(labQueue.indexOf(lab), 1);

  let notificationSummary = '[SERVER] Deployment Update';
  let notificationDetail = null;
  let notificationSeverity = '';

  console.log('Executing lab: ', lab);

  switch (lab.state) {
    case 0:
      lab.state = 1;
      lab.latestStateChange = new Date().toISOString();
      notificationDetail = `Deployment of lab "${lab.name}" has been started.`;
      notificationSeverity = 2;
      labQueue.push([lab, Date.now(), randomNumber(5000, 10000)]);
      break;
    case 1:
      if (randomNumber(0, 100) > 50) {
        lab.state = 2;
        lab.latestStateChange = new Date().toISOString();
        notificationDetail = `Lab "${lab.name}" has been successfully deployed.`;
        notificationSeverity = 2;
      } else {
        lab.state = 3;
        lab.latestStateChange = new Date().toISOString();
        notificationDetail = `Deployment of lab "${lab.name}" has failed!`;
        notificationSeverity = 0;
      }
      break;
  }

  if (notificationDetail) {
    notificationQueue.push({
      userId: lab.runnerId,
      data: {
        id: uuidv4(),
        timestamp: new Date(),
        summary: notificationSummary,
        detail: notificationDetail,
        severity: notificationSeverity,
      },
    });
  }
}

function executeNotificationStep() {
  if (notificationQueue.length === 0) return;

  const notification = notificationQueue.pop();
  if (!socketMap.has(notification.userId)) return;

  console.log('SEND NOTIFICATION TO FRONTEND');
  socketMap.get(notification.userId).emit('notification', notification.data);
}

function executeSteps() {
  executeLabStep();
  executeNotificationStep();

  setTimeout(executeSteps, Math.floor(Math.random() * (6 - 2) + 6) * 1000);
}

executeSteps();
