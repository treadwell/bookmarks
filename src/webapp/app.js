const main = require("./main.js")
const signin = require("./signin.js")
const register = require("./register.js")
const loading = require("./loading.js")
const add = require("./add.js")

module.exports = (state, $update) =>
    ({ main, register, signin, loading, add })[state.view](state, $update)
