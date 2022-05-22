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
    id text,
    key text,
    name text,
    status int,
    status_modifyed timestamp WITH TIME ZONE,
    owner text,
    created_at timestamp WITH TIME ZONE,
    gifted_to text,
    gifted_at timestamp WITH TIME ZONE,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id))`, (err) => {
    if (err) { logger('error', `Table-gen: Error keyslist ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS gifts (
    id text,
    url_token text,
    request boolean,
    request_name text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id))`, (err) => {
    if (err) { logger('error', `Table-gen: Error gifts ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS users (
    username text,
    password text,
    extraverify text,
    login_2fa TIMESTAMP WITH TIME ZONE,
    keys_success bigint,
    keys_failed bigint,
    lang text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (username))`, (err) => {
    if (err) { logger('error', `Table-gen: Error users ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS user_permissions (
    username text,
    permission text,
    read boolean,
    write boolean,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (username, permission))`, (err) => {
    if (err) { logger('error', `Table-gen: Error user_permissions ${err}`) }
});

pool.query(`CREATE TABLE IF NOT EXISTS webtokens (
    username text,
    token text,
    ip text,
    browser text,
    lang text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (token))`, (err) => {
    if (err) { logger('error', `Table-gen: Error webtokens ${err}`) }
});

/*
    |-------------------------------------------------------------------------------|
    |                                                                               |
    |                              Key - Managment                                  |
    |                                                                               |
    |-------------------------------------------------------------------------------|
*/

/**
 * Write a new Key to db with status and owner
 * @param {String} id
 * @param {String} key 
 * @param {String} name 
 * @param {Number} [status]
 * @param {String} owner 
 * @returns {Promise}
 */
const WriteNewKey = function (id, key, name, status = 1, owner) {
    return new Promise(function (resolve, reject) {
        pool.query('INSERT INTO keyslist (id, key, name, status, status_modifyed, owner, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [
            id, key, name, status, new Date(), owner, new Date()
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function is used to remove a key
 * @param {String} id
 * @returns {Promise}
 */
const DelKey = function (id) {
    return new Promise(function (resolve, reject) {
        pool.query(`DELETE FROM keyslist WHERE id = $1`, [
            id
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function will return all keys from DB
 * @returns {Promise}
 */
const GetAllKeys = function () {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT id, name, status, status_modifyed, created_at FROM keyslist`, (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function will return all keys from DB with the user succsess and fail rate
 * @returns {Promise}
 */
const GetAllKeysWithKeyFailandSuccsessJoinToUserTable = function () {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT keyslist.id, keyslist.name, keyslist.status, keyslist.status_modifyed, keyslist.owner, keyslist.created_at, users.keys_success, users.keys_failed FROM keyslist LEFT JOIN users ON keyslist.owner = users.username WHERE NOT keyslist.status = 4`,
            (err, result) => {
                if (err) { reject(err) }
                resolve(result);
            });
    });
}

/**
 * This function will return all keys from DB with a specific status and the user succsess and fail rate
 * @param {Number} status
 * @returns {Promise}
 */
const GetAllKeysBasedOnStatusWithKeyFailandSuccsessJoinToUserTable = function (status) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT keyslist.id, keyslist.name, keyslist.status, keyslist.status_modifyed, keyslist.owner, keyslist.created_at, users.keys_success, users.keys_failed FROM keyslist LEFT JOIN users ON keyslist.owner = users.username WHERE keyslist.status = $1`, [
            status
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function will return all keys from DB with the user succsess and fail rate only owner
 * @param {String} owner
 * @returns {Promise}
 */
const GetAllKeysWithKeyFailandSuccsessJoinToUserTableWithOwner = function (owner) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT keyslist.id, keyslist.name, keyslist.status, keyslist.status_modifyed, keyslist.owner, keyslist.created_at, users.keys_success, users.keys_failed FROM keyslist LEFT JOIN users ON keyslist.owner = users.username WHERE keyslist.owner = $1 AND NOT keyslist.status = 4`, [
            owner
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function will return all keys from DB with a specific status and the user succsess and fail rate only owner
 * @param {Number} status
 * @param {String} owner
 * @returns {Promise}
 */
const GetAllKeysBasedOnStatusWithKeyFailandSuccsessJoinToUserTableWithOwner = function (status, owner) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT keyslist.id, keyslist.name, keyslist.status, keyslist.status_modifyed, keyslist.owner, keyslist.created_at, users.keys_success, users.keys_failed FROM keyslist LEFT JOIN users ON keyslist.owner = users.username WHERE keyslist.status = $1 AND keyslist.owner = $2`, [
            status, owner
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function will return all keys from DB with a specific status
 * @param {Number} status 
 * @returns {Promise}
 */
const GetAllKeysBasedOnStatus = function (status) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT id, name, status, status_modifyed, created_at FROM keyslist WHERE status = $1`, [
            status
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * Returns all data of a Key
 * @param {String} id 
 * @returns 
 */
const GetKeyDetails = function (id) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT * FROM keyslist WHERE id = $1`, [
            id
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * Returns all data of a Key exept the code
 * @param {String} id 
 * @returns 
 */
 const GetKeyDetailsSave = function (id) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT id, name, status, owner, status_modifyed, created_at, gifted_to, gifted_at FROM keyslist WHERE id = $1`, [
            id
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * Checks if a key is already in the DB
 * @param {String} key
 * @returns {Promise} Returns true if key exists
 */
const CheckKeyDetails = function (key) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT * FROM keyslist WHERE key = $1`, [
            key
        ], (err, result) => {
            if (err) { reject(err) }
            if (result.rows.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

/**
 * 
 * @param {String} id 
 * @param {Number} status 
 * @returns {Promise}
 */
const UpdateKeyStatus = function (id, status) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE keyslist SET status = $1, status_modifyed = CURRENT_TIMESTAMP WHERE id = $2`, [
            status, id
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * Update a key if it was gifted
 * @param {String} id 
 * @param {String} gifted_to 
 * @returns {Promise}
 */
const UpdateKeyGiftedto = function (id, gifted_to) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE keyslist SET gifted_to = $1 WHERE id = $2`, [
            gifted_to, id
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * Update a keys status to gifted
 * @param {String} id 
 * @returns {Promise}
 */
 const UpdateKeyGiftedStatus = function (id) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE keyslist SET status = 3, gifted_at = CURRENT_TIMESTAMP WHERE id = $1`, [
            id
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/*
    |-------------------------------------------------------------------------------|
    |                                                                               |
    |                              User - Managment                                 |
    |                                                                               |
    |-------------------------------------------------------------------------------|
*/

/**
 * This function will write new user to DB
 * @param {String} username
 * @param {String} password
 * @param {String} [extraverify]
 * @param {String} [login_2fa]
 * @param {string} lang
 * @returns {Promise}
 */
const WriteNewUser = function (username, password, lang, extraverify = null, login_2fa = null) {
    return new Promise(function (resolve, reject) {
        pool.query('INSERT INTO users (username, password, lang, extraverify, login_2fa) VALUES ($1,$2,$3,$4,$5)', [
            username, password, lang, extraverify, login_2fa
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
* This function will return all users without sectet stuff
* @returns Array
*/
const GetAllUsers = function () {
    return new Promise(function (resolve, reject) {
        pool.query('SELECT username, lang, extraverify FROM users', (err, result) => {
            if (err) { reject(err) }
            //Just make sure to not leak secrets...
            for (let i = 0; i < result.rows.length; i++) {
                if (result.rows[i].extraverify) {
                    result.rows[i].extraverify = true;
                } else {
                    result.rows[i].extraverify = false;
                }
            }
            resolve(result.rows);
        });
    });
}

/**
 * This function will return a user by username
 * @param {String} username
 * @returns {Object}
 */
const GetUserbyName = function (username) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT * FROM users WHERE username = '${username}'`, (err, result) => {
            if (err) { reject(err) }
            resolve(result.rows);
        });
    });
}

/**
 * This function will update a users login_2fa, if null the user dosn´t login
 * @param {String} [login_2fa]
 * @param {String} username
 * @returns {Promise}
 */
const UpdateUserlogin_2fa = function (username, login_2fa = null) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE users SET login_2fa = $1 WHERE username = $2`, [
            login_2fa, username
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result)
        });
    });
}

/**
 * This function will update a users language
 * @param {String} lang
 * @param {String} username
 * @returns {Promise}
 */
const UpdateUserLang = function (lang, username) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE users SET lang = $1 WHERE username = $2`, [
            lang, username
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result)
        });
    });
}

/**
 * Adds one to the Key Succsess info of a user
 * @param {String} username 
 * @returns {Promise}
 */
const IncreeseUserKeySuccess = function (username) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE users SET key_success = key_success + 1 WHERE username = $1`, [
            username
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result)
        });
    });
}

/**
 * Adds one to the Key Fail info of a user
 * @param {String} username 
 * @returns {Promise}
 */
const IncreeseUserKeyFail = function (username) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE users SET key_fail = key_fail + 1 WHERE username = $1`, [
            username
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result)
        });
    });
}

/*
    |-------------------------------------------------------------------------------|
    |                                                                               |
    |                            Permissions - Managment                            |
    |                                                                               |
    |-------------------------------------------------------------------------------|
*/

/**
 * This function will add a given permission to a user
 * @param {string} username
 * @param {string} permission
 * @param {boolean} read
 * @param {boolean} write
 * @returns {Promise}
 */
const AddPermissionToUser = function (username, permission, read, write) {
    return new Promise(function (resolve, reject) {
        pool.query(`INSERT INTO user_permissions (username, permission, read, write) VALUES ($1,$2,$3,$4)`, [
            username, permission, read, write
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function is used to get a list of permissions of a user
 * @param {String} username
 * @returns {Promise}
 */
const GetPermissionFromUser = function (username) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT permission, read, write FROM user_permissions WHERE username = $1`, [
            username
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function is used to remove a permission from a user
 * @param {String} username
 * @param {String} permission
 * @returns {Promise}
 */
const DelPermissionFromUser = function (username, permission) {
    return new Promise(function (resolve, reject) {
        pool.query(`DELETE FROM user_permissions WHERE username = $1 AND permission = $2`, [
            username, permission
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function is used to update r/w of a permission of a user
 * @param {String} username
 * @param {String} permission
 * @param {boolean} read
 * @param {boolean} write
 * @returns {Promise}
 */
const UpdatePermissionFromUser = function (username, permission, read, write) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE user_permissions SET read = $3, write = $4 WHERE username = $1 AND permission = $2`, [
            username, permission, read, write
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/*
    |-------------------------------------------------------------------------------|
    |                                                                               |
    |                             Gifts - Managment                                 |
    |                                                                               |
    |-------------------------------------------------------------------------------|
*/

pool.query(`CREATE TABLE IF NOT EXISTS gifts (
    id text,
    url_token text,
    request boolean,
    request_name text,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id))`, (err) => {
    if (err) { logger('error', `Table-gen: Error keyslist ${err}`) }
});

/**
 * This function will add a gift to the database
 * @param {string} id
 * @param {string} url_token
 * @param {boolean} request
 * @param {string} request_name
 * @returns {Promise}
 */
 const AddWebGift = function (id, url_token, request, request_name) {
    return new Promise(function (resolve, reject) {
        pool.query(`INSERT INTO gifts (id, url_token, request, request_name) VALUES ($1,$2,$3,$4)`, [
            id, url_token, request, request_name
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

const GetAllGiftsForOwner = function (owner) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT * FROM gifts WHERE request = $1`, [
            owner
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * Get URL Token from a gift
 * @param {String} id 
 * @returns 
 */
const GetURLTokenFromGift = function (id) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT url_token FROM gifts WHERE id = $1`, [
            id
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

const GetKeyDetailsSaveFromGift = function (url_token) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT keyslist.name, keyslist.status, keyslist.status_modifyed, keyslist.owner, keyslist.created_at FROM keyslist INNER JOIN gifts ON keyslist.id = gifts.id WHERE gifts.url_token = $1`, [
            url_token
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/*
    |-------------------------------------------------------------------------------|
    |                                                                               |
    |                                Webtokens                                      |
    |                                                                               |
    |-------------------------------------------------------------------------------|
*/

/**
 * This function will add a webtoken to the database
 * @param {string} username
 * @param {string} ip
 * @param {string} browser
 * @param {string} token
 * @param {string} lang
 * @returns {Promise}
 */
const AddWebToken = function (username, ip, browser, token, lang) {
    return new Promise(function (resolve, reject) {
        pool.query(`INSERT INTO webtokens (username, ip, browser, token, lang) VALUES ($1,$2,$3,$4,$5)`, [
            username, ip, browser, token, lang
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function is used to get a token from the DB
 * @param {String} token
 * @returns {Promise}
 */
const GetWebToken = function (token) {
    return new Promise(function (resolve, reject) {
        pool.query(`SELECT * FROM webtokens WHERE token = '${token}'`, (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function is used to delete a webtoken
 * @param {String} token
 * @returns {Promise}
 */
const DelWebToken = function (token) {
    return new Promise(function (resolve, reject) {
        pool.query(`DELETE FROM webtokens WHERE token = '${token}'`, (err, result) => {
            if (err) { reject(err) }
            resolve(result);
        });
    });
}

/**
 * This function will update a users language in webtokens
 * @param {String} lang
 * @param {String} username
 * @returns {Promise}
 */
let UpdateUserLangWebToken = function (lang, username) {
    return new Promise(function (resolve, reject) {
        pool.query(`UPDATE webtokens SET lang = $1 WHERE username = $2`, [
            lang, username
        ], (err, result) => {
            if (err) { reject(err) }
            resolve(result)
        });
    });
}

const key = {
    write: {
        key: WriteNewKey
    },
    read: {
        key: GetKeyDetails,
        keysave: GetKeyDetailsSave,
        all: {
            keys: GetAllKeys,
            keysonstatus: GetAllKeysBasedOnStatus,
            keywithuserstats: GetAllKeysWithKeyFailandSuccsessJoinToUserTable,
            keysonstatuswithuserstats: GetAllKeysBasedOnStatusWithKeyFailandSuccsessJoinToUserTable,
            keywithuserstatsowner: GetAllKeysWithKeyFailandSuccsessJoinToUserTableWithOwner,
            keysonstatuswithuserstatsowner: GetAllKeysBasedOnStatusWithKeyFailandSuccsessJoinToUserTableWithOwner
        },
        check: {
            key: CheckKeyDetails,
        }
    },
    delete: {
        key: DelKey,
    },
    update: {
        status: UpdateKeyStatus,
        giftedto: UpdateKeyGiftedto,
        gifted: UpdateKeyGiftedStatus,
    },
}

const gift = {
    write: {
        gift: AddWebGift
    },
    read: {
        giftowner: GetAllGiftsForOwner,
        url: GetURLTokenFromGift,
        key: GetKeyDetailsSaveFromGift
    },
}

const user = {
    write: {
        user: WriteNewUser,
    },
    read: {
        user: GetUserbyName,
        allUsers: GetAllUsers,
    },
    update: {
        login_2fa: UpdateUserlogin_2fa,
        lang: UpdateUserLang,
        key_success: IncreeseUserKeySuccess,
        key_fail: IncreeseUserKeyFail,
    },
}

const permission = {
    write: {
        permission: AddPermissionToUser,
    },
    read: {
        permission: GetPermissionFromUser,
    },
    update: {
        permission: UpdatePermissionFromUser,
    },
    delete: {
        permission: DelPermissionFromUser,
    },
}

const webtoken = {
    write: {
        webtoken: AddWebToken,
    },
    read: {
        webtoken: GetWebToken,
    },
    delete: {
        webtoken: DelWebToken,
    },
    update: {
        lang: UpdateUserLangWebToken,
    },
}

module.exports = {
    key,
    gift,
    user,
    permission,
    webtoken,
}