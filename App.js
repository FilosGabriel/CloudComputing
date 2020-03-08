const http = require('http');
const {Auth} = require("./Utils");
const {secret} = require("./Utils");
const {Unauthorized} = require("./Responses");
const {MethodNotAllowed} = require("./Responses");
const {index} = require('./Controllers');
const {HTTPV} = require('./Constants');
const {NotFoundHandler, UnsupportedMediaTypeHandler} = require("./ErrorHandler");
const {Path} = require('path-parser');
const {routes} = require('./routes');
const {config} = require('./config');
const {createConnection} = require('./Model');

let db;

function urlParser(url) {
    let pathsTemplate = Object.keys(routes);
    for (let i = 0; i < pathsTemplate.length; i++) {
        let param = new Path(pathsTemplate[i]).test(url);
        if (param !== null)
            return {params: param, path: pathsTemplate[i]};
    }
    return null;
}

//todo solve problem not correct id path
const requestListener = function (req, res) {
    if (["POST", "PUT", "PATCH"].includes(req.method) && !config['supported-content'].includes(req.headers['content-type'])) {
        UnsupportedMediaTypeHandler(req, res);
        return;
    }

    const result = urlParser(req.url);
    if (result === null) {
        NotFoundHandler(req, res);
        return;
    }

    if (routes[result.path][req.method] === undefined) {
        MethodNotAllowed(res);
        return;
    }

    console.assert(!config.log, 'Data: %o', {
        path: result.path,
        method: req.method,
        handler: routes[result.path][req.method]['handler']
    });

    let p = {params: result.params};
    if (routes[result.path][req.method].auth === undefined) {
        if (req.headers['authorization'] === undefined) {
            Unauthorized(res);
            return;
        } else {
            Auth(res, secret(req), db)
                .then(user => {
                        p['user'] = user;
                        routes[result.path][req.method]['handler'](req, res, p, db);
                    }
                ).catch(error => console.assert(!config.log, 'The error is %o', error));
            return;
        }
    }
    routes[result.path][req.method]['handler'](req, res, p, db);
};


async function start() {
    db = await createConnection(config);
    const server = http.createServer(requestListener);
    server.listen(config.PORT);
}


start();