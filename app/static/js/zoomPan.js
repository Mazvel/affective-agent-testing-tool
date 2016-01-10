/*****************************************************************************************
* zoomPan javascript plugin
* Author: Magnús Snorri Bjarnason (Github: Mazvel)
* zoomPan is released under the MIT license
* requires jquery to be imported aswell
*****************************************************************************************/
Mazvel = function(){
	//simply create the namespace
};

/**
* This is the constructor.
*
* @class Mazvel.ZoomPan
* @constructor
* @param {DOMElement}} container The DOM element that will hold the canvas.
* @param {int} maxWidth The maximum width the container can have.
* @param {int} maxHeight The maximum height the container can have.
* @param {Mazvel.ZoomPan.Image} background The background image that will always be drawn first
*                               when the drawCanvas method is called. 
*/
Mazvel.ZoomPan = function (container, maxWidth, maxHeight, background) {
  this.zoomPanCtx = this;
  this.background = background;
  this.backgroundWidth = background.image.width;
  this.backgroundHeight = background.image.height;
  this.canvas;
  this.ctx;
  this.objects = new Mazvel.ZoomPan.DrawList(this);
  this.width = 0;
  this.height = 0;
  this.minimumScale = 1;
  this.maximumScale = 1;
  this.currentScale = 1;
  this.maxZoom = 4; // We are able to zoom 4x the minimum zoom.
  this.scaleFactor = 2; // Somehow this only works when set to 2. When bug is fixed this should be added to constructor.
  this.mouseMoveSpeed = 2;
  this.mouseDown = false;
  this.xLeft = 0;
  this.yTop = 0;
  this.mouseX;
  this.mouseY;
  this.xMouseCanvasOffest;
  this.yMouseCanvasOffset;
  this.initializeScale(background, maxWidth, maxHeight);
  this.initializeCanvas(container, this.width, this.height, this.minimumScale);
  this.addEventHandlers();
  this.drawCanvas();
};

/**
* A facilitator method that calculates canvas dimensions
*
* @method Mazvel.ZoomPan.initializeScale
* @param {Image} image The background image of the canvas
* @param {Int} maxWidth The maximum width the canvas is allowed to have
* @param {Int} maxHeight The maximum height the canvas is allowed to have
* This function sets the dimensions of the canvas and sets the initial scale.
*/
Mazvel.ZoomPan.prototype.initializeScale = function(image, maxWidth, maxHeight){
  var imageWidth = image.image.width;
  var imageHeight = image.image.height;
  // First check if the image dimensions are smaller than the container dimensions
  if (imageWidth <= maxWidth && imageHeight <= maxHeight) {
    this.width = imageWidth;
    this.height = imageHeight;
    this.minimumScale = 1;
  } else {
    // Now we know the image is too large to fit within the constraints. We must find the
    // limiting dimension.
    var containerAspectRatio = maxWidth/maxHeight;
    var imageAspectRatio = imageWidth/imageHeight;
    if (containerAspectRatio >= imageAspectRatio) {
      // Now we know that the height of the image is the limiting factor.
      this.height = maxHeight;
      this.width = imageWidth * (maxHeight / imageHeight);
      this.minimumScale = maxHeight / imageHeight;
    } else {
      // Now the width of the image is the limiting factor.
      this.width = maxWidth;
      this.height = imageHeight * (maxWidth / imageWidth);
      this.minimumScale = maxWidth / imageWidth;
    }
  }
  this.maximumScale = this.minimumScale * this.maxZoom;
  //console.log("Canvas width: " + this.width + ", canvas height: " + this.height + ". MinimumScale: " + this.minimumScale);
  
};

/**
* A facilitator method that creates the canvas element in the DOM 
* 
*
* @method Mazvel.ZoomPan.initializeScale
* @param {DOMElement} container The container that will be holding the canvas
* @param {Int} canvasWidth The width of the canvas
* @param {Int} canvasHeight The height of the canvas
* @param {Float} minimumScale The initial scale applied to the the canvas context
* This function creates a canvas element as a child of container with the dimensions
* of canvasWidth and canvasHeight and initializes its scale.
*/
Mazvel.ZoomPan.prototype.initializeCanvas = function(container, canvasWidth, canvasHeight, minimumScale) {
  var canvas = document.createElement('canvas');
  canvas.id     = "ZoomPanCanvas";
  canvas.width  = canvasWidth - 2;
  canvas.height = canvasHeight - 2;
  canvas.style.zIndex   = 8;
  canvas.style.position = "relative";
  canvas.style.border   = "1px solid";
  container.appendChild(canvas)
  this.canvas = canvas;
  this.ctx = this.canvas.getContext("2d");
  this.currentScale = minimumScale;
};

/**
* A method that draws the list of drawable objects onto the canvas based on current scale and x-,y-offest. 
*/
Mazvel.ZoomPan.prototype.drawCanvas = function(){
  this.ctx.clearRect(0, 0, this.width, this.height);
  this.ctx.save();
  this.ctx.scale(1,1);
  this.ctx.translate(this.xLeft,this.yTop);
  this.ctx.scale(this.currentScale,this.currentScale);
  // Start with drawing the background
  this.background.draw(this.ctx);
  // Now we draw every other object
  this.objects.drawObjects(this.ctx);
  this.ctx.restore();
  
}

Mazvel.ZoomPan.prototype.zoomInCanvas = function(useOffset){
  if (useOffset == true){
    var scaleMultiplier = this.checkScaleBounds(true)
    this.xLeft *= scaleMultiplier;
    this.yTop *= scaleMultiplier;
        
    var newWidth = this.width/scaleMultiplier;
    var newHeight = this.height/scaleMultiplier;
    var newXOff = this.xMouseCanvasOffset/scaleMultiplier;
    var newYOff = this.yMouseCanvasOffset/scaleMultiplier;
    var xDiff = newWidth - newXOff;
    var yDiff = newHeight - newYOff;
    var xPreviousDiff = this.width - this.xMouseCanvasOffset;
    var yPreviousDiff = this.height - this.yMouseCanvasOffset;
    var newXStart = this.width - ((xPreviousDiff - xDiff) + newWidth);
    var newYStart = this.height - ((yPreviousDiff - yDiff) + newHeight);
    //alert("xLeft: " + xLeft + ", yTop: " + yTop + ", newXStart: " + newXStart + ", newYStart: " + newYStart); 
    //console.log("Before.xLeft: " + xLeft + ", yTop: " + yTop);
    this.checkTranslateBounds(this.xLeft, this.yTop, -newXStart * scaleMultiplier, -newYStart * scaleMultiplier)
    this.drawCanvas();
    //console.log("After.xLeft: " + xLeft + ", yTop: " + yTop);
  } else {
    // TODO make canvas zoom-in to the center.
    this.xMouseCanvasOffset = this.width / 2;
    this.yMouseCanvasOffset = this.height / 2;
    this.zoomInCanvas(true);
  }
    
};
Mazvel.ZoomPan.prototype.zoomOutCanvas = function(useOffset){
  if (useOffset == true){
    var scaleMultiplier = this.checkScaleBounds(false);
    this.xLeft /= scaleMultiplier;
    this.yTop /= scaleMultiplier; 
    // TODO This somehow only works if the scaleFactor is 2. Not if I set it to anything between 1 and 2. No idea why.
    this.checkTranslateBounds(this.xLeft, this.yTop, this.xMouseCanvasOffset / scaleMultiplier, this.yMouseCanvasOffset / scaleMultiplier)
    this.drawCanvas();
    // When zooming out it is possible that we went out of boundaries. So we do one more call in checkTranslateBounds and 
    // drawCanvas to fix that potential issue.
    this.checkTranslateBounds(this.xLeft,this.yTop,-1,-1);
    this.drawCanvas();
  } else {
    this.xMouseCanvasOffset = this.width / 2;
    this.yMouseCanvasOffset = this.height / 2;
    this.zoomOutCanvas(true);
  } 
};

Mazvel.ZoomPan.prototype.checkTranslateBounds = function(currentX, currentY, xAddition, yAddition){
  var xPixelDensity = (this.backgroundWidth/this.canvas.width) * (this.minimumScale/this.currentScale);
  var yPixelDensity = (this.backgroundHeight/this.canvas.height) * (this.minimumScale/this.currentScale);
  if (xAddition < 0){
    // We are moving to the left.
    if ((Math.abs(currentX + xAddition) + this.canvas.width) * xPixelDensity > this.backgroundWidth && currentX + xAddition < 0){
      //alert("Current: " + currentX + ", addition: " + xAddition + ", pixelDensity: " + xPixelDensity + ", scale: " + currentScale);
      this.xLeft = -(this.backgroundWidth - this.canvas.width * xPixelDensity)/xPixelDensity;
    }
    else {
      this.xLeft += xAddition;
    }
  } else {
    // We are moving to the right.
    if (currentX + xAddition > 0){
      this.xLeft = 0;
    } else {
      this.xLeft += xAddition;
    }
  }
  if (yAddition < 0) {
    // We are moving up.
    if ((Math.abs(currentY + yAddition) + this.canvas.height) * yPixelDensity > this.backgroundHeight && currentY + yAddition < 0){
      this.yTop = -(this.backgroundHeight - this.canvas.height * yPixelDensity)/yPixelDensity;
    } else {
      this.yTop += yAddition;
    }
  }else {
    // We are moving down.
    if (currentY + yAddition > 0) {
        this.yTop = 0;
    } else {
      this.yTop += yAddition;
    }
  }
  // Now let's check if the currentX and currentY are the same as xLeft and yTop.
  if (currentX == this.xLeft && currentY == this.yTop){
    return false;
  } else {
    return true;
  }
};

Mazvel.ZoomPan.prototype.checkScaleBounds = function(increasing){
  if (increasing) {
    var newScale = this.currentScale * this.scaleFactor;
    if (newScale > this.maximumScale){
      newScale = this.maximumScale;
    }
    var scaleMultiplier = newScale / this.currentScale;
    
  } else {
    newScale = this.currentScale / this.scaleFactor;
    if (newScale <= this.minimumScale){
      newScale = this.minimumScale;
      this.xLeft = 0;
      this.yTop = 0;
    }
    scaleMultiplier = this.currentScale / newScale;
  }
  this.currentScale = newScale;
  return scaleMultiplier;
};

/*************************************************************************************** 
  * The following functions handle mouse and keyboard input.  
  ****************************************************************************************/
Mazvel.ZoomPan.prototype.addEventHandlers = function() {
    var zoomPanCtx = this;
    $("#ZoomPanCanvas").mousedown(function(event){
      zoomPanCtx.mouseX = event.pageX;
      zoomPanCtx.mouseY = event.pageY;
      zoomPanCtx.mouseDown = true;
      
    });
    $(document).mouseup(function() {
      zoomPanCtx.mouseDown = false;
    });
    $("#ZoomPanCanvas").mousemove(function(event) {
      event.preventDefault();
      if (zoomPanCtx.mouseDown == true) {        
          //console.log("x:" + event.pageX + ",y:" + event.pageY);
          var xDiff = zoomPanCtx.mouseX - event.pageX;
          var yDiff = zoomPanCtx.mouseY - event.pageY;
          //console.log("xDiff: " + xDiff + ", yDiff: " + yDiff);
          //console.log("xDiff: " + xDiff);
          if (zoomPanCtx.checkTranslateBounds(zoomPanCtx.xLeft, zoomPanCtx.yTop, -xDiff * zoomPanCtx.mouseMoveSpeed, -yDiff * zoomPanCtx.mouseMoveSpeed)){  
            zoomPanCtx.drawCanvas();
          }
          zoomPanCtx.mouseX = event.pageX;
          zoomPanCtx.mouseY = event.pageY;
      } 
      zoomPanCtx.xMouseCanvasOffset = event.pageX - $(this).offset().left;
      zoomPanCtx.yMouseCanvasOffset = event.pageY - $(this).offset().top;
      //console.log("x:" + xMouseCanvasOffset + ",y:" + yMouseCanvasOffset);  
    });
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x
    $('#ZoomPanCanvas').bind(mousewheelevt, function(e){
      e.preventDefault();
      var evt = window.event || e //equalize event object     
      evt = evt.originalEvent ? evt.originalEvent : evt; //convert to originalEvent if possible               
      var delta = evt.detail ? evt.detail*(-40) : evt.wheelDelta //check for detail first, because it is used by Opera and FF
      
      if (delta > 0) {
        zoomPanCtx.zoomInCanvas(true);
      } else {
        zoomPanCtx.zoomOutCanvas(true);
      }
    });
}
/*****************************************************************************************/

/**
* This class is a data structure to store every object that should be drawn on the canvas.
* @class  Mazvel.ZoomPan.Drawable
* @constructor
*/
Mazvel.ZoomPan.DrawList = function(zoomPanInstance) {
  this.zoomPanInstance = zoomPanInstance;
  this.objectList = [];
}

Mazvel.ZoomPan.DrawList.prototype.add = function(object) {
  this.objectList.push(object);
  this.zoomPanInstance.drawCanvas();
}

Mazvel.ZoomPan.DrawList.prototype.remove = function(id) {
  for (var i = 0; i < this.objectList.length; i++) {
    if (this.objectList[i].id == id) {
      this.objectList.splice(i, 1);
    }
    this.zoomPanInstance.drawCanvas();
  }
}

Mazvel.ZoomPan.DrawList.prototype.drawObjects = function(context) {
  for (var i = 0; i < this.objectList.length; i++) {
    this.objectList[i].draw(context);
  }
}

/********************************************************************************************************
* The following classes are for different types of objects one might want to add to the list.
********************************************************************************************************/

/**
* This class is a parent class for every type of drawable object.
* @class  Mazvel.ZoomPan.Drawable
* @constructor
* @param {string} id The id used to identify this object.
* @param {int} relativeX The x offset used when drawing this object.
* @param {int} relativeY The y offset used when drawing this object.
* @param {float} relativeScale The relative scale used when drawing this object.
*/
Mazvel.ZoomPan.Drawable = function(id, relativeX, relativeY, relativeScale) {
  this.id = id;
  this.relativeX = relativeX;
  this.relativeY = relativeY;
  this.relativeScale = relativeScale;
  this.draw = function(context) {
  }
}

Mazvel.ZoomPan.Image = function(id, relativeX, relativeY, relativeScale, image){ 
  Mazvel.ZoomPan.Drawable.call(this, id, relativeX, relativeY, relativeScale);
	this.image = image;
  this.draw = function(context) {
    context.save();
    context.scale(1,1);
    context.translate(this.relativeX,this.relativeY);
    context.scale(this.relativeScale,this.relativeScale);
    context.drawImage(this.image, 0, 0);
    context.restore();
  } 
}

Mazvel.ZoomPan.Image.prototype = Object.create(Mazvel.ZoomPan.Drawable.prototype);
Mazvel.ZoomPan.Image.prototype.constructor=Mazvel.ZoomPan.Image;

Mazvel.ZoomPan.Rectangle = function(id, relativeX, relativeY, relativeScale, width, height, color, fill){ 
  Mazvel.ZoomPan.Drawable.call(this, id, relativeX, relativeY, relativeScale);
	this.width = width;
  this.height = height;
  this.color = color;
  this.fill = fill;
  this.draw = function(context) {
    context.save();
    context.scale(1,1);
    context.translate(this.relativeX,this.relativeY);
    context.scale(this.relativeScale,this.relativeScale);
    
    if (fill == true) {
      context.fillStyle= color;
      context.fillRect(0,0,this.width,this.height);
    } else {
      context.strokeStyle= color;
      context.rect(0,0,this.width,this.height);
    }
    context.stroke();
    context.restore();
  }
}  

Mazvel.ZoomPan.Rectangle.prototype = Object.create(Mazvel.ZoomPan.Drawable.prototype);
Mazvel.ZoomPan.Rectangle.prototype.constructor=Mazvel.ZoomPan.Image;