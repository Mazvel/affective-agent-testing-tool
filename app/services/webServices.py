#!flask/bin/python
from flask import Flask, jsonify
from flask import request
from flask import abort
from app import app
from app import models, db
from flask import make_response
from flask.ext.httpauth import HTTPBasicAuth
from datetime import datetime
import json

auth = HTTPBasicAuth()


@app.route('/api/v1.0/NPCLocations', methods=['GET'])
@auth.login_required
def getNpcLocations():
  results = models.NPCLocation.query.all()
  if len(results) > 0:
    locations = []
    for location in results:
      locations.append({'location': location.location})
    return jsonify({'locations': locations})
  else:
    return jsonify({'error':'No locations found'})
    
@app.route('/api/v1.0/NPCLocations', methods=['POST'])
@auth.login_required
def addNpcLocations():
  if not request.json or not 'location' in request.json:
    abort(400)
  userKey = request.authorization.username
  sessionId = getLatestSession(userKey)
  addedLocations = []
  for entry in request.json['location']:
    npcID = int(entry['npcID'])
    location = entry['location']
    if 'timestamp' in entry:
      timestampMS = int(entry['timestamp'])
      timestamp = datetime.fromtimestamp(timestampMS/1000.0)
    else:
      timestamp = None
    location = models.NPCLocation(userKey = userKey, sessionID = sessionId, npcID = npcID, location = location, timeStamp = timestamp)
    addedLocations.append({'location': location.location})
    db.session.add(location)
  db.session.commit()
  return jsonify({'locations': addedLocations}), 201

@app.route('/api/v1.0/SimulationSession', methods=['POST'])
@auth.login_required
def newSimulationSession():
  userKey = request.authorization.username
  #Check if the user has any previous simulation session.
  if not request.json or not 'label' in request.json:
    label = "Unnamed simulation"
  else:
    label = request.json['label']   
  sessions = models.SimulationSession.query.filter_by(userKey=userKey).all()
  if len(sessions) is not 0:
    oldId = models.SimulationSession.query.filter_by(userKey=userKey).order_by('sessionid desc').first().sessionID
    newSession = models.SimulationSession(userKey = userKey, sessionID = oldId + 1, date = datetime.now(), label = label)
  else:
    #There was no simulation session for this user. Just create a new one with id 0.
    newSession = models.SimulationSession(userKey = userKey, sessionID = 1, date = datetime.now(), label = label)
  db.session.add(newSession)
  db.session.commit()
  return jsonify({'User key': newSession.userKey, 'Session id': newSession.sessionID, 'date' : newSession.date, 'label': newSession.label}), 201
  
@app.route('/api/v1.0/addNPC', methods=['POST'])
@auth.login_required
def addNPC():
  if not request.json or not 'npc' in request.json:
    abort(400)
  userKey = request.authorization.username
  sessionID = getLatestSession(userKey)
  addedNPC = []
  for entry in request.json['npc']:
    npcID = int(entry['npcID'])
    typeID = int(entry['typeID'])
    name = entry['name']
    info = entry['info']
    npc = models.NPC(userKey = userKey, sessionID = sessionID, typeID = typeID, npcID = npcID, name = name, info = info)
    db.session.add(npc)
    addedNPC.append({'npc': npc.name})
  db.session.commit()
  return jsonify({'npcs': addedNPC}), 201
    
@app.route('/api/v1.0/addNPCType', methods=['POST'])
@auth.login_required
def addNPCType():
  if not request.json or not 'npcType' in request.json:
    abort(400)
  userKey = request.authorization.username
  sessionID = getLatestSession(userKey)
  addedNPCType = []
  for entry in request.json['npcType']:
    typeID = int(entry['typeID'])
    name = entry['name']
    info = entry['info']
    npcType = models.NPCType(userKey = userKey, sessionID = sessionID, typeID = typeID, name = name, info = info)
    db.session.add(npcType)
    addedNPCType.append({'npcType': npcType.name})
  db.session.commit()
  return jsonify({'npcTypes': addedNPCType}), 201

@app.route('/api/v1.0/addEmotion', methods=['POST'])
@auth.login_required
def addEmotion():
  if not request.json or not 'emotion' in request.json:
    abort(400)
  userKey = request.authorization.username
  sessionID = getLatestSession(userKey)
  addedEmotion = []
  for entry in request.json['emotion']:
    npcID = int(entry['npcID'])
    typeID = entry['typeID']
    if 'intensity' in entry:
      intensity = float(entry['intensity'])
    else:
      intensity = 1.0
    if 'timestamp' in entry:
      timestampMS = int(entry['timestamp'])
      timestamp = datetime.fromtimestamp(timestampMS/1000.0)
    else:
      timestamp = None
    emotion = models.Emotion(userKey = userKey, sessionID = sessionID, npcID = npcID, typeID = typeID, intensity = intensity, timeStamp = timestamp)
    db.session.add(emotion)
    addedEmotion.append({'typeID': emotion.typeID, 'intensity': emotion.intensity, 'npc': emotion.npcID})
  db.session.commit()
  return jsonify({'emotions': addedEmotion}), 201  
  
@app.route('/api/v1.0/addEmotionType', methods=['POST'])
@auth.login_required
def addEmotionType():
  if not request.json or not 'emotionType' in request.json:
    abort(400)  
  userKey = request.authorization.username
  sessionID = getLatestSession(userKey)
  addedEmotionType = []
  for entry in request.json['emotionType']:
    typeID = entry['typeID']
    name = entry['name']
    info = entry['info']
    emotionType = models.EmotionType(userKey = userKey, sessionID = sessionID, typeID = typeID, name = name, info = info)
    db.session.add(emotionType)
    addedEmotionType.append({'emotion': emotionType.name})
  db.session.commit()
  return jsonify({'emotionTypes': addedEmotionType}), 201
    
@app.route('/api/v1.0/sendPAD', methods=['POST'])
@auth.login_required  
def addPAD():
  if not request.json or not 'pad' in request.json:
    abort(400)
  userKey = request.authorization.username
  sessionID = getLatestSession(userKey)
  addedPAD = []
  for entry in request.json['pad']:
    npcID = int(entry['npcID'])
    pad = entry['pad']
    if 'timestamp' in entry:
      timestampMS = int(entry['timestamp'])
      timestamp = datetime.fromtimestamp(timestampMS/1000.0)
    else:
      timestamp = None
    pad = models.PAD(userKey = userKey, sessionID = sessionID, npcID = npcID, pad = pad, timeStamp = timestamp)
    addedPAD.append({'pad': pad.pad})
    db.session.add(pad)
  db.session.commit()
  return jsonify({'pad': addedPAD}), 201

@app.route('/api/v1.0/addEvent', methods=['POST'])
@auth.login_required
def addEvent():
  if not request.json or not 'event' in request.json:
    abort(400)
  userKey = request.authorization.username
  sessionID = getLatestSession(userKey)
  addedEvent = []
  for entry in request.json['event']:
    npcID = int(entry['npcID'])
    typeID = entry['typeID']
    location = entry['location']
    if 'timestamp' in entry:
      timestampMS = int(entry['timestamp'])
      timestamp = datetime.fromtimestamp(timestampMS/1000.0)
    else:
      timestamp = None
    event = models.Event(userKey = userKey, sessionID = sessionID, npcID = npcID, typeID = typeID, timeStamp = timestamp, location = location)
    db.session.add(event)
    addedEvent.append({'event': event.typeID, 'npc': event.npcID})
  db.session.commit()
  return jsonify({'events': addedEvent}), 201  
  
@app.route('/api/v1.0/addEventType', methods=['POST'])
@auth.login_required
def addEventType():
  if not request.json or not 'eventType' in request.json:
    abort(400)
  userKey = request.authorization.username
  sessionID = getLatestSession(userKey)
  addedEventType = []
  for entry in request.json['eventType']:
    typeID = entry['typeID']
    name = entry['name']
    info = entry['info']
    eventType = models.EventType(userKey = userKey, sessionID = sessionID, typeID = typeID, name = name, info = info)
    db.session.add(eventType)
    addedEventType.append({'event': eventType.name})
  db.session.commit()
  return jsonify({'eventTypes': addedEventType}), 201  

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)
    
@auth.verify_password
def get_pw(userKey, password):
    user = models.User.query.filter_by(userKey=userKey).first()
    if user is not None:
        return True
    return False
 
def getLatestSession(userKey):
  if len(models.SimulationSession.query.filter_by(userKey=userKey).order_by('sessionid desc').all()) is 0:
    newSimulationSession()
  simulationSession = models.SimulationSession.query.filter_by(userKey=userKey).order_by('sessionid desc').first().sessionID
  return simulationSession
