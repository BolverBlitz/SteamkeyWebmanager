const randomstring = require('randomstring');
const PossibleKeyStatus = ['ava', 'unk', 'gif', 'use'];

/**
 * Generates a random string
 * @param {Number} [length] Default: 64
 * @returns {String}
 */
const randomString = (length = 64) => {
    return randomstring.generate({
        length: length,
        charset: 'alphanumeric'
    });
};

/**
 * Convert Key Status to number
 * @param {String} status 
 * @returns {Number}
 */
const convertStatusToNumber = (status) => {
    switch (status) {
        case 'ava':
            return 1;
        case 'unk':
            return 2;
        case 'gif':
            return 3;
        case 'use':
            return 4;
    }

    return PossibleKeyStatus.indexOf(status) + 1;
}

module.exports = {
    randomString: randomString,
    convertStatusToNumber: convertStatusToNumber
}