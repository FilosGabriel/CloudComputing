function NotFoundHandler(req, res) {
    res.statusCode = 404;
    res.end();
}

function NotImplementedHandler(req, res, opts) {
    res.statusCode = 501;
    res.end();
}

function UnsupportedMediaTypeHandler(req, res) {
    res.statusCode = 415;
    res.end();
}

function NotAcceptableHandler(req, res){
    res.statusCode =406;
    res.end();
}

module.exports = {
    NotFoundHandler,
    NotImplementedHandler,
    UnsupportedMediaTypeHandler
};