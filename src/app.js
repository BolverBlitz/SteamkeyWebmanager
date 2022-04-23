const express = require('express');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
//const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

require('dotenv').config();

const middlewares = require('./middlewares');
const api = require('./api');

const app = express();
app.set('trust proxy', 1); // If Behind PROXY

// app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(expressCspHeader({
  directives: {
    'default-src': [SELF],
    'script-src': [SELF, INLINE],
    'style-src': [SELF, INLINE],
    'img-src': [SELF, INLINE],
    'worker-src': [NONE],
    'block-all-mixed-content': true
  }
}));

app.use(bodyParser.urlencoded({ extended: false }))

//Load index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'www-public', 'index.html'));
});

//Load public pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'www-public', 'login.html'));
});

app.get('/login2fa', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'www-public', 'login2fa.html'));
});

app.use('/assets', express.static(path.join(__dirname, '..', 'www-public', 'assets')));

//Load APIs
app.use('/api/application', api)

//Load error handling middleware
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;