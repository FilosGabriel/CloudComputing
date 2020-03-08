const {config} = require('./config');

/**
 * @return {string}
 */
function UserUrl(id) {
    return `${config.URL_SERVER}/users/${id}`;
}

function GroupUrl(id) {
    return `${config.URL_SERVER}/users/groups/${id}`;
}

module.exports = {
    UserUrl
};