const h = require("snabbdom/h").default

module.exports = (state, $update) => {
    initialize(state, $update)
    return h("div", [
        vToolbar(state, $update),
        vBody(state, $update),
    ])
}

function vToolbar (state, $update) {
    return h("div", [
        h("button", {on: {click: () => {
            fetch("/private/auth/signout", {
                method: "POST",
                credentials: "same-origin"
            }).then(() =>
               $update({ view: "signin" }))
        }}}, "Sign out"),
        h("button", {on: {click: () => {
            state.view = "add"
            $update(state)
        }}}, "Add"),
        h("hr")
    ])
}

function vBody ({ loading, bookmarks, tags }, $update) {
    if (loading) return vLoading()
    console.log(bookmarks)
    return h("div", bookmarks.map(({ url, name, tagIDs }) =>
        h("div", [
            h("div", name),
            h("div", url),
            h("div", tagIDs.map(tagID =>
                h("span", findTagName(tagID, tags))))
        ])
    ))
}

function findTagName (tagID, tags) {
    return tags.find(tag => tagID === tag._id).name
}

function vLoading () {
    return "Loading bookmarks..."
}

function initialize (state, $update) {
    if (state.initialized)
        return
    state.initialized = true
    state.loading = true
    $update(state)
    fetch("/private/bookmarks", {
        method: "POST",
        credentials: "same-origin"
    }).then(response => response.json())
      .then(({ bookmarks, tags }) => {
          state.loading = false
          state.bookmarks = bookmarks
          state.tags = tags
          $update(state)
      })
}
