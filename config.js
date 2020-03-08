const config = {
    "supported-content": ['application/json'],
    PORT: 8080,
    url: 'mongodb://localhost:27017',
    dbName: 'CC2',
    URL_SERVER: 'http://localhost:8080/user',
    log: true,
    type: ['private', 'public']
};

module.exports = {
    config
};