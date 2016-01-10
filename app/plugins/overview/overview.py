import abc
from app import app, models, db
from app.plugins.PluginBase import PluginBase

class OverviewImplementation(PluginBase): 

  def bundleData(self, data, sessionID, userKey):
    data = {}
    sessionInfo = models.SimulationSession.query.filter_by(sessionID = sessionID, userKey = userKey).first()
    data['sessionInfo'] = {'id' : sessionInfo.sessionID, 'label': sessionInfo.label, 'date': sessionInfo.date }
    npcTypeInfo = []
    npcTypeQueryResults = db.session.query(models.NPCType, db.func.count(models.NPC.typeID))\
          .filter(models.NPCType.typeID == models.NPC.typeID, models.NPCType.sessionID == models.NPC.sessionID, models.NPCType.userKey == models.NPC.userKey)\
          .filter_by(userKey=userKey, sessionID = sessionID).group_by(models.NPC.typeID).all()
    for entry in npcTypeQueryResults:
      print entry[1]
      print entry.NPCType.name
      npcTypeInfo.append({'name' : entry.NPCType.name, 'agents' : entry[1], 'info' : entry.NPCType.info})
    if len(npcTypeInfo) > 0:
      data['npcType'] = npcTypeInfo
    test = models.NPCType.query.filter_by(sessionID = sessionID, userKey = userKey).all()
    
    #Add emotion info
    emotionTypeInfo = []
    emotionTypeQueryResults = db.session.query(models.EmotionType, db.func.count(models.Emotion.typeID))\
          .filter(models.EmotionType.typeID == models.Emotion.typeID, models.EmotionType.sessionID == models.Emotion.sessionID, models.EmotionType.userKey == models.Emotion.userKey)\
          .filter_by(userKey=userKey, sessionID = sessionID).group_by(models.Emotion.typeID).all()
    for entry in emotionTypeQueryResults:
      emotionTypeInfo.append({'name' : entry.EmotionType.name, 'points' : entry[1], 'info' : entry.EmotionType.info})
    if len(emotionTypeInfo) > 0:
      data['emotionType'] = emotionTypeInfo
    #Add event info
    eventTypeInfo = []
    eventTypeQueryResults = db.session.query(models.EventType, db.func.count(models.Event.typeID))\
          .filter(models.EventType.typeID == models.Event.typeID, models.EventType.sessionID == models.Event.sessionID, models.EventType.userKey == models.Event.userKey)\
          .filter_by(userKey=userKey, sessionID = sessionID).group_by(models.Event.typeID).all()
    for entry in eventTypeQueryResults:
      eventTypeInfo.append({'name' : entry.EventType.name, 'points' : entry[1], 'info' : entry.EventType.info})
    if len(eventTypeInfo) > 0:
      data['eventType'] = eventTypeInfo
    
    emotionTypeQuery = models.EmotionType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    
    return data

  def getPluginTemplate(self, data, warnings):
    template = []
    return template