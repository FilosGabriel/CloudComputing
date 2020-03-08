const MongoClient = require('mongodb').MongoClient;


async function createConnection(config) {
    let client;
    try {
        client = await MongoClient.connect(config['url']);
        return client.db(config['dbName']);
    } catch (err) {
        console.log(err.stack);
    }
}


module.exports = {
    createConnection
};