// Import snabbdom, a library that provides the basic
// virtual-DOM functionality.
const snabbdom = require("snabbdom")

// Import the the defined in "app.js" that returns our
// top-level virtual-DOM node..
const app = require("./app.js")

// Import reset-css, which standardizes the default css of DOM
// elements across the major browsers.
require("reset-css/reset.css")

// Import our custom css.
require("./index.css")

// Create a virtual-DOM patch function that can set and
// remove element events, attributes, and styles.
const patch = snabbdom.init([
    require("snabbdom/modules/eventlisteners").default,
    require("snabbdom/modules/attributes").default,
    require("snabbdom/modules/style").default
])

// The "patch" function compares a virtual-DOM node that we
// create to EITHER an existing DOM element, like $root, or
// another virtual-DOM node, $oldnode. $oldnode is initially
// null, but will store the last-rendered virtual-DOM node.
let $root = document.getElementById("app")
let $oldnode = null

// Declare a function that will drive event loop:
//   1. Given a state object, create a new virtual-DOM node
//   2. Patch the real DOM
//   3. Wait for another call to this function to provide a
//      new state object, and go back to step 1
function $update (state) {
    // Call our the "app" function, which will create and
    // return a virtual-DOM node according to the state
    // passed in. It will also register some event handlers
    // that will call the passed-in $update function when
    // certain events are triggered (like button clicks,
    // etc.).
    let $vnode = app(state, $update)
    // Update the actual DOM to reflect the new DOM defined
    // in the virtual-DOM node $vnode. The "patch" function
    // compares $vnode to either $root, if this is the first
    // time we're calling $update, or $oldnode.
    patch($oldnode || $root, $vnode)
    // Store the just-rendered $vnode in $oldnode, so
    // subsequent calls to $update will compare the newly
    // created virtual-DOM node to $oldnode instead of
    // $root.
    $oldnode = $vnode
}

// Call $update for the first time, which will create the
// virtual-DOM node defined in "app.js", compare it to
// $root, and modify the real DOM to reflect the virtual-DOM
// we created.
$update({ view: "loading" })

// Ask the server, via an HTTP request, if we are already
// authenticated (e.g. if we already have a valid session
// cookie stored in our browser). If we are, the response's
// status will be 200, and we call $update with a new object
// defining the app's "view" to be "main". If we are not,
// the response's status will not be 200, and we call
// $update with a new object defining the app's "view" to
// be "signin".
fetch("/private/auth/ping", {
    credentials: "same-origin"
}).then(({ status }) =>
    $update({
        view: status === 200 ? "main" : "signin"
    }))

// Store our $update function on the global "window" object.
// This will allow us to call $update from the browser
// console.
// window.$update = $update
