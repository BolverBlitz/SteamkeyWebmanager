const pg = require('pg');
const { logger } = require('../logger');

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

pool.query(`CREATE TABLE IF NOT EXISTS keyslist (
    key text,
    name text,
    status int,
    owner text,
    created_at timestamp,
    gifted_to text,
    created_at timestamp,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (key))`, (err, result) => {
    if (err) { logger('error', `Table-gen: Error keyslist ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS users (
    username text,
    password text,
    extraverify text,
    login_2fa TIMESTAMP WITH TIME ZONE,
    lang text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (username))`, (err, result) => {
    if (err) { logger('error', `Table-gen: Error users ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS user_permissions (
    username text,
    permission text,
    read boolean,
    write boolean,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (username, permission))`, (err, result) => {
    if (err) { logger('error', `Table-gen: Error user_permissions ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS webtokens (
    username text,
    token text,
    ip text,
    browser text,
    lang text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (token))`, (err, result) => {
    if (err) { logger('error', `Table-gen: Error webtokens ${err}`) }
});

