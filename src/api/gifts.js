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
const router = express.Router();

router.post("/create", tokenpermissions(), limiter, async (reg, res, next) => {
    try {
        const value = await createGift.validateAsync(reg.body);

        DB.key.read.keysave(value.KeyID).then((KeyData) => {
            console.log(KeyData.rows[0].owner, reg.check.Data.username);
            
            if(KeyData.rows[0].owner !== reg.check.Data.username) {
                res.status(401);
                res.json({
                    Message: 'You are not the owner of this key.'
                });
            }
            
        });
        
    } catch (error) {
        logger('error', 'Error at saving gift' + error)
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