Padmap = function (radius, canvas, width, height, alphaCenterValue, edgeAlpha, minAlpha, arousalRadius, numberOfAgents) {
  this.radius = radius;
	this.canvas = canvas;
  this.width = width;
  this.height = height;
  this.alphaCenterValue = alphaCenterValue;
  this.centerAlpha;
  this.edgeAlpha = edgeAlpha;
  this.minAlpha = minAlpha;
  this.arousalRadius = arousalRadius;
  this.numberOfAgents = numberOfAgents;
  this.ctx = canvas.getContext("2d"),
  this.ripple;
  this.texture;
  
  canvas.width = width;
  canvas.height = height;
  this.padMapColors;
  this.padMapArousal;
  this.activePixels;
  this.activePixelsKeys;
  this.activeArousalPixels;
};

Padmap.prototype.calculateCenterAlpha = function() {
  //this.centerAlpha = this.alphaCenterValue / (this.radius * 0.2 * this.numberOfAgents);
  //alert(this.centerAlpha);
  this.centerAlpha = 0.7;
}

Padmap.prototype.initializeDataStructure = function() {
  delete this.padMapColors;
  delete this.padMapArousal;
  delete this.activePixels;
  delete this.activePixelsKeys;
  delete this.activeArousalPixels;
  this.padMapColors = new Array(this.width);
  this.padMapArousal = new Array(this.width);
  for (var i = 0; i < this.width; i++) {
    this.padMapColors[i] = new Array(this.height);
    this.padMapArousal[i] = new Array(this.height);
    
  }
  this.activePixels = {};
  this.activePixelsKeys = [];
  this.activeArousalPixels = [];
}

Padmap.prototype.setData = function(dataPoints, numberOfNpcs) {
  this.numberOfAgents = numberOfNpcs;
  this.calculateCenterAlpha();
  this.initializeDataStructure();
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  for (var i = 0; i < dataPoints.length; i++) {
    this.updateNeighbourPixels(dataPoints[i], radius);
  }
  for (var key in this.activePixels) {
    if (this.activePixels.hasOwnProperty(key)) {
      var keySplit = key.split(",");
      this.activePixelsKeys.push([keySplit[0], keySplit[1]]);
    }
  }
  
  for (var i = 0; i < this.activePixelsKeys.length; i++) {
    var colorAlphaArousal = this.calculatePixelColor(this.padMapColors[this.activePixelsKeys[i][0]][this.activePixelsKeys[i][1]]);
    var arousalValue = colorAlphaArousal[2];
    if (arousalValue > 0) {
      if (this.addToArousalMap(this.activePixelsKeys[i][0], this.activePixelsKeys[i][1], this.arousalRadius, arousalValue)) {
        this.activeArousalPixels.push([this.activePixelsKeys[i][0], this.activePixelsKeys[i][1], arousalValue + 1, arousalValue + 1]);
        this.padMapArousal[this.activePixelsKeys[i][0]][this.activePixelsKeys[i][1]] = [arousalValue * colorAlphaArousal[1], arousalValue * colorAlphaArousal[1] + 1];
        this.deleteArousalNeighbours(this.activePixelsKeys[i][0], this.activePixelsKeys[i][1], this.arousalRadius, arousalValue, this.activeArousalPixels);
      }
    }
    var tmpColor = colorAlphaArousal[0];
    this.ctx.fillStyle = "rgba("+(tmpColor[0])+","+(tmpColor[1])+","+(tmpColor[2])+","+colorAlphaArousal[1]+")";
    this.ctx.fillRect( this.activePixelsKeys[i][0], this.activePixelsKeys[i][1], 1, 1 );
  }
  //Padmap.WaterRipple(this);
}

/**
* A method which returns true if arousal value at [x,y]
* should be added to the arousalMap.
*
* @method Padmap.validPixel
* @param {int} x The x co-ordinate
* @param {int} y The y co-ordinate
* @param {int} radius The radius we are checking within
* @param {float} value The arousal value to-be added
* @return {bool} true if value should be added at location
*         [x,y] in the arousal map. false otherwise.
*/

Padmap.prototype.updateNeighbourPixels = function(dataPoint, radius){
  var x = Math.round(dataPoint.x);
  var y = Math.round(dataPoint.y);
  // Calculate how this datapoint affects all pixels in radius from itself.
  for (var i = x - radius; i <= x + radius; i++) {
    for (var j = y - radius; j <= y + radius; j++) {
      if (this.validPixel(i, j, this.padMapColors)) {
        var distance = this.getEuclideanDistance([x,y], [i,j]);
        if (distance <= radius*2) {
          if (!([i,j] in this.activePixels)) {  
            this.activePixels[[i,j]] = true;
            this.padMapColors[i][j] = [];
          } 
          this.padMapColors[i][j].push(this.getColorAlphaArousal(dataPoint, distance));
        }
      }
    }
  }
}

// -------------------------------------------------------------------------------
// Colour related helper functions - only called by the padmap class
// -------------------------------------------------------------------------------

Padmap.prototype.getPixelColor = function(x, y) {
  var x = parseFloat(x);
  var y = parseFloat(y);
  var xNew;
  var yNew;
  var colors;
  // First we must find in which quadrant the XY values belong
  // and retrieve the corner colors of that quadrant.
  if (x < 0 && y < 0) {
    // Quadrant bottom-left corner
    //alert("Quadrant bottom-left");
    colors = [[128, 0, 128], [255,255,255], [0,0,255], [0,100,128]];
    xNew = x + 1.0;
    yNew = y + 1.0;
  }
  if (x < 0 && y >= 0) {
    // Quadrant top-left corner
    //alert("Quadrant top-left");
    colors = [[255, 0, 0], [255,128,0], [128,0,128], [255,255,255]];
    xNew = x + 1.0;
    yNew = y;
  }
  if (x >= 0 && y < 0) {
    // Quadrant bottom-right corner
    //alert("Quadrant bottom-right");
    colors = [[255, 255, 255], [128,228,0], [0,100,128], [0,200,0]];
    xNew = x;
    yNew = y + 1.0;
  }
  if (x >= 0 && y >= 0) {
    // Quadrant top-right corner
    //alert("Quadrant top-right");
    colors = [[255, 128, 0], [255,255,0], [255,255,255], [128,228,0]];
    xNew = x;
    yNew = y;
  }
  var returnColor = [0,0,0];
  var weights = [0,0,0,0];
  weights[0] = (1.0 - xNew) * yNew
  weights[1] = xNew * yNew
  weights[2] = (1.0 - xNew) * (1.0 - yNew)
  weights[3] = xNew * (1.0 - yNew)
  // Calculate the final colour based on the weights of each corner colour.
  for (var i = 0; i < 3; i++) {
    returnColor[i] = Math.round(weights[0] * colors[0][i] + weights[1] * colors[1][i] + weights[2] * colors[2][i] + weights[3] * colors[3][i])
    
  }
  return returnColor
}

Padmap.prototype.calculatePixelColor = function(colorValues) {
  // We have a list of tuples [alpha, rgb]. 
  // First we start with calculating the color where "alpha" is the weight.
  // Then we sum the alpha and if it is > 1 then we set it to 1.
  var totalAlpha = 0;
  var totalArousal = 0;
  var totalColor = [0,0,0];
  for (var i = 0; i < colorValues.length; i++) {
    if (colorValues[i][0] < 0) {
      colorValues[i][0] = minAlpha;
    }
    totalAlpha += colorValues[i][0];
    totalColor[0] += colorValues[i][1][0] * colorValues[i][0];
    totalColor[1] += colorValues[i][1][1] * colorValues[i][0];
    totalColor[2] += colorValues[i][1][2] * colorValues[i][0];
    totalArousal += colorValues[i][2] * colorValues[i][0];
  }
  var finalColor = [0, 0, 0];
  var finalArousal = 0;
  if (totalAlpha > 0) {
    finalColor = [Math.round(totalColor[0]/totalAlpha), Math.round(totalColor[1]/totalAlpha), Math.round(totalColor[2]/totalAlpha)];
    finalArousal = totalArousal / totalAlpha;
  }
  if (totalAlpha > 0.7) {
    totalAlpha = 0.7;
  }
  if (totalAlpha <= 0) {
    totalAlpha = 0;
  }
  return [finalColor, totalAlpha, finalArousal];
}

Padmap.prototype.getColorAlphaArousal = function(dataPoint, distance) {
  var intensityValue = Math.sqrt(Math.pow(dataPoint.p,2) + Math.pow(dataPoint.a,2) + Math.pow(dataPoint.d,2)) / 1.73;
  var alpha = this.centerAlpha - Math.pow(distance, 2) * (this.centerAlpha - this.edgeAlpha) / Math.pow(this.radius, 2);
  var color = this.getPixelColor(dataPoint.p, dataPoint.d)
  return [alpha * intensityValue, color, dataPoint.a];
}

// -------------------------------------------------------------------------------
// Arousal related helper functions - only called by the padmap class
// -------------------------------------------------------------------------------

Padmap.prototype.addToArousalMap = function (x,y, radius, value) {
  var x = Math.round(x);
  var y = Math.round(y);
  // We loop over all pixels in a cube around the [x,y].
  for (var i = x - radius; i <= x + radius; i++) {
    for (var j = y - radius; j <= y + radius; j++) {
      // We first check if this is a valid pixel coordinate
      if (this.validPixel(i, j, this.padMapArousal)) {
        // We are only interested in the neighbours, so we disregard the [x,y] pixel
        if (x != i || y != j) {
          // If the distance is too far we ignore the pixel
          if (this.getEuclideanDistance([x,y], [i,j]) < radius) {
            // If [i,j] is not in the map we ignore it.
            if (this.padMapArousal[i][j] != null) {
               if (this.padMapArousal[i][j][0] >=  value) {
                // If the arousal value at [i,j] is bigger or equal
                // than the value we want to add we do not add it.
                return false;
               }
            }
          }
        }
      }
    }
  }
  // We reached the end of the for loops without finding better arousal value.
  return true;
}

/**
* A method which deletes neighbouring pixels from the arousal map if their arousal
* value is lower than of the value at the origin we are checking from.
*
* @method Padmap.validPixel
* @param {int} x The x co-ordinate
* @param {int} y The y co-ordinate
* @param {int} radius The radius we are checking within
* @param {float} value The arousal value to-be added
* @param {array} arousalPixels array containing the current pixel coordinates
*         in the arousal map
* @return 
*/
Padmap.prototype.deleteArousalNeighbours = function(x,y, radius, value, arousalPixels) {
  var x = Math.round(x);
  var y = Math.round(y);
  // We loop over all pixels in a cube around the [x,y].
  for (var i = x - radius; i <= x + radius; i++) {
    for (var j = y - radius; j <= y + radius; j++) {
      // We first check if this is a valid pixel coordinate
      if (this.validPixel(i, j, this.padMapArousal)) {
        // We are only interested in the neighbours, so we disregard the [x,y] pixel
        if (x != i || y != j) {
          // If the distance is too far we ignore the pixel
          if (this.getEuclideanDistance([x,y], [i,j]) < radius) {
            if (this.padMapArousal[i][j] != null) {
               if (value > this.padMapArousal[i][j][0] ) {
                delete this.padMapArousal[i][j];
                this.deletePixelFromKeys(arousalPixels, [i,j]);
               }
            }
          }
        }
      }
    }
  }
}

Padmap.prototype.updateArousalNeighbours = function(x,y, radius) {
  var x = Math.round(x);
  var y = Math.round(y);
  // We loop over all pixels in a cube around the [x,y].
  for (var i = x - radius; i <= x + radius; i++) {
    for (var j = y - radius; j <= y + radius; j++) {
      // We first check if this is a valid pixel coordinate
      if (this.validPixel(i, j, this.padMapArousal)) {
        // We are only interested in the neighbours, so we disregard the [x,y] pixel
        if (x != i || y != j) {
          var distance = this.getEuclideanDistance([x,y], [i,j]);
          // If the distance is too far we ignore the pixel
          if (distance < radius) {
            if (this.padMapArousal[i][j] != null) {
               this.padMapArousal[i][j][1] = 0 + (this.padMapArousal[i][j][0] + 1) * Math.pow(( 1 + distance / distance ), 2) * 0.1;
            }
          }
        }
      }
    }
  }
}

// -------------------------------------------------------------------------------
// Water ripple functions - only called by the padmap class
// -------------------------------------------------------------------------------

/**
 * Water ripple effect.
 * Original code (Java) by Neil Wallis 
 * @link http://www.neilwallis.com/java/water.html
 * 
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */ 
/* Modified version to fit my needs */
  Padmap.WaterRipple = function(padMapInstance) {
    this.width = padMapInstance.width;
    this.height = padMapInstance.height;
    this.half_width = padMapInstance.width >> 1;
    this.half_height = padMapInstance.height >> 1;
    this.size = padMapInstance.width * (padMapInstance.height + 2) * 2;
    this.delay = 30;
    this.oldind = padMapInstance.width;
    this.newind = padMapInstance.width * (padMapInstance.height + 3);
    this.riprad = 5;
    this.ripplemap = [];
    this.last_map = [];
    this.line_width = 20;
    this.step = this.line_width * 2; 
    this.count = padMapInstance.height / this.line_width;
    this.ctx = padMapInstance.ctx;
    
    /*
     * Water ripple demo can work with any bitmap image
     * (see example here: http://media.chikuyonok.ru/ripple/)
     * But I need to draw simple artwork to bypass 1k limitation
     */
    
      this.texture = this.ctx.getImageData(0, 0, this.width, this.height);
      this.ripple = this.ctx.getImageData(0, 0, this.width, this.height);
      
      for (var i = 0; i < this.size; i++) {
          this.last_map[i] = this.ripplemap[i] = 0;
      }
      
      //setInterval(this.run.bind(this), this.delay);
    
    // generate random ripples
      //setInterval(this.updateDisturb.bind(this), 10);
      
    }
    
    /**
     * Main loop
     */
    Padmap.WaterRipple.prototype.run = function() {
        console.log("here...");
        this.newframe();
        this.ctx.putImageData(this.ripple, 0, 0);
    }
    
    Padmap.WaterRipple.prototype.updateDisturb = function() {
      console.log("here too...")
      for (var i = 0; i < padMapInstance.activeArousalPixels.length; i++) {
          if (padMapInstance.padMapArousal[padMapInstance.activeArousalPixels[i][0]][padMapInstance.activeArousalPixels[i][1]][1] > 2) {
            padMapInstance.padMapArousal[padMapInstance.activeArousalPixels[i][0]][padMapInstance.activeArousalPixels[i][1]][1] = 0;
            this.disturb(padMapInstance.activeArousalPixels[i][0], padMapInstance.activeArousalPixels[i][1]);
            padMapInstance.updateArousalNeighbours(padMapInstance.activeArousalPixels[i][0],padMapInstance.activeArousalPixels[i][1], 40);
          } else {
            padMapInstance.padMapArousal[padMapInstance.activeArousalPixels[i][0]][padMapInstance.activeArousalPixels[i][1]][1] += Math.pow(padMapInstance.activeArousalPixels[i][2], 2) * 0.002;
          }
        }
    }
    
    /**
     * Disturb water at specified point
     */
    Padmap.WaterRipple.prototype.disturb = function (dx, dy) {
        dx <<= 0;
        dy <<= 0;
        var riprad = Math.round((padMapInstance.padMapArousal[this.dx][this.dy][0] + 1) * 2);
        for (var j = this.dy - riprad; j < this.dy + riprad; j++) {
            for (var k = this.dx - riprad; k < this.dx + riprad; k++) {
                this.ripplemap[this.oldind + (j * this.width) + k] += 128;
            }
        }
    }
    
    /**
     * Generates new ripples
     */
    Padmap.WaterRipple.prototype.newframe = function () {
        var a, b, data, cur_pixel, new_pixel, old_data;
        
        var t = this.oldind; this.oldind = this.newind; this.newind = t;
        var i = 0;
        
        // create local copies of variables to decrease
        // scope lookup time in Firefox
        var _width = this.width,
            _height = this.height,
            _ripplemap = this.ripplemap,
            _last_map = this.last_map,
            _rd = this.ripple.data,
            _td = this.texture.data,
            _half_width = this.half_width,
            _half_height = this.half_height;
        
        for (var y = 0; y < _height; y++) {
            for (var x = 0; x < _width; x++) {
                var _newind = this.newind + i, _mapind = this.oldind + i;
                data = (
                    _ripplemap[_mapind - _width] + 
                    _ripplemap[_mapind + _width] + 
                    _ripplemap[_mapind - 1] + 
                    _ripplemap[_mapind + 1]) >> 1;
                    
                data -= _ripplemap[_newind];
                data -= data >> 5;
                
                _ripplemap[_newind] = data;

                //where data=0 then still, where data>0 then wave
                data = 1024 - data;
                
                old_data = _last_map[i];
                _last_map[i] = data;
                
                if (old_data != data) {
                    //offsets
                    a = (((x - _half_width) * data / 1024) << 0) + _half_width;
                    b = (((y - _half_height) * data / 1024) << 0) + _half_height;
    
                    //bounds check
                    if (a >= _width) a = _width - 1;
                    if (a < 0) a = 0;
                    if (b >= _height) b = _height - 1;
                    if (b < 0) b = 0;
    
                    new_pixel = (a + (b * _width)) * 4;
                    cur_pixel = i * 4;
                    
                    _rd[cur_pixel] = _td[new_pixel];
                    _rd[cur_pixel + 1] = _td[new_pixel + 1];
                    _rd[cur_pixel + 2] = _td[new_pixel + 2];
                }  
                ++i;
            }
        }
    }


// -------------------------------------------------------------------------------
// Helper functions - only called by the padmap class
// -------------------------------------------------------------------------------

/**
* A method which returns true if 2d index values are not
* out of bounds in a 2d array.
*
* @method Padmap.validPixel
* @param {int} x The x co-ordinate
* @param {int} y The y co-ordinate
* @param {2d array} array The 2d array to be checked
* @return {bool} value representing if (x,y) is out 
*         of bounds of array or not
*/

Padmap.prototype.validPixel = function(x, y, array) {
  if (x < 0 || y < 0) {
    return false;
  }
  if (x >= array.length) {
    return false;
  }
  if (y >= array[x].length) {
    return false;
  }
  return true;
}

/**
* Method which deletes single occurance of 2d coordinate fromCharCode
* from a array of 2d coordinates.
*
* @method Padmap.deletePixelFromKeys
* @param {array} keys Array of [x,y] coordinate objects
* @param {array} pixel Array containing single 2d coordinate
* @return 
*
*/
Padmap.prototype.deletePixelFromKeys = function(keys, pixel) {
  for (var i = 0; i < keys.length; i++) {
    if (keys[i][0] == pixel[0] && keys[i][1] == pixel[1]) {
      keys.splice(i, 1);
      return;
    }
  }
}

/**
* Method which calculates the manhattan distance between two 2d coordinates
*
* @method Padmap.getManhattanDistance
* @param {array} a Array containing single 2d coordinate
* @param {array} b Array containing single 2d coordinate
* @return {int} the distance between a and b
*
*/
Padmap.prototype.getManhattanDistance = function(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

/**
* Method which calculates the Euclidian distance between two 2d coordinates
*
* @method Padmap.getEuclideanDistance
* @param {array} a Array containing single 2d coordinate
* @param {array} b Array containing single 2d coordinate
* @return {int} the distance between a and b
*
*/
Padmap.prototype.getEuclideanDistance = function(a, b) {
  return Math.sqrt(Math.pow((a[0] - b[0]), 2) + Math.pow((a[1] - b[1]), 2));
}