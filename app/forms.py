from app import photos
from flask.ext.wtf import Form
from flask_wtf.file import FileField, FileAllowed, FileRequired
from flask.ext.uploads import UploadSet, IMAGES
from wtforms import StringField, BooleanField, PasswordField, IntegerField, SelectMultipleField
from wtforms.validators import DataRequired
from wtforms.widgets import HiddenInput, TableWidget, CheckboxInput

class LoginForm(Form):
  username = StringField('username', validators=[DataRequired()])
  password = PasswordField('password', validators=[DataRequired()])
  remember_me = BooleanField('remember_me', default=False)
 
class SimulationSessionSelectionForm(Form):
  simulationSessoinId = IntegerField('simulationSessoinId', validators=[DataRequired()], widget=HiddenInput())
  gameBackgroundId = IntegerField('gameBackgroundId', validators=[DataRequired()], widget=HiddenInput())
  
class DeleteSimulationSessionsForm(Form):
  simulationSessoinIds = SelectMultipleField('simulationSessoinIds', validators=[DataRequired()], coerce=int)
  

class UploadGameBackgroundForm(Form):
  label = StringField('label', validators=[DataRequired()])
  width = IntegerField('Gameworld width', validators=[DataRequired()])
  height = IntegerField('Gameworld height', validators=[DataRequired()])
  gameBackground = FileField('photos', validators=[
    FileRequired(),
    FileAllowed(photos, 'Incorrect file extension. Images must have .png, .jpg, .jpeg or .gif extension.')
  ])