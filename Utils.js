/**
 *
 * @param req
 * @returns {Promise}
 * @constructor
 */
const {NoContent} = require("./Responses");
const {NotFound} = require("./Responses");
const {ServerError} = require("./Responses");
const {Unauthorized, LogAndServerError} = require("./Responses");
const {config} = require('./config');



function JsonBody(req) {
    return new Promise((resolve, reject) => {
        let data = [];
        req.on('data', chunk => {
            data.push(chunk)
        });
        req.on('end', () => {
            try {
                let body = JSON.parse(data);
                resolve(body);
            } catch (e) {
                console.assert(!config.log, 'Error is %o', e);
                reject(e);
            }
        })
    })
}

async function Auth(res, opt, db) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .findOne({username: opt.user})
            .then(e => {
                if (e === null) {
                    Unauthorized(res);
                    reject();
                } else
                    resolve(e);
            })
            .catch(e => LogAndServerError(e, res));
    });
}


function secret(req) {
    let header = req.headers['authorization'] || '',        // get the header
        token = header.split(/\s+/).pop() || '',            // and the encoded auth token
        auth = new Buffer.from(token, 'base64').toString(),    // convert from base64
        parts = auth.split(/:/),                          // split on colon
        username = parts[0],
        password = parts[1];
    return {user: username, passwd: password};
}


module.exports = {
    JsonBody,
    Auth, secret

};