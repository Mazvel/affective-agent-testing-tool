from app import models

name = "Simulation Replay"
data = {}
data = {}
data[models.EventType] = [(models.EventType.name, 'required'), 
  (models.EventType.typeID, 'required'),
  (models.EventType.info, 'optional')]
data[models.Event] = [(models.Event.eventID, 'required'), 
  (models.Event.timeStamp, 'required'),
  (models.Event.typeID, 'required'),
  (models.Event.npcID, 'filter')]

def getRequiredData():
  return data
  
def getName():
  return name