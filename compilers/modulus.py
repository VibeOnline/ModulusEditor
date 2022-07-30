import json

# Design params
translate = {
    "actors": {
        "set_action": "function :par:() { :content: }",
        "run_action": ":par:()",
        "if": "if :par: { :content: }",
        "if_else": "if :par::\n\t:content:\nelse:\n\t:content:\n",
        "repeat": "while(True):\n\t",
        "wait": "setTimeout(() => { :content: }, (:par: * 1000))",
        "end_repeat": "break",
        "set_var": ":par: = :par:"
    },
    "params": {
        "and": "(:par: and :par:)",
        "or": "(:par: or :par:)",
        "gt": "(:par: > :par:)",
        "lt": "(:par: < :par:)",
        "eq": "(:par: == :par:)",
        "not": "not :par:",
        "add": "(:par: + :par:)",
        "subtract": "(:par: - :par:)",
        "divide": "(:par: / :par:)",
        "multiply": "(:par: * :par:)",
        "var": ":par:"
    }
}

# Precompile parameters
def compileCond(cond):
    # Return simple data
    if cond is not dict:
        return cond

    # Get sub data
    str = translate["params"][cond["name"]]
    for val in cond["content"]:
        str = str.replace(":par:", compileCond(val), 1)
    return str

# Precompile actions
def compile(data):
    full = []
    for node in data:
        str = translate["actors"][node["name"]] # Get template
        
        # Load contents
        for val in node["content"]:
            str = str.replace(":content:", compile(val), 1)
        for cond in node["data"]:
            str = str.replace(":par:", compileCond(cond), 1)
        
        full.append(str)
    return " ".join(full)

file = open("static/mdls/main.mdls")
print(compile(json.loads(file.read())["script"]))
file.close()