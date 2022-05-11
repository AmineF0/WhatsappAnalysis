from flask import Flask,redirect,  request, Response, render_template, jsonify,  url_for, redirect, make_response
import json
import time
from tools import *
import os

app = Flask(__name__)

users = {}

@app.route('/not_found')
def not_found():
    return render_template('404.html')

@app.route('/')
def index():
    return render_template('upload.html')

@app.route("/handleUpload", methods=['POST'])
def handleFileUpload():
    response = make_response(redirect(url_for('not_found')))

    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':

            u = user(file.filename , str(file.read())  )     
            #users[u.id()] = u

            response = jsonify(u.gen_response())


    return response

if __name__ == '__main__':
    # Threaded option to enable multiple instances for multiple user access support
    app.run(threaded=True, port=5000)