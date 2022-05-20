const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const SanitizeHtml = require('sanitize-html');
const DB = require('../../lib/db/pg_sql');
const { logger } = require('../../lib/logger');
const { tokenpermissions } = require('../middlewares/tokenVerify');
const { randomString, convertStatusToNumber } = require('../../lib/util');


const PluginConfig = {
};

/* Plugin info */
const PluginName = 'Keys';
const PluginRequirements = [];
const PluginVersion = '0.0.1';
const PluginAuthor = 'BolverBlitz';
const PluginDocs = '';

const customJoi = Joi.extend((joi) => {
    return {
        type: 'string',
        base: joi.string(),
        rules: {
            htmlStrip: {
                validate(value) {
                    return SanitizeHtml(value, {
                        allowedTags: [],
                        allowedAttributes: {},
                    });
                },
            },
        },
    };
});

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30
});

const getKeysschema = Joi.object({
    onlymykeys: Joi.boolean().required(),
    status: Joi.string().valid('all', 'ava', 'unk', 'gif', 'use').required(),
})

const getKeyData = Joi.object({
    KeyID: customJoi.string().trim().required().htmlStrip()
})

const newkeysschema = customJoi.object({
    Status: customJoi.string().max(256).htmlStrip().required().max(3),
    Keys: customJoi.string().trim().required().htmlStrip(),
    Owner: customJoi.string().trim().required().htmlStrip(),
});

const router = express.Router();

router.post("/", tokenpermissions(), limiter, async (reg, res, next) => {
    try {
        const value = await newkeysschema.validateAsync(reg.body);
        const KeyDataArray = value.Keys.split('\n');

        const KeyAdded = [];
        const KeyRejected = [];
        const TableData = [];

        for (i = 0; i < KeyDataArray.length; i++) {
            const KeyString = KeyDataArray[i].split(':');
            const SteamKey = KeyString[KeyString.length - 1];
            const KeyName = [];

            if (SteamKey.match(/[A-z0-9]{5}(?:(?:-[A-z0-9]{5}){4}|(?:-[A-z0-9]{5}){2})/gi)) {
                for (j = 0; j < KeyString.length - 1; j++) {
                    KeyName.push(KeyString[j]);
                }

                TableData.push({
                    "Status": value.Status.trim(),
                    "Name": KeyName.join(":").trim(),
                    "Key": SteamKey.trim(),
                    "Owner": value.Owner.trim(),
                });
            }
        }

        const TableDataFiltered = TableData.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.Key === value.Key
            ))
        )

        const DBKeyChecks = [];
        const DBWrites = [];
        for (i = 0; i < TableDataFiltered.length; i++) {
            KeyData = TableDataFiltered[i];
            DBKeyChecks.push(DB.key.read.check.key(KeyData.Key));
        }

        Promise.all(DBKeyChecks).then((KeyExistsList) => {
            for (i = 0; i < TableDataFiltered.length; i++) {
                KeyData = TableDataFiltered[i];

                if (!KeyExistsList[i]) {
                    KeyAdded.push(KeyData);
                    DBWrites.push(DB.key.write.key(randomString(64), KeyData.Key, KeyData.Name, convertStatusToNumber(KeyData.Status), KeyData.Owner));
                } else {
                    KeyRejected.push(KeyData);
                }
            }

            Promise.all(DBWrites).then(() => {
                res.status(200);
                res.json({ KeyAdded, KeyRejected })
            }).catch(err => {
                logger('error', 'Error when writing one or multiple keys to DB ' + err);
                res.status(500);
                res.json({ error: 'Error when writing one or multiple keys to DB ' + err });
            });

        }).catch((err) => {
            logger('error', 'Error when writing one or multiple keys to DB ' + err);
            res.status(500);
            res.json({ error: 'Error when writing one or multiple keys to DB ' + err });
        });
    } catch (error) {
        logger('error', 'Error at saving keys' + error)
        next(error);
    }
});

router.get("/", limiter, tokenpermissions(true), async (reg, res, next) => {
    try {
        const value = await getKeysschema.validateAsync(reg.query);
        let owner;
        if (reg.check) {
            owner = reg.check.Data.username
        }

        if (value.onlymykeys) { // If only my keys is set to true
            if (value.status === 'all') { // If status is all and my keys is set to true
                DB.key.read.all.keywithuserstatsowner(owner).then((KeyData) => {
                    res.status(200);
                    res.json(KeyData.rows);
                }).catch((err) => {
                    logger('error', 'Error when reading all keys from DB ' + err);
                    res.status(500);
                    res.json({ error: 'Error when reading all keys from DB ' + err });
                });
            } else {
                DB.key.read.all.keysonstatuswithuserstatsowner(convertStatusToNumber(value.status), owner).then((KeyData) => {
                    res.status(200);
                    res.json(KeyData.rows);
                }).catch((err) => {
                    logger('error', 'Error when reading all keys from DB ' + err);
                    res.status(500);
                    res.json({ error: 'Error when reading all keys from DB ' + err });
                });
            }
        } else { // If only my keys is set to false
            if (value.status === 'all') { // If status is all and my keys is set to false
                DB.key.read.all.keywithuserstats().then((KeyData) => {
                    res.status(200);
                    res.json(KeyData.rows);
                }).catch((err) => {
                    logger('error', 'Error when reading all keys from DB ' + err);
                    res.status(500);
                    res.json({ error: 'Error when reading all keys from DB ' + err });
                });
            } else {
                DB.key.read.all.keysonstatuswithuserstats(convertStatusToNumber(value.status)).then((KeyData) => {
                    res.status(200);
                    res.json(KeyData.rows);
                }).catch((err) => {
                    logger('error', 'Error when reading all keys from DB ' + err);
                    res.status(500);
                    res.json({ error: 'Error when reading all keys from DB ' + err });
                });
            }
        }
    } catch (error) {
        logger('error', 'Error at getting keys' + error);
        next(error);
    }
});

router.get("/keysave", limiter, async (reg, res, next) => {
    try {
        const value = await getKeyData.validateAsync(reg.query)

        DB.key.read.keysave(value.KeyID).then((KeyDataSave) => {
            res.status(200);
            res.json(KeyDataSave.rows[0])
        })
    } catch (error) {
        logger('error', 'Error at getting a key' + error);
        next(error);
    }
});

module.exports = {
    router: router,
    PluginName: PluginName,
    PluginRequirements: PluginRequirements,
    PluginVersion: PluginVersion,
    PluginAuthor: PluginAuthor,
    PluginDocs: PluginDocs
};