const {isValidNote} = require("./Validation");
const {NoContent} = require("./Responses");
const {areValidFieldsOfGroup} = require("./Validation");
const {Auth} = require("./Utils");
const {Resource} = require("./Responses");
const {CollectionsResource} = require("./Responses");
const {Unauthorized, LogAndServerError, ResourceOrNotFound, NotFoundOrNoContent} = require("./Responses");
const {config} = require("./config");
const {NotFound} = require("./Responses");
const {isValidGroup} = require("./Validation");
const {created, ServerError, BadRequest, Conflict} = require('./Responses');
const {UserUrl} = require('./UrlConstructor');
const {JsonBody} = require('./Utils');
const {isValidUser} = require('./Validation');
const {ObjectId} = require('mongodb');


function index(req, res, param) {
    res.writeHead(200);
    res.end('Hello, World!');
}


/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function userPost(req, res, opt, db) {
    let body = await JsonBody(req);
    if (!isValidUser(body)) {
        BadRequest(res);
        return;
    }
    db.collection('users')
        .findOne({username: body['username']})
        .then(e => {
            if (e)
                Conflict(res, "User already exists");
            else
                db.collection('users')
                    .insertOne({username: body['username'], password: body['password']})
                    .then(r => created(res, UserUrl(r.insertedId.toHexString())))
                    .catch(error => LogAndServerError(error, res));


        })
        .catch(error => LogAndServerError(error, res));
}

/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
//todo solve location header
async function groupsPost(req, res, opt, db) {
    let groupData = await JsonBody(req);
    if (!isValidGroup(groupData)) {
        BadRequest(res);
        return;
    }
    let user = opt.user;
    db.collection('groups')
        .findOne({name: groupData['name']})
        .then(g => {
            if (g == null)
                db.collection('groups')
                    .insertOne({
                        name: groupData['name'],
                        description: groupData['description'],
                        owner: user.username,
                        creationDate: Date.now(),
                        lastModified: Date.now(),
                        members: [],
                        notes: []
                    })
                    .then(r => created(res, r.insertedId.toHexString()))
                    .catch(error => LogAndServerError(error, res));
            else
                Conflict(res, 'Group already exists');
        })
        .catch(error => LogAndServerError(error, res))
}


/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function groupGet(req, res, opt, db) {
    let user = opt.user;
    db.collection('groups')
        .find({owner: user.username})
        .project({
            name: 1,
            description: 1,
            creationDate: 1,
            lastModified: 1,

        })
        .toArray()
        .then(e => CollectionsResource(res, e))
        .catch(e => LogAndServerError(e, res));
}

/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function getGroupId(req, res, opt, db) {
    let user = opt.user;
    db.collection('groups')
        .findOne(
            {_id: ObjectId(opt.params.id), owner: user.username},
            {projection: {members: false, notes: false}}
        )
        .then(e => ResourceOrNotFound(e, res))
        .catch(e => LogAndServerError(e, res))
}

/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function patchGroup(req, res, opt, db) {
    let user = opt.user;
    let groupData = await JsonBody(req);
    if (!areValidFieldsOfGroup(groupData)) {
        BadRequest(res);
        return;
    }
    db.collection('groups')
        .findOneAndUpdate(
            {_id: opt.params._id, owner: user.username},
            {$set: {...groupData}}
        )
        .then(g => NotFoundOrNoContent(g, res))
        .catch(e => LogAndServerError(e, res));

}


/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function deleteGroup(req, res, opt, db) {
    let user = opt.user;
    db.collection('groups')
        .findOneAndDelete({_id: ObjectId(opt.params.id), owner: user.username})
        .then(g => NotFoundOrNoContent(g, res))
        .catch(e => LogAndServerError(e, res));
}


/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function groupsPut(req, res, opt, db) {
    let groupData = await JsonBody(req);
    if (!isValidGroup(groupData)) {
        BadRequest(res);
        return;
    }
    let user = opt.user;

    db.collection('groups')
        .findOneAndReplace(
            {owner: user.username, _id: ObjectId(opt.params.id)},
            {
                name: groupData['name'],
                description: groupData['description'],
                owner: user.username,
                creationDate: Date.now(),
                lastModified: Date.now(),
                members: [],
                notes: []
            }
        )
        .then(g => NotFoundOrNoContent(g, res))
        .catch(error => LogAndServerError(error, res));
}

async function notesPost(req, res, opt, db) {
    let notesBody = await JsonBody(req);
    if (!isValidNote(notesBody)) {
        BadRequest(res);
        return;
    }
    let user = opt.user;
    console.log(opt);
    db.collection('groups')
        .findOne({owner: user.username, _id: ObjectId(opt.params.id)})
        .then(
            group => {
                if (!group)
                    NotFound(res);
                else {
                    let NewNotes = group.notes;
                    notesBody['_id'] = ObjectId();
                    NewNotes.push(notesBody);
                    db.collection('groups')
                        .findOneAndUpdate(
                            {owner: user.username, _id: ObjectId(opt.params.id)},
                            {
                                $set: {lastModified: Date.now(), notes: NewNotes}
                            }
                        )
                        .then(g => {
                                console.log(g);
                                created(res, notesBody['_id']);

                            }
                        ).catch(e => LogAndServerError(e, res));
                }
            }
        )
        .catch(error => LogAndServerError(error, res));
}


/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function NotesGet(req, res, opt, db) {
    let user = opt.user;
    db.collection('groups')
        .find({owner: user.username, _id: ObjectId(opt.params.id)})
        .project({notes: 1})
        .toArray()
        .then(e => CollectionsResource(res, e))
        .catch(e => LogAndServerError(e, res));
}

/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function getNoteId(req, res, opt, db) {
    let user = opt.user;
    console.log(opt);
    db.collection('groups')
        .find(
            {notes: {$elemMatch: {_id: ObjectId(opt.params.id2)}}})
        .project(
            {_id: 0, notes: {$elemMatch: {_id: ObjectId(opt.params.id2)}}})
        .toArray()
        .then(e => ResourceOrNotFound(e[0], res))
        .catch(e => LogAndServerError(e, res))
}


/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function putNoteId(req, res, opt, db) {
    let user = opt.user;
    let notesBody = await JsonBody(req);
    if (!isValidNote(notesBody)) {
        BadRequest(res);
        return;
    }
    db.collection('groups')
        .updateMany(
            {notes: {$elemMatch: {_id: ObjectId(opt.params.id2)}}},
            {$set: {"notes.$": {...notesBody, _id: ObjectId(opt.params.id2)}}})
        .then(e => {
            console.log(e.result);
            if (e.result.n === 1)
                NoContent(res);
            else
                NotFound(res);
        })

        .catch(e => LogAndServerError(e, res))
}



/**
 * @param req {Request}
 * @param res {Response}
 * @param opt {Options}
 * @param db {Db}
 */
async function deleteNoteId(req, res, opt, db) {
    let user = opt.user;
    db.collection('groups')
        .updateMany(
            {_id: ObjectId(opt.params.id), owner: user.username},
            {$pull: {"notes":{ _id: ObjectId(opt.params.id2)}}},
            {multi: true})
        .then(e => {
            console.log(e);
            if (e.result.n === 1)
                NoContent(res);
            else
                NotFound(res);
        })

        .catch(e => LogAndServerError(e, res))
}
module.exports = {
    index, userPost,
    groupsPost, groupGet, getGroupId, patchGroup, deleteGroup, groupsPut,
    notesPost, NotesGet, getNoteId, putNoteId,deleteNoteId
};