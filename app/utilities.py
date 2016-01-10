from app import models, db
from config import ALLOWED_EXTENSIONS
import uuid

def deleteSimulationSession(sessionID, userKey):
  # Now we must delete all data for this simulation session and userKey.
  print "Deleting data for session: " + str(sessionID)
  models.PAD.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.NPCLocation.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.Emotion.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.EmotionType.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.NPC.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.NPCType.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.Event.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.EventType.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  models.SimulationSession.query.filter_by(userKey = userKey, sessionID = sessionID).delete()
  print "Delete finished for session " + str(sessionID)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS
           
def getImageFileName():
  filename = str(uuid.uuid4())
  print "Randomly generated filename: " + filename
  return filename
    