from app import models

name = "Location Map"
data = {}
data[models.NPCLocation] = [(models.NPCLocation.location, 'required'), 
  (models.NPCLocation.timeStamp, 'optional'),
  (models.NPCLocation.npcID, 'filter')]

def getRequiredData():
  return data
  
def getName():
  return name