MazvelGameMap = function() {
  // simply create the namespace
}

MazvelGameMap.gameMap = function(container, maxWidth, maxHeight, args) {
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
  if (typeof args.agentSize != "undefined"){
    this.agentSize = args.agentSize;
  } else {
    this.agentSize = Math.round(maxWidth * 0.01) + 1;
  }
  if (typeof args.agentShape != "undefined"){
    this.agentShape = args.agentShape;
  } else {
    this.agentShape = "circle";
  }
  if (typeof args.showBorder != "undefined"){
    this.showBorder = args.showBorder;
  } else {
    this.showBorder = true;
  }
  if (typeof args.agentClickedCallback != "undefined"){
    this.agentClickedCallback = args.agentClickedCallback;
  }
  
  // Start with creating empty function which will be used as an alternative if callbacks are not defined
  this.noop = function(){};
  
  this.backgroundWidth = background.width;
  this.backgroundHeight = background.height;
  this.rightPanelWidth = 200;
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
  this.agents;
  this.agentTypes;
  this.colorPalette;
  this.agentTooltip;
  this.heatMap;
  this.heatMapElement;
  this.focusedEvent;
  this.focusedEventData;
  
  this.initializeSize(background, maxWidth - this.padding * 2 - this.rightPanelWidth, maxHeight - this.padding * 2);
  this.initializeTimeline(container, this.width, this.height, background);
};

MazvelGameMap.gameMap.prototype.initializeTimeline = function(container, width, height, background) {
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
    .on("zoom", function(){
      self.zoomMap()});

  self.zoom.scale(self.minimumScale);
  
  self.svgElement = d3.select(container).append("svg")
      .attr("class", "gameMap")
      .attr("width", width + self.padding * 2 + self.rightPanelWidth)
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
  
  console.log("Drawing heatMap image");
  
  self.heatMapElement = self.gameMap.append("g")
    .attr("class", "heatMap")
  
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

  self.svgElement.append("g")
    .attr("class", "")
    .append("rect")
    .attr("class", "paddingForeground")
    .attr("x", self.padding + self.width)
    .attr("y", 0)
    .attr("height", self.padding * 2 + self.height)
    .attr("width", self.padding + self.rightPanelWidth); 
  
  if (self.showBorder) {
  
    var lineData = [ { "x": 1,   "y": 1},  { "x": self.width + self.padding * 2 + self.rightPanelWidth - 2,  "y": 1},
                    { "x": self.width + self.padding * 2 + self.rightPanelWidth - 2,  "y": self.height + self.padding * 2 - 2},
                    { "x": 1,  "y": self.height + self.padding * 2 - 2}, {"x" : 1, "y" : 1}];
    
    var lineFunction = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .interpolate("linear");
    
    self.svgElement.append("path")
      .attr("class", "borderPath")
      .attr("d", lineFunction(lineData))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("fill", "none");
    
  }
  
  self.colorPalette=d3.scale.category10();
  
  /*self.gameMap.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + self.padding + "," + background.height + ")")
    .call(self.xAxis);
  
  self.gameMap.append("g")
    .attr("class", "y axis")
    .call(self.yAxis); */
};

MazvelGameMap.gameMap.prototype.initializeSize = function(background, maxWidth, maxHeight){
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

MazvelGameMap.gameMap.prototype.addAgentTypes = function(data, legendLabel, showSelected, selectedText) {
  var self = this;
  if (data.length > 10) {
    self.colorPalette=d3.scale.category20();
  }
  self.agentTypes = {};
  for (var i = 0; i < data.length; i++) {
    if (!(data[i].id in self.agentTypes)) {
      self.agentTypes[data[i].id] = {color: self.colorPalette(data[i].id), name: data[i].name};
    }
  }


  
  if (typeof showSelected != "undefined" && showSelected) {
    self.agentTypes["Selected"] = true; 
  }
    var legendBox = self.svgElement.append("g")
    .attr("transform", "translate(" + (self.padding * 2 + self.width) + "," + self.padding + ")")
    .attr("class", "legendBox")
  

  var legendBoxHeight = Object.keys(self.agentTypes).length * 20 + (Object.keys(self.agentTypes).length - 1) * 5 + 20;
  if (typeof legendLabel != "undefined") {
    legendBoxHeight += 30;
  }
  legendBox.append("rect")
    .attr("class", "legendBoxRect")
    .attr("x", 1)
    .attr("y", 1)
    .attr("height", legendBoxHeight - 2)
    .attr("width", self.rightPanelWidth - self.padding - 2); 
  
  var heightOffset = 20;
  
  if (typeof legendLabel != "undefined") {
    legendBox.append("g")
      .attr("transform", "translate(" + 10 + "," + heightOffset + ")")
      .append("text")
      .attr("x", 0)
      .attr("font-weight", "bold")
      .attr("dy", ".35em")
      .text(legendLabel);
    heightOffset += 30;
  }
  
  for (var key in self.agentTypes) {
    var tmpG = legendBox.append("g")
        .attr("transform", "translate(" + 15 + "," + heightOffset + ")");
    if (key != "Selected") {
      
        
      tmpG.append("circle")
        .attr("r", 10)
        .attr("fill", self.agentTypes[key].color)
        
      tmpG.append("text")
        .attr("x", 30)
        .attr("dy", ".35em")
        .text(self.agentTypes[key].name);
    } else {
      
        
      tmpG.append("circle")
        .attr("r", 10)
        .attr("stroke-width", 4 )
        .attr("stroke", "yellow")
        .attr("fill", "white");
        
      tmpG.append("text")
        .attr("x", 30)
        .attr("dy", ".35em")
        .text(selectedText);
    }
    heightOffset += 25;
    
  }
  
  // Let's initialize the agent info tooltip here...
  this.agentTooltip = self.svgElement.append("g")
    .attr("transform", "translate(" + (self.padding * 2 + self.width) + "," + (self.padding + legendBoxHeight + self.padding * 2) + ")")
    .attr("class", "agentTooltipBox")
    
}

MazvelGameMap.gameMap.prototype.updateFocusedEvent = function(data) {
  var self = this;
  self.focusedEventData = data;
  console.log("x: " + data.x + ", y: " + data.y);
  self.svgElement.selectAll(".focusedEventStyle").remove();
  self.svgElement.selectAll(".focusedEvent").remove();
  self.focusedEvent = self.gameMap.append("g")
    .attr("class", ".focusedEvent")
    .attr("transform", "translate(" + self.widthScale(data.x) + "," + self.heightScale(data.y) + ")")
    .append("rect")
    .attr("class", "focusedEventStyle")
    .attr("width", 30 * self.zoom.scale())
    .attr("height", 30 * self.zoom.scale())
    .attr("x", - 15 *self.zoom.scale() )
    .attr("y", - 15 * self.zoom.scale());
}

MazvelGameMap.gameMap.prototype.updateHeatMapImage = function(image) {
  var self = this;
  self.heatMap = image;
  self.svgElement.selectAll(".heatMapImage").remove();
  self.heatMapElement = self.svgElement.select("g.heatMap")
    .append("svg:image")
    .attr("class", "heatMapImage")
    .attr("xlink:href", image.src)
    .attr("width", image.width * self.zoom.scale())
    .attr("height", image.height * self.zoom.scale())
    .attr("x", self.widthScale(0))
    .attr("y",self.heightScale(0));
  //self.zoom.translate([self.zoom.translate()[0] - diff,0])
  //self.zoom.event(self.mainTimelineArea);
  
}

MazvelGameMap.gameMap.prototype.bindAgentLocationData = function(data) {
  var self = this;
  self.gameMap.selectAll("g.event").remove();
  // DATA JOIN
  self.agents = self.gameMap.selectAll("g.event")
      .data(data)
  
  // UPDATE???
  
  self.agents
    .attr("transform", function(d) { return "translate(" + self.widthScale(d.x) + "," + self.heightScale(d.y) + ")";});  
  
  // ENTER - creates new elements if needed
  self.agents
    .enter().append("g")
    .attr("class", "event")
    .attr("transform", function(d) { return "translate(" + self.widthScale(d.x) + "," + self.heightScale(d.y) + ")";});  
  
  // EXIT - removes old data
  self.agents.exit().remove();
  
  if (this.agentShape == "rect") {
    
    
  } else {
    self.agents.append("circle")
      .attr("class", (function(d){ return "agent id" + d.id }) )
      .attr("r", self.agentSize * self.zoom.scale())
      .attr("stroke-width", (function(d){
        if (typeof d.highlight != "undefined") {
          return 4 * self.zoom.scale();
        } else {
          return 2 * self.zoom.scale(); 
        }}))
      .attr("stroke", (function(d){
        if (typeof d.highlight != "undefined") {
          return "yellow";
        } else {
          return "black"; 
        }}))
      .attr("fill", (function(d) { return self.agentTypes[d.type].color }))
      .attr("data-legend",function(d) { return d.title})
      .on("mouseover", function(d){
        //self.tooltip.html("Time: " + format(d.timeStamp) + "<br/>" + d.name);
        //self.agentTypes[d.type].color;
        d3.selectAll("circle.agent").filter(".id" + d.id).attr("fill", (function(d) { return increase_brightness(self.colorPalette(d.type), 50); }));
        // Add the tooltip data...
        self.agentTooltip.append("text")
        .attr("x", 0)
        .attr("font-size", 14)
        .attr("dy", ".35em")
        .text(d.name);
        
        return //self.tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(d){
        return;
      })
      .on("mouseout", function(d){
        self.agentTooltip.select("text").remove();
        d3.selectAll("circle.agent").filter(".id" + d.id).attr("fill", (function(d) { 
          return self.colorPalette(d.type) }));
          //self.agentTypes[d.type].color;
          //return rgbToHex(color.r, color.g, color.b) }));
          //return;
      })
      .on("click", function(d){
        self.agentTooltip.select("text").remove();
        callback = self.agentClickedCallback || self.noop;
        callback({id: d.id});
      });
      
  }
  

  
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  
  function increase_brightness(hex, percent){
    //http://stackoverflow.com/a/6444043/1303142
    // strip the leading # if it's there
    hex = hex.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if(hex.length == 3){
        hex = hex.replace(/(.)/g, '$1$1');
    }

    var r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
  }   
}

MazvelGameMap.gameMap.prototype.zoomMap = function() {
  var self = this;
  if (self.zoom.translate()[0] + self.backgroundWidth * self.zoom.scale() < self.width) {
    var x = self.width - self.background.width * self.zoom.scale();
    self.zoom.translate([x, self.zoom.translate()[1]]);
  }
  if (self.zoom.translate()[0] > 0) {
    self.zoom.translate([0, self.zoom.translate()[1]]);
  }
  if (self.zoom.translate()[1] > 0) {
    self.zoom.translate([self.zoom.translate()[0], 0]);
  }
  if (self.zoom.translate()[1] + self.background.height * self.zoom.scale() < self.height) {
    var y = self.height - self.background.height * self.zoom.scale();
    self.zoom.translate([self.zoom.translate()[0], y]);
  }
  self.gameMap.selectAll(".axis").selectAll(".x").call(self.xAxis);
  self.gameMap.selectAll(".axis").selectAll(".y").call(self.yAxis);
  self.redrawMap();
};

MazvelGameMap.gameMap.prototype.redrawMap = function() {
  var self = this;
  self.gameMapBackground.transition()
    .duration(0)
    .attr("width", self.background.width * self.zoom.scale())
    .attr("height", self.background.height * self.zoom.scale())
    .attr("x", self.widthScale(0))
    .attr("y",self.heightScale(0));

  if (typeof self.heatMap != "undefined") {
    self.heatMapElement.transition()
      .duration(0)
      .attr("width", self.heatMap.width * self.zoom.scale())
      .attr("height", self.heatMap.height * self.zoom.scale())
      .attr("x", self.widthScale(0))
      .attr("y",self.heightScale(0));  
  }
  
  if (!(typeof(self.agents) == "undefined")) {
    self.agents.transition()
      .duration(0)
      .attr("transform", function(d) { return "translate(" + self.widthScale(d.x) + "," + self.heightScale(d.y) + ")";})
  }
  self.gameMap.selectAll(".agent").transition()
    .duration(0)
    .attr("r", self.agentSize * self.zoom.scale())
    .attr("stroke-width", (function(d){
        if (typeof d.highlight != "undefined") {
          return 4 * self.zoom.scale();
        } else {
          return 2 * self.zoom.scale(); 
        }}));
        
  if (typeof(self.focusedEventData) != "undefined") {
    self.svgElement.selectAll(".focusedEventStyle").remove();
    self.svgElement.selectAll(".focusedEvent").remove();
    self.focusedEvent = self.gameMap.append("g")
      .attr("class", ".focusedEvent")
      .attr("transform", "translate(" + self.widthScale(self.focusedEventData.x) + "," + self.heightScale(self.focusedEventData.y) + ")")
      .append("rect")
      .attr("class", "focusedEventStyle")
      .attr("width", 30 * self.zoom.scale())
      .attr("height", 30 * self.zoom.scale())
      .attr("x", - 15 *self.zoom.scale() )
      .attr("y", - 15 * self.zoom.scale());
  }
}

MazvelGameMap.gameMap.prototype.getSelectedArea = function() {
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
