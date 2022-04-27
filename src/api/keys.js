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
const PluginName = 'Users';
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
        next(error);
    }
});

router.get("/", limiter, tokenpermissions(), async (reg, res, next) => {

    try {
    } catch (error) {
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