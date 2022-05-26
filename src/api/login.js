const express = require('express');
const rateLimit = require('express-rate-limit');
const useragent = require('express-useragent');
const Joi = require('joi');
const DB = require('../../lib/db/pg_sql');
const { logger } = require('../../lib/logger');
const TV = require('../../lib/webtokenverification');
const twofactor = require("node-2fa");
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');

const PluginConfig = {
};

/* Plugin info */
const PluginName = 'Login';
const PluginRequirements = [];
const PluginVersion = '0.0.1';
const PluginAuthor = 'BolverBlitz';
const PluginDocs = '';

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30
});

const hartlimiter = rateLimit({
    windowMs: 60 * 1000 * 15,
    max: 6
});

const LoginCheck = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const Login2FACheck = Joi.object({
    client2fa: Joi.number().required(),
    username: Joi.string().required()
});

const TokenCheck = Joi.object({
    token: Joi.string().required()
});

const router = express.Router();

router.post("/login", hartlimiter, async (reg, res, next) => {
    try {
        const value = await LoginCheck.validateAsync(reg.body);
        DB.user.read.user(value.username).then(function (User_response) {
            if (User_response.length <= 0) {
                res.status(401);
                res.json({
                    Message: 'User dosn´t exist or Password is invalid'
                });
            } else {
                bcrypt.compare(value.password, User_response[0].password).then(function (result) {
                    if (result) {
                        let IP;
                        const source = reg.headers['user-agent']
                        const UserAgent = useragent.parse(source)
                        if (process.env.CloudFlare_Proyx === 'true' || process.env.CloudFlare_Proyx == true) {
                            IP = reg.headers['cf-connecting-ip'] || reg.socket.remoteAddress //This only works with cloudflare proxy
                        } else {
                            IP = reg.headers['x-forwarded-for'] || reg.socket.remoteAddress //This only works without cloudflare
                        }

                        if (User_response[0].extraverify) {
                            DB.user.update.Login2FA(User_response[0].username, new Date()).then(function () {
                                res.status(206);
                                res.json({
                                    message: '2FA Required',
                                    username: User_response[0].username,
                                    lang: User_response[0].lang
                                });
                            }).catch(function (error) {
                                logger('error', error);
                                res.status(500);
                                res.json({
                                    message: 'Internal Server Error'
                                });
                            });
                        } else {
                            const WebToken = randomstring.generate({
                                length: process.env.WebTokenLength, //DO NOT CHANCE!!!
                                charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
                            });

                            bcrypt.hash(IP, parseInt(process.env.SaltRounds, 10) / 2, function (err, ip_hash) { //Only half Saltrounds cuz of SPEEEED || Added in version 0.0.3 in a rush (Not well tested)
                                Promise.all([DB.webtoken.write.webtoken(User_response[0].username, ip_hash, UserAgent.source, WebToken, User_response[0].lang), DB.permission.read.permission(User_response[0].username)]).then(function (result) {
                                    res.status(200);
                                    res.json({
                                        token: WebToken,
                                        username: User_response[0].username,
                                        lang: User_response[0].lang,
                                        permission: result[1].rows
                                    });
                                }).catch(function (error) {
                                    logger('error', `MSHC-Login Error while writing WebToken or requesting Permissions ${error}`);
                                    res.status(500);
                                    res.json({
                                        message: "Internal Error!",
                                    });
                                })
                            });
                        }
                    } else {
                        res.status(401);
                        res.json({
                            message: "Wrong E-Mail or Password",
                        });
                    }
                }).catch(function (error) {
                    logger('error', `MSHC-Login Error while comparing Password ${error}`);
                    res.status(500);
                    res.json({
                        message: "Internal Error!",
                    });
                })
            }
        });
    } catch (error) {
        logger('error', `MSHC-Login Error while validating ${error}`);
        next(error);
    }
});


router.post("/login/2fa", hartlimiter, async (reg, res, next) => {
    try {
        const value = await Login2FACheck.validateAsync(reg.body);
        DB.user.read.user(value.username).then(function (User_response) {
            if (User_response[0]) {
                if (new Date(User_response[0].login_2fa).getTime() + (process.env.Web2FAValidForMin * 1000 * 60) > Date.now()) {
                    const delta = twofactor.verifyToken(User_response[0].extraverify, `${value.client2fa}`);
                    if (delta && delta.delta === 0) {
                        let IP;
                        const source = reg.headers['user-agent']
                        const UserAgent = useragent.parse(source)
                        if (process.env.CloudFlare_Proyx === 'true' || process.env.CloudFlare_Proyx == true) {
                            IP = reg.headers['cf-connecting-ip'] || reg.socket.remoteAddress //This only works with cloudflare proxy
                        } else {
                            IP = reg.headers['x-forwarded-for'] || reg.socket.remoteAddress //This only works without cloudflare
                        }

                        const WebToken = randomstring.generate({
                            length: process.env.WebTokenLength, //DO NOT CHANCE!!!
                            charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!'
                        });

                        bcrypt.hash(IP, parseInt(process.env.SaltRounds, 10) / 2, function (err, ip_hash) { //Only half Saltrounds cuz of SPEEEED || Added in version 0.0.3 in a rush (Not well tested)
                            Promise.all([DB.webtoken.write.webtoken(value.username, ip_hash, UserAgent.source, WebToken, User_response[0].lang), DB.permission.read.permission(value.username)]).then(function (result) {
                                DB.user.update.Login2FA(value.username).then(function () {
                                    res.status(200);
                                    res.json({
                                        token: WebToken,
                                        username: value.username,
                                        lang: User_response[0].lang,
                                        permission: result[1].rows
                                    });
                                }).catch(function (error) {
                                    logger('error', `MSHC-Login Error while deleting 2fa login timestamp ${error}`);
                                    res.status(500);
                                    res.json({
                                        message: "Internal Error!",
                                    });
                                })

                            }).catch(function (error) {
                                logger('error', `MSHC-Login Error while writing WebToken or requesting Permissions ${error}`);
                                res.status(500);
                                res.json({
                                    message: "Internal Error!",
                                });
                            })
                        });
                    } else {
                        res.status(401);
                        res.json({
                            message: "2FA Token is invalid",
                        });
                    }
                } else {
                    res.status(401);
                    res.json({
                        message: "2FA Token is invalid",
                    });
                }
            } else {
                res.status(401);
                res.json({
                    message: "2FA Token is invalid",
                });
            }
        }).catch(function (error) {
            logger('error', `MSHC-Login Error while getting user for 2FA ${error}`);
            next(error);
        });
    } catch (error) {
        logger('error', `MSHC-Login Error while validating ${error}`);
        next(error);
    }
});


router.post("/check", limiter, async (reg, res, next) => {
    try {
        const value = await TokenCheck.validateAsync(reg.body);
        let IP;
        const source = reg.headers['user-agent']
        if (process.env.CloudFlare_Proyx === 'true' || process.env.CloudFlare_Proyx == true) {
            IP = reg.headers['cf-connecting-ip'] || reg.socket.remoteAddress //This only works with cloudflare proxy
        } else {
            IP = reg.headers['x-forwarded-for'] || reg.socket.remoteAddress //This only works without cloudflare
        }

        const para = {
            Browser: useragent.parse(source),
            IP: IP
        }
        TV.check(value.token, para).then(function (Check) {
            if (Check.State) {
                res.status(200);
                res.json({
                    TokenData: Check.Data
                });
            } else {
                DB.webtoken.delete.webtoken(value.token).then(function () {
                    res.status(401);
                    res.json({
                        Message: "Token invalid"
                    });
                })
            }
        });
    } catch (error) {
        next(error);
    }
});


router.post("/logout", limiter, async (reg, res, next) => {
    try {
        const value = await TokenCheck.validateAsync(reg.body);
        let IP;
        const source = reg.headers['user-agent']
        if (process.env.CloudFlare_Proyx === 'true' || process.env.CloudFlare_Proyx == true) {
            IP = reg.headers['cf-connecting-ip'] || reg.socket.remoteAddress //This only works with cloudflare proxy
        } else {
            IP = reg.headers['x-forwarded-for'] || reg.socket.remoteAddress //This only works without cloudflare
        }
        const para = {
            Browser: useragent.parse(source),
            IP: IP
        }
        TV.check(value.token, para).then(function (Check) {
            if (Check.State) {
                DB.webtoken.delete.webtoken(value.token).then(function () {
                    res.status(200);
                    res.json({
                        Message: "Sucsess"
                    });
                })
            } else {
                DB.webtoken.delete.webtoken(value.token).then(function () {
                    res.status(401);
                    res.json({
                        Message: "Token invalid"
                    });
                })
            }
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