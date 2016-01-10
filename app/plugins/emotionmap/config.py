from app import models

name = "Emotion Map"
data = {}
data[models.NPCLocation] = [(models.NPCLocation.location, 'required'), 
  (models.NPCLocation.timeStamp, 'optional'),
  (models.NPCLocation.npcID, 'filter')]
data[models.Emotion] = [(models.Emotion.intensity, 'required')]
  
data[models.EmotionType] = [(models.EmotionType.typeID, 'required')]

def getRequiredData():
  return data
  
def getName():
  return name