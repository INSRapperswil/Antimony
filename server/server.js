import express from 'express';
import fs from 'fs';
import YAML from 'yaml';
import jwt from 'jsonwebtoken';
import bearerToken from 'express-bearer-token';

const app = express();
const port = 3000;
const secret = 'thisismylittlesecret';

const store = {
  topologies: [],
  labs: [],
  devices: [],
  groups: [],
  users: [],
};

loadTestData();

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

app.get('/groups', (req, res) => {
  const user = authenticateUser(req.token);
  if (!user) {
    res.status(403).send('Unauthorized');
    return;
  }

  res.send({payload: getUserGroups(user)});
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
});

app.post('/users/auth', (req, res) => {
  const body = req.body;
  const user = findUser(body.username, body.password);
  if (!user) {
    res.status(400).send(generateError('Invalid credentials'));
    return;
  }

  res.send({
    payload: {
      token: jwt.sign({user: user.id}, secret),
      isAdmin: user.isAdmin,
    },
  });
});

app.listen(port, () => {
  console.log('[APP] Antimony server ready');
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
    .flatMap(group => store.labs.filter(lab => lab.groupId === group.id));
}

function getUserGroups(user) {
  return user.groups.map(groupId =>
    store.groups.find(group => group.id === groupId)
  );
}

function getUserTopologies(user) {
  return user.groups
    .map(groupId => store.groups.find(group => group.id === groupId))
    .filter(group => user.isAdmin || group.public)
    .flatMap(group =>
      store.topologies.filter(topology => topology.groupId === group.id)
    );
}

function loadTestData() {
  store.topologies = readDataFile('topologies.yaml');
  store.labs = readDataFile('labs.yaml');
  store.devices = readDataFile('devices.yaml');
  store.groups = readDataFile('groups.yaml');
  store.users = readDataFile('users.yaml');
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
