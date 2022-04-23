const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require("fs");
const readline = require('readline');
const bcrypt = require('bcrypt');
const twofactor = require("node-2fa");
const qrcode = require('qrcode-terminal');
const DB = require('../lib/db/pg_sql');

if (isNaN(parseInt(process.env.SaltRounds))) {
    console.log(".env wurde nicht gefunden!")
}

const SaltRounds = parseInt(process.env.SaltRounds);

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function Questions() {
    const username = await askQuestion("Type your username: ");
    const lang = await askQuestion("Type your language: ");
    const password = await askQuestion("Type your password: ");
    const extraVerify = await askQuestion("Type your extraVerify (y/n): ");

    if (password.length < 8) { throw new Error("Password must be at least 8 characters long!") };
    if (password.length > 50) { throw new Error("Password must be at most 50 characters long!") };

    bcrypt.hash(password, SaltRounds, async function (err, hash) {
        if (err) { throw new Error(err) };
        if (extraVerify.toLowerCase() === "y") {

            const secret2fa = twofactor.generateSecret({ name: process.env.servername, account: username });
            qrcode.generate(secret2fa.uri, { small: true });
            const code2fa = await askQuestion("Type your 2fa code: ");

            const delta = twofactor.verifyToken(secret2fa.secret, code2fa);

            if (delta.delta === 0) {
                Promise.all([DB.user.write.user(username, hash, lang.toLowerCase(), secret2fa.secret), DB.permission.write.permission(username, "admin", true, true)]).then(function (result) {
                    console.log("\n\nAdmin User created!\n\n")
                }).catch(function (error) {
                    console.log(error);
                })
            } else {
                throw new Error("2FA Token is not valid!")
            }
        } else {
            Promise.all([DB.user.write.user(username, hash, lang), DB.permission.write.permission(username, "admin", true, true)]).then(() => {
                console.log("\n\nAdmin User created!")
                process.exit(0);
            }).catch(err => {
                console.log(err)
                process.exit(1);
            });
        }
    });
}

Questions()