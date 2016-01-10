import os
from app import app, models, db, lm, utilities, photos
from app.plugins import pluginConfig
from config  import PLUGIN_DIR, UPLOAD_FOLDER
from flask import render_template, flash, redirect, session, url_for, request
from .forms import LoginForm, SimulationSessionSelectionForm, DeleteSimulationSessionsForm, UploadGameBackgroundForm
from .models import User
from functools import wraps
from flask.ext.login import login_user, logout_user, current_user, login_required
from flask.ext.httpauth import HTTPDigestAuth
from werkzeug import secure_filename
from datetime import datetime



def simulation_session_required(f):
  ''' This decorator redirects the user to 
  the dashboard if no simulation session id 
  is found in the session cookie'''
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('simulationSession') is None:
          flash('Too hasty! The simulation session has not been set.', 'warning')
          return redirect('/dashboard')
        return f(*args, **kwargs)
    return decorated

@app.route('/')
@app.route('/index')
@login_required
def index():
  if current_user.is_authenticated():
    return redirect('/dashboard')
  else:
    return render_template('login.html')
 
@app.route('/')
@app.route('/contact')
def contact():
  return render_template('contact.html')
  
@app.route('/')
@app.route('/about')
def about():
  return render_template('about.html')
 
@app.route('/dashboard', methods=['GET', 'POST']) 
@login_required
def dashboard():
  form = SimulationSessionSelectionForm()
  if form.validate_on_submit():
    session['simulationSession'] = form.simulationSessoinId.data
    session['backgroundImage'] = form.gameBackgroundId.data
    return redirect('/plugins')
  userKey = models.User.query.filter_by(id = current_user.get_id()).first().userKey
  userSimulationSessions = models.SimulationSession.query.filter_by(userKey = userKey).all()
  simulationSessions = []
  simulationSessionIds = []
  for simulation in userSimulationSessions:
    simulationSessions.append({'id' : simulation.sessionID, 'label' : simulation.label, 'date' : simulation.date})
    simulationSessionIds.append(simulation.sessionID)
  userGameMaps = models.BackgroundImage.query.filter_by(userKey = userKey).all()
  gameMaps = []
  for gameMap in userGameMaps:
    gameMaps.append({'id' : gameMap.mapID, 'label' : gameMap.label, 'date' : gameMap.timeStamp})
  return render_template("dashboard.html", simulationSessions = simulationSessions, form = form, gameMaps = gameMaps)
  
@app.route('/manage', methods=['GET', 'POST']) 
@login_required
def manage():
  form = DeleteSimulationSessionsForm()
  userKey = models.User.query.filter_by(id = current_user.get_id()).first().userKey
  userSimulationSessions = models.SimulationSession.query.filter_by(userKey = userKey).all()
  simulationSessions = []
  simulationSessionIds = []
  form.simulationSessoinIds.choices = [(c.sessionID, c.sessionID) for c in userSimulationSessions]
  if form.validate_on_submit():
    global selectedIds
    selectedIds = request.form.getlist('simulationSessoinIds')
    for value in selectedIds:
      # Now we must delete everything for this simulation session.
      utilities.deleteSimulationSession(value, userKey) 
    db.session.commit()
    return redirect('/dashboard')
  
  for simulation in userSimulationSessions:
    simulationSessions.append({'id' : simulation.sessionID, 'label' : simulation.label, 'date' : simulation.date})
    
    simulationSessionIds.append(simulation.sessionID)
  return render_template("managesessions.html", simulationSessions = simulationSessions, form = form)
 
@app.route('/uploadMap', methods=['GET', 'POST']) 
@login_required
def uploadMap():
  form = UploadGameBackgroundForm()
  userKey = models.User.query.filter_by(id = current_user.get_id()).first().userKey
  if form.validate_on_submit():
    label = form.label.data
    width = form.width.data
    height = form.height.data
    timeStamp = datetime.now()
    randomFileName = utilities.getImageFileName()
    file = request.files['gameBackground']
    filename, file_extension = os.path.splitext(file.filename)
    file.filename = randomFileName + file_extension
    filename = photos.save(file)
    addedGameMap = models.BackgroundImage(userKey = userKey, fileName = filename, label = label, width = width, height = height, timeStamp = timeStamp)
    db.session.add(addedGameMap)
    db.session.commit()
    flash("Image saved.")
    return redirect('/dashboard')
  return render_template("uploadBackground.html", form = form) 
 
 
@app.route('/plugins')
@login_required
@simulation_session_required
def plugin():
  ''' This function is called when the user requests a plug-in.
  '''
  plugins = pluginConfig.returnPlugins()
  pluginNames = []
  for pluginName in plugins:
    pluginNames.append(__import__('app.plugins.' + str(pluginName), fromlist=[str(pluginName)]).config.getName())
  if len(plugins) == 0:
    # No plug-ins are activated in the config. Return error message.
    flash('Something went terribly wrong! There are no plug-ins activated!', 'danger')
    return render_template('pluginBase.html')
  if 'name' in request.args:
    name = request.args['name']
    # We need to find the index of this plug-in so we can update the 'active' in the menu
    for i, plugin in enumerate(plugins):
      if plugin == name:
        index = i + 1
  else:
    # No plug-in name in the request, get the default plug-in name.
    name = plugins[0]
    index = 1
  # Now we need to load the specified plug-in.
  userKey = models.User.query.filter_by(id = current_user.get_id()).first().userKey
  simulationSession = session['simulationSession']
  plugin = __import__('app.plugins.' + str(name), fromlist=[str(name)])
  # Checking for errors and warnings takes time. Especially when a simulation contains a lot of data.
  # To solve this problem we should only check when necessary.
  includedData = models.IncludedData.query.filter_by(userKey = userKey, sessionID = simulationSession, plugin = name).first()
  hasData = False
  if includedData is not None:
    hasData = includedData.data
  if hasData:
    errors = []
    warnings = []
  else:
    errors = plugin.implementation.getDataErrors(plugin.config.getRequiredData(), simulationSession, userKey)
    warnings = plugin.implementation.getDataWarnings(plugin.config.getRequiredData(), simulationSession, userKey)
    if len(errors) > 0 or len(warnings) > 0:
      newIncludedDataObject = models.IncludedData(userKey = userKey, sessionID = simulationSession, plugin = name, data = False)
      db.session.merge(newIncludedDataObject)
      db.session.commit()
    else:
      newIncludedDataObject = models.IncludedData(userKey = userKey, sessionID = simulationSession, plugin = name, data = True)
      db.session.merge(newIncludedDataObject)
      db.session.commit()
  if len(errors) > 0:
    # There are errors. We need to return them.
    for error in errors:
      flash(error, 'danger')
    for warning in warnings:
      flash(warning, 'warning')
    return render_template(str(name) + '/' + str(name) + '.html', plugins = pluginConfig.returnPlugins(), pluginNames = pluginNames, index = index)
  for warning in warnings:
    flash(warning)
  # Now we need to get the data to be returned to the plug-in template
  backgroundImage = models.BackgroundImage.query.filter_by(mapID = session['backgroundImage']).first()
  data = plugin.implementation.bundleData(plugin.config.getRequiredData(), simulationSession, userKey)
  return render_template(str(name) + '/' + str(name) + '.html', plugins = pluginConfig.returnPlugins(), pluginNames = pluginNames, index = index, backgroundImage = backgroundImage, data = data)
    
@app.route('/login', methods=['GET', 'POST'])
def login():
  form = LoginForm()
  if form.validate_on_submit():
    user = models.User.query.filter_by(username=form.username.data).first()
    if user == None: 
      flash('The username and password combination did not match', 'danger')
      return render_template('login.html', title='Sign In', form = form)
    if form.password.data == user.password:
      # Keep the user info in the session using Flask-Login
      login_user(user)
      return redirect(request.args.get('next') or '/')
  return render_template('login.html', title='Sign In',form=form)
 
@app.route('/logout')
@login_required
def logout():
  # Remove the user information from the session
  session.pop('simulationSession', None)
  logout_user()
  return redirect(request.args.get('next') or '/')
    
@lm.user_loader
def load_user(id):
  return User.query.get(int(id))
  
@lm.unauthorized_handler
def unauthorized():
    # do stuff
    return redirect(url_for('login', next=request.url))
    
