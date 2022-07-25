// Viewport data
var view = {
    move: false,
    x: 420,
    y: 60
}

// Generate templates
// Node holder template
const nodeField = document.createElement("div");
nodeField.classList.add("nodefield");
nodeField.addEventListener("drop", drop);
nodeField.addEventListener("dragover", e => { e.preventDefault(); });

// Basic input template
const inputElem = document.createElement("input");
inputElem.setAttribute("autocomplete", "off");
inputElem.setAttribute("autocorrect", "off");
inputElem.setAttribute("autocapitalize", "off");
inputElem.setAttribute("spellcheck", false);

// Condition holder template
const condField = document.createElement("div");
condField.classList.add("condfield");
condField.appendChild(inputElem);
condField.addEventListener("drop", drop);
condField.addEventListener("dragover", allowDrop);

// Load node library
var nodes;
fetch("js/nodes.json")
    .then(resp => resp.json())
    .then(json => {
        nodes = json.actors;
        params = json.params;

        window.dispatchEvent(new CustomEvent("nodesready"));
    });

// Create a node
function newNode(par, ref) {
    let node = document.createElement("div");

    // Add functions
    node.setAttribute("id", ref);
    node.setAttribute("ondrag", "drag(event)");
    node.setAttribute("draggable", true);
    ref = nodes[ref];

    // Style
    node.classList.add("node");
    node.style.backgroundColor = ref.color;

    // Add node field
    for (i in ref.section) {
        var sect = document.createElement("span");

        // Conditional parameter
        if (ref.section[i].text) sect.innerHTML += `<div style='margin-bottom: 10px;'>${ref.section[i].text}</div>`;
        let inp = condField.cloneNode(true);
        let value = inp.querySelector("input");

        value.setAttribute("placeholder", ref.section.par);
        value.style.width = "calc(100% - 20px)";
        inp.style.width = "calc(100% - 20px)";
        sect.appendChild(inp);
        sect.innerHTML += "<span style='height: 10px; display: block;'></span>";

        // Space to hold children
        if (ref.section[i].hold) {
            sect.innerHTML += "<hr>";
            sect.appendChild(nodeField.cloneNode());
        }

        node.appendChild(sect);
    }

    return par.appendChild(node);
}

// Create conditional
function newCond(par, ref) {
    let cond = document.createElement("div");

    // Add functions
    cond.setAttribute("id", ref);
    cond.setAttribute("ondrag", "drag(event)");
    cond.setAttribute("draggable", true);
    ref = params[ref];

    // Style
    cond.classList.add("cond");
    cond.style.backgroundColor = ref.color;

    // Add node field
    for (i in ref.section) {
        if (typeof(ref.section[i]) == "object") { // Hold children
            let inp = condField.cloneNode();
            inp.appendChild(inputElem.cloneNode());
            cond.appendChild(inp);
        } else { // Basic text
            let text = document.createElement("div");
            text.innerHTML = ref.section[i];
            cond.appendChild(text);
        }
    }

    return par.appendChild(cond);
}

// Param load data
function loadParam(par, data) {
    let cond = newCond(par, data.name);
    par.querySelector("input").style.display = "none";

    // Get sub conditions
    data.content.forEach(function(subData, ind) {
        let fields = [];

        // Return only direct children
        cond.querySelectorAll(".condfield").forEach(function(field) { 
            if (field.parentNode === cond) fields.push(field);
        });

        // Insert into input or create new sub condition
        if (typeof(subData) == "string") {
            fields[ind].querySelector("input").value = subData;
        } else {
            loadParam(fields[ind], subData);
        }
    });
}

// Load saved data
function loadData(data) {
    if (!confirm("This will discard all current work, load anyway?")) return;

    let rec = function(par, items) { // Recursive get all nodes
        items.forEach(function(item) {
            let node = newNode(par, item.name);

            // Unpack conditions
            item.data.forEach(function(data, ind) {
                let fields = [];

                // Return only direct children
                node.querySelectorAll(".condfield").forEach(function(field) { 
                    if (field.parentNode.parentNode === node) fields.push(field);
                });

                loadParam(fields[ind], data);
            });

            // Find all content divisions
            item.content.forEach(function(content, ind) {
                let fields = [];

                // Return only direct children
                node.querySelectorAll(".nodefield").forEach(function(field) { 
                    if (field.parentNode.parentNode === node) fields.push(field);
                });

                // Next pass
                rec(fields[ind], content);
            });
        });
    };
    
    // Start from root
    rec(document.querySelector(".sandbox").querySelector(".nodefield"), JSON.parse(data).script);
}

// Drag and drop functions
var movingElem;
function drag(e) {
    e.preventDefault();
    view.move = false;
    movingElem = e.target;
}

function allowDrop(e) { e.preventDefault(); }
function drop(e) {
    e.preventDefault();

    // Load file
    if (e.dataTransfer.files[0] != null) {
        let file = e.dataTransfer.files[0];

        if (file.name.substring(file.name.length - 5, file.name.length) == ".mdls") {
            let reader = new FileReader();

            reader.onload = function(data) {
                loadData(data.target.result);
            }

            reader.readAsText(file);
        } else {
            alert("Invalid file type, must be \".mdls\"");
        }
    } else { // Drop node or cond
        let item = e.target;

        let type = movingElem.classList.value.includes("cond") ? "condfield" : "nodefield";

        // Redirect from sandbox into nodefield
        if (!movingElem.contains(item)) {
            if (item.classList.value.includes("sandbox")) {
                item = item.querySelector(".nodefield");
            }

            // Check drop to parent possibility
            let isType = item.classList.value.includes(type);
            if (item.parentNode.classList.value.includes(type) && !isType) item = item.parentNode, isType = true;

            // Validate parent and drop
            if (isType) {
                // Check origin
                let oldPar = movingElem.parentNode;
                if (movingElem.parentNode.classList.value.includes("library")) {
                    movingElem = movingElem.cloneNode(true);
                }
                
                // Allow drop at any position in sandbox
                if (item.parentNode.classList.value.includes("sandbox")) {
                    movingElem.style.position = "absolute";
                    movingElem.style.left = `${e.x - view.x - 40}px`;
                    movingElem.style.top = `${e.y - view.y - 40}px`;
                } else {
                    movingElem.style.position = "static";
                    movingElem.style.left = "0";
                    movingElem.style.top = "0";
                }

                // Additional condition behavior
                if (type == "condfield") {
                    if (item.querySelector(".condfield") == null) {
                        e.target.parentNode.querySelector("input").style.display = "none";
                        item.appendChild(movingElem);

                        if (oldPar.childNodes.length == 1) {
                            oldPar.querySelector("input").style.display = "block";
                        }
                    }
                } else {
                    item.appendChild(movingElem);
                }
            }
        }
    }
}

// Throw away node
function trash(e) {
    e.preventDefault();

    if (!movingElem.parentNode.classList.value.includes("library")) {
        if (movingElem.parentNode.childNodes.length == 1) {
            movingElem.parentNode.querySelector("input").style.display = "block";
        }

        movingElem.parentNode.removeChild(movingElem);
    }
}

// Viewport movement controls
var sb = document.querySelector(".sandbox");
var sbArea = sb.querySelector(".nodefield");
sb.addEventListener("mousedown", function() {
    view.move = true;
});

window.addEventListener("mousemove", function (e) {
    if (view.move) {
        view.x += e.movementX;
        view.y += e.movementY;
        sbArea.style.left = `${view.x}px`;
        sbArea.style.top = `${view.y}px`;
    }
});

window.addEventListener("mouseup", function() { view.move = false; });
window.addEventListener("blur", function() { view.move = false; });

// Body loaded
window.addEventListener("load", function() {
    window.addEventListener("nodesready", function() { // Nodes ready
        let lib = document.querySelector(".library");

        // Load libraries
        for (item in nodes) newNode(lib, item);
        for (item in params) newCond(lib, item);
    });

    // Initialize sandbox data
    sbArea.style.left = `${view.x}px`;
    sbArea.style.top = `${view.y}px`;
});

// Param compilation
function paramCompile(div) {
    // Get non cond field info
    div = div.querySelector("div");

    // Normal recursion
    let item = {
        name: div.getAttribute("id"),
        content: []
    };

    // Get value of children
    div.childNodes.forEach(function(child) {
        if (child.style.display != "none") {
            let inp = child.querySelector("input");

            if (inp && inp.style.display != "none") {
                item.content.push(inp.value);
            } else if (child.childNodes.length > 1) {
                item.content.push(paramCompile(child));
            }
        }
    });

    return item;
}

// Compile script
function compile() {
    let readNodes = (nodes) => {
        var arr = [];

        if (nodes != null) {
            nodes.childNodes.forEach((val) => {
                var sections = [];

                // Pack contents of all fields
                val.querySelectorAll(".nodefield").forEach(function(holds) {
                    if (holds.parentNode.parentNode === val) sections.push(readNodes(holds));
                });

                // Pack data in conditional
                let param = [];
                val.querySelectorAll(".condfield").forEach(function(data) {
                    if (data.parentNode.parentNode === val) {
                        data = data.querySelector("div") || data.querySelector("input").value; // Add as basic text

                        // Compile if cond field
                        if (typeof(data) != "text") param.push(paramCompile(data.parentNode));
                    }
                });

                // Pack whole node
                arr.push({
                    name: val.getAttribute("id"),
                    content: sections,
                    data: param
                });
            });
        }

        return arr;
    }

    return readNodes(document.querySelector(".sandbox").querySelector(".nodefield"));
}

// Save and load
function save() {
    var filename = document.querySelector("#filename").value;

    if (filename != "") {
        // Add download anchor
        var a = document.createElement("a");
        a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify({ "script": compile() }))}`;
        a.download = `${filename}.mdls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else { // Display require name text
        document.querySelector("#filename-required").style.display = "inline-block";
        setTimeout(function() {
            document.querySelector("#filename-required").style.display = "none";
        }, 3000);
    }
}

// Warn before unload and save data
window.addEventListener("beforeunload", function (e) {
    var mess = "If you leave now your work may not be saved.";
    (e || window.event).returnValue = mess;
    return mess;
});