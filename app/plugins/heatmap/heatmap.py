import abc
from app import app, models, db
from app.plugins.PluginBase import PluginBase

class HeatmapImplementation(PluginBase):

  def bundleData(self, data, sessionID, userKey):
    # Let's create the npc type filter.
    npcFilterData = []
    # First we need to get the ids of all npcs.
    npcIds = models.NPC.query.filter_by(userKey = userKey, sessionID = sessionID).all();
    for npc in npcIds:
      npcLocationData = []
      # Let's fetch the location data for this NPC.
      npcLocationQuery = models.NPCLocation.query.filter(models.NPCLocation.npcID == npc.npcID).filter_by(userKey=userKey, sessionID = sessionID).all()
      for location in npcLocationQuery:
        locationStringSplit = location.location.split(";")
        x = locationStringSplit[0][2:]
        y = locationStringSplit[2][2:]
        npcLocationData.append({'npcID' : location.npcID, 'x' : x, 'y' : y, 'timeStamp' : location.timeStamp})
      npcFilterData.append({'id' : npc.npcID, 'name' : npc.name, 'data': npcLocationData})
    npcTypeFilterData = []
    npcTypeIds = models.NPCType.query.filter_by(userKey = userKey, sessionID = sessionID).all()
    for npcType in npcTypeIds:
      npcIds = db.session.query(models.NPC.npcID).filter(models.NPC.typeID == npcType.typeID).filter_by(userKey=userKey, sessionID = sessionID).all()
      npcIds = [id for (id, ) in npcIds]
      npcTypeLocationData = []
      npcLocationQuery = models.NPCLocation.query.filter(models.NPCLocation.npcID.in_(npcIds)).filter_by(userKey=userKey, sessionID = sessionID).all()
      for location in npcLocationQuery:
        locationStringSplit = location.location.split(";")
        x = locationStringSplit[0][2:]
        y = locationStringSplit[2][2:]
        npcTypeLocationData.append({'npcID' : location.npcID, 'x' : x, 'y' : y, 'timeStamp' : location.timeStamp})
      npcTypeFilterData.append({'id' : npcType.typeID, 'name' : npcType.name, 'data': npcTypeLocationData})
    returnData = {}
    returnData['npcFilter'] = npcFilterData
    returnData['npcTypeFilter'] = npcTypeFilterData
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
    
    return returnData
  
  def getPluginTemplate(self, data, warnings):  
    template = []
    return template
    