#!/bin/node

const request = require("request")
const FileCookieStore = require("tough-cookie-filestore")

const [ ,, method, path, data ] = process.argv
const uri = `http://localhost:3000${path}`

const jar = request.jar(new FileCookieStore("cookies.json"))

request({
    method, uri, jar,
    body: data,
    headers: { "Content-Type": "application/json" },
}, (e, response, body) => {
    if (e) return console.error(e)
    console.log("Request to " + uri)
    console.log("  payload: " + data)
    console.log("Response: " + response.statusCode)
    body && console.log(body)
})
