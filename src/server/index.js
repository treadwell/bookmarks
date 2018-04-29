// TODO: implement multilevel tagging

const path = require("path")
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const express = require("express")
const redis = require("redis")
const mongo = require("mongodb")
const uuid = require("uuid")
const cookieParser = require("cookie-parser")

const app = express()
const MongoClient = mongo.MongoClient
const ObjectId = mongo.ObjectId
const url = "mongodb://localhost:27017"
const dbName = "bookmarks"

MongoClient.connect(url, function(err, client) {

    const cache = redis.createClient()
    const db = client.db(dbName)
    const users = db.collection("users")
    const bookmarks = db.collection("bookmarks")
    const tags = db.collection("tags")

    app.get("/", (request, response) => {
        response.sendFile(path.join(process.cwd(), "dist/webapp/index.html"))
    })

    app.use(bodyParser.json())
    app.use(cookieParser())
    app.use(attachUser)

    const public = express.Router().use(requireAuth(false))
    const private = express.Router().use(requireAuth(true))

    public.post("/auth/register", (request, response) => {
        const { username, password } = request.body
        users.findOne({username:username}, (e, user) => {
            if (e) {throw(e)}
            if (user) {
                response.status(409).end()
            } else {
                console.log(username, password)
                bcrypt.hash(password, 10, (e, encryptedPass) => {
                    if (e) {throw(e)}
                    const user = {
                        username:username,
                        password:encryptedPass
                    }
                    users.insert(user, (e) => {
                        if (e) {throw(e)}
                        response.status(200).end()
                    })
                })
            }
        })
    })

    public.post("/auth/signin", (request, response) => {
        const { username, password } = request.body
        users.findOne({username:username}, (e, user) => {
            if (e) {throw(e)}
            if (user) {
                const encryptedPass = user.password
                bcrypt.compare(password, encryptedPass, (e, isMatch) => {
                    if (isMatch) {
                        bcrypt.hash(uuid.v4() + (new Date()).getTime(), 10, (e, token) => {
                            cache.set(token, user._id.toString(), (e) => {
                                if (e) {throw(e)}
                                cache.expire(token, 30*60, (e) => {
                                    if (e) {throw(e)}
                                })
                            })
                            response
                                .status(200)
                                .cookie("session", token)
                                .end()
                        })
                    } else {
                        response.status(401).end()
                    }
                })
            } else {
                response.status(401).end()
            }
        })
    })

    private.get("/auth/ping", (_, response) =>
        response.status(200).end())

    private.post("/auth/signout", (request, response) => {
        const token = request.cookies.session
        cache.del(token, (e) => {
            if (e) {throw(e)}
            response
                .status(200)
                .end()
        })
    })

    private.post("/bookmarks", (request, response) => {
        const { page = 0, limit = 50 } = request.body
        bookmarks
            .find({ userID: request.user._id })
            .sort({ created: -1 })
            .skip(page * limit)
            .limit(limit)
            .toArray((e, bookmarks) => {
                if (e) {throw(e)}
                const tagIDs = [...new Set([].concat(...bookmarks
                    .map(b => b.tagIDs)
                    .filter(x => x)))]
                tags.find({ userID: request.user._id, _id: { $in: tagIDs } })
                    .toArray((e, tags) => {
                        if (e) {throw(e)}
                        response
                            .status(200)
                            .send({ bookmarks, tags })
                    })
            })
    })

    private.post("/bookmark/add", (request, response) => {
        let { name, url, tagIDs } = request.body
        if (tagIDs) {
            tagIDs = tagIDs.map(t => ObjectId(t))
        }
        const bookmark = {
            name, url, tagIDs,
            userID: request.user._id,
            created: new Date(Date.now())
        }
        bookmarks.insert(bookmark, (e) => {
            if (e) {throw(e)}
            response
                .status(200)
                .send(bookmark)
        })
    })

    private.post("/bookmark/update", (request, response) => {
        let { _id, name, url, tagIDs } = request.body
        if (tagIDs) {
            tagIDs = tagIDs.map(t => ObjectId(t))
        }
        const bookmark = {
            _id: ObjectId(_id),
            name, url, tagIDs,
            userID: request.user._id,
            created: new Date(Date.UTC())
        }
        bookmarks.updateOne(
            { _id: bookmark._id },
            { $set: bookmark },
            (e) => {
                if (e) {throw(e)}
                response
                    .status(200)
                    .send(bookmark)
            })
    })

    private.post("/bookmark/delete", (request, response) => {
        const { _id } = request.body
        bookmarks.deleteOne(
            { _id: ObjectId(_id) },
            (e) => {
                if (e) {throw(e)}
                response
                    .status(200)
                    .end()
            })
    })

    private.post("/tags", (request, response) => {
        const { page = 0, limit = 50 } = request.body
        tags
            .find({ userID: request.user._id })
            .sort({ created: -1 })
            .skip(page * limit)
            .limit(limit)
            .toArray((e, tags) => {
                if (e) {throw(e)}
                response
                    .status(200)
                    .send(tags)
            })
    })

    private.post("/tag/add", (request, response) => {
        const { name, url } = request.body
        const tag = {
            name,
            userID: request.user._id,
            created: new Date(Date.now())
        }
        tags.insert(tag, (e) => {
            if (e) {throw(e)}
            response
                .status(200)
                .send(tag)
        })
    })

    private.post("/tag/update", (request, response) => {
        const { _id, name } = request.body
        const tag = {
            _id: ObjectId(_id),
            name,
            userID: request.user._id,
            created: new Date(Date.UTC())
        }
        tags.updateOne(
            { _id: tag._id },
            { $set: tag },
            (e) => {
                if (e) {throw(e)}
                response
                    .status(200)
                    .send(tag)
            })
    })

    private.post("/tag/delete", (request, response) => {
        const { _id } = request.body
        tags.deleteOne(
            { _id: ObjectId(_id) },
            (e) => {
                if (e) {throw(e)}
                response
                    .status(200)
                    .end()
            })
    })

    app.use("/public", public)
    app.use("/private", private)
    app.listen(3000)

    function passIfAuthenticated (request, response, next) {
        if (request.user) {
            next()
        } else {
            response
                .status(404)
                .end()
        }
    }

    function rejectIfAuthenticated (request, response, next) {
        if (request.user) {
            response
                .status(404)
                .end()
        } else {
            next()
        }
    }

    function requireAuth (boolean) {
        if (boolean) {
            return(passIfAuthenticated)
        } else {
            return(rejectIfAuthenticated)
        }
    }

    function attachUser (request, response, next) {
        const token = request.cookies.session
        if (!token) {
            next()
        } else {
            cache.get(token, (e, userID) => {
                if (e) {throw(e)}
                if (!userID) {
                    next()
                } else {
                    users.findOne({_id:ObjectId(userID)}, (e, user) => {
                        if (e) {throw(e)}
                        request.user = user
                        next()
                    })
                }
            })
        }
    }

});
