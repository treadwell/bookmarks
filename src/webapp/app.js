const main = require("./main.js")
const signin = require("./signin.js")
const register = require("./register.js")
const loading = require("./loading.js")

module.exports = (state, $update) =>
    ({ main, register, signin, loading })[state.view](state, $update)
