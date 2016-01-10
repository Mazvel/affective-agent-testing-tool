import abc
from app import app, models, db
from app.plugins.PluginBase import PluginBase
from sqlalchemy import desc
from datetime import datetime
from timeit import default_timer as timer

class EmotionmapImplementation(PluginBase):


  def bundleData(self, data, sessionID, userKey):
    start = timer()
    returnData = {}   
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
    # Need to create a dictionary of emotion types to help with processing
    emotionTypes = {}
    emotionTypesReturnData = []
    emotionTypeQuery = models.EmotionType.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    for emotionType in emotionTypeQuery:
      emotionTypes[emotionType.typeID] = emotionType.name
      emotionTypesReturnData.append({"id" : emotionType.typeID, "name" : emotionType.name})
    
    returnData['emotionTypes'] = emotionTypesReturnData
    # Start with creating query to get data on emotion types in simulation.
    emotionTypeInfo = []
    emotionTypeQueryResults = db.session.query(models.EmotionType, db.func.count(models.Emotion.typeID), db.func.avg(models.Emotion.intensity))\
          .filter(models.EmotionType.typeID == models.Emotion.typeID, models.EmotionType.sessionID == models.Emotion.sessionID, models.EmotionType.userKey == models.Emotion.userKey)\
          .filter_by(userKey=userKey, sessionID = sessionID).group_by(models.Emotion.typeID).all()
    for entry in emotionTypeQueryResults:
      emotionTypeInfo.append({'name' : entry.EmotionType.name, 'points' : entry[1], 'info' : entry.EmotionType.info, 'intensity' : str(entry[2])[:5]})
    returnData['emotionTypeInfo'] = emotionTypeInfo
    
    #Now we must gather the emotionData.
    emotionQuery = models.Emotion.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    #print "Emotion query length: " + str(len(emotionQuery))
    #print "Number of emotions: " + str(len(emotionQuery))
    #emotionDataTimes = {}
    #for emotion in emotionQuery:
    #  if emotion.timeStamp in emotionDataTimes:
    #    emotionDataTimes[emotion.timeStamp] = emotionDataTimes[emotion.timeStamp] + 1 
    #  else:
    #    emotionDataTimes[emotion.timeStamp] = 1
    emotionTimeData = []
    emotionTimeQuery = db.session.query(models.Emotion.timeStamp).filter_by(userKey=userKey, sessionID = sessionID).group_by(models.Emotion.timeStamp).order_by(models.Emotion.timeStamp)
    for time in emotionTimeQuery:
      tmpTime = time[0] - datetime(1970, 01, 01, 01)
      emotionTimeData.append(int(tmpTime.total_seconds() * 1000))
    #print "Number of times: " + str(len(emotionTimeData))
    
    
    # Start with getting the time for every location.
    # every emotion data needs to have intensity, emotionType, npcID, x, y
    # so we need to create dictionary with every agent and their location at each location time.
    # if empty we don't care.
    # then for every instance that is NON-empty we need to search the corresponding emotional state.
    locationTimeQuery = db.session.query(models.NPCLocation.timeStamp).filter_by(userKey=userKey, sessionID = sessionID).group_by(models.NPCLocation.timeStamp).order_by(models.NPCLocation.timeStamp)
    npcLocations = {}
    for npc in npcQuery:
      npcLocations[npc.npcID] = {}
      for locationTime in locationTimeQuery:
        npcLocations[npc.npcID][locationTime[0]] = []
    locationQuery = models.NPCLocation.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    #print "Location query length: " + str(len(locationQuery))
    for location in locationQuery:
      locationStringSplit = location.location.split(";")
      x = locationStringSplit[0][2:]
      y = locationStringSplit[2][2:]
      npcLocations[location.npcID][location.timeStamp] = [x, y]
    
    
    # Now we need the same for npc emotions.
    npcEmotions = {}
    for npc in npcQuery:
      npcEmotions[npc.npcID] = {}
      for time in emotionTimeData:
        npcEmotions[npc.npcID][time] = []
    for emotion in emotionQuery:
      tmpTime = emotion.timeStamp - datetime(1970, 01, 01, 01)
      tmpTime = int(tmpTime.total_seconds() * 1000)
      npcEmotions[emotion.npcID][tmpTime].append(emotion)
    returnEmotionData = []
    lastIndex = 0
    for locationTime in locationTimeQuery:
      for npc in npcQuery:
        # Check if this agent has location data for this time!
        if len(npcLocations[npc.npcID][locationTime[0]]) is not 0:
          tmpTime = locationTime[0] - datetime(1970, 01, 01, 01)
          tmpTime = int(tmpTime.total_seconds() * 1000)
          lastIndex = getIndex(emotionTimeData, tmpTime, lastIndex)
          for emotion in npcEmotions[npc.npcID][emotionTimeData[lastIndex]]:
            returnEmotionData.append({"emotionType" : emotion.typeID, "npc" : emotion.npcID, "intensity" : emotion.intensity, "x" : npcLocations[npc.npcID][locationTime[0]][0], "y": npcLocations[npc.npcID][locationTime[0]][1] })
    #print "Length of emotion data: " + str(len(returnEmotionData))
    returnData['emotionData'] = returnEmotionData   
    end = timer()
    print "Time elapsed: " + str((end - start))   
    
    # We need to get the events for the event overlay.
    
    eventTypeQuery = models.EventType.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    eventTypes = []
    eventTypeDict = {}
    for eventType in eventTypeQuery:
      eventTypeDict[eventType.typeID] = eventType.name
      eventTypes.append({"name" : eventType.name, "id" : eventType.typeID})
    returnData['eventTypes'] = eventTypes
    
    eventQuery = models.Event.query.filter_by(userKey=userKey, sessionID = sessionID).all()
    events = []
    for event in eventQuery:
      locationStringSplit = event.location.split(";")
      x = locationStringSplit[0][2:]
      y = locationStringSplit[2][2:]
      events.append({"name" : eventTypeDict[event.typeID], "x": x, "y" : y, "type" : event.typeID, "id" : event.eventID})
    returnData['events'] = events
    # #Build emotion  type filter data
    # emotionTypeFilterData = []
    # emotionTypeQuery = models.EmotionType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    # for emotionType in emotionTypeQuery:
      # emotionTypeEmotionData = []
      # emotionQuery = db.session.query(models.Emotion, models.NPCLocation)\
          # .filter(models.Emotion.typeID == emotionType.typeID, models.NPCLocation.npcID == models.Emotion.npcID, models.NPCLocation.timeStamp == models.Emotion.timeStamp, models.Emotion.sessionID == models.NPCLocation.sessionID, models.Emotion.userKey == models.NPCLocation.userKey)\
          # .filter_by(userKey=userKey, sessionID = sessionID).all()
      # for entry in emotionQuery:
        # locationStringSplit = entry.NPCLocation.location.split(";")
        # x = locationStringSplit[0][2:]
        # y = locationStringSplit[2][2:]
        # emotionTypeEmotionData.append({'npcID' : entry.Emotion.npcID, 'x' : x, 'y' : y, 'timeStamp' : entry.Emotion.timeStamp, 'intensity' : entry.Emotion.intensity, 'typeID' : entry.Emotion.typeID })  
      # if len(emotionTypeEmotionData) > 0:
        # emotionTypeFilterData.append({'id' : emotionType.typeID, 'name' : emotionType.name, 'data' : emotionTypeEmotionData})
    # returnData['emotionFilter'] = emotionTypeFilterData
    # #Build npc filter data
    # npcFilterData = []
    # npcIds = models.NPC.query.filter_by(userKey = userKey, sessionID = sessionID).all();
    # for npc in npcIds:
      # npcEmotionData = []
      # emotionQuery = db.session.query(models.Emotion, models.NPCLocation)\
          # .filter(models.Emotion.npcID == npc.npcID, models.NPCLocation.npcID == models.Emotion.npcID, models.NPCLocation.timeStamp == models.Emotion.timeStamp, models.Emotion.sessionID == models.NPCLocation.sessionID, models.Emotion.userKey == models.NPCLocation.userKey)\
          # .filter_by(userKey=userKey, sessionID = sessionID).all()
      # for entry in emotionQuery:
        # locationStringSplit = entry.NPCLocation.location.split(";")
        # x = locationStringSplit[0][2:]
        # y = locationStringSplit[2][2:]
        # npcEmotionData.append({'npcID' : entry.Emotion.npcID, 'x' : x, 'y' : y, 'timeStamp' : entry.Emotion.timeStamp, 'intensity' : entry.Emotion.intensity, 'typeID' : entry.Emotion.typeID })  
      # if len(npcEmotionData) > 0:
        # npcFilterData.append({'id' : npc.npcID, 'name' : npc.name, 'data' : npcEmotionData})
    # returnData['npcFilter'] = npcFilterData
    # #Build npc type filter data
    # npcTypeFilterData = []
    # npcTypeIds = models.NPCType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    # for npcType in npcTypeIds:
      # npcIds = db.session.query(models.NPC.npcID).filter(models.NPC.typeID == npcType.typeID).filter_by(userKey=userKey, sessionID = sessionID).all()
      # npcIds = [id for (id, ) in npcIds]
      # npcTypeEmotionData = []
      # emotionQuery = db.session.query(models.Emotion, models.NPCLocation)\
          # .filter(models.Emotion.npcID.in_(npcIds), models.NPCLocation.npcID == models.Emotion.npcID, models.NPCLocation.timeStamp == models.Emotion.timeStamp, models.Emotion.sessionID == models.NPCLocation.sessionID, models.Emotion.userKey == models.NPCLocation.userKey)\
          # .filter_by(userKey=userKey, sessionID = sessionID).all()
      # for entry in emotionQuery:
        # locationStringSplit = entry.NPCLocation.location.split(";")
        # x = locationStringSplit[0][2:]
        # y = locationStringSplit[2][2:]
        # npcTypeEmotionData.append({'npcID' : entry.Emotion.npcID, 'x' : x, 'y' : y, 'timeStamp' : entry.Emotion.timeStamp, 'intensity' : entry.Emotion.intensity, 'typeID' : entry.Emotion.typeID })  
      # if len(npcTypeEmotionData) > 0:
        # npcTypeFilterData.append({'id' : npcType.typeID, 'name' : npcType.name, 'data' : npcTypeEmotionData})
    # returnData['npcTypeFilter'] = npcTypeFilterData
    
    
    
    return returnData

  def getPluginTemplate(self, data, warnings):
    template = []
    return template

def getIndex(array, target, startIndex):
  # The idea is that array is sorted array.
  # We want to find the index of the number where array[i] <= target < array[i+1]
  # We start iterating from startIndex
  for x in range(startIndex, len(array) - 1):
    if array[x] <= target and target < array[x + 1]:
      return x
  if array[len(array) - 1] < target:
    return len(array) - 1
  return -1