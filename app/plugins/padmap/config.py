from app import models

name ="PAD Map"
data = {}
data[models.NPCLocation] = [(models.NPCLocation.location, 'required'), 
  (models.NPCLocation.timeStamp, 'optional'),
  (models.NPCLocation.npcID, 'filter')]
data[models.PAD] = [(models.PAD.pad, 'required'),
  (models.PAD.timeStamp, 'optional'),
  (models.PAD.npcID, 'filter')]

def getRequiredData():
  return data
  
def getName():
  return name