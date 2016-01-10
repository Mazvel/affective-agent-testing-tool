from app import models

name = "Overview"
data = {}
data[models.NPCLocation] = [(models.NPCLocation.location, 'optional')]
data[models.NPCType] = [(models.NPCType.typeID, 'optional')]
data[models.NPC] = [(models.NPC.npcID, 'optional')]
data[models.Emotion] = [(models.Emotion.typeID, 'optional')]
data[models.EmotionType] = [(models.EmotionType.typeID, 'optional')]
data[models.Event] = [(models.Event.eventID, 'optional')]
data[models.EventType] = [(models.EventType.typeID, 'optional')]
data[models.PAD] = [(models.PAD.pad, 'optional')]

def getRequiredData():
  return data
  
def getName():
  return name