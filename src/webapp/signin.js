const h = require("snabbdom/h").default
module.exports = (state, $update) =>
    h("div", [
        h("input#username"),
        h("input#password"),
        state.msg
            ? h("div", state.msg)
            : undefined,
        h("button", {on: {click: signInHandler(state, $update)}}, "Sign In"),
        h("span", " or "),
        h("a", {
            attrs: { href: "javascript:void(0)" },
            on: { click: () => {
                $update({ view: "register" })
            }}
        } , "sign up.")
    ])

function signInHandler (state, $update) {
    return () => {
        state.msg = "Signing in..."
        $update(state)
        fetch("/public/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            }),
            credentials: "same-origin"
        }).then(({ status }) => {
            if (status === 200) {
                $update({ view: "main" })
            } else {
                state.msg = "Sign in failed."
                $update(state)
            }
        })
    }
}
