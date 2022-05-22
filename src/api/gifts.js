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

const createGift = Joi.object({
    KeyID: customJoi.string().trim().required().htmlStrip()
})

const claimKey = Joi.object({
    URL_Token: customJoi.string().trim().required().htmlStrip()
})

const router = express.Router();

router.post("/create", tokenpermissions(), limiter, async (reg, res, next) => {
    try {
        const value = await createGift.validateAsync(reg.body);

        DB.key.read.keysave(value.KeyID).then((KeyData) => {

            if (KeyData.rows[0].owner !== reg.check.Data.username) {
                res.status(401);
                res.json({
                    Message: 'You are not the owner of this key.'
                });
            } else {
                if (KeyData.rows[0].status === 1 || KeyData.rows[0].status === 2) {
                    DB.key.update.gifted(value.KeyID).then(() => {
                        const url_token = randomString(24);
                        DB.gift.write.gift(value.KeyID, url_token, false, null).then(() => {
                            res.status(200);
                            res.json({
                                Message: 'Gift created.',
                                URL_Token: url_token,
                                Key_Name: KeyData.rows[0].name
                            });
                        }).catch((err) => {
                            logger('error', 'Error creating gift.' + err);
                            res.status(500);
                            res.json({
                                Message: 'Error creating gift.'
                            });
                        });
                    }).catch((err) => {
                        logger('error', 'Error updating status of key.', err);
                        res.status(500);
                        res.json({
                            Message: 'Error updating status of key.'
                        });
                    });
                } else if (KeyData.rows[0].status === 3) {
                    DB.gift.read.url(value.KeyID).then((GiftData) => {
                        if (GiftData.rows[0].url_token === null) {
                            res.status(500);
                            res.json({
                                Message: 'No gift found, key status broken.'
                            });
                        } else {
                            res.status(200);
                            res.json({
                                Message: 'Gift found.',
                                URL_Token: GiftData.rows[0].url_token,
                                Key_Name: KeyData.rows[0].name
                            });
                        }
                    }).catch((err) => {
                        logger('error', 'Error reading gift.', err);
                        res.status(500);
                        res.json({
                            Message: 'Error reading gift.'
                        });
                    });
                } else {
                    res.status(410);
                    res.json({
                        Message: 'This key is already in use.'
                    });
                }
            }
        });

    } catch (error) {
        logger('error', 'Error at saving gift' + error)
        next(error);
    }
});

router.get("/claim", limiter, async (reg, res, next) => {
    try {
        const value = await claimKey.validateAsync(reg.query)

        DB.gift.read.keysave(value.URL_Token).then((GiftKeyData) => {
            res.status(200);
            res.json(GiftKeyData.rows[0]);
        })
    } catch (error) {
        logger('error', 'Error at getting a claim' + error);
        next(error);
    }
});

router.get("/claimkey", limiter, async (reg, res, next) => {
    try {
        const value = await claimKey.validateAsync(reg.query)

        DB.gift.read.key(value.URL_Token).then((GiftKey) => {
            res.status(200);
            res.json(GiftKey.rows[0].key);
        })
        
    } catch (error) {
        logger('error', 'Error at getting a claimkey' + error);
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