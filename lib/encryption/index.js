const { randomBytes, createCipheriv, createDecipheriv } = require('node:crypto');
const { Buffer } = require('node:buffer');
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt');
const { logger } = require('../logger');
const { randomString } = require('../util');
const { process_params } = require('express/lib/router');

const algorithm = 'aes-256-cbc';
let g_key = "";

try {
    const KeyFileCheck = fs.existsSync(path.join(__dirname, '..', '..', '.key'))
    const KeyValidFileCheck = fs.existsSync(path.join(__dirname, '..', '..', '.key_valid'))

    //Check if the key file exists, if not create it
    if (!KeyFileCheck && !KeyValidFileCheck) {
        const key = randomString(32);
        fs.writeFileSync(path.join(__dirname, '..', '..', '.key'), key);
        logger('system', 'Encryption Key file created. Keep it save and secure!');
        bcrypt.hash(key, parseInt(process.env.SaltRounds), (err, hash) => {
            if (err) {
                logger('error', 'Error hashing key_valid.');
                throw err;
            }
            fs.writeFileSync(path.join(__dirname, '..', '..', '.key_valid'), hash);
            logger('system', 'Encryption Key_valid file created.');
            g_key = key;
        });
    } else {
        //Check if both files are valid
        if (KeyFileCheck && KeyValidFileCheck) {
            let test_key = fs.readFileSync(path.join(__dirname, '..', '..', '.key'), 'utf8');
            let test_key_valid = fs.readFileSync(path.join(__dirname, '..', '..', '.key_valid'), 'utf8');

            bcrypt.compare(test_key, test_key_valid, (err, res) => {
                if (err) {
                    logger('error', 'Error comparing key_valid.');
                    throw err;
                }
                if (!res) {
                    logger('error', 'Encryption Key file is not valid.');
                    throw new Error('Encryption Key file is not valid.');
                } else {
                    logger('system', 'Encryption Key file is valid.');
                    g_key = test_key;

                }
            });
        }

        //Check if the key_valid file exists, if not create it
        if (KeyFileCheck && !KeyValidFileCheck) {
            let test_key = fs.readFileSync(path.join(__dirname, '..', '..', '.key'), 'utf8');
            bcrypt.hash(test_key, parseInt(process.env.SaltRounds), (err, hash) => {
                if (err) {
                    logger('error', 'Error hashing key_valid.');
                    throw err;
                }
                fs.writeFileSync(path.join(__dirname, '..', '..', '.key_valid'), hash);
                logger('system', 'Encryption Key can´t be validated. Be carefull!');
            });
        }

        //If key files dosn´t exist but key_valid file does, exit with critical error
        if (!KeyFileCheck && KeyValidFileCheck) {
            logger('error', 'No Encryption Key found but the security file. Did you loose your key?');
            process.exit(2);
        }

    }
} catch (err) {
    console.error(err)
}

/**
 * Encrypts a string with the global key
 * @param {String} Text 
 * @param {String} [key] Encryption Key
 * @param {String} [iv] InitVector
 * @returns {String}
 */
const encrypt = (Text, key = g_key, iv = randomBytes(16)) => {
    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(Text, 'utf-8', 'hex')
    encrypted += cipher.final("hex");

    return (`${iv.toString('hex')}.${encrypted}`);
}

/**
 * Decrypts a string with the global key
 * @param {String} Text 
 * @param {String} [key] Encryption Key 
 * @returns 
 */
const decrypt = (Text, key = g_key) => {
    const [iv, encrypted] = Text.split('.');
    const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8');

    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
}