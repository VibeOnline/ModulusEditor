// Node behavior
const nodes = {};

// Design params
const params = {
    and: "(:0: && :1:)",
    or: "(:0: || :1:)",
    eq: "(:0: == :1:)",
    add: "(:0: + :1:)"
};

// Design actions
nodes.if = function(step) { return eval(step.par) ? step.content[0] : step.content[1]; }
nodes.if_else = nodes.if;

// Run execution steps
function run(data) {
    if (data) data.forEach(step => run(nodes[step.name](step)));
}

// Precompile parameters
function compileCond(cond) {
    if (typeof(cond) == "object") {
        // Get sub data
        let arr = [];
        cond.content.forEach(val => {
            arr.push(compileCond(val));
        });

        // Format string condition
        let str = params[cond.name];
        arr.forEach((val, ind) => {
            str = str.replace(`:${ind}:`, val);
        });

        return str;
    } else return cond;
}

// Precompile actions
function compile(data) {
    if (data) data.forEach(function(step) {
        step.data.forEach((par, ind) => {
            step.data[ind] = compileCond(par);
        });

        step.content.forEach(sub => compile(sub));
    });

    return data;
}

// Load all modulus script with compiler
window.addEventListener("load", function() {
    document.querySelectorAll("script").forEach(function(script) {
        if (script.getAttribute("type") == "application/modulus") {
            fetch(script.getAttribute("src"))
                .then(res => res.json())
                .then(data => {
                    console.log(compile(data.script));
                    run(compile(data.script));
                });
        }
    });
});