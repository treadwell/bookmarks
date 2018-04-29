const h = require("snabbdom/h").default
module.exports = (state, $update) =>
    h("div", [
        h("input#username"),
        h("input#password"),
        state.msg
            ? h("div", state.msg)
            : undefined,
        h("button", {on: {click: () => {
            state.msg = "Signing up..."
            $update(state)
            fetch("/public/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: document.getElementById("username").value,
                    password: document.getElementById("password").value
                }),
                credentials: "same-origin"
            }).then(({ status }) => {
                if (status === 200) {
                    $update({ view: "signin", msg: "Please sign in." })
                } else if (status === 409) {
                    state.msg = "User exists."
                    $update(state)
                } else {
                    state.msg = "Register failed."
                    $update(state)
                }
            })
        }}}, "Sign Up"),
        h("span", " or "),
        h("a", {
            attrs: { href: "javascript:void(0)" },
            on: { click: () => {
                $update({ view: "signin" })
            }}
        } , "sign in.")
    ])
