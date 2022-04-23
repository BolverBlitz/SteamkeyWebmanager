const DB = require('../db/pg_sql');
const bcrypt = require('bcrypt');
const { logger } = require('../logger');

/**
 * Wil check if a Token is valid
 * @param {String} Token Token String
 * @param {object} Para Browser & IP
 * @param {String} [Para.ip] IP of the client
 * @param {String} [Para.browser] Browser of the client
 * @returns {Promise}
 */
let check = function (Token, Para) {
    return new Promise(function (resolve, reject) {
        DB.webtoken.read.webtoken(Token).then(function (Token_response) {
            if (typeof Token_response.rows[0] === "undefined") {
                resolve({ State: false })
            } else {
                let DBTime = new Date(Token_response.rows[0].time).getTime() + parseInt(process.env.WebTokenDurationH) * 60 * 60 * 1000
                if (DBTime > new Date().getTime()) { //Check if Token isn´t too old
                    bcrypt.compare(Para.IP, Token_response.rows[0].ip).then(function (result) {
                        if (Para.Browser.source === Token_response.rows[0].browser) { //Check if Browser and IP are the same
                            resolve({ State: true, Data: Token_response.rows[0] })
                        } else {
                            resolve({ State: false })
                        }
                    });
                } else {
                    resolve({ State: false })
                }
            }
        }).catch(function (error) {
            logger('error', `TokenVerification Error ${error}`);
            reject(error)
        })
    });
}

module.exports = {
    check
};