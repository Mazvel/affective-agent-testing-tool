MazvelSelectedArea = function() {
  // simply create the namespace
}

MazvelSelectedArea.gameMap = function(container, maxWidth, maxHeight, args) {
  if (typeof args.background != "undefined"){
    this.background = args.background;
  } else {
    this.background = new Image();
  }
  if (typeof args.gameWidth != "undefined"){
    this.gameWidth = args.gameWidth;
  } else {
    this.gameWidth = maxWidth;
  }
  if (typeof args.gameHeight != "undefined"){
    this.gameHeight = args.gameHeight;
  } else {
    this.gameHeight = maxHeight;
  }
  
  
  // Start with creating empty function which will be used as an alternative if callbacks are not defined
  
  this.backgroundWidth = background.width;
  this.backgroundHeight = background.height;
  this.padding = 10;
  this.width;
  this.height;
  this.minimumScale;
  this.svgElement;
  this.gameMap;
  this.gameMapBackground;
  this.widthScale;
  this.heightScale;
  this.xAxis;
  this.yAxis;
  
  this.initializeSize(background, maxWidth - this.padding * 2, maxHeight - this.padding * 2);
  this.initializeTimeline(container, this.width, this.height, background);
};

MazvelSelectedArea.gameMap.prototype.initializeTimeline = function(container, width, height, background) {
  var self = this;
  
  self.widthScale = d3.scale.linear()
    .domain([0,self.gameWidth])
    .range([0, self.background.width]);
    
  self.heightScale = d3.scale.linear()
    .domain([0,self.gameHeight])
    .range([0, self.background.height]);
  
  self.xAxis = d3.svg.axis()
    .scale(self.widthScale)
    .orient("bottom"); 
    
  self.yAxis = d3.svg.axis()
    .scale(self.heightScale)
    .orient("left");
  
  self.zoom = d3.behavior.zoom()
    .x(self.widthScale)
    .y(self.heightScale)
    .scaleExtent([self.minimumScale, 12])
    

  self.zoom.scale(self.minimumScale);
  
  self.svgElement = d3.select(container).append("svg")
      .attr("class", "gameMap")
      .attr("width", width + self.padding * 2)
      .attr("height", height + self.padding * 2);
  
  self.gameMap = self.svgElement.append("g")
    .attr("transform", "translate(" + self.padding + "," + self.padding + ")")
    .call(self.zoom);
    
  self.gameMap.append("rect")
      .attr("class", "border")
      .attr("x", 1)
      .attr("y", 1)
      .attr("height", height - 2)
      .attr("width", width - 2);  
  

  self.gameMapBackground = self.gameMap.append("g")
    .attr("class", "gameBackground")
    .append("svg:image")
    .attr("xlink:href", self.background.src)
    .attr("width", self.background.width * self.zoom.scale())
    .attr("height", self.background.height * self.zoom.scale())
    .attr("x", self.widthScale(0))
    .attr("y",self.heightScale(0));
  

  // Now we must draw rects over all of the other places. As the image will otherwise bevisible where it shouldnt
  // when panning.
  
  
  
  self.svgElement.append("g")
    .attr("class", "")
    .append("rect")
    .attr("class", "paddingForeground")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", self.height + self.padding * 2)
    .attr("width", self.padding); 
    
  self.svgElement.append("g")
    .attr("class", "")
    .append("rect")
    .attr("class", "paddingForeground")
    .attr("x", self.padding)
    .attr("y", 0)
    .attr("height", self.padding)
    .attr("width", self.width);
    
    self.svgElement.append("g")
    .attr("class", "")
    .append("rect")
    .attr("class", "paddingForeground")
    .attr("x", self.padding)
    .attr("y", self.padding + self.height)
    .attr("height", self.padding)
    .attr("width", self.width);

  
  var lineData = [ { "x": 1,   "y": 1},  { "x": self.width + self.padding * 2 - 2,  "y": 1},
                  { "x": self.width + self.padding * 2 - 2,  "y": self.height + self.padding * 2 - 2},
                  { "x": 1,  "y": self.height + self.padding * 2 - 2}, {"x" : 1, "y" : 1}];
  
  var lineFunction = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("linear");
  
  //self.svgElement.append("path")
  //  .attr("class", "borderPath")
  //  .attr("d", lineFunction(lineData))
  //  .attr("stroke", "black")
  //  .attr("stroke-width", 1)
  //  .attr("fill", "none");
  
  
};

MazvelSelectedArea.gameMap.prototype.initializeSize = function(background, maxWidth, maxHeight){
  var self = this;
  // First check if the image dimensions are smaller than the container dimensions
  if (self.backgroundWidth <= maxWidth && self.backgroundHeight <= maxHeight) {
    self.width = imageWidth;
    self.height = imageHeight;
    self.minimumScale = 1;
  } else {
    // Now we know the image is too large to fit within the constraints. We must find the
    // limiting dimension.
    var containerAspectRatio = maxWidth/maxHeight;
    var imageAspectRatio = self.backgroundWidth/self.backgroundHeight;
    if (containerAspectRatio >= imageAspectRatio) {
      // Now we know that the height of the image is the limiting factor.
      self.height = maxHeight;
      self.width = self.backgroundWidth * (maxHeight / self.backgroundHeight);
      self.minimumScale = maxHeight / self.backgroundHeight;
    } else {
      // Now the width of the image is the limiting factor.
      self.width = maxWidth;
      self.height = self.backgroundHeight * (maxWidth / self.backgroundWidth);
      self.minimumScale = maxWidth / self.backgroundWidth;
    }
  }
  
};

MazvelSelectedArea.gameMap.prototype.addArea = function(xLeft, xRight, yTop, yBottom) {

  var self = this;
  var widthRatio = (xRight - xLeft)/self.gameWidth;
  var heightRatio = (yBottom - yTop)/self.gameHeight;
  var startX = self.widthScale(xLeft);
  var startY = self.heightScale(yTop);
  self.gameMap.append("g")
    .append("rect")
    .attr("class", "wholeArea")
    .attr("width", self.width)
    .attr("height", startY)
    .attr("x",0 )
    .attr("y",0)
  
  self.gameMap.append("g")
    .append("rect")
    .attr("transform", "translate(" + 0 + "," + self.heightScale(yTop - 2) + ")")
    .attr("class", "wholeArea")
    .attr("width", startX)
    .attr("height", self.height)
    .attr("x",0 )
    .attr("y",0)
   
  self.gameMap.append("g")
    .attr("transform", "translate(" + self.widthScale(xLeft - 2) + "," + self.heightScale(yBottom - 2) + ")")
    .append("rect")
    .attr("class", "wholeArea")
    .attr("width", self.width - startX)
    .attr("height", self.height - (startY + heightRatio * self.height))
    .attr("x",0 )
    .attr("y",0)
    
  self.gameMap.append("g")
    .attr("transform", "translate(" + self.widthScale(xRight - 2) + "," + self.heightScale(yTop - 2) + ")")
    .append("rect")
    .attr("class", "wholeArea")
    .attr("width", self.width - (startX + widthRatio * self.width))
    .attr("height", heightRatio * self.height)
    .attr("x",0 )
    .attr("y",0)
  
  self.gameMap.append("g")
    .append("rect")
    .attr("transform", "translate(" + self.widthScale(xLeft) + "," + self.heightScale(yTop) + ")")
    .attr("class", "selectedArea")
    .attr("width", self.width * widthRatio)
    .attr("height", self.height * heightRatio)
    .attr("x",0 )
    .attr("y",0)
    

}



MazvelSelectedArea.gameMap.prototype.zoomMap = function() {
  var self = this;
  self.zoom.scale(self.minimumScale);
  self.zoom.translate(self.initialTranslate);
};



MazvelSelectedArea.gameMap.prototype.getSelectedArea = function() {
  // This function returns a array containing [xLeft, xRight, yTop, yBottom]
  // This array represents the area that is visible in the map visualization.
  var self = this;
  var widthRatio = self.gameWidth / self.width;
  var heightRatio = self.gameHeight / self.height;
  var scaleRatio = self.zoom.scale() / self.minimumScale;
  var width = self.gameWidth / (self.zoom.scale() / self.minimumScale);
  var height = self.gameHeight / (self.zoom.scale() / self.minimumScale)
  var xLeft = -self.zoom.translate()[0] * widthRatio / scaleRatio; //-  width/2;
  var yTop = -self.zoom.translate()[1] * heightRatio / scaleRatio; //- height/2;
  if (Math.abs(xLeft) < 0.01) {
    //xLeft = 0;
  }
  if (Math.abs(yTop) < 0.01) {
    //yTop = 0;
  }
  returnArray = [Math.round(xLeft), Math.round(xLeft + width), Math.round(yTop), Math.round(yTop + height)];
  console.log(returnArray);
  return returnArray;
}
