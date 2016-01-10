import os
from flask.ext.login import LoginManager
from flask.ext.uploads import UploadSet, configure_uploads
from flask.ext.openid import OpenID
from config import basedir, PLUGIN_DIR, UPLOAD_FOLDER
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
import jinja2


app = Flask(__name__)
app.config.from_object('config')
app.config['UPLOADED_GAMEMAP_DEST'] = UPLOAD_FOLDER
photos = UploadSet('GAMEMAP', ('png', 'jpg', 'jpeg', 'gif' ))
configure_uploads(app, (photos,))
my_loader = jinja2.ChoiceLoader([
    app.jinja_loader,
    jinja2.FileSystemLoader(PLUGIN_DIR),
])
app.jinja_loader = my_loader
db = SQLAlchemy(app)
lm = LoginManager()
lm.init_app(app)

from app import views, models
from app.services import webServices
