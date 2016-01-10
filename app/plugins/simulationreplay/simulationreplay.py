import abc
from app import app, models, db
from app.plugins.PluginBase import PluginBase
from sqlalchemy import desc
from datetime import datetime

class SimulationReplayImplementation(PluginBase):

  def bundleData(self, data, sessionID, userKey): 
    # Start with building dictionary of eventTypes, emotionTypes and npcs to help with later processing.
    eventTypeQuery = models.EventType.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    eventTypes = {}
    for eventType in eventTypeQuery:
      eventTypes[eventType.typeID] = eventType.name
    emotionTypes = {}
    emotionTypeQuery = models.EmotionType.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    for emotionType in emotionTypeQuery:
      emotionTypes[emotionType.typeID] = emotionType.name
    npcQuery = models.NPC.query.filter_by(userKey = userKey, sessionID = sessionID).order_by(models.NPC.typeID)
    npcs = {}
    for npc in npcQuery:
      npcs[npc.npcID] = npc.name 
    eventData = []
    eventQuery = models.Event.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    for event in eventQuery:
      locationStringSplit = event.location.split(";")
      x = locationStringSplit[0][2:]
      y = locationStringSplit[2][2:]
      eventData.append({"eventID": event.eventID, "x": x, "y": y,"timeStamp": event.timeStamp, "typeID": event.typeID, "typeName": eventTypes[event.typeID], "npcID": event.npcID, "npcName": npcs[event.npcID]})
    returnData = {}
    returnData['eventData'] = eventData
    latestEvent = models.Event.query.filter_by(userKey = userKey, sessionID = sessionID).order_by(desc(models.Event.timeStamp))[0]
    returnData['latestDate'] = latestEvent.timeStamp
    npcEmotionLines = []
    npcPADLines = []
    for npc in npcQuery:
      padQuery = db.session.query(models.PAD)\
        .filter(models.PAD.npcID.in_([npc.npcID]))\
        .filter_by(userKey=userKey, sessionID = sessionID).all()
      tmpPleasureLine = []
      tmpArousalLine = []
      tmpDominanceLine = []
      #tmpPleasureLine.append({'x': 0, 'y': 0})
      #tmpArousalLine.append({'x': 0, 'y': 0})
      #tmpDominanceLine.append({'x': 0, 'y': 0})
      for padPoint in padQuery:      
        padStringSplit = padPoint.pad.split(";")
        p = padStringSplit[0][2:]
        a = padStringSplit[1][2:]
        d = padStringSplit[2][2:]
        tmpTime = padPoint.timeStamp - datetime(1970, 01, 01, 01)
        milliseconds = int(tmpTime.total_seconds() * 1000)
        tmpPleasureLine.append({'x': milliseconds, 'y': p})
        tmpArousalLine.append({'x': milliseconds, 'y': a})
        tmpDominanceLine.append({'x': milliseconds, 'y': d})
      tmpPADLines = []
      tmpPADLines.append({ 'name': "Pleasure", 'data': tmpPleasureLine})
      tmpPADLines.append({ 'name': "Arousal", 'data': tmpArousalLine})
      tmpPADLines.append({ 'name': "Dominance", 'data': tmpDominanceLine})
      npcPADLines.append({ 'id' : npc.npcID, 'name' : npc.name, 'data' : tmpPADLines})
    returnData['npcPADLines'] = npcPADLines
    # Get the event data
    eventData = []
    eventQuery = models.Event.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    for event in eventQuery:
      locationStringSplit = event.location.split(";")
      x = locationStringSplit[0][2:]
      y = locationStringSplit[2][2:]
      eventData.append({"eventID": event.eventID, "x": x, "y": y,"timeStamp": event.timeStamp, "typeID": event.typeID, "typeName": eventTypes[event.typeID], "npcID": event.npcID, "npcName": npcs[event.npcID]})
    returnData['eventData']
    # For the emotional state for every agent we log emotions?
    # We sort by timestamp. So for each agent we get all of it's emotions sorted by timestamp. 
    # First we get all of the location timestamps, because then we know when time was logged for this agent.
    # Then we create a dictionary of { time: x, npcID: x, data: [] } where data is the emotional state.
    #npcEmotionalStates = []
    #for npc in npcQuery:
    #  locationQuery = db.session.query(models.NPCLocation)\
    #    .filter(models.NPCLocation.npcID.in_([npc.npcID]))\
    #    .filter_by(userKey=userKey, sessionID = sessionID).all()
    #  timeOrder = []
    #  npcLocationTimes = {}
    #  npcEmotionState = []
    #  index = 0
    #  for entry in locationQuery:
    #    timeOrder.append(entry.timeStamp)
    #    npcLocationTimes[entry.timeStamp] = index
    #    npcEmotionState.append([])
    #    index += 1
    #  # Ok now we got the location locked up.
    #  emotionQuery = db.session.query(models.Emotion)\
    #    .filter(models.Emotion.npcID.in_([npc.npcID]))\
    #    .filter_by(userKey=userKey, sessionID = sessionID).all()
    #  for emotion in emotionQuery:
    #    npcEmotionState[npcLocationTimes[emotion.timeStamp]].append({"intensity": emotion.intensity, "name": emotionTypes[emotion.typeID]})
    #  npcReturnData = []
    #  for key in timeOrder:
    #      npcReturnData.append({"time": key, "npcID": npc.npcID, "data": npcEmotionState[npcLocationTimes[key]]})
    #  npcEmotionalStates.append({"id": npc.npcID, "data": npcReturnData})
    #returnData['npcEmotionalStates'] = npcEmotionalStates
    #emotionQuery = models.Emotion.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    #emotions = []
    #for emotion in emotionQuery:
    #  emotions.append({"npcID": emotion.npcID, "time" : emotion.timeStamp, "intensity" : emotion.intensity, "name": emotionTypes[emotion.typeID]})
    #returnData['emotions'] = emotions
    
    
    #Now we must gather the emotionData.
    emotionQuery = models.Emotion.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    print "Emotion query length: " + str(len(emotionQuery))
    emotionReturnData = []
    for emotion in emotionQuery:
      emotionReturnData.append({ "id" : emotion.typeID, "name" : emotionTypes[emotion.typeID], "intensity" : emotion.intensity, "timeStamp" : emotion.timeStamp, "npc" : emotion.npcID})
    returnData['emotions'] = emotionReturnData
    print "Number of emotions: " + str(len(emotionQuery))
    emotionDataTimes = {}
    for emotion in emotionQuery:
      if emotion.timeStamp in emotionDataTimes:
        emotionDataTimes[emotion.timeStamp] = emotionDataTimes[emotion.timeStamp] + 1 
      else:
        emotionDataTimes[emotion.timeStamp] = 1
    emotionTimeData = []
    for key in emotionDataTimes:
      tmpTime = key - datetime(1970, 01, 01, 01)
      emotionTimeData.append(int(tmpTime.total_seconds() * 1000))
    list.sort(emotionTimeData)
    print "Number of times: " + str(len(emotionTimeData))
    returnData["emotionTimeData"] = emotionTimeData
    
    
    
    
    locationQuery = models.NPCLocation.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    locations = []
    for location in locationQuery:
      locationStringSplit = location.location.split(";")
      x = locationStringSplit[0][2:]
      y = locationStringSplit[2][2:]
      locations.append({'npcID' : location.npcID, 'x' : x, 'y' : y, 'timeStamp' : location.timeStamp})
    returnData['locations'] = locations
    
    # Now we must get the agent types.
    npcTypeQuery = models.NPCType.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    npcTypes = []
    npcTypeDict = {}
    for npcType in npcTypeQuery:
      npcTypeDict[npcType.typeID] = npcType.name
      npcTypes.append({"name" : npcType.name, "id" : npcType.typeID})
    returnData['npcTypes'] = npcTypes
    # We need to get also get information on all agents. Their id, name, typeID and typeName.
    npcQuery = models.NPC.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    npcInfo = []
    for npc in npcQuery:
      npcInfo.append({"name" : npc.name, "id" : npc.npcID, "typeID" : npc.typeID, "type" : npcTypeDict[npc.typeID]})
    returnData['npcInfo'] = npcInfo
    
    
    return returnData
  
  def getPluginTemplate(self, data, warnings):  
    template = []
    return template
    