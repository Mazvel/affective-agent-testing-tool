import abc
from app import db, models

class PluginBase(object):
  __metaclass__ = abc.ABCMeta
  
  def getDataErrors(self, data, sessionID, userKey):
    """Check if the data required by this class, 
    as specified in the config file, is available."""
    errors = []
    for key in data:
      requiredColumns = []
      for column in data[key]:
        if column[1] == 'required':
            requiredColumns.append(column[0])
      if len(requiredColumns) == 0:
        return []
      length = len(key.query.filter_by(userKey = userKey, sessionID = sessionID).all())
      for column in requiredColumns:
        tmpLength = len(key.query.filter_by(userKey = userKey, sessionID = sessionID).filter(column != None).all())
        if tmpLength == 0: 
          errors.append("Required data missing error. Column data for " + str(column.name) + " in table " + str(key.__tablename__) + " is missing")
        elif tmpLength != length:
          errors.append("Required data inconsistent error. Column data row count for " + str(column.name) + " in table " + str(key.__tablename__) + " does not match table row count.")
    return errors
   
  def getDataWarnings(self, data, sessionID, userKey):
    """Get all warnings about missing optional/filtering data, 
    as specified in the config file."""
    warnings = []
    for key in data:
      requiredColumns = []
      for column in data[key]:
        if column[1] == 'optional':
            requiredColumns.append(column[0])
      if len(requiredColumns) == 0:
        return []
      length = len(key.query.filter_by(userKey = userKey, sessionID = sessionID).all())
      for column in requiredColumns:
        tmpLength = len(key.query.filter_by(userKey = userKey, sessionID = sessionID).filter(column != None).all())
        if tmpLength == 0:
          warnings.append("Optional data missing warning. Column data for " + str(column.name) + " in table " + str(key.__tablename__) + " is missing")
        elif tmpLength != length:
          warnings.append("Optional data inconsistent warning. Column data row count for " + str(column.name) + " in table " + str(key.__tablename__) + " does not match table row count.")
    return warnings
  
  @abc.abstractmethod
  def bundleData(self, data, sessionID, userKey):
    """Bundle the appropriate file into a dictionary
       to be read by the template."""
    return
  
  @abc.abstractmethod
  def getPluginTemplate(self, data, warnings):
    """Bundle the appropriate file into a dictionary
       to be read by the template."""
    return