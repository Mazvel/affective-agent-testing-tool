from app import db
from datetime import datetime

 
class SimulationSession(db.Model):
  __tablename__ = 'SimulationSession'
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID'),
  )
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer)
  date = db.Column(db.DateTime)
  label = db.Column(db.String(64), default='Unnamed simulation')
  
  def __repr__(self):
    return '<%r>' % (self.label)

class IncludedData(db.Model):
  __tablename__ = 'IncludedData'
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'plugin'),
  )
  
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer)
  plugin = db.Column(db.String(64))
  data = db.Column(db.Boolean)
    
class User(db.Model):
  __tablename__ = 'User'
  id = db.Column(db.Integer, primary_key=True)
  userKey = db.Column(db.Integer, unique = True)
  username = db.Column(db.String(64), unique = True)
  password = db.Column(db.String(64))
  def is_authenticated(self):
    return True
  def is_active(self):
    return True
  
  def is_anonymous(self):
    return False
    
  def get_id(self):
    try:
      return unicode(self.id)  # python 2
    except NameError:
      return str(self.id)  # python 3
      
  def __repr__(self):
    return '<User %r>' % (self.username)
 
class NPCType(db.Model):
  __tablename__ = 'NPCType'
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'typeID'),
  )
  
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer)
  typeID = db.Column(db.Integer)
  name = db.Column(db.String(64))
  info = db.Column(db.String(2048))
  
  def __repr__(self):
    return '<%r>' % (self.name)
 
class NPC(db.Model):
  __tablename__ = 'NPC'
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'npcID'),
  )
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer, db.ForeignKey('SimulationSession.sessionID'))
  npcID = db.Column(db.Integer)
  typeID = db.Column(db.Integer, db.ForeignKey('NPCType.typeID'))
  name = db.Column(db.String(64))
  info = db.Column(db.String(2048))
  
  def __repr__(self):
    return '<%r>' % (self.name)
    
#

class NPCLocation(db.Model):
  __tablename__ = 'NPCLocation'
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'npcID', 'timeStamp'),
  )
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer, db.ForeignKey('SimulationSession.sessionID'))
  npcID = db.Column(db.Integer, db.ForeignKey('NPC.npcID'))
  location = db.Column(db.String(64))
  timeStamp = db.Column(db.DateTime, nullable=True)
  
  def __repr__(self):
    return '<SimulationSession: %r, npcID: %r,location: %r>' % (self.sessionID, self.npcID, self.location)

 
class EmotionType(db.Model):
  __tablename__ = "EmotionType"
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'typeID'),
  )  
  
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer, db.ForeignKey('SimulationSession.sessionID'))
  typeID = db.Column(db.Integer)
  name = db.Column(db.String(64))
  info = db.Column(db.String(2048))
  
 
#Need to create Emotion table. (userkey, session, emotionId, intensity, timestamp)
class Emotion(db.Model):
  __tablename__ = "Emotion"
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'typeID', 'npcID', 'timeStamp'),
  )  
  
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer, db.ForeignKey('SimulationSession.sessionID'))
  npcID = db.Column(db.Integer, db.ForeignKey('NPC.npcID'))
  typeID = db.Column(db.Integer, db.ForeignKey('EmotionType.typeID'))
  intensity = db.Column(db.Float)
  timeStamp = db.Column(db.DateTime, nullable=True)

class EventType(db.Model):
  __tablename__ = "EventType"
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'typeID'),
  )
   
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer, db.ForeignKey('SimulationSession.sessionID'))
  typeID = db.Column(db.Integer)
  name = db.Column(db.String(64))
  info = db.Column(db.String(2048))  

class Event(db.Model):
  __tablename__ = "Event"
  __table_args__ = (
    db.PrimaryKeyConstraint('eventID'),
  ) 
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer, db.ForeignKey('SimulationSession.sessionID'))
  npcID = db.Column(db.Integer, db.ForeignKey('NPC.npcID'))
  typeID = db.Column (db.Integer, db.ForeignKey('EventType.typeID'))
  eventID = db.Column(db.Integer, primary_key=True, autoincrement=True)
  timeStamp = db.Column(db.DateTime, nullable=True)
  location = db.Column(db.String(64))
  
class PAD(db.Model):
  __tablename__ = 'PAD'
  __table_args__ = (
    db.PrimaryKeyConstraint('userKey', 'sessionID', 'npcID', 'timeStamp'),
  )
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  sessionID = db.Column(db.Integer, db.ForeignKey('SimulationSession.sessionID'))
  npcID = db.Column(db.Integer, db.ForeignKey('NPC.npcID'))
  pad = db.Column(db.String(64))
  timeStamp = db.Column(db.DateTime, nullable=True)
  
 
class BackgroundImage(db.Model):
  __tablename__ = 'BackgroundImage'
  __table_args__ = (
    db.PrimaryKeyConstraint('mapID'),
  )
  mapID = db.Column(db.Integer, primary_key=True, autoincrement=True)
  userKey = db.Column(db.Integer, db.ForeignKey('User.userKey'))
  fileName = db.Column(db.String(32))
  label = db.Column(db.String(64))
  width = db.Column(db.Integer)
  height = db.Column(db.Integer)
  timeStamp = db.Column(db.DateTime)