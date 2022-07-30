import json, os

# Design params
translate = {
    "actors": {
        "set_action": "def :par:():\n:content:",
        "run_action": ":par:()\n",
        "if": "if :par::\n:content:",
        "if_else": "if :par::\n:content:\nelse:\n:content:",
        "repeat": "while (True):\n:content:",
        "wait": "sleep(:par:)",
        "end_repeat": "break",
        "set_var": "mdls_set_var(\":par:\", :par:)"
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
        "var": "mdls_get_var(\":par:\")"
    }
}

# Precompile parameters
def compileCond(cond):
    # Return simple data
    if type(cond) is not dict:
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
            # Special format for python indent syntax
            str = str.replace("\n:content:", "\n\t:content:")
            str = str.replace("\n", "\n\t")
            str = str.replace(":content:", compile(val), 1)
        for cond in node["data"]:
            str = str.replace(":par:", compileCond(cond), 1)
        
        full.append(str)

    return "\n".join(full)

# Compile directories files
def compile_files(path=None, ind=0):
    for file in os.listdir(path):
        src = os.path.join(path or "", file)
        print(src)

        if os.path.isdir(src):
            compile_files(src, ind + 1)
        else:
            if file.endswith(".mdls"):
                # Special functions
                mdls_var_dict = {}
                def mdls_set_var(name, val):
                    mdls_var_dict[name] = val

                def mdls_get_var(name):
                    return mdls_var_dict[name] or 0

                # Run script
                script = open(src, "r")
                exec(
                    "from time import sleep\n\n%s" % compile(json.loads(script.read())["script"]).replace("\n\t", "\n"),
                    { # Script runtime context
                        "mdls_set_var": mdls_set_var,
                        "mdls_get_var": mdls_get_var
                    }
                )
                print(mdls_var_dict)
                script.close()
compile_files()