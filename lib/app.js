const express = require('express');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./util/ensure-auth.js')();

const path = require('path');

const publicDir = path.resolve(__dirname, '../public');
app.use(morgan('dev'));
app.use(express.static(publicDir));
app.use(express.json());

const { handler, api404 } = require('./util/errors');

const ships = require('./routes/ships');
app.use('/api/ships', ships);

const responses = require('./routes/responses');
app.use('/api/responses', ensureAuth, responses);

const auth = require('./routes/auth');
app.use('/api/auth', auth);

const stages = require('./routes/stages');
app.use('/api/stages', stages);

app.use('/api', api404);
app.use((req, res) => {
    res.sendStatus(404);
});

app.use(handler);

module.exports = app;