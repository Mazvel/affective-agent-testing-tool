import abc
from app import app, models, db
from app.plugins.PluginBase import PluginBase
from sqlalchemy import desc
from datetime import datetime
from flask import request

class EventInspectorImplementation(PluginBase):

  def bundleData(self, data, sessionID, userKey):
    # First we must check if there are special parameters in the request referencing the boundaries. 
    # If there is one then there is all.
    returnData = {}
    specialBoundaries = False
    if 'xLeft' in request.args:
      specialBoundaries = True
      xLeft = int(request.args['xLeft'])
      xRight = int(request.args['xRight'])
      yTop = int(request.args['yTop'])
      yBottom = int(request.args['yBottom'])
      returnData['selectedArea'] = {"xLeft": xLeft, "xRight": xRight, "yTop": yTop, "yBottom": yBottom} 
    
    # Start with building dictionary of eventTypes, emotionTypes and npcs to help with later processing.
    eventTypeQuery = models.EventType.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    eventTypes = {}
    for eventType in eventTypeQuery:
      eventTypes[eventType.typeID] = eventType.name
    emotionTypeQuery = models.EmotionType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    emotionTypes = {}
    for emotionType in emotionTypeQuery:
        emotionTypes[emotionType.typeID] = emotionType.name
    npcQuery = models.NPC.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    npcs = {}
    for npc in npcQuery:
      npcs[npc.npcID] = npc.name
    # Let's start with putting the npc data over
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
    eventData = []
    eventQuery = models.Event.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    for event in eventQuery:
      locationStringSplit = event.location.split(";")
      x = locationStringSplit[0][2:]
      y = locationStringSplit[2][2:]
      if specialBoundaries:
        if not (float(x) > xLeft and float(x) < xRight):
          continue
        if not(float(y) > yTop and float(y) < yBottom):
          continue
      eventData.append({"eventID": event.eventID, "x": x, "y": y,"timeStamp": event.timeStamp, "typeID": event.typeID, "typeName": eventTypes[event.typeID], "npcID": event.npcID, "npcName": npcs[event.npcID]})
    returnData['eventData'] = eventData
    latestEvent = models.Event.query.filter_by(userKey = userKey, sessionID = sessionID).order_by(desc(models.Event.timeStamp))[0]
    returnData['latestDate'] = latestEvent.timeStamp
    npcFilterData = []
    npcIds = models.NPC.query.filter_by(userKey = userKey, sessionID = sessionID).all();
    for npc in npcIds:
      npcEventData = []
      eventQuery = models.Event.query.filter_by(userKey=userKey, sessionID = sessionID, npcID = npc.npcID).all();
      for event in eventQuery:
        locationStringSplit = event.location.split(";")
        x = locationStringSplit[0][2:]
        y = locationStringSplit[2][2:]
        if specialBoundaries:
          if not (float(x) > xLeft and float(x) < xRight):
            continue
          if not(float(y) > yTop and float(y) < yBottom):
            continue
        eventType = models.EventType.query.filter_by(userKey=userKey, sessionID = sessionID, typeID = event.typeID).first()
        npcEventData.append({"id": event.eventID, "typeId": event.typeID, "name": eventTypes[event.typeID], "timeStamp" : event.timeStamp})
      npcFilterData.append({'id': npc.npcID, 'name' : npc.name, 'data' : npcEventData})
    returnData['npcFilter'] = npcFilterData
    npcTypeFilterData = []
    npcTypeIds = models.NPCType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    for npcType in npcTypeIds:
      npcIds = db.session.query(models.NPC.npcID).filter(models.NPC.typeID == npcType.typeID).filter_by(userKey=userKey, sessionID = sessionID).all()
      npcIds = [id for (id, ) in npcIds]
      npcTypeEventData = []
      eventQuery = db.session.query(models.Event)\
          .filter(models.Event.npcID.in_(npcIds))\
          .filter_by(userKey=userKey, sessionID = sessionID).all()
      for event in eventQuery:
        locationStringSplit = event.location.split(";")
        x = locationStringSplit[0][2:]
        y = locationStringSplit[2][2:]
        if specialBoundaries:
          if not (float(x) > xLeft and float(x) < xRight):
            continue
          if not(float(y) > yTop and float(y) < yBottom):
            continue
        eventType = models.EventType.query.filter_by(userKey=userKey, sessionID = sessionID, typeID = event.typeID).first()
        npcTypeEventData.append({"id": event.eventID, "typeId": event.typeID, "name": eventType.name, "timeStamp" : event.timeStamp})
      npcTypeFilterData.append({'id': npcType.typeID, 'name': npcType.name, 'data': npcTypeEventData})
    returnData['npcTypeFilter'] = npcTypeFilterData
    #Now we must gather the emotionData.
    emotionQuery = models.Emotion.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    emotionReturnData = []
    for emotion in emotionQuery:
      emotionReturnData.append({ "id" : emotion.typeID, "name" : emotionTypes[emotion.typeID], "intensity" : emotion.intensity, "timeStamp" : emotion.timeStamp, "npc" : emotion.npcID})
    returnData['allEmotionData'] = emotionReturnData
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
    returnData["emotionTimeData"] = emotionTimeData
    
    # Get location data
    locationQuery = models.NPCLocation.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    locations = []
    for location in locationQuery:
      locationStringSplit = location.location.split(";")
      x = locationStringSplit[0][2:]
      y = locationStringSplit[2][2:]
      locations.append({'npcID' : location.npcID, 'x' : x, 'y' : y, 'timeStamp' : location.timeStamp})
    returnData['locations'] = locations
    
    
    #Now we must gather the emotional data.
    # allEmotionIntensities = {}
    # emotionIntensities = {}
    # emotionTypeQuery = models.EmotionType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    # for emotionType in emotionTypeQuery:
      # emotionIntensities[emotionType.typeID] = {}
    # #First find the seconds of the latestEvent.
    # tmpTime = latestEvent.timeStamp - datetime(1970, 01, 01, 01)
    # milliseconds = tmpTime.total_seconds() * 1000
    # latestEventSeconds = int(round(milliseconds,-3)) / 1000
    # for emotionType in emotionTypeQuery:
      # for x in range (0,latestEventSeconds + 1):
        # emotionIntensities[emotionType.typeID][x] = []
    # for x in range (0,latestEventSeconds + 1):
      # allEmotionIntensities[x] = []
    # emotionQuery = models.Emotion.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    # for emotion in emotionQuery:
      # tmpTime = emotion.timeStamp - datetime(1970, 01, 01, 01)
      # milliseconds = tmpTime.total_seconds() * 1000
      # second = int(round(milliseconds,-3)) / 1000
      # if second not in allEmotionIntensities:
        # allEmotionIntensities[second] = []
      # allEmotionIntensities[second].append(emotion.intensity)
      # if second not in emotionIntensities[emotion.typeID]:
        # emotionIntensities[emotion.typeID][second] = []
      # emotionIntensities[emotion.typeID][second].append(emotion.intensity)
    # emotionIntensityLines = []
    # allIntensities = []
    # for second in allEmotionIntensities:
      # sum = 0
      # for intensity in allEmotionIntensities[second]:
        # sum += intensity
      # allIntensities.append({ "x": second * 1000,   "y": sum / max(1,len(allEmotionIntensities[second]))})
    # emotionIntensityLines.append({'id' : len(emotionTypeQuery), 'name' : "All", 'data' : allIntensities})
    # for emotionType in emotionTypeQuery:
      # tmpEmotionLine = []
      # for second in emotionIntensities[emotionType.typeID]:
        # sum = 0
        # for intensity in emotionIntensities[emotionType.typeID][second]:
          # sum += intensity
        # tmpEmotionLine.append({ "x": second * 1000,   "y": sum / max(1,len(emotionIntensities[emotionType.typeID][second]))})
      # #emotionIntensityLines[emotionType.typeID] = tmpEmotionLine
      # emotionIntensityLines.append({'id' : emotionType.typeID, 'name' : emotionType.name, 'data' : tmpEmotionLine})
    # returnData['emotionIntensityLines'] = emotionIntensityLines 
    # # Now we must get the emotion data for all agent types!
    # npcTypeEmotionLines = []
    # for npcType in npcTypeIds:
      # tmpNpcTypeEmotionLines = []
      # npcIds = db.session.query(models.NPC.npcID).filter(models.NPC.typeID == npcType.typeID).filter_by(userKey=userKey, sessionID = sessionID).all()
      # npcIds = [id for (id, ) in npcIds]
      # emotionQuery = db.session.query(models.Emotion)\
          # .filter(models.Emotion.npcID.in_(npcIds))\
          # .filter_by(userKey=userKey, sessionID = sessionID).all()
      # allEmotionsDict = {}
      # individualEmotionsDict = {}
      # for emotionType in emotionTypeQuery:
        # individualEmotionsDict[emotionType.typeID] = {}
      # for emotionType in emotionTypeQuery:
        # for x in range (0,latestEventSeconds + 1):
          # individualEmotionsDict[emotionType.typeID][x] = []
      # for x in range (0,latestEventSeconds + 1):
        # allEmotionsDict[x] = []
      # for emotion in emotionQuery:
        # tmpTime = emotion.timeStamp - datetime(1970, 01, 01, 01)
        # milliseconds = tmpTime.total_seconds() * 1000
        # second = int(round(milliseconds,-3)) / 1000
        # if second not in allEmotionsDict:
          # allEmotionsDict[second] = []
        # allEmotionsDict[second].append(emotion.intensity)
        # if second not in individualEmotionsDict[emotion.typeID]:
          # individualEmotionsDict[emotion.typeID][second] = []
        # individualEmotionsDict[emotion.typeID][second].append(emotion.intensity)
      # allEmototionIntensities = []
      # for second in allEmotionsDict:
        # sum = 0
        # for intensity in allEmotionsDict[second]:
          # sum += intensity
        # allEmototionIntensities.append({ "x": second * 1000,   "y": sum / max(1,len(allEmotionsDict[second]))})
      # tmpNpcTypeEmotionLines.append({'id' : len(emotionTypeQuery), 'name' : "All", 'data' : allEmototionIntensities})
      # for emotionType in emotionTypeQuery:
        # tmpEmotionLine = []
        # for second in individualEmotionsDict[emotionType.typeID]:
          # sum = 0
          # for intensity in individualEmotionsDict[emotionType.typeID][second]:
            # sum += intensity
          # tmpEmotionLine.append({ "x": second * 1000,   "y": sum / max(1,len(individualEmotionsDict[emotionType.typeID][second]))})
        # #emotionIntensityLines[emotionType.typeID] = tmpEmotionLine
        # tmpNpcTypeEmotionLines.append({'id' : emotionType.typeID, 'name' : emotionType.name, 'data' : tmpEmotionLine})
      # npcTypeEmotionLines.append({'id' : npcType.typeID, 'name' : npcType.name, 'data' : tmpNpcTypeEmotionLines})
    # returnData['npcTypeEmotionLines'] = npcTypeEmotionLines
    # # Now get the emotion data for everh agent!
    # # Instead of constructing a new emotion intensity line for all NPCs we create a dictionary with all emotion data.
    # # Then when the user selects different NPC in the selection filter this dictionary is looped and used to retrive the
    # # relevant data. It is simply infeasible to do it the other way in terms of computational overhead.
    # #Build emotion  type filter data
    # emotionTypeFilterData = []
    # emotionTypeQuery = models.EmotionType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    # for emotionType in emotionTypeQuery:
      # emotionTypeEmotionData = []
      # emotionQuery = models.Emotion.query.filter_by(userKey = userKey, sessionID = sessionID).all()
      # for entry in emotionQuery:
        # if entry.typeID == emotionType.typeID:
          # tmpTime = entry.timeStamp - datetime(1970, 01, 01, 01)
          # milliseconds = int(tmpTime.total_seconds() * 1000)
          # second = int(round(milliseconds,-3)) / 1000
          # emotionTypeEmotionData.append({'npcID' : entry.npcID, 'x' : milliseconds, 'y' : entry.intensity, 'typeID' : entry.typeID })  
      # if len(emotionTypeEmotionData) > 0:
        # emotionTypeFilterData.append({'id' : emotionType.typeID, 'name' : emotionType.name, 'data' : emotionTypeEmotionData})
    # returnData['emotionData'] = emotionTypeFilterData
    # npcEmotionLines = []

    
    return returnData
  
  def getPluginTemplate(self, data, warnings):  
    template = []
    return template
    