const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const DB = require('../../lib/db/pg_sql');
const { logger } = require('../../lib/logger');
const { tokenpermissions } = require('../middlewares/tokenVerify');


const PluginConfig = {
};

/* Plugin info */
const PluginName = 'Users';
const PluginRequirements = [];
const PluginVersion = '0.0.1';
const PluginAuthor = 'BolverBlitz';
const PluginDocs = '';

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30
});

const SetLang = Joi.object({
    lang: Joi.string().required()
});

const router = express.Router();

router.post("/setLang", tokenpermissions(), limiter, async (reg, res, next) => {
    try {
        const value = await SetLang.validateAsync(reg.body);

        Promise.all([DB.user.update.lang(value.lang, reg.check.Data.username), DB.webtoken.update.lang(value.lang, reg.check.Data.username)])
            .then(function () {
                res.status(200);
                res.json({
                    Message: `Language chanced to ${value.Lang}`
                });
            }).catch(function (error) {
                logger('error', error);
                res.status(500);
                res.json({
                    Message: "Database Error"
                });
            });
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