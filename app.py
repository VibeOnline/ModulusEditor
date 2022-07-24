from flask import Flask, render_template, send_from_directory, abort, make_response
import os

app = Flask(__name__)

# Load html site page
@app.route("/")
def index():
    return render_template("index.html")

# Handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404

# Load static files
@app.route("/<path:path>")
def send_static(path):
    return send_from_directory("static/", path)

# Load PWA service worker
@app.route("/sw.js")
def send_sw():
    resp = make_response(send_from_directory("pwa/", "sw.js"))
    resp.headers["Cache-Control"] = "no-cache"
    resp.mimetype = "application/javascript"
    return resp

# Load PWA manifest
@app.route("/manifest.json")
def send_manifest():
    return send_from_directory("pwa/", "manifest.json")

# Run flask
if __name__ == "__main__":
    app.run()