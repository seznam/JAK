/**
 *        /\
 *  _____//\\    _____
 *  _____/  \\  /_____
 *           \\//
 *            \/
 *
 * @overview Čárový graf
 * @version 2.6
 * @author zara, majak
 */

JAK.Chart.Line = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart.Line",
	VERSION: "2.6",
	EXTEND: JAK.Chart,
	IMPLEMENT: [JAK.ISignals, JAK.Chart.Grid]
});

JAK.Chart.Line.prototype.$constructor = function(obj, data, options, insertToChart) {
	var data = this._prepareData(data);
	this.options = {
		backend: JAK.Chart.Backend.SVG,
		draw: true,
		width:200,
		height:200,
		min:null,
		max:null,
		padding:40,

		gridPadding: 0,

		lineWidth: 2,
		lineColor: null,
		sectorColors: ["#a71e72","#e51114","#f37944","#fcc83e","#aad400",
				"#70c21a","#1dbdc0","#3f6fd3","#214478"],
		colorsMap: [[1],
					[1,7],
					[1,3,7],
					[1,3,5,7],
					[1,2,3,5,7],
					[1,2,3,5,6,7],
					[0,1,2,3,5,6,7],
					[0,1,2,3,4,5,6,7],
					[0,1,2,3,4,5,6,7,8]],

		rows: {
			width: 0.5,
			count: 6,
			color: "#f0f0f0"
		},
		cols: {
			show: true,
			width: 0.5,
			color: "#f0f0f0",
			highlightBg: "#f3f3f3"
		},
		frame: {
			width: 1,
			color: "#dcdcdc",
			complete: true,
			position: "left"
		},

		previewGraph: {
			height: 50,
			lineWidth: 1,
			paddingFromGraph: 30,
			path: true,
			activeColorLine: "#b9b9b9",
			activeColorPath: "#d4efff",
			colorLine: "#b9b9b9",
			colorPath: "#f7f7f7",
			fillOpacity: 1,
			onlyScrollbarMove: false,
			scrollImgDir: ""
		},

		zoomable: false,
		zoomLevel: 0,
		graphMove: 0,
		movingSpeed: 1,
		zoomStep: 2,

		incremental: false,

		labels: [],
		secondLabelsX: [],
		labelsPosition: "start", // start || center
		labelsYPosition: "left", // left || right
		labelsXPosition: "bottom", // bottom || top
		minSpaceLabelX: 6,
		labelsToEndX: false,

		computeOverlap: true,

		label: true, // false || true
		showLabel: "mouseover", // alltime || events ('click', 'mouseover')
		labelPosition: {
			displacementY: 10,
			displacementX: -13,
			position: (3/2)
		},

		noteShow: false,
		noteFontSize: "12px",
		noteLabel: {
			color: "#f00",
			top: 40
		},

		legendShow: false,
		legendPosition: "right",
		legendWidth: 180,
		legendHeight: 260,
		legendColorWidth: 12,
		legendColorHeight: 12,

		active: true,
		//activeAnimation: true,
		//activeAnimationLength: 100,

		onloadAnimation: true,
		onloadAnimationLength: 1500,
		onloadAnimationDelay: 1000,
		onloadAnimationType: "horizontal", // computeVertical, horizonatal, vertical

		oncloseAnimationLength: 1500,
		oncloseAnimationDelay: 1000,
		oncloseAnimationType: "horizontal", // computeVertical, horizonatal, vertical

		hover: false,
		hoverPointWidth: 4,
		hoverPointOpacity: 0.8,
		hoverPointFill: "colorPalette", // color or "colorPalette"
		hoverPointStrokeColor: "#fff", // color or "colorPalette"
		hoverPointStrokeWidth: 2,
		hoverPointShowAllTime: false,

		fill: false,
		fillOpacity: 0.5,
		activeFillOpacity: 0.8,
		onlyFirstFill: false,

		items: [],

		interactiveLineX: false,
		interactiveLineY: false,
		interactiveLineValue: false,

		showPointValue: false,

		sameMetric: true, // stejna metrika jako ma graf do ktereho je vkladan (pouze pokud je graf vkladan do jineho)

		callback: {
			mouseDown: {obj: null, method: null}, // return originalEvent
			mouseUp: {obj: null, method: null}, // return originalEvent
			zoomIn: {obj: null, method: null}, // return originalEvent
			zoomOut: {obj: null, method: null}, // return originalEvent
			graphMove: {obj: null, method: null}, // return originalEvent
			click: {obj: null, method: null} // return originalEvent
		}
	}

	this._ev = [];

	this._elements = {};

	this._pointerCleared = true;

	this._zoomLevel = options.zoomLevel || this.options.zoomLevel;
	this._pointer = 50;
	this._graphMove = options.graphMove || this.options.graphMove;
	this._downOnPreviewGraph = false;

	this._groups = [];
	this._anime = [];
	this._labels = [];
	this._pointMap = [];
	this._activePointGroup = [];
	this._activePoint = [];
	this._activeLine = [];
	this._lineValueContainer = [];
	this._pointValueCotainer = null;
	this._note = [];


	this._textGroupX = null;
	this._textGroupY = null;
	this._labelsX = [];
	this._labelsY = [];
	this._labelsXsecond = [];
	this._gridFrame = null;
	this.__insertToChart = insertToChart;

	this._eventLabel = [];

	this.$super(obj, data, options);

	this._isMouseDown = false;
	this._lastMouseMove = {left:[]};

	this._ev.push(this.addListener('click', '_click', this._backend));
	this._ev.push(this.addListener('mouseDown', '_mouseDown', this._backend));
	//this._ev.push(this.addListener('touchStart', '_mouseStart', this._backend));
	this._ev.push(this.addListener('mouseUp',  '_mouseUp', this._backend));
	//this._ev.push(this.addListener('touchEnd',  '_mouseUp', this._backend));
	this._ev.push(this.addListener('mouseOut', '_mouseOut', this._backend));
	this._ev.push(this.addListener('canvasMouseMove', '_mouseMove', this._backend));
	this._ev.push(this.addListener('gestureChange', '_gestureChange', this._backend));
	this._ev.push(this.addListener('canvasDoubleClick', '_doubleClick', this._backend));

	if ( this.options.zoomable ) {
		if (JAK.Browser.client == "gecko") {
			this._backend._ev.push(JAK.Events.addListener(this._backend.getContainer(), "DOMMouseScroll", this, "_scroll"));
		} else {
			this._backend._ev.push(JAK.Events.addListener(this._backend.getContainer(), "mousewheel", this, "_scroll"));
		}
	}
}

JAK.Chart.Line.prototype._mouseDown = function(event) {
	var e = event.data.originalEvent;
	var eId = event.data.id;
	this._lastMouseMove.clientX = e.clientX;
	this._lastMouseMove.clientY = e.clientY;

	JAK.Events.cancelDef(e);
	if ( this.options.zoomable ) {
		var eventInscrollButtons = this._eventInscrollButtons(eId);
		var eventInMaskOnPreviewGraph = this._eventInMaskOnPreviewGraph();
	}

	if( this.options.zoomable && ( this._eventInGraph() || eventInMaskOnPreviewGraph || eventInscrollButtons ) ) {
		if ( eventInMaskOnPreviewGraph ) { this._downOnPreviewGraph = true; }
		if ( eventInscrollButtons ) { this._downOnScrollButtons = eventInscrollButtons; }
		this._isMouseDown = true;
		this._backend.getContainer().style.cursor = "move";
		this._mouseDownCoords = {clientX:e.clientX, clientY:e.clientY};
	} else {
		this._isMouseDown = false;
		this._backend.getContainer().style.cursor = "default";
	}

	if ( this.options.callback.mouseDown.method ) {
		if ( !this.options.callback.mouseDown.obj ) { this.options.callback.mouseDown.obj = window; }
		this.options.callback.mouseDown.obj[this.options.callback.mouseDown.method](e);
	}
};

JAK.Chart.Line.prototype._mouseUp = function(e) {
	if ( this._downOnScrollButtons ) { this._zoom(); }
	this._isMouseDown = false;
	this._backend.getContainer().style.cursor = "default";
	//this._downOnScrollButtons = false;

	if ( this.options.callback.mouseUp.method ) {
		if ( !this.options.callback.mouseUp.obj ) { this.options.callback.mouseUp.obj = window; }
		this.options.callback.mouseUp.obj[this.options.callback.mouseUp.method](e.data.originalEvent);
	}
	//if (JAK.Browser.client != "gecko") { this._click(e); }
	//this._click(e);

	this._downOnPreviewGraph = false;
	this._downOnScrollButtons = false;
};

JAK.Chart.Line.prototype._mouseOut = function(e) {};

JAK.Chart.Line.prototype._gestureChange = function(event) {
	var e = event.data.originalEvent;

	this._zoomType = ( e.scale >= 1 ) ? 1 : -1;
	this._zoomLevel += e.scale * this._zoomType;

	if ( this._zoomLevel < 0 ) { this._zoomLevel = 0; }

	this._zoom();

	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);

	//this._mouseMove(event);
}

JAK.Chart.Line.prototype._mouseMove = function(event) {
	var e = event.data.originalEvent;
	var lines = this._lines;
	var scroll = JAK.DOM.getBoxScroll(this._parentElm);
	var boxPosition = JAK.DOM.getBoxPosition(this._parentElm);
	var mousePosLeft = e.clientX - boxPosition.left + scroll.x;
	var mousePosTop = e.clientY - boxPosition.top + scroll.y;
	this._lastMouseMove.clientX = e.clientX;
	this._lastMouseMove.clientY = e.clientY;

	var clearGroup = [];
	var valContainer = this._pointValueContainer;

	/*if ( this.options.zoomable && !this._eventInGraph(e) && !this._eventInMaskOnPreviewGraph() && !this._downOnScrollButtons ) {
		this._isMouseDown = false;
	}*/

	if ( this.options.zoomable && this._isMouseDown && ( this._zoomLevel > 0 || this._downOnScrollButtons ) ) {

		if ( ( this.options.showLabel == "mouseover" || this.options.showLabel == "click" ) && this.options.label ) {
			var label = JAK.gel(this._actualLabel);

			if ( label ) {
				label.parentNode.removeChild(label);
			}

			this._actualLabel = null;
		}

		if ( this._activePointGroup.length > 0 ) {
			for ( var i = 0; i < this._activePointGroup.length; i++ ) {
				if ( !this._downOnScrollButtons ) { JAK.DOM.clear(this._activePointGroup[i][1]); }
				this._lastMouseMove.left[i] = null;

				if ( this._labels[i] && JAK.gel(this._labels[i][0])) {
					var oldLabel = JAK.gel(this._labels[i][0]);
					oldLabel.parentNode.removeChild(oldLabel);
				}
			}
		}

		if ( this.options.interactiveLineX || this.options.interactiveLineY ) {
			JAK.DOM.clear(this._interactiveLinesGroup[1]);
			this._interactiveLineX = this._interactiveLineY = false;
		}

		if ( this._downOnScrollButtons ) {
			this._changePreviewWidth(( this._downOnScrollButtons == 1 ));
		}
		else if ( this._downOnPreviewGraph ) {
			this._graphMove -= Math.round((this._lastMouseMove.clientX - this._mouseDownCoords.clientX) * (1 + this._zoomLevel/10) * this.options.movingSpeed);
		}
		else {
			this._graphMove += Math.round((this._lastMouseMove.clientX - this._mouseDownCoords.clientX) * this.options.movingSpeed);
		}

		this._mouseDownCoords.clientX = this._lastMouseMove.clientX;

		if ( !this._downOnScrollButtons ) {
			if ( this._graphMove >= 0 ) {
				this._graphMove = 0;
			}
			else if ( ( this._c.zoomGraphWidth + this._graphMove ) < this._c.graphWidth ) {
				this._graphMove = this._c.graphWidth - this._c.zoomGraphWidth;
			}

			this._redrawing = true;
			this._computeLines();
			this._draw();
			this._moveZoomableMaskPreview();
			this._redrawing = false;
		}
	}
	else if ( mousePosTop > (this._c.top + this._c.graphHeight) || mousePosTop < this._c.top || mousePosLeft > (this._c.left + this._c.graphWidth) || mousePosLeft < ( this._c.left ) ) {
		if ( this.options.label ) {
			for ( var i = 0; i < this._activePointGroup.length; i++ ) {
				if ( !this.options.hoverPointShowAllTime ) { JAK.DOM.clear(this._activePointGroup[i][1]); }
				this._lastMouseMove.left[i] = null;

				if ( this._labels[i] && JAK.gel(this._labels[i][0])) {
					var oldLabel = JAK.gel(this._labels[i][0]);
					oldLabel.parentNode.removeChild(oldLabel);
				}
			}

			if ( this.options.interactiveLineX || this.options.interactiveLineY ) {
				JAK.DOM.clear(this._interactiveLinesGroup[1]);
				this._interactiveLineX = this._interactiveLineY = false;
				/*if ( this._lineValueContainer[0] || this._lineValueContainer[1] ) {
					if ( this._lineValueContainer[0] ) { this._lineValueContainer[0].innerHTML=""; }
					if ( this._lineValueContainer[1] ) { this._lineValueContainer[1].innerHTML=""; }
				}*/
			}
		}
	}
	else {
		if ( this.options.interactiveLineX && mousePosLeft > this._computed.left && mousePosLeft < this._computed.right ) {
			if ( this._interactiveLineX ) { JAK.gel(this._interactiveLineX).setAttribute("points",mousePosLeft + " " + this._computed.top + ", " + mousePosLeft + " " + this._computed.bottom); }
			else { this._interactiveLineX = this._backend.drawPolyline([[mousePosLeft,this._computed.top], [mousePosLeft,this._computed.bottom]],{lineWidth:1, strokeColor:"#FFA81C"}, this._interactiveLinesGroup[1]); }
		}

		if ( this.options.interactiveLineY && mousePosTop > this._computed.top && mousePosTop < this._computed.bottom ) {
			if ( this._interactiveLineY ) { JAK.gel(this._interactiveLineY).setAttribute("points",this._computed.left + " " + mousePosTop + ", " + this._computed.right + " " + mousePosTop); }
			else { this._interactiveLineY = this._backend.drawPolyline([[this._computed.left,mousePosTop], [this._computed.right,mousePosTop]],{lineWidth:1, strokeColor:"#FFA81C"}, this._interactiveLinesGroup[1]); }
		}

		for ( var i = 0; i < lines.length; i++ ) {
			if ( lines[i].active && this.options.hover && !this._closeanimation ) {
				var pointMap = this._pointMap[i];
				var datapoints = lines[i].datapoints;
				var showLabel = false;

				for ( var x = 0; x < pointMap.length; x++ ) {
					var datapoint = datapoints[x];
					var point = pointMap[x];

					if ( point.from < mousePosLeft && point.to > mousePosLeft && this._lastMouseMove.left[i] != datapoint[0] && ( datapoint[0] - this.options.hoverPointWidth / 2 ) < ( this._c.graphWidth + this._c.left ) ) {
						this._lastMouseMove.left[i] = datapoint[0];

						if ( !this.options.hoverPointShowAllTime ) {
							JAK.DOM.clear(this._activePointGroup[i][1]);


							if ( datapoint[0] !== null && datapoint[1] !== null ) {
								this._activePoint[i] = this._backend.drawCircle(datapoint[0], datapoint[1], this.options.hoverPointWidth, {
									lineWidth: this.options.hoverPointStrokeWidth,
									fillColor: ( this.options.hoverPointFill == "colorPalette" ) ? lines[i].color : this.options.hoverPointFill,
									fillOpacity: this.options.hoverPointOpacity,
									strokeColor: ( this.options.hoverPointStrokeColor == "colorPalette" ) ? lines[i].color : this.options.hoverPointStrokeColor,
									ignoreEvents: true
								}, this._activePointGroup[i][1]);
							}
						}

						if ( this.options.label && datapoint[0] !== null && datapoint[1] !== null ) {
							this._addLabel(i, datapoint[0], this._computed.bottom - datapoint[1] + this.options.padding, lines[i].label[x][0], "left");
						}

						if ( this.options.showPointValue && valContainer ) {

							if ( ( this._activeLine.length > 0 && valContainer.children.length >= this._activeLine.length ) || valContainer.children.length >= lines.length ) { valContainer.innerHTML = ""; }

							var txtVal = JAK.cel("span");
							txtVal.style.color = lines[i].color;
							if ( datapoint[1] !== null ) {
								if ( valContainer.innerHTML != "" ) { valContainer.appendChild(JAK.ctext(" | ")); }
								txtVal.innerHTML = (lines[i].label[x][0]);
							}
							valContainer.appendChild(txtVal);
						}

						break;
					}

					if ( this._activePoint[i] && this.options.showLabel == "mouseover" && this.options.label ) {
						if ( this._activePoint[i] == e.target.id && this._labels[i] ) {
							this._showElm(null, JAK.gel(this._labels[i][0]) );
							showLabel = true;
							break;
						}
					}

				}

				if ( !showLabel && this.options.hoverPointShowAllTime && this._labels[i] ) { this._hideElm(null, JAK.gel(this._labels[i][0])); }

				if ( this.options.showLabel == "mouseover" && this.options.label && !this.options.hoverPointShowAllTime ) {
					if ( this._activePoint[i] == e.target.id ) { this._showElm(null, JAK.gel(this._labels[i][0]) ); }
					else {
						if ( this._labels[i] ) { this._hideElm(null, JAK.gel(this._labels[i][0])); }
					}
				}
			}
		}

		if ( this.options.interactiveLineValue ) {
			var yVal = this._lineValueContainer[0],
				xVal = this._lineValueContainer[1];
			if ( yVal ) { yVal.innerHTML = Math.round(( ( this._c.max - this._c.min ) / this._c.graphHeight ) * ( this._c.bottom - mousePosTop )) + this._c.min; }
			if ( xVal && this.options.labels.length > 0 ) { xVal.innerHTML = ( ( yVal ) ? " / " : "" ) + ( ( this.options.labels[Math.floor(( mousePosLeft - this._c.left - this._graphMove ) / this._c.stepX)] ) ? ( this.options.labels[Math.floor(( mousePosLeft - this._c.left - this._graphMove ) / this._c.stepX)].name || "" ) : "" ); }
		}
	}
};

JAK.Chart.Line.prototype._click = function(e) {
	var eId = e.data.id;

	if ( this._eventInPreviewGraph() && !this._downOnPreviewGraph && !this._downOnScrollButtons ) {
		var e = e.data.originalEvent;
		var scroll = JAK.DOM.getBoxScroll(this._parentElm);
		var boxPosition = JAK.DOM.getBoxPosition(this._parentElm);
		var mousePosLeft = e.clientX - boxPosition.left + scroll.x;

		for ( var i = 0; i < this._activePointGroup.length; i++ ) { JAK.DOM.clear(this._activePointGroup[i][1]); }

		this._moveGraph(( mousePosLeft - this._c.left ) * (1 + this._zoomLevel/10));
	}

	if ( this.options.label && this.options.showLabel == "click" ) {
		for ( var i = 0; i < this._lines.length; i++ ) {
			if ( this._activePoint[i] == eId && JAK.gel(this._labels[i][0]).style.display != "block" ) {
				this._showElm(null, JAK.gel(this._labels[i][0]) );
			}
			else if ( this._activePoint[i] == eId ){
				this._hideElm(null, JAK.gel(this._labels[i][0]) );
			}
		}
	}

	this._downOnPreviewGraph = false;
	this._downOnScrollButtons = false;

	if ( this.options.callback.click.method ) {
		if ( !this.options.callback.click.obj ) { this.options.callback.click.obj = window; }
		this.options.callback.click.obj[this.options.callback.click.method](e.data.originalEvent);
	}
};

JAK.Chart.Line.prototype._legendClick = function(e, elm){
	if ( this.options.active ) {
		var groupId = elm.parentNode.id.replace("label-","");
		var group = JAK.gel(groupId);
		var valContainer = this._pointValueContainer;
		var items = null;
		var numberOfActive = 0;

		if ( this.options.showPointValue && valContainer ) {
			valContainer.innerHTML = "";
		}

		if ( JAK.DOM.hasClass(elm.parentNode, "active") ) {
			this.setActiveOnLegend(elm);
			JAK.DOM.removeClass(elm.parentNode, "active");
		}
		else {
			this.setActiveOnLegend(elm.parentNode, true);
			JAK.DOM.addClass(elm.parentNode, "active");
		}

		items = JAK.DOM.getElementsByClass("chartLegend", this._parentElm)[0].getElementsByTagName("li");

		this._activeLine = [];

		for ( var i = 0; i < items.length; i++) {
			if ( JAK.DOM.hasClass(items[i], "active") ) {
				this._lines[i].active = true;
				this._activeLine.push(this._lines[i]);
				numberOfActive++;
			}
			else { this._lines[i].active = false; }
		}

		if ( !numberOfActive ) {
			for ( var i = 0; i < items.length; i++) {
				this._lines[i].active = true;
			}
		}
	}

	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
}

JAK.Chart.Line.prototype._legendOver = function(e, elm){
	if ( this.options.active ) { this.setActiveOnLegend(elm, true); }
}

JAK.Chart.Line.prototype._legendOut = function(e, elm){
	if ( !JAK.DOM.hasClass(elm,"active") && this.options.active ) {
		this.setActiveOnLegend(elm);
	}
}

JAK.Chart.Line.prototype._zoom = function(e) {
	var cursor;
	if ( typeof(e) != "undefined" ) {
		var target = JAK.Events.getTarget(e),
			coords = JAK.DOM.getBoxPosition(this._parentElm),
			left = this._lastMouseMove.clientX,
			scroll = JAK.DOM.getBoxScroll(this._parentElm);

		cursor = (left - coords.left + scroll.x - this.options.padding) / this._c.graphWidth;

		this._undefinedEvent = false;
	}
	else {
		this._undefinedEvent = true;
	}

	for ( var i = 0; i < this._activePointGroup.length; i++ ) {
		JAK.DOM.clear(this._activePointGroup[i][1]);

		if ( this._activePointGroup.length > 0 && this.options.hoverPointShowAllTime ) {
			if ( this._labels[i] && JAK.gel(this._labels[i][0])) {
				var oldLabel = JAK.gel(this._labels[i][0]);
				oldLabel.parentNode.removeChild(oldLabel);
			}
		}
		this._activePointGroup[i][1].parentNode.removeChild(this._activePointGroup[i][1]);
	}

	this._activePointGroup = [];

	this._pointer = cursor || 50;

	var zoomInPixels = this._c.graphWidth * (1 + this.options.zoomStep/10) - this._c.graphWidth;

	if ( this._zoomLevel && !this._downOnScrollButtons && typeof(e) != "undefined" ) {
		this._graphMove += this._pointer * zoomInPixels * this._zoomType;
	}
	else if ( !this._downOnScrollButtons && typeof(e) != "undefined" ) {
		this._graphMove = 0;
	}

	this.options.onloadAnimation = false;

	if (this._actualLabel && JAK.gel(this._actualLabel)) {
		var actualLabel = JAK.gel(this._actualLabel);
		actualLabel.parentNode.removeChild(actualLabel);
		this._actualLabel = null;
	}

	if ( this.options.showPointValue && this._pointValueContainer ) { JAK.DOM.clear(JAK.gel(this._pointValueContainer)); }

	this._compute();
	this._redrawing = true;
	this._moveZoomableMaskPreview();
	this._draw();
	if ( this.includeGraph ) {
		for ( var i = 0; i < this.includeGraph.length; i ++ ) {
			this.includeGraph[i]._compute();
			this.includeGraph[i]._redrawing = true;
			this.includeGraph[i]._draw();
			this.includeGraph[i]._redrawing = false;
		}
	}
	this._redrawing = false;
};

// Dopočte hodnoty
JAK.Chart.Line.prototype._compute = function() {
	this._c = this._computed = {
		left: this.options.padding + ( ( this.options.legendPosition == "left" )? this.legend.width : 0 ),
		top: this.options.padding + ( ( this.options.legendPosition == "top" )? this.legend.height : 0 ),
		right: this.options.width - this.options.padding - ( ( this.options.legendPosition == "right" )? this.legend.width : 0 ),
		bottom: this.options.height - this.options.padding - ( ( this.options.legendPosition == "bottom" )? this.legend.height : 0 ),
		graphWidth: this.options.width - 2 * this.options.padding - ( ( this.options.legendPosition == "right" || this.options.legendPosition == "left" )? this.legend.width : 0 ),
		graphHeight: this.options.height - 2 * this.options.padding - ( ( this.options.legendPosition == "bottom" || this.options.legendPosition == "top" )? this.legend.height : 0 )
	}

	this._c.zoomGraphWidth = this._c.graphWidth  * (1 + this._zoomLevel/10);

	if ( this._graphMove >= 0 ) {
		this._graphMove = 0;
	}
	else if ( ( this._c.zoomGraphWidth + this._graphMove ) < this._c.graphWidth ) {
		this._graphMove = this._c.graphWidth - this._c.zoomGraphWidth;
	}

	this._data = JSON.parse(JSON.stringify(this._origData));
	if ( this.origItems ) { this.options.items = JSON.parse(JSON.stringify(this.origItems)); }

	if ( this.options.incremental ) { this._computeIncrement(); }

	this._computeExtremes();
	this._computeStepY();
	this._computeStepX(this.options.labelsToEndX);
	this._computeLines();
}

JAK.Chart.Line.prototype._computeExtremes = function() {
	var all = [];

	for (var i = 0; i < this._data.length; i++) {
		if ( !this.options.items[i] || !this.options.items[i].deactive ) {
			var data = this._data[i];
			for (var j = 0; j < data.length; j++) {
				var value = data[j].data;
				if (value !== null) { all.push(value); }
			}
		}
	}
	all.sort(function(a,b) {return a-b;});
	var min = all[0] || 0;
	var max = all[all.length-1] || 0;
	if (min == max) { this.options.zero = true; }

	if (this.options.zero) {
		if (min > 0) { min = 0; }
		if (max < 0) { max = 0; }
	}

	if (this.options.min !== null) { min = this.options.min; }
	if (this.options.max !== null) { max = this.options.max; }
	this._c.min = min;
	this._c.max = max;
}

JAK.Chart.Line.prototype._computeStepY = function() {
	var c = this._computed;

	var diff = c.max - c.min;
	var step = diff / (this.options.rows.count);
	var base = Math.floor(Math.log(step) / Math.log(10));
	var divisor = Math.pow(10, base);
	var optimal = Math.round(step / divisor) * divisor;

	if (this.options.min !== null && this.options.max !== null) { /* uzivatel zadal obe meze */
		c.stepY = step;
	} else {
		c.stepY = optimal;
		var rounded = Math.ceil(diff / optimal) * optimal;

		if (this.options.min !== null) { /* uzivatel zadal spodni mez */
			c.max = c.min + rounded;
		} else if (this.options.max !== null) { /* uzivatel zadal horni mez */
			c.min = c.max - rounded;
		} else { /* uzivatel nezadal zadnou mez */
			c.min = Math.floor(c.min / optimal) * optimal;
			c.max = Math.ceil(c.max / optimal) * optimal;
		}
	}

}

JAK.Chart.Line.prototype._computeStepX = function(toEnd) {
	var displacement = this.options.spacing || 0;
	var labelsLength = ( toEnd ) ? (this.options.labels.length - 1) : this.options.labels.length; // rozhodnuti zda ma byt labels az do konce grafu
	this._c.stepX = ( this._c.graphWidth * (1 + this._zoomLevel/10) - displacement ) / labelsLength;
}

JAK.Chart.Line.prototype._computeLines = function() {
	if ( this.origItems ) { this.options.items = JSON.parse(JSON.stringify(this.origItems)); }
	this._lines = [];
	this._eventLabel = [];
	this._pointMap = [];
	this._note = [];
	var c = this._c;
	for(var i = 0; i < this._data.length ; i++) {
		var data = this._data[i];
		var step = ( this._c.graphWidth * (1 + this._zoomLevel/10) - this.options.gridPadding * 2 * (1 + this._zoomLevel/10) ) / (data.length - 1)
		var color = ( this.__insertToChart ) ? this._colorMap(i, this.__insertToChart._data.length) : this._colorMap(i);
		var datapoints = [];
		var dataLabels = [];
		var pointPercentage = [];

		this._pointMap.push([]);

		for ( var j = 0; j < data.length; j++ ) {
			var point = data[j].data;

			if ( this.options.min !== null && point < this.options.min ) {
				point = 0;
			}
			else if ( this.options.max !== null && point > this.options.max ) {
				point = this.options.max;
			}

			var x =  this._graphMove + this._c.left + step * j + this.options.gridPadding * (1 + this._zoomLevel/10);
			var y = this._c.bottom - (this._c.graphHeight * ( point - this._c.min ) / ( this._c.max - this._c.min ));
			pointPercentage.push( ( point - this._c.min ) / ( this._c.max - this._c.min ) * 100);

			if ( data[j].note && data[j].note.id ) {
				var eventLabel = data[j].note;

				if ( !this._eventLabel[eventLabel.id] ) {
					this._eventLabel[eventLabel.id] = eventLabel;
					this._eventLabel[eventLabel.id].start = x;
				}

				if ( eventLabel.end && this._eventLabel[eventLabel.id] ) {
					this._eventLabel[eventLabel.id].end = x;
				}

				if ( !eventLabel.start ) { data[j].note.hide = true; }
			}

			if ( point == null ) { y = null; }

			datapoints[j] = [x, y];
			if ( data[j].note ) { data[j].note.point = datapoints[j]; }
			dataLabels[j] = [data[j].label, data[j].data, data[j].note];

			if ( this.options.noteShow && data[j].note ) {
				this._note.push(data[j].note);
			}

			var pointMapFrom = ( j == 0 ) ? (0 + this.options.padding/2) : (x - step/2);
			var pointMapTo = ( j+1 == data.length ) ? (x + step) : (x + step/2);
			this._pointMap[this._pointMap.length-1][j] = {from: pointMapFrom, to: pointMapTo};
		}

		if ( !this.options.items[i] || !this.options.items[i].deactive ) {
			this._lines.push({label:dataLabels, color: color, datapoints: datapoints, step:step, fill:color, active: true, percentage: pointPercentage});
		}
	}
}

JAK.Chart.Line.prototype._recountParentChart = function () {
	var c = this._c;
	if ( this.options.sameMetric) {
		if ( c.max > this.__insertToChart._c.max ) {
			this.__insertToChart._c.max = c.max;
			this.__insertToChart._c.stepY = c.stepY;
		}
		else {
			this._c.max = this.__insertToChart._c.max;
			this._computeLines();
		}
		this.__insertToChart._draw();
	}
}

JAK.Chart.Line.prototype._draw = function() {

	if ( !this._redrawing ) {
		this._backend.clear();

		this._gridGroup = this._b.createGroup();
		this._textGroupX = this._b.createGroup();
		this._textGroupY = this._b.createGroup();
		if ( this._eventLabel ) { this._eventLabelGroup = this._b.createGroup(); }

	}
	else {
		var gridFrame = JAK.gel(this._gridFrame);

		JAK.DOM.clear(this._gridGroup[1]);
		JAK.DOM.clear(this._textGroupX[1]);
		JAK.DOM.clear(this._textGroupY[1]);

		if ( this._eventLabelGroup ) {
			JAK.DOM.clear(this._eventLabelGroup[1]);
		}
		gridFrame.parentNode.removeChild(gridFrame);

		for ( i in this._groups ) {
			JAK.DOM.clear(this._groups[i][1]);
		}

		if ( this.options.legendShow || this.options.noteShow ) {
			if ( this.options.noteShow ) {
				var items = this.legendElm.getElementsByTagName("li");

				for ( var i = 0; i < items.length; i++ ) {
					noteId = items[i].id.replace("label-","");
					JAK.gel(noteId).parentNode.removeChild(JAK.gel(noteId));
				}
			}
			this.options.items = [];

			this.legendElm.parentNode.removeChild(this.legendElm);
			this.legendElm = null;
		}
	}

	// Vertikální mřížka
	this._drawVarticalGrid((this.options.spacing || 0));

	// Horizontální mřížka
	this._drawHorizontalGrid();

	if ( this._eventLabel ) { this._drawEventLabel(); }

	this._drawLines();

	// otoceni poradi aby nedochazelo k prekrivani pri incremental = true
	for ( var i = 1; i <= this._groups.length; i++ ) {
		this._b._g.appendChild(this._groups[this._groups.length - i][1]);
	}

	// Rámeček
	this._drawFrameGrid();

	if ( ( this.options.interactiveLineX || this.options.interactiveLineY ) && !this._redrawing ) {
		this._interactiveLinesGroup = this._b.createGroup();
	}

	// Popisky na ose Y
	this._drawLabelsY(this.options.labelsY);

	// Popisky na ose X
	this._drawLabelsX((this.options.spacing || 0));

	if ( this.options.secondLabelsX.length > 0 && !this._redrawing ) { this._drawVarticalGridSec(); }

	if ( this.legend.elm  && !this._redrawing) {
		this.legend.elm.parentNode.removeChild(this.legend.elm);
		this.legend.elm = null;
	}

	if ( this._note.length > 0 ) {
		this.options.items = [];
		for ( var i = 0; i < this._note.length; i++ ) {
			this.options.items.push(this._note[i]);
		}
	}

	if ( this.options.legendShow || this.options.noteShow ) { this.legend.elm = this._drawLegend(this.options.items, this._note); }

	if ( this.options.zoomable ) { this._addZoomableMask(); }
	else if ( !this._redrawing ) { this.options.previewGraph.height = 0; }

	if ( this.options.hover ) {
		for ( var i in this._lines ) {
			this._activePointGroup[i] = this._b.createGroup();
		}
	}

	if ( this.options.hoverPointShowAllTime ) { this._drawPointsOnLine(); }

	this._insertToPage();

	if ( this.options.interactiveLineValue && !this._redrawing ) {
		this._createIntLineValContainer();
	}

	if ( this.options.computeOverlap && this._labelsX.length ) { this._computeOverlap(this._labelsX, this._c.graphWidth); }

	if ( this.options.showPointValue && !this._redrawing ) { this._createPointValContainer(); }

	if ( this.options.onloadAnimation && !this._redrawing ) { this._onloadAnimation(); }

}

// Vykreslení do existujiciho grafu
JAK.Chart.Line.prototype._drawToGraph = function() {

	this._drawLines();

	// otoceni poradi aby nedochazelo k prekrivani pri incremental = true
	for ( var i = 1; i <= this._groups.length; i++ ) {
		this._b._g.appendChild(this._groups[this._groups.length - i][1]);
	}

	if ( this.options.interactiveLineX || this.options.interactiveLineY ) {
		this._interactiveLinesGroup = this._b.createGroup();
	}

	if ( !this.options.sameMetric ) {
		this._gridGroup = this._b.createGroup();
		this._textGroupX = this._b.createGroup();
		this._textGroupY = this._b.createGroup();
		this.options.labelsYPosition = "right";
		this.options.frame.position = "right";

		// Horizontální mřížka sekundární osy
		this._drawHorizontalGridSec();

		this._drawFrameGrid();

		// Popisky na ose Y
		this._drawLabelsY();
	}

	if ( this.options.secondLabelsX.length > 0 ) {
		this._drawVarticalGridSec(this.options.gridPadding * (1 + this._zoomLevel/10));

		this.options.labelsXPosition = "top";
		this.options.labels = this.options.secondLabelsX;
		this._c.stepX = ( this._c.graphWidth - this.options.gridPadding * 2 * (1 + this._zoomLevel/10) ) / ( this.options.secondLabelsX.length - 1 );

		this._drawLabelsX(this.options.gridPadding * 2 * (1 + this._zoomLevel/10));
	}

	if ( this.options.hover ) {
		for ( var i in this._lines ) {
			this._activePointGroup[i] = this._b.createGroup();
		}
	}

	if ( this.options.hoverPointShowAllTime ) { this._drawPointsOnLine(); }

	this._insertToPage();

	if ( this.options.interactiveLineValue ) {
		this._createIntLineValContainer();
	}

	if ( this.options.showPointValue ) { this._createPointValContainer(); }

	if ( this.options.onloadAnimation ) { this._onloadAnimation(); }

}

JAK.Chart.Line.prototype._drawLines = function() {
	var fillCount = 0;
	for ( var i in this._lines ) {
		var line = this._lines[i];
		var first = line.datapoints[0];
		var last = line.datapoints[line.datapoints.length - 1];

		if ( !this._redrawing || !this._groups[i] ) {
			this._groups[i] = this._b.createGroup();
		}

		// Plocha grafu
		if( ( this.options.fill && !this.options.onlyFirstFill ) || ( this.options.fill && this.options.onlyFirstFill && !fillCount ) ) {
			var clonedDataPoints = line.datapoints.slice(0,line.datapoints.length);

			var fillPath = this._createPathData(clonedDataPoints, first[0], last[0], true);

			var fillElm = this._b.drawPath(fillPath,{strokeColor:"none", fillOpacity:this.options.fillOpacity, fillColor:line.color},this._groups[i][1],"fill");

			fillCount++;
		}

		// Samotná linka grafu
		var path = this._createPathData(line.datapoints);

		var pathElm = this._b.drawPath(path,{strokeColor:((this.options.lineColor) ? this.options.lineColor : line.color), lineWidth: this.options.lineWidth},this._groups[i][1], "main");
	}
}

JAK.Chart.Line.prototype._drawPointsOnLine = function () {
	var lines = this._lines;

	for ( var i = 0; i < lines.length; i++ ) {
		if ( lines[i].active && this.options.hover ) {
			var pointMap = this._pointMap[i];
			var datapoints = lines[i].datapoints;
			this._activePoint[i] = [];
			var path = [];

			for ( var x = 0; x < pointMap.length; x++ ) {
				var datapoint = datapoints[x];
				var point = pointMap[x];
				var pointType = i % 5;

				if ( datapoint[0] < ( this._c.left - this.options.hoverPointWidth / 2 ) || datapoint[0] > ( this._c.right + this.options.hoverPointWidth / 2 ) || datapoint[1] === null) {
					continue;
				}

				switch (pointType) {
					case 0:
						// krouzek
						/*this._activePoint[i][x] = this._backend.drawCircle(datapoint[0], datapoint[1], this.options.hoverPointWidth, {
							lineWidth: this.options.hoverPointStrokeWidth,
							fillColor: ( this.options.hoverPointFill == "colorPalette" ) ? lines[i].color : this.options.hoverPointFill,
							fillOpacity: this.options.hoverPointOpacity,
							strokeColor: ( this.options.hoverPointStrokeColor == "colorPalette" ) ? lines[i].color : this.options.hoverPointStrokeColor
						}, this._activePointGroup[i][1]);*/

						path.push([" M", datapoint[0], datapoint[1] - parseFloat(this.options.hoverPointWidth) - parseFloat(this.options.hoverPointStrokeWidth) / 2, "a", this.options.hoverPointWidth, this.options.hoverPointWidth, "0 1 0 1 0 Z"]);
					break;

					case 1:
						// ctverecek
						/*this._activePoint[i][x] = this._backend.drawRect(datapoint[0] - this.options.hoverPointWidth, datapoint[1] - this.options.hoverPointWidth, this.options.hoverPointWidth * 2, this.options.hoverPointWidth * 2, {
							lineWidth: this.options.hoverPointStrokeWidth,
							fillColor: ( this.options.hoverPointFill == "colorPalette" ) ? lines[i].color : this.options.hoverPointFill,
							fillOpacity: this.options.hoverPointOpacity,
							strokeColor: ( this.options.hoverPointStrokeColor == "colorPalette" ) ? lines[i].color : this.options.hoverPointStrokeColor
						}, this._activePointGroup[i][1]);*/
						path.push([" M", datapoint[0] - parseFloat(this.options.hoverPointWidth), datapoint[1] - parseFloat(this.options.hoverPointWidth), "l", this.options.hoverPointWidth * 2, 0, "l", 0, this.options.hoverPointWidth * 2, "l", (-2 * this.options.hoverPointWidth), 0, "Z"]);
					break;

					case 2:
						// trojuhelnicek
						/*this._activePoint[i][x] = this._backend.drawPolygon([
							[datapoint[0] - this.options.hoverPointWidth * 1.3, datapoint[1] + this.options.hoverPointWidth],
							[datapoint[0], datapoint[1] - this.options.hoverPointWidth * 1.6],
							[datapoint[0] + this.options.hoverPointWidth * 1.3, datapoint[1] + this.options.hoverPointWidth]
						], {
							lineWidth: this.options.hoverPointStrokeWidth,
							fillColor: ( this.options.hoverPointFill == "colorPalette" ) ? lines[i].color : this.options.hoverPointFill,
							fillOpacity: this.options.hoverPointOpacity,
							strokeColor: ( this.options.hoverPointStrokeColor == "colorPalette" ) ? lines[i].color : this.options.hoverPointStrokeColor
						}, this._activePointGroup[i][1]);*/
						path.push([" M", datapoint[0] - this.options.hoverPointWidth * 1.3, datapoint[1] + this.options.hoverPointWidth, "L", datapoint[0], datapoint[1] - this.options.hoverPointWidth * 1.6, "L", datapoint[0] + this.options.hoverPointWidth * 1.3, datapoint[1] + this.options.hoverPointWidth, "Z"]);
					break;

					case 3:
						// kosoctverecek
						/*this._activePoint[i][x] = this._backend.drawPolygon([
							[datapoint[0], datapoint[1] - this.options.hoverPointWidth * 1.2],
							[datapoint[0] - this.options.hoverPointWidth * 1.2, datapoint[1]],
							[datapoint[0], datapoint[1] + this.options.hoverPointWidth * 1.2],
							[datapoint[0] + this.options.hoverPointWidth * 1.2, datapoint[1]]
						], {
							lineWidth: this.options.hoverPointStrokeWidth,
							fillColor: ( this.options.hoverPointFill == "colorPalette" ) ? lines[i].color : this.options.hoverPointFill,
							fillOpacity: this.options.hoverPointOpacity,
							strokeColor: ( this.options.hoverPointStrokeColor == "colorPalette" ) ? lines[i].color : this.options.hoverPointStrokeColor
						}, this._activePointGroup[i][1]);*/
						path.push([" M", datapoint[0], datapoint[1] - this.options.hoverPointWidth * 1.2, "L", datapoint[0] - this.options.hoverPointWidth * 1.2, datapoint[1], "L", datapoint[0], datapoint[1] + this.options.hoverPointWidth * 1.2, "L", datapoint[0] + this.options.hoverPointWidth * 1.2, datapoint[1], "Z"]);
					break;

					case 4:
						// obracenej trojuhelnicek
						/*this._activePoint[i][x] = this._backend.drawPolygon([
							[datapoint[0] - this.options.hoverPointWidth * 1.3, datapoint[1] - this.options.hoverPointWidth],
							[datapoint[0], datapoint[1] + this.options.hoverPointWidth * 1.6],
							[datapoint[0] + this.options.hoverPointWidth * 1.3, datapoint[1] - this.options.hoverPointWidth]
						], {
							lineWidth: this.options.hoverPointStrokeWidth,
							fillColor: ( this.options.hoverPointFill == "colorPalette" ) ? lines[i].color : this.options.hoverPointFill,
							fillOpacity: this.options.hoverPointOpacity,
							strokeColor: ( this.options.hoverPointStrokeColor == "colorPalette" ) ? lines[i].color : this.options.hoverPointStrokeColor
						}, this._activePointGroup[i][1]);*/
						path.push([" M", datapoint[0] - this.options.hoverPointWidth * 1.3, datapoint[1] - this.options.hoverPointWidth, "L", datapoint[0], datapoint[1] + this.options.hoverPointWidth * 1.6, "L", datapoint[0] + this.options.hoverPointWidth * 1.3, datapoint[1] - this.options.hoverPointWidth, "Z"]);
					break;
				}
			}

			this._activePoint[i] = this._b.drawPath(path,{strokeColor:(( this.options.hoverPointStrokeColor == "colorPalette" ) ? lines[i].color : this.options.hoverPointStrokeColor), lineWidth: this.options.hoverPointStrokeWidth, fillColor: ( this.options.hoverPointFill == "colorPalette" ) ? lines[i].color : this.options.hoverPointFill, fillOpacity: this.options.hoverPointOpacity}, this._activePointGroup[i][1]);
		}
	}
}

JAK.Chart.Line.prototype._addLabel = function (i, xT, yT, txt, textAlign) {
	var display,
		mouseoverAction;
	switch ( this.options.showLabel ) {
		case "alltime" :
			display = "block";
			break;
		case "mouseover" :
			display = "none";
			break;
		case "click" :
			display = "none";
			break;
		default :
			display = null;
			break
	}

	if ( this._labels[i] && JAK.gel(this._labels[i][0]) ) {
		var oldLabel = JAK.gel(this._labels[i][0]);
		oldLabel.parentNode.removeChild(oldLabel);
	}
	this._labels[i] = [this.createLabel(xT, yT, txt, {textAlign: textAlign, display: display})];
}

JAK.Chart.Line.prototype._createIntLineValContainer = function () {
	var valContainer,
		xValContainer,
		yValContainer

	valContainer = JAK.mel("p", {className: "lineValueContainer"});

	if ( this.options.interactiveLineValue[1] ) {
		yValContainer = JAK.mel("span", {className: "yValue"});
		this._lineValueContainer[0] = yValContainer;

		valContainer.appendChild(yValContainer);
	}

	if ( this.options.interactiveLineValue[0] ) {
		xValContainer = JAK.mel("span", {className: "xValue"});
		this._lineValueContainer[1] = xValContainer;

		valContainer.appendChild(xValContainer);
	}

	this._parentElm.appendChild(valContainer);
}

JAK.Chart.Line.prototype._createPointValContainer = function () {
	var valContainer;

	valContainer = JAK.mel("p", {className: "pointValueContainer"});
	valContainer.style.maxWidth = (this.options.width - 400 -this.legend.reduceHeight ) + "px";
	this._pointValueContainer = valContainer;

	this._parentElm.appendChild(valContainer);
}

JAK.Chart.Line.prototype._previewGraph = function () {
	var coordinates = [];
	var previewGraph = null;
	var previewGraphActive = null;
	var line = (this.options.incremental) ? this._lines[this._lines.length - 1] : this._lines[0];
	if ( line ) {
		var stepX = ( this._c.graphWidth - this.options.gridPadding * 2 ) / ( line.datapoints.length - 1);

		coordinates.push([this._c.left + this.options.gridPadding, this._c.bottom + this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph]);

		for ( var x = 0; x < line.datapoints.length; x++ ) {
			var point = this._c.bottom + this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph - ( line.percentage[x] / 100 * this.options.previewGraph.height );
			if ( line.percentage[x] < 0 ) {
				point = this._c.bottom + this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph;
			}

			coordinates.push([this._c.left + stepX * x + this.options.gridPadding, point]);
		}

		coordinates.push([this._c.right - this.options.gridPadding, this._c.bottom + this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph]);

		previewGraph = this._b.drawPolygon([coordinates], {lineWidth:this.options.previewGraph.lineWidth, strokeColor:this.options.previewGraph.colorLine, fillColor: (this.options.previewGraph.path) ? this.options.previewGraph.colorPath : "none", fillOpacity: this.options.previewGraph.fillOpacity},this._zoomableGroup[1]);
		previewGraphActive = this._b.drawPolygon([coordinates], {lineWidth:this.options.previewGraph.lineWidth, strokeColor:this.options.previewGraph.activeColorLine, fillColor: (this.options.previewGraph.path) ? this.options.previewGraph.activeColorPath : "none", fillOpacity: this.options.previewGraph.fillOpacity},this._zoomableGroup[1]);
	}

	return [previewGraph, previewGraphActive];
}

JAK.Chart.Line.prototype._onloadAnimation = function () {
	var onloadAnimation = [];
	var type = this.options.onloadAnimationType;
	var timeoutInc = 0;

	if ( type == "computeVertical" ) {
		var datapoint = [];
		var all = [];
		var obj = this;

		for ( var i = 0; i < this._lines.length; i++ ) {
			var datapointY = [[],[],[]];
			var line = this._lines[i];

			datapoint[i] = line.datapoints.slice();

			for ( var x = 0; x < datapoint[i].length; x++ ) {
				/*if ( datapoint[i][x][1] === null ) { // chyba kvuli hodnote null - preruseni grafu
					all.push(null);
					datapointY[0].push(null);
					datapointY[1].push(null);
					datapoint[i][x][1] = null;
				}
				else {*/
					all.push(datapoint[i][x][1]);
					datapointY[0].push(datapoint[i][x][1]);
					datapointY[1].push(this._c.bottom);
					datapoint[i][x][1] = this._c.bottom;
				//}
			}

			all.sort(function(a,b) {return a-b;});
			var min = all[0] || 0;

			for ( var x = 0; x < datapoint[i].length; x++ ) {
				datapointY[2][x] = min;
			}

			var mainPath = [JAK.DOM.getElementsByClass("main", this._groups[i][1])[0]];
			if ( this.options.fill ) { mainPath.push(JAK.DOM.getElementsByClass("fill", this._groups[i][1])[0]); }

			mainPath[0].setAttribute("d","");
			if ( this.options.fill ) { mainPath[1].setAttribute("d",""); }

			onloadAnimation[i] = new JAK.Interpolator(datapointY[1], datapointY[2], this.options.onloadAnimationLength, null, {interpolation: JAK.Interpolator.QUADRATIC});
			onloadAnimation[i].datapoint = datapoint[i];
			onloadAnimation[i].origDatapoint = datapointY[0];
			onloadAnimation[i].mainPath = mainPath;
			onloadAnimation[i].callback = function (a) {
				for ( var x = 0; x < a.length; x++) {
					if ( a[x] > this.origDatapoint[x] ) { this.datapoint[x][1] = a[x]; }
					else { this.datapoint[x][1] = this.origDatapoint[x]; }
				}

				var newPathData = [
					obj._createPathData(this.datapoint),
					obj._createPathData(this.datapoint, this.datapoint[0][0], this.datapoint[this.datapoint.length - 1][0])];

				for ( var x = 0; x < this.mainPath.length; x++ ) {
					var points = [];

					for ( var y = 0; y < newPathData[x].length; y++ ) {
						var step = newPathData[x][y];
						points.push(step.join(" "));
					}
					var path = points.join(" ");

					this.mainPath[x].setAttribute("d",path);
				}
			}

			// nastaveni za jak dlouho ma dojit ka zacatku animace dalsi liny - nutno dodelat
			timeoutInc = timeoutInc + this.options.onloadAnimationDelay;

			this._closeanimation = false;

			onloadAnimation[i].start();
		}
	}

	if ( type == "horizontal" || type == "vertical" ) {
		for ( var i = 0; i < this._lines.length; i++ ) {
			var settings = {
				animeAttribute: "width",
				startWidth: "0",
				startHeight: "100%",
				maskLeft: this.options.padding,
				maskTop: this.options.padding,
				startValue: 0,
				endValue: this._c.graphWidth,
				valueUnit: "",
				animationLength: this.options.onloadAnimationLength
			}

			if ( type == "vertical" ) {
				settings.animeAttribute = "y";
				settings.startWidth = this._c.graphWidth;
				settings.maskTop = this.options.padding + this._c.graphHeight + (( this.options.legendPosition == "top" ) ? this.legend.reduceHeight : 0);
				settings.startValue = this.options.padding + this._c.graphHeight + (( this.options.legendPosition == "top" ) ? this.legend.reduceHeight : 0);
				settings.endValue = this.options.padding + (( this.options.legendPosition == "top" ) ? this.legend.reduceHeight : 0),
				settings.valueUnit = "";
			}

			this._closeanimation = false;

			onloadAnimation[i] = this._createBasicAnimation(settings, i);
			// nastaveni za jak dlouho ma dojit ka zacatku animace dalsi liny - nutno dodelat
			//timeoutInc = timeoutInc + this.options.onloadAnimationDelay;
			onloadAnimation[i].start();
		}
	}
}

JAK.Chart.Line.prototype._oncloseAnimation = function () {
	var oncloseAnimation = [];
	var type = this.options.oncloseAnimationType;
	var timeoutInc = 0;

	if ( type == "computeVertical" ) {
		var datapoint = [];
		var all = [];
		var obj = this;

		for ( var i = 0; i < this._lines.length; i++ ) {
			var datapointY = [[],[],[]];
			var line = this._lines[i];

			datapoint[i] = line.datapoints.slice();

			for ( var x = 0; x < datapoint[i].length; x++ ) {
				all.push(datapoint[i][x][1]);
				datapointY[0].push(datapoint[i][x][1]);
				datapointY[1].push(this._c.bottom);
			}

			all.sort(function(a,b) {return a-b;});
			var min = all[0] || 0;

			for ( var x = 0; x < datapoint[i].length; x++ ) {
				datapointY[2][x] = min;
			}

			var mainPath = [JAK.DOM.getElementsByClass("main", this._groups[i][1])[0]];
			if (this.options.fill) { mainPath.push(JAK.DOM.getElementsByClass("fill", this._groups[i][1])[0]); }

			oncloseAnimation[i] = new JAK.Interpolator(datapointY[2], datapointY[1], this.options.oncloseAnimationLength, null, {interpolation: JAK.Interpolator.QUADRATIC});
			oncloseAnimation[i].datapoint = datapoint[i];
			oncloseAnimation[i].origDatapoint = datapointY[0];
			oncloseAnimation[i].mainPath = mainPath;
			oncloseAnimation[i].callback = function (a) {
				for ( var x = 0; x < a.length; x++) {
					if ( a[x] > this.origDatapoint[x] ) { this.datapoint[x][1] = a[x]; }
					else { this.datapoint[x][1] = this.origDatapoint[x]; }
				}

				var newPathData = [
					obj._createPathData(this.datapoint),
					obj._createPathData(this.datapoint, this.datapoint[0][0], this.datapoint[this.datapoint.length - 1][0])];

				for ( var x = 0; x < this.mainPath.length; x++ ) {
					var points = [];

					for ( var y = 0; y < newPathData[x].length; y++ ) {
						var step = newPathData[x][y];
						points.push(step.join(" "));
					}
					var path = points.join(" ");

					this.mainPath[x].setAttribute("d",path);
				}
			}

			// nastaveni za jak dlouho ma dojit ka zacatku animace dalsi liny - nutno dodelat
			timeoutInc = timeoutInc + this.options.oncloseAnimationDelay;

			this._closeanimation = true;

			oncloseAnimation[i].start();
		}
	}

	if ( type == "horizontal" || type == "vertical" ) {
		for ( var i = 0; i < this._lines.length; i++ ) {
			var settings = {
				animeAttribute: "x",
				startWidth: "100%",
				startHeight: "100%",
				maskLeft: this.options.padding,
				maskTop: this.options.padding,
				startValue: this.options.padding + (( this.options.legendPosition == "left" ) ? this.legend.reduceWidth : 0),
				endValue: this.options.padding + this._c.graphWidth + (( this.options.legendPosition == "left" ) ? this.legend.reduceWidth : 0),
				valueUnit: "",
				animationLength: this.options.oncloseAnimationLength
			}

			if ( type == "vertical" ) {
				settings.animeAttribute = "y";
				startValue = this.options.padding;
				settings.maskTop = this.options.padding + (( this.options.legendPosition == "top" ) ? this.legend.reduceHeight : 0);
				settings.startValue= this.options.padding + (( this.options.legendPosition == "top" ) ? this.legend.reduceHeight : 0);
				settings.endValue = this.options.padding + this._c.graphHeight + (( this.options.legendPosition == "top" ) ? this.legend.reduceHeight : 0);
			}

			this._closeanimation = true;

			oncloseAnimation[i] = this._createBasicAnimation(settings, i);

			oncloseAnimation[i].start();
		}
	}
}

JAK.Chart.Line.prototype.addLine = function(data) {
	this._origData.push(data);

	this._zoom();
}

JAK.Chart.Line.prototype.removeLine = function(index) {
	this._origData.splice(index, 1);

	this._zoom();
}

JAK.Chart.Line.prototype.setActiveOnLegend = function (elm, active) {
	var groupId = elm.id.replace("label-","");
	var group = JAK.gel(groupId);
	var fill = JAK.DOM.getElementsByClass("fill", group);

	if ( active ) {
		JAK.DOM.addClass(elm,"strong");
	}
	else {
		JAK.DOM.removeClass(elm,"strong");
	}

	fill[0].setAttribute("fill-opacity",( active ) ? this.options.activeFillOpacity : this.options.fillOpacity);
}