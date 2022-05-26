const loglevel = Number(process.env.LOG_LEVEL) || 0;
const Levels = ['error', 'warning', 'info', 'system'];

function getTimestamp() {
    const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
    const d = new Date();

    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${pad(d.getFullYear(), 4)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 
 * @param {string} level
 * @param {string} text
 */
const logger = function (level, text) {
    const levelnumber = Levels.indexOf(level.toLowerCase()) + 1

    if (levelnumber <= loglevel && levelnumber === 1) {
        console.log(`[${process.env.servername}] [${getTimestamp()}] \x1b[31m[E]\x1b[0m`, text)
    }

    if (levelnumber <= loglevel && levelnumber === 2) {
        console.log(`[${process.env.servername}] [${getTimestamp()}] \x1b[33m[W]\x1b[0m`, text)
    }

    if (levelnumber <= loglevel && levelnumber === 3) {
        console.log(`[${process.env.servername}] [${getTimestamp()}] \x1b[32m[I]\x1b[0m`, text)
    }

    if (levelnumber === 4) {
        console.log(`[${process.env.servername}] [${getTimestamp()}] \x1b[36m[S]\x1b[0m`, text)
    }
}

logger('system', `Logger initialized at level ${Levels[loglevel - 1]}`);

module.exports = {
    logger
};