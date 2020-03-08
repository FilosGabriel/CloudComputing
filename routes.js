const {deleteNoteId} = require("./Controllers");
const {putNoteId} = require("./Controllers");
const {getNoteId} = require("./Controllers");
const {NotesGet} = require("./Controllers");
const {notesPost} = require("./Controllers");
const {deleteGroup} = require("./Controllers");
const {groupsPut} = require("./Controllers");
const {HTTPV} = require('./Constants');
const {NotImplementedHandler} = require("./ErrorHandler");
const {userPost, groupsPost, groupGet, getGroupId, patchGroup} = require('./Controllers');
const routes = {
    "/users": {
        POST: {handler: userPost, auth: false},
    },
    "/users/groups": {
        POST: {handler: groupsPost},
        GET: {handler: groupGet}
    },
    "/users/groups/:id": {
        GET: {handler: getGroupId},
        PATCH: {handler: patchGroup},
        DELETE: {handler: deleteGroup},
        PUT: {handler: groupsPut},
    },
    "/users/groups/:id/members": {
        GET: {handler: NotImplementedHandler},
        POST: {handler: NotImplementedHandler},
    },
    "/users/groups/:id/members/:id2": {
        DELETE: {handler: NotImplementedHandler},
    },
    //todo add for members
    "/users/groups/:id/notes": {
        GET: {handler: NotesGet},
        POST: {handler: notesPost},
    },
    //todo solve problem code delete
    "/users/groups/:id/notes/:id2": {
        GET: {handler: getNoteId},
        PUT: {handler: putNoteId},
        PATCH: {handler: NotImplementedHandler},
        DELETE: {handler: deleteNoteId},
    }


};

module.exports = {
    routes
};