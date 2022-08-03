// Design params
const translate = {
    actors: {
        set_action: "function :par:() { :content: }",
        run_action: ":par:();",
        if: "if :par: { :content: }",
        if_else: "if :par: { :content: } else { :content: }",
        repeat: "while(true) { :content: }",
        wait: "setTimeout(() => { :content: }, (:par: * 1000));",
        end_repeat: "break;",
        set_var: ":par: = :par:;",
        return: "return :par:;"
    },
    params: {
        and: "(:par: && :par:)",
        or: "(:par: || :par:)",
        gt: "(:par: > :par:)",
        lt: "(:par: < :par:)",
        eq: "(:par: == :par:)",
        not: "(!:par:)",
        add: "(:par: + :par:)",
        subtract: "(:par: - :par:)",
        divide: "(:par: / :par:)",
        multiply: "(:par: * :par:)",
        var: "(:par:)",
        run_action: "(:par:())",
        true: "(true)",
        false: "(false)",
        modulo: "(:par: % :par:)",
        pow: "(:par: ** :par:)",
        pow: "(:par: ** :par:)",
        log: "(Math.log(:par:) / Math.log(:par:))",
        sin: "(Math.sin(:par:))",
        cos: "(Math.cos(:par:))",
        tan: "(Math.tan(:par:))",
        asin: "(Math.asin(:par:))",
        acos: "(Math.acos(:par:))",
        atan: "(Math.atan(:par:))",
        round: "(Math.round(:par:))",
        floor: "(Math.floor(:par:))",
        ceil: "(Math.ceil(:par:))",
        abs: "(Math.abs(:par:))",
        sqrt: "(Math.sqrt(:par:))",
        pi: "(Math.PI)",
        ln: "(Math.log(:par:))",
        e: "(Math.E)"
    }
};

// Precompile parameters
function compileCond(cond) {
    if (!cond.name) return cond; // Return simple data

    // Get sub data
    let str = translate.params[cond.name];
    cond.content.forEach(val => str = str.replace(":par:", compileCond(val)));
    return str;
}

// Precompile actions
function compile(data) {
    let full = [];
    data.forEach(node => {
        let str = translate.actors[node.name]; // Get template
        
        // Load contents
        node.content.forEach(val => str = str.replace(":content:", compile(val)));
        node.data.forEach(cond => str = str.replace(":par:", compileCond(cond)));
        full.push(str);
    });
    return full.join(" ");
}

// Load all modulus script with compiler
window.addEventListener("load", function() {
    document.querySelectorAll("script").forEach(function(script) {
        if (script.getAttribute("type") == "application/modulus") {
            fetch(script.getAttribute("src"))
                .then(res => res.json())
                .then(data => {
                    eval(compile(data.script));
                });
        }
    });
});