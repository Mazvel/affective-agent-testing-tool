/*****************************************************************************************
* d3.playableTimeline javascript plugin
* Author: Magnús Snorri Bjarnason (Github: Mazvel)
* playableTimeline is released under the MIT license
* requires d3 to be imported as well
*****************************************************************************************/
MazvelPlayableTimeline = function(){
	//simply create the namespace
};

/**
* This is the constructor.
*
* @class MazvelPlayableTimeline.playableTimeline
* @constructor
* @param {DOMElement} container The DOM element that will hold the SVG.
* @param {int} width The width the timeline will have.
*/
MazvelPlayableTimeline.playableTimeline = function (container, width, args) {
  if (typeof args.startTime != "undefined"){
    this.startTime = args.startTime;
  } else {
    this.startTime = new Date(0);
  }
  if (typeof args.endTime != "undefined"){
    this.endTime = args.endTime;
  } else {
    this.endTime = new Date();
  }
  if (typeof args.showLegend != "undefined"){
    this.showLegend = args.showLegend;
  } else {
    this.showLegend = false;
  }
  if (typeof args.showBorder != "undefined"){
    this.showBorder = args.showBorder;
  } else {
    this.showBorder = false;
  }
  if (typeof args.dragable != "undefined"){
    this.dragable = dragable;
  } else {
    this.dragable = true;
  }
  if (typeof args.showYAxis != "undefined"){
    this.showYAxis = args.showYAxis;
  } else {
    this.showYAxis = true;
  }
  if (typeof args.yScaleDomain != "undefined"){
    if (args.yScaleDomain.length == 2){
      this.yScaleDomain = args.yScaleDomain;
    } 
  } else {
    this.yScaleDomain = [0,1];
  }
  if (typeof args.zoomEventCallback != "undefined"){
    if (typeof args.zoomEventCallback === "function") {
      this.zoomEventCallback = args.zoomEventCallback;
    } else {
      console.log("Zoom event callback was not a function!");
    }
  }
  
  // Start with creating empty function which will be used as an alternative if callbacks are not defined
  this.noop = function(){};
  this.container = container;
  this.margin = {top: 50, right: 0, bottom: 30, left: 30},
  this.legendPanelWidth = this.showLegend ? 300 : 0;
  this.margin.right = this.showLegend ? 0 : 10;
  this.legendPanelPadding = 10;
  this.height = 180 - this.margin.top - this.margin.bottom;
  this.width = width - this.margin.left - this.margin.right - this.legendPanelWidth;

  this.startLine;
  this.endLine;
  this.timeScale;
  this.intensityScale;
  this.heightScale;
  this.xAxis;
  this.yAxis;
  this.timeline;
  this.mainTimelineArea;
  this.zoom;
  this.events;
  this.timeSeries;
  this.timeSeriesData
  this.eventTypes;
  this.eventTypeData;
  this.tooltip;
  this.circleRadius = 8;
  this.currentTime = this.startTime;
  this.lastTime;
  this.currentScale;
  this.eventColorPalette;
  this.legendBox;
  // False playback status means pause.
  this.playBackStatus;
  this.playBackSpeed;
  // true playBackDirection means forward, false means rewind.
  this.playBackDirection;
  this.lineFunction = d3.svg.line()
    .x(function(d) { return this.timeScale(d.x); })
    .y(function(d) { return this.intensityScale(d.y); })
    .interpolate("linear");
  this.initializeTimeline(container, this.width, this.height, this.startTime, this.endTime);
};

MazvelPlayableTimeline.playableTimeline.prototype.initializePlayback = function() {
  var self = this;
  self.lastTime = new Date().getTime();
  self.playBackStatus = false;
  self.playBackSpeed = 1.0;
  self.playBackDirection = true;
  setInterval(function(){self.mainLoop();}, 33);
};

MazvelPlayableTimeline.playableTimeline.prototype.mainLoop = function() {
  var self = this;
  var tmpTime = new Date().getTime();
  var elapsed = tmpTime - self.lastTime;
  self.lastTime = tmpTime;
  
  
  if (self.playBackStatus) {
    self.tickTime(elapsed * self.playBackSpeed * (self.playBackDirection ? 1 : -1));
  }
  
  
};

MazvelPlayableTimeline.playableTimeline.prototype.setPlaybackParamters = function(parameters) {
  var self = this;
  if (typeof parameters[0] != "undefined") {
    self.playBackStatus = parameters[0];
    if (status == true) {
      self.lastTime = new Date().getTime();
    }
  }
  if (typeof parameters[1] != "undefined") {
    self.mainLoop();
    self.playBackSpeed = parameters[1];
  }
  if (typeof parameters[2] != "undefined") {
    self.playBackDirection = parameters[2];
  }
};

MazvelPlayableTimeline.playableTimeline.prototype.getPlaybackParamters = function() {
  var self = this;
  return [self.playBackStatus, self.playBackSpeed, self.playBackDirection];
};

MazvelPlayableTimeline.playableTimeline.prototype.getPlaybackTime = function() {
  return this.currentTime;
};

MazvelPlayableTimeline.playableTimeline.prototype.setPlaybackTime = function(newTime) {
  var self = this;
  self.tickTime(newTime.getTime() - self.currentTime.getTime());
};


MazvelPlayableTimeline.playableTimeline.prototype.addHorizontalSplitLine = function() {
  var self = this;
  self.timeline.append("g")
    .append("rect")
    .attr("class", "playableTimeLineHorizontalMarker")
    .attr("x", self.margin.left)
    .attr("y", self.margin.top + self.height / 2)
    .attr("height", 1)
    .attr("width", self.width)
};

/**
* This function creates the SVG in the DOM and initializes the timeline
* by setting its timeScale, xAxis and drawing the background.
*
* @method MazvelPlayableTimeline.playableTimeline.initializeTimeline
* @param {DOMElement} container The DOM element that will hold the SVG.
* @param {int} width The width of the timeline.
* @param {int} height The height of the timeline.
* @param {Date} startTime The start date of the time scale.
* @param {Date} endTime The end date of the time scale.
*/
MazvelPlayableTimeline.playableTimeline.prototype.initializeTimeline = function(container, width, height, startTime, endTime) {
  var self = this;
  self.timeScale = d3.time.scale()
    .domain([startTime, endTime])
    .range([0, width]);
  
  // Initialize the scale to default if it is unset.
  
  self.intensityScale = d3.scale.linear()
    .domain(self.yScaleDomain)
    .range([height, 0]);
  
  self.xAxis = d3.svg.axis()
    .scale(self.timeScale)
    .orient("bottom")
    .tickFormat(d3.time.format("%M:%S")); 
  

  if (typeof yAxis == "undefined"){
    self.yAxis = d3.svg.axis()
      .scale(self.intensityScale)
      .orient("left");
  }
  
  // Now we must calculate the scaleExtent.
  // Assuming we want minimum 4 seconds in deepest zoom for while timeline.
  var totalSeconds = Math.floor(endTime.getTime()/1000) + 5;
  var maximumScale = totalSeconds/4;
  self.zoom = d3.behavior.zoom()
    .x(self.timeScale)
    .scaleExtent([1, maximumScale])
    .on("zoom", function(){
      self.zoomTimeline()});   
  
  self.timeline = d3.select(container).append("svg")
      .attr("class", "playableTimeline")
      .attr("width", width + self.margin.left + self.margin.right + self.legendPanelWidth)
      .attr("height", height + self.margin.bottom + self.margin.top);
 
  
 
  self.mainTimelineArea = self.timeline.append("g")
    .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
    .call(self.zoom);
  self.mainTimelineArea.append("rect")
      .attr("class", "border")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", height)
      .attr("width", width);  
    
  self.mainTimelineArea.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(self.xAxis);
  
  self.timeline.append("g")
    .append("rect")
    .attr("class", "playableTimeLineTimeMarker")
    .attr("x", self.margin.left + self.width/2 - 1)
    .attr("y", self.margin.top)
    .attr("height", self.height)
    .attr("width", 3)
    
  
  
  self.timeline.append("g")
    .attr("class", "paddingLeft")
    .append("rect")
    .attr("class", "paddingForeground")
    .attr("x", 0)
    .attr("y", self.margin.top)
    .attr("height", self.height)
    .attr("width", self.margin.left); 

  self.timeline.append("g")
    .attr("class", "paddingRight")
    .append("rect")
    .attr("class", "paddingForeground")
    .attr("x", self.margin.left + self.width + 1)
    .attr("y", self.margin.top)
    .attr("height", self.height)
    .attr("width", self.margin.left); 
  
  if (self.showYAxis) {
    self.timeline.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
      .call(self.yAxis);
   }
  
  // Let's initialize the tooltip.
  self.tooltip = d3.select(container)
	.append("div")
  .attr("id", "playableTimelineTooltip")
	.style("position", "absolute")
  .style("top", "7px")
	.style("z-index", "10")
	.style("visibility", "hidden")
	.text("a simple tooltip");
  
  self.currentScale = 4;
  self.zoom.translate([0,0])
    .scale(4); 
  self.zoom.event(self.mainTimelineArea);
  self.currentTime = self.timeScale.invert(self.width/2);
  self.tickTime(-(self.currentTime.getTime() - self.startTime.getTime()));
  
  if (this.showBorder) {
    // Let's att the border around the timeline container
    var lineData = [ { "x": 1,   "y": 1},  { "x": self.width + self.margin.left + self.margin.right + self.legendPanelWidth - 2,  "y": 1},
                    { "x": self.width + self.margin.left + self.margin.right + self.legendPanelWidth - 2,  "y": self.height + self.margin.top + self.margin.bottom - 2},
                    { "x": 1,  "y": self.height + self.margin.top + self.margin.bottom - 2}, {"x" : 1, "y" : 1}];
    
    var lineFunction = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .interpolate("linear");
    
    self.timeline.append("path")
      .attr("class", "borderPath")
      .attr("d", lineFunction(lineData))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
    .attr("fill", "none");
  }
  if (self.showLegend) {
    // Now we must initialize the legend background.
    self.legendBox = self.timeline.append("g")
      .attr("transform", "translate(" + (self.margin.left + self.margin.right + self.width + self.legendPanelPadding) + "," + self.legendPanelPadding + ")")
      .attr("class", "legendBox")
      
    self.legendBox.append("rect")
      .attr("class", "legendBoxRect")
      .attr("x", 1)
      .attr("y", 1)
      .attr("height", self.margin.bottom + self.margin.top + self.height - self.legendPanelPadding * 2)
      .attr("width", self.legendPanelWidth - self.legendPanelPadding * 2); 
    }
};


MazvelPlayableTimeline.playableTimeline.prototype.addEventTypes = function (data) {
  var self = this;
  // It is important to get all the event types in here. That way we can display the data legend.
  // Also we initialixe the color palette here. So when user changes data the same color will always
  // be associated with the same event.
  // The easiest way for the user is just to dump ALL the data into here when the data has been loaded.
  // The events will then be identified.
  // We accept data on the form: list of events. event: { name: x, id: x }
  this.eventTypeData = data;
  var typeIds = [];
  for (var i = 0; i < data.length; i++) {
    typeIds.push(data[i].id);
  }
  if (data.length < 10) {
    this.eventColorPalette = d3.scale.category10();
  } else {
    this.eventColorPalette = d3.scale.category20();
  }
  // Now that we have the data types we must display the legend.
  console.log(self.showLegend);
  if (self.showLegend) {
    console.log("Pumping out legends...");
    var heightOffset = 15;
    var widthOffset;
    for (var i = 0; i < data.length; i++) {
      if (i%2 == 0) {
        widthOffset = 0;
      } else {
        widthOffset = 140;
      }
      var tmpG = self.legendBox.append("g")
        .attr("transform", "translate(" + (widthOffset + 12) + "," + heightOffset + ")");
      tmpG.append("circle")
        .attr("r", 8)
        .attr("fill", self.eventColorPalette(data[i].id))
        
      tmpG.append("text")
        .attr("x", 16)
        .attr("dy", ".25em")
        .attr("font-size", 12)
        .text(data[i].name);
      if (i % 2 != 0) {
        heightOffset += 22
      }
    }
  }
}

/**
* This function adds the event data to the timeline and draws the circles
* and adds event listeners to the circles.
*
* @method MazvelPlayableTimeline.playableTimeline.bindEventData
* @param {Dictionary} data Dictionary containing the keys: typeID, id, name, callback
*/
MazvelPlayableTimeline.playableTimeline.prototype.bindEventData = function (data) {
  var self = this;
  self.eventTypes = [];
  for (var i = 0; i < data.length; i++) {
    if (self.eventTypes.indexOf(data[i].typeId) < 0) {
      self.eventTypes.push(data[i].typeId);
    }
  }
  self.heightScale = d3.time.scale()
    .domain([0, self.eventTypes.length + 1])
    .range([0, self.height]);

  var format = d3.time.format("%M:%S");
  self.mainTimelineArea.selectAll("g.event").remove();
  self.events = self.mainTimelineArea.selectAll("g.event")
      .data(data)
    .enter().append("g")
      .attr("class", "event")
      .attr("transform", function(d) { return "translate(" + self.timeScale(d.timeStamp) + "," + self.heightScale(self.eventTypes.indexOf(d.typeId) + 1) + ")";});  
  self.events.append("circle")
    .attr("class", (function(d){ 
      if (typeof d.highlight != "undefined") {
        return "event highlight id" + d.id;
      } else {
        return "event id" + d.id; 
      }}))
    .attr("r", self.circleRadius)
    .attr("fill", (function(d) { 
    
    return self.eventColorPalette(d.typeId) }))
    .on("mouseover", function(d){
      self.tooltip.html("Time: " + format(d.timeStamp) + "<br/>" + d.name);
      var brighterColor = increase_brightness(self.eventColorPalette(d.typeId), 50);
      d3.selectAll("circle.event").filter(".id" + d.id).attr("fill", brighterColor);
      return self.tooltip.style("visibility", "visible");
    })
    .on("mousemove", function(d){
      var rect = self.container.getBoundingClientRect();
      return self.tooltip.style("left",(self.timeScale(d.timeStamp))+"px");
    })
    .on("mouseout", function(d){
      d3.selectAll("circle.event").filter(".id" + d.id).attr("fill", (function(d) { return self.eventColorPalette(d.typeId) }));
      return self.tooltip.style("visibility", "hidden");
    })
    .on("click", function(d){
      d.callback(d);
    });
    
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
};

/**
* This function adds the emotion data to the timeline 
*
* @method MazvelPlayableTimeline.playableTimeline.bindTimeSeries
* @param {Dictionary} data Dictionary containing the keys: typeID, id, name, callback
*/
MazvelPlayableTimeline.playableTimeline.prototype.bindTimeSeriesData = function (data) {
  var self = this;
  self.timeSeriesData = data;
  if (data.length < 10) {
    var color = d3.scale.category10()
      .domain(d3.keys(data[0]).filter(function(key) { return key === "name"; }));
  } else {
    var color = d3.scale.category20()
      .domain(d3.keys(data[0]).filter(function(key) { return key === "name"; }));
  }
  self.timeSeries = self.mainTimelineArea.selectAll(".pad").remove();
  self.timeSeries = self.mainTimelineArea.selectAll(".pad")
      .data(data)
    .enter().append("g")
      .attr("class", "pad");
      
  self.timeSeries.append("path")
      .attr("class", "timeSeries")
      .attr("d", function(d) { return self.lineFunction(d.data); })
      .style("stroke", function(d) { 
        if (typeof d.color != "undefined") {
          return d.color;
        } else {
          console.log("Color: " + d.color);
          return color(d.name);
        }})
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("data-legend",function(d) { return d.name}); 
  
  legend = self.mainTimelineArea.append("g")
    .attr("class","legend")
    .attr("transform","translate(15,18)")
    .style("font-size","12px")
    .call(d3.legend)

}

MazvelPlayableTimeline.playableTimeline.prototype.tickTime = function (time, previousTranslate) {
  var self = this;
  if (self.currentTime.getTime() + time > self.endTime.getTime() || self.currentTime.getTime + time < self.startTime.getTime()){
    return;
  }
  if (typeof self.previousTranslate != "undefined") {
    previousTranslate = 0;
  }
  var currentX = self.timeScale(self.currentTime);
  var tmp = self.currentTime.getTime() + time;
  newTime = new Date(tmp);
  var newX = self.timeScale(newTime);
  var diff = newX - currentX;
  self.currentTime = new Date(tmp);
  self.zoom.translate([self.zoom.translate()[0] - diff,0])
  self.zoom.event(self.mainTimelineArea);
}

/**
* This function is called when d3 zoom event is fired. It updates the circles
* position on the timeline based on the new xAxis scale. User is also prevented
* from moving the timeline out of bounds.
*
* @method MazvelPlayableTimeline.playableTimeline.zoomTimeline
*/
MazvelPlayableTimeline.playableTimeline.prototype.zoomTimeline = function() {
  var self = this;
  self.zoom.center([self.width/2, 0]);
  if (typeof self.currentTime != "undefined") {
    // When this is called first the current time has not been set, as it can only be set
    // after the first call.
    /*if (Math.abs(self.currentTime.getTime() - self.timeScale.invert(self.width/2).getTime()) > 2 && self.currentScale != self.zoom.scale() || self.zoom.scale() == 7 || self.zoom.scale() == 1) {
      console.log("Current scale: " + self.currentScale);
      console.log("New scale: " + self.zoom.scale());
      //console.log("Zoom translate vector: " + self.zoom.translate());
      var currentX = self.timeScale(self.timeScale.invert(self.width/2));
      var newX = self.timeScale(self.currentTime);
      var diff = newX - currentX;
      //self.zoom.translate([self.zoom.translate()[0] - diff,0])
    }*/
    if (self.zoom.scale() == self.currentScale) {  
      // This means the user is dragging the timeline. We should let him, and update the current time.
      // accordingly.
      self.currentTime = self.timeScale.invert(self.width/2);
      // We should not allow the user to drag outside of the boundaries!
      if (self.timeScale.invert(self.width/2).getTime() < self.startTime.getTime()) {
        self.currentTime = new Date(self.startTime.getTime());
        var currentX = self.timeScale(self.timeScale.invert(self.width/2));
        var newX = self.timeScale(self.currentTime);
        var diff = newX - currentX;
        self.zoom.translate([self.zoom.translate()[0] - diff,0])
      } else if (self.timeScale.invert(self.width/2).getTime() > self.endTime.getTime()) {
        self.currentTime = new Date(self.endTime.getTime());
        var currentX = self.timeScale(self.timeScale.invert(self.width/2));
        var newX = self.timeScale(self.currentTime);
        var diff = newX - currentX;
        self.zoom.translate([self.zoom.translate()[0] - diff,0])
      } else {
        self.currentTime = self.timeScale.invert(self.width/2);
      }
    } else {
      // This means the user is zooming. Let's check if the tickFormat should be updated.
      if (self.timeScale.invert(self.width).getTime() - self.timeScale.invert(0).getTime() < 7000) {
        console.log("Updating tickFormat");
        self.xAxis.tickFormat(d3.time.format("%M:%S.%L"));
      } else {
        self.xAxis.tickFormat(d3.time.format("%M:%S"));
      }
      
      
    }
  }
  self.currentScale = self.zoom.scale();
  self.mainTimelineArea.selectAll(".axis").call(self.xAxis);
  self.redrawTimeline();
  callback = self.zoomEventCallback || self.noop;
  callback({currentTime: self.currentTime});
};

/**
* This function redraws the circles on the timeline based on the 
* scale of the xAxis.
*
* @method MazvelPlayableTimeline.playableTimeline.redrawTimeline
*/
MazvelPlayableTimeline.playableTimeline.prototype.redrawTimeline = function() {
  var self = this;
  
  if (typeof self.events != "undefined"){
    self.events.transition()
      .duration(0)
      .attr("transform", function(d) {
        if (self.timeScale(d.timeStamp) > self.timeScale(self.timeScale.domain()[0]) - self.circleRadius && 
        self.timeScale(d.timeStamp) < self.circleRadius + self.timeScale(self.timeScale.domain()[1])) {
          return "translate(" + self.timeScale(d.timeStamp) + "," + self.heightScale(self.eventTypes.indexOf(d.typeId) + 1) + ")";
        } else {
          return "translate(-100,-50)";
        }});
  }
  if (typeof self.timeSeries != "undefined"){
    self.mainTimelineArea.selectAll("path.timeSeries")
    .attr("d", function(d) { return self.lineFunction(d.data); })
    .attr("transform", null)
    .transition();
  }
  
  
};

MazvelPlayableTimeline.playableTimeline.prototype.drawEmotionLine = function() {
  var self = this;
  
  self.mainTimelineArea.selectAll("path.emotionLine").remove()                      
  self.mainTimelineArea.append("path")
    .attr("class", "emotionLine")
    .attr("d", self.lineFunction(self.emotionData))
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("fill", "none"); 
};

MazvelPlayableTimeline.playableTimeline.prototype.testBindData = function(data) {
  var self = this;
};
