const h = require("snabbdom/h").default

module.exports = (state, $update) =>
    h("div", [
        vToolbar(state, $update),
        vBody(state, $update)
    ])

function vToolbar (state, $update) {
    return h("div", [
        h("button", {on: {click: () => {
            state.view = "main"
            $update(state)
        }}}, "Back"),
        h("button", {on: {click: () => {
            state.msg = "Adding..."
            $update(state)
            fetch("/private/bookmark/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: document.getElementById("name").value,
                    url: document.getElementById("url").value,
                    tagIDs: []
                }),
                credentials: "same-origin"
            }).then(response => {
                if (response.status === 200) {
                    response.json().then(body => {
                        state.bookmarks.unshift(body)
                        state.msg = ""
                        state.view = "main"
                        $update(state)
                    })
                } else {
                    state.msg = "Add failed."
                    $update(state)
                }
            })
        }}}, "Save"),
        h("hr")
    ])
}

function vBody (state, $update) {
    return h("div", [
        h("input#name"),
        h("input#url")
    ])
}

