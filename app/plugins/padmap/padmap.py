import abc
from app import app, models, db
from app.plugins.PluginBase import PluginBase

class OverviewImplementation(PluginBase): 

  def bundleData(self, data, sessionID, userKey):
    returnData = {}
    for key in data:
      if str(key.__tablename__) == 'PAD':
        #padQueryResults = key.query.filter_by(userKey=userKey, simulationSession = sessionID).all()
        padQueryResults = db.session.query(key, models.NPCLocation)\
          .filter(models.NPCLocation.npcID == models.PAD.npcID, models.NPCLocation.timeStamp == models.PAD.timeStamp, models.PAD.sessionID == models.NPCLocation.sessionID, models.PAD.userKey == models.NPCLocation.userKey)\
          .filter_by(userKey=userKey, sessionID = sessionID).all()
        print len(padQueryResults)
       # locationQueryResults = key.query.filter_by(userKey=userKey, simulationSession = sessionID).all()
        pad = []
        npcs = []
        npcDictionary = dict()
        for padEntry in padQueryResults:
          #print padEntry.NPCLocation
          if padEntry.NPCLocation.npcID not in npcDictionary:
            npcDictionary[padEntry.NPCLocation.npcID] = True
            npcs.append({'npcID' : padEntry.NPCLocation.npcID})
          locationStringSplit = padEntry.NPCLocation.location.split(";")
          x = locationStringSplit[0][2:]
          y = locationStringSplit[2][2:]
          padStringSplit = padEntry.PAD.pad.split(";")
          p = padStringSplit[0][2:]
          a = padStringSplit[1][2:]
          d = padStringSplit[2][2:]
          pad.append({'npcID' : padEntry.PAD.npcID, 'p' : p, 'a' : a, 'd' : d, 'timeStamp' : padEntry.PAD.timeStamp,  'x' : x, 'y' : y})
        returnData['npcs'] = npcs
        returnData['pad'] = pad
    return returnData

  def getPluginTemplate(self, data, warnings):
    template = []
    return template