/**
 *        /\
 *  _____//\\    _____
 *  _____/  \\  /_____
 *           \\//
 *            \/
 *
 * @overview Sloupcový graf
 * @version 2.3
 * @author zara, majak
 */

JAK.Chart.Bar = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart.Bar",
	VERSION: "2.3",
	EXTEND: JAK.Chart,
	IMPLEMENT: [JAK.ISignals, JAK.Chart.Grid]
})

JAK.Chart.Bar.prototype.$constructor = function(obj, data, options, insertToChart) {
	var data = this._prepareData(data);
	this.options = {
		backend: JAK.Chart.Backend.SVG,
		draw: true,
		width :200,
		height: 200,

		min: null,
		max: null,

		padding: 40,

		lineWidth: 0,
		lineColor: "none",
		barWidth: 0, // kdyz 0 dopocita se automaticky
		spacing: 5,
		categorySpacing: 0,

		graphType: 0, //  0 = horizontal || 1 = vertical

		sectorColors:["#a71e72","#e51114","#f37944","#fcc83e","#aad400",
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
			width: 2,
			color: "#dcdcdc",
			complete: false,
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
		labelsY: [],
		labelsYPosition: "left", // left || right
		labelsXPosition: "bottom", // bottom || top
		minSpaceLabelX: 6,

		computeOverlap: true,

		label: true, // false || true
		showLabel: "mouseover", // alltime || events ('click', 'mouseover')
		labelOnCursor: false, // zdali se bude label prichytavat ke kurzoru mysi [ true || false ]
		labelPosition: {
			displacementY: 12,
			displacementX: -10,
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
		onloadAnimationLength: 1000,
		onloadAnimationDelay: 0,
		onloadAnimationType: "horizontal", // horizonatal, vertical, fade
		onloadAnimationReverse: false,

		oncloseAnimationLength: 800,
		oncloseAnimationDelay: 0,
		oncloseAnimationType: "horizontal", // horizonatal, vertical
		oncloseAnimationReverse: true,

		hover: false,
		hoverPointWidth: 4,
		hoverPointOpacity: 0.8,
		hoverPointFill: "colorPalette", // color or "colorPalette"
		hoverPointStrokeColor: "#fff", // color or "colorPalette"
		hoverPointStrokeWidth: 2,

		fillOpacity: 1,

		items: [],

		showBarsValue: false,

		sameMetric: true,

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

	this._sectorIds = [];

	this._pointerCleared = true;

	this._zoomLevel = options.zoomLevel || this.options.zoomLevel;
	this._pointer = 50;
	this._graphMove = options.graphMove || this.options.graphMove;
	this._downOnPreviewGraph = false;

	this._category = [];
	this._groups = [];
	this._anime = [];
	this._labels = [];
	this._note = [];

	this._redrawing = false;

	this._actualLabel = null;

	this._textGroupX = null;
	this._textGroupY = null;
	this._labelsX = [];
	this._labelsY = [];
	this._gridFrame = null;
	this.__insertToChart = insertToChart;

	this._eventLabel = [];

	this.$super(obj, data, options);

	this._isMouseDown = false;
	this._lastMouseMove = {left:[]};

	this._actualComputedGroup = 0;
	this.onloadAnimation = [];
	this.oncloseAnimation = [];

	this._ev.push(this.addListener('click', '_click', this._backend));
	//this._ev.push(this.addListener('mouseMove', '_mouseMove', this._backend));
	this._ev.push(this.addListener('mouseDown', '_mouseDown', this._backend));
	this._ev.push(this.addListener('mouseUp',  '_mouseUp', this._backend));
	this._ev.push(this.addListener('mouseOut', '_mouseOut', this._backend));
	this._ev.push(this.addListener('mouseOver', '_mouseOver', this._backend));
	this._ev.push(this.addListener('canvasMouseMove', '_mouseMove', this._backend));

	if ( this.options.zoomable ) {
		if (JAK.Browser.client == "gecko") {
			this._backend._ev.push(JAK.Events.addListener(this._backend.getContainer(), "DOMMouseScroll", this, "_scroll"));
		} else {
			this._backend._ev.push(JAK.Events.addListener(this._backend.getContainer(), "mousewheel", this, "_scroll"));
		}
	}
}

JAK.Chart.Bar.prototype._mouseDown = function(event) {
	var e = event.data.originalEvent;
	var eId = event.data.id;
	this._lastMouseMove.clientX = e.clientX;
	this._lastMouseMove.clientY = e.clientY;

	JAK.Events.cancelDef(e);

	var eventInscrollButtons = this._eventInscrollButtons(eId);
	var eventInMaskOnPreviewGraph = this._eventInMaskOnPreviewGraph();

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

JAK.Chart.Bar.prototype._mouseUp = function(event) {
	if ( this._downOnScrollButtons ) { this._zoom(); }
	this._isMouseDown = false;
	this._backend.getContainer().style.cursor = "default";
	//this._downOnScrollButtons = false;

	if ( this.options.callback.mouseUp.method ) {
		if ( !this.options.callback.mouseUp.obj ) { this.options.callback.mouseUp.obj = window; }
		this.options.callback.mouseUp.obj[this.options.callback.mouseUp.method](event.data.originalEvent);
	}

	//this._click(event);
	this._downOnPreviewGraph = false;
	this._downOnScrollButtons = false;
};

JAK.Chart.Bar.prototype._mouseOut = function(event) {
	var eId = event.data.id;

	if ( this._sectorIds[eId] && !this._isMouseDown ) {
		if ( ( this.options.showLabel == "mouseover" || this.options.showLabel == "click" ) && this.options.label ) {
			var label = JAK.gel(this._actualLabel);

			if ( label ) { label.parentNode.removeChild(label); }
			this._actualLabel = null;
		}

		if ( this.options.showBarsValue && this._barValueContainer ) { JAK.DOM.clear(this._barValueContainer); }
	}
}

JAK.Chart.Bar.prototype._mouseOver = function(event) {
	var eId = event.data.id;
	var e = event.data.originalEvent;
	var scroll = JAK.DOM.getBoxScroll(this._parentElm);
	var boxPosition = JAK.DOM.getBoxPosition(this._parentElm);
	var mousePosLeft = e.clientX - boxPosition.left + scroll.x;
	var mousePosTop = e.clientY - boxPosition.top + scroll.y;

	if ( this._sectorIds[eId] && !this._isMouseDown ) {
		var sectors = this._sectorIds[eId];
		var sector = null;
		for ( var i = 0; i < sectors.length; i++ ) {
			if ( sectors[i][2].left <= mousePosLeft && sectors[i][2].right >= mousePosLeft && sectors[i][2].top <= mousePosTop && sectors[i][2].bottom >= mousePosTop ) {
				sector = sectors[i];
				break;
			}
		}

		if ( this.options.showLabel == "mouseover" && this.options.label && sector ) {
			var coords = this._labels[sector[0]][sector[1]].coords;
			var label = this._labels[sector[0]][sector[1]].label[0];
			var c = this._c;

			if ( this.options.graphType ) { this._actualLabel = this.createLabel(coords.right, coords.fromBottom - this.options.barWidth / 2, label, {display: "block"}); }
			else { this._actualLabel = this.createLabel(( coords.left + this.options.barWidth / 2 ), coords.fromBottom, label, {display: "block"}); }
		}

		if ( this.options.showBarsValue && this._barValueContainer && sector ) {
			var valContainer = this._barValueContainer;

			for ( var i = 0; i < this._bars.length; i++) {
				if ( this.options.items[i] && this.options.items[i].deactive ) { continue; }

				var txtVal = JAK.cel("span");

				txtVal.style.color = this._bars[i][sector[1]].color;

				if ( valContainer.innerHTML != "" ) { valContainer.appendChild(JAK.ctext(" | ")); }
				txtVal.innerHTML = (this._bars[i][sector[1]].label[0] + " (" + ( this._bars[i][sector[1]].size || this._bars[i][sector[1]].value ) + ")");

				valContainer.appendChild(txtVal);
			}
		}
	}
}

JAK.Chart.Bar.prototype._mouseMove = function(event) {
	var e = event.data.originalEvent;
	var eId = event.data.id;
	this._lastMouseMove.clientX = e.clientX;
	this._lastMouseMove.clientY = e.clientY;

	/*if ( this.options.zoomable && !this._eventInGraph(e) && !this._eventInPreviewGraph() && !this._downOnScrollButtons ) {
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
			this._draw();
			this._moveZoomableMaskPreview();
			this._redrawing = false;

			if ( this.options.callback.graphMove.method ) {
				if ( !this.options.callback.graphMove.obj ) { this.options.callback.graphMove.obj = window; }
				this.options.callback.graphMove.obj[this.options.callback.graphMove.method](e);
			}
		}
	}
	else if ( this._sectorIds[eId] ) {
		var label = JAK.gel(this._actualLabel);
		if ( this.options.labelOnCursor && this.options.label ) {
			JAK.DOM.setStyle(label, {
				left: (event.data.originalEvent.layerX+10)+"px",
				top: (event.data.originalEvent.layerY+10)+"px",
				bottom: "auto",
				right: "auto"
			});
		}
	}
}

JAK.Chart.Bar.prototype._click = function(event) {
	var eId = event.data.id;

	if ( this._eventInPreviewGraph() && !this._downOnPreviewGraph && !this._downOnScrollButtons ) {
		var e = event.data.originalEvent;
		var scroll = JAK.DOM.getBoxScroll(this._parentElm);
		var boxPosition = JAK.DOM.getBoxPosition(this._parentElm);
		var mousePosLeft = e.clientX - boxPosition.left + scroll.x;

		this._moveGraph(( mousePosLeft - this._c.left ) * (1 + this._zoomLevel/10));
	}

	if ( this._sectorIds[eId] ) {
		var sector = this._sectorIds[eId];

		if ( this.options.showLabel == "click" && !this._actualLabel && this.options.label ) {
			var coords = this._labels[sector[0]][sector[1]].coords;
			var label = this._labels[sector[0]][sector[1]].label[0];
			var c = this._c;

			if ( this.options.graphType ) { this._actualLabel = this.createLabel(coords.right, c.graphHeight - coords.fromBottom + this.options.padding * 2 - this.options.barWidth / 2, label, {display: "block"}); }
			else { this._actualLabel = this.createLabel(( coords.left + this.options.barWidth / 2 ), coords.fromBottom, label, {display: "block"}); }
		} else if ( this.options.showLabel == "click" && this.options.label ) {
			var label = JAK.gel(this._actualLabel);

			label.parentNode.removeChild(label);
			this._actualLabel = null;
		}
	}

	this._downOnPreviewGraph = false;
	this._downOnScrollButtons = false;

	if ( this.options.callback.click.method ) {
		if ( !this.options.callback.click.obj ) { this.options.callback.click.obj = window; }
		this.options.callback.click.obj[this.options.callback.click.method](event.data.originalEvent);
	}
}

JAK.Chart.Bar.prototype._legendClick = function(e, elm) {
	if ( this.options.active ) {

		for ( var i = 0; i < this.oncloseAnimation.length; i++ ) {
			this.oncloseAnimation[i].stop();
		}
		for ( var i = 0; i < this.onloadAnimation.length; i++ ) {
			this.onloadAnimation[i].stop();
		}

		var groupId = elm.parentNode.id.replace("label-","");
		var group = JAK.gel(groupId);

		if ( JAK.DOM.hasClass(elm.parentNode, "deactive") ) {
			//group.style.display = "block";
			JAK.DOM.removeClass(elm.parentNode, "deactive");

			for ( key in this._groups ) {
				if ( this._groups[key][0] == groupId ) {
					this.origItems[key].deactive = false;
				}
			}
		}
		else {
			//group.style.display = "none";
			JAK.DOM.addClass(elm.parentNode, "deactive");

			for ( key in this._groups ) {
				if ( this._groups[key][0] == groupId ) {
					this.origItems[key].deactive = true;
				}
			}
		}

		this.options.barWidth = 0;
		this._compute();
		this._draw();

	}

	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
}

JAK.Chart.Bar.prototype._legendOver = function(e, elm){}

JAK.Chart.Bar.prototype._legendOut = function(e, elm){}

JAK.Chart.Bar.prototype._zoom = function(event) {
	var cursor;
	if ( typeof(event) != "undefined" ) {
		var target = JAK.Events.getTarget(event),
			coords = JAK.DOM.getBoxPosition(this._parentElm),
			left = this._lastMouseMove.clientX,
			scroll = JAK.DOM.getBoxScroll(this._parentElm);

		cursor = (left - coords.left + scroll.x - this.options.padding) / this._computed.graphWidth * 100;

		this._undefinedEvent = false;
	}
	else {
		this._undefinedEvent = true;
	}

	this._pointer = cursor || 50;

	var zoomInPixels = this._c.graphWidth * (1 + this.options.zoomStep/10) - this._c.graphWidth;

	if ( this._zoomLevel && !this._downOnScrollButtons && typeof(event) != "undefined" ) {
		this._graphMove += this._pointer / 100 * zoomInPixels * this._zoomType;
	}
	else if ( !this._downOnScrollButtons && typeof(event) != "undefined" ) {
		this._graphMove = 0;
	}

	this.options.onloadAnimation = false;
	this.options.barWidth = 0;

	if (this._actualLabel && JAK.gel(this._actualLabel)) {
		var actualLabel = JAK.gel(this._actualLabel);
		actualLabel.parentNode.removeChild(actualLabel);
		this._actualLabel = null;
	}

	if ( this.options.showBarsValue && this._barValueContainer ) { JAK.DOM.clear(JAK.gel(this._barValueContainer)); }

	this._compute();
	this._redrawing = true;
	this._moveZoomableMaskPreview();
	this._draw();
	this._redrawing = false;
};

JAK.Chart.Bar.prototype._compute = function() {
	this._c = this._computed = {
		left: this.options.padding + ( ( this.options.legendPosition == "left" )? this.legend.width : 0 ),
		top: this.options.padding + ( ( this.options.legendPosition == "top" )? this.legend.height : 0 ),
		right: this.options.width - this.options.padding - ( ( this.options.legendPosition == "right" )? this.legend.width : 0 ),
		bottom: this.options.height - this.options.padding - ( ( this.options.legendPosition == "bottom" )? this.legend.height : 0 ),
		graphWidth: this.options.width - 2 * this.options.padding - ( ( this.options.legendPosition == "right" || this.options.legendPosition == "left" )? this.legend.width : 0 ),
		graphHeight: this.options.height - 2 * this.options.padding - ( ( this.options.legendPosition == "bottom" || this.options.legendPosition == "top" )? this.legend.height : 0 ),
		max: 0,
		min: 0,
		step: 0
	}
	this._c.zoomGraphWidth = this._c.graphWidth  * (1 + this._zoomLevel/10);

	if ( this._graphMove >= 0 ) {
		this._graphMove = 0;
	}
	else if ( ( this._c.zoomGraphWidth + this._graphMove ) < this._c.graphWidth ) {
		this._graphMove = this._c.graphWidth - this._c.zoomGraphWidth;
	}

	var dataLength = 0;
	var labelsToEndX = false;

	this._numberOfActiveGroup = 0;

	this._data = JSON.parse(JSON.stringify(this._origData));
	if ( this.origItems ) { this.options.items = JSON.parse(JSON.stringify(this.origItems)); }

	/*for ( var i = 0; i < this._data.length; i++ ) {
		if ( this.options.items[i].deactive ) { this._data[i] = []; }
	}*/

	if ( this.options.incremental ) { this._computeIncrement(); }

	for ( var i = 0; i < this._data.length; i++ ) {
		if ( this.options.items[i] && this.options.items[i].deactive ) { continue; }
		this._numberOfActiveGroup++;
		var data = this._data[i];

		if ( dataLength < data.length ) { dataLength = data.length; }
		for ( var x = 0; x < data.length; x++ ) {
			if ( this._c.max < data[x].data ) {
				this._c.max = data[x].data;
			}
		}
	}

	if ( this._numberOfActiveGroup == 0 ) {
		dataLength = this._data[0].length;
		this._numberOfActiveGroup++;
	}

	if ( !this.options.barWidth ) {
		var graphSize = 0;

		if ( this.options.graphType ) { graphSize = this._c.graphHeight; }
		else { graphSize = this._c.graphWidth; }

		if ( this.options.incremental ) {
			this.options.barWidth = ( graphSize * (1 + this._zoomLevel/10) - ( ( dataLength + 1) * this.options.spacing ) ) / dataLength;
		}
		else {
			this.options.barWidth = ( ( graphSize * (1 + this._zoomLevel/10) - ( ( dataLength + 1) * this.options.spacing ) - ( dataLength * this.options.categorySpacing * ( this._numberOfActiveGroup - 1 ) ) ) / dataLength ) / this._numberOfActiveGroup;
		}
	}

	if ( this.options.barWidth < 0 && this._zoomLevel > 0 ) {
		this.options.barWidth = this.options.barWidth * -1;
	}

	if ( ( this.options.graphType && this.options.labels.length == 0 ) || this._computeLabel ) { labelsToEndX = true; } // urceni zda labels na X budou az na konec

	this._computeStepY();
	this._computeStepX(labelsToEndX);

	this._computeBars();
}

JAK.Chart.Bar.prototype._computeCoordsHorizontalBar = function (bar, item, category) {
	var c = this._computed;
	var activeItems = this._numberOfActiveGroup;

	if ( this._actualComputedGroup != bar.category && this._actualComputedGroup < bar.category ) { spacing = this.options.categorySpacing; }
	else { spacing = this.options.spacing; }

	var top = (item * this.options.barWidth) + (item * (activeItems - 1) * this.options.barWidth) + (category * this.options.barWidth) + ((item + 1) * this.options.spacing) + ((activeItems - 1) * item * this.options.categorySpacing) + (category * this.options.categorySpacing) + c.top;
	if ( this.options.incremental ) { top = (item * this.options.barWidth) + ((item + 1) * this.options.spacing) + c.top; }
	var fromBottom = c.graphHeight + (( this.options.legendShow && this.options.legendPosition == "top" ) ? this.legend.height * 2 : 0 ) + this.options.padding * 2 - top;
	var bottom = top + this.options.barWidth;
	var left = c.left;
	var right = ( c.graphWidth / c.max * bar.value ) + ( this.options.lineWidth / 2 ) + c.left;

	if ( right < 0 ) { left = 0; }

	this._actualComputedGroup = bar.category;

	return {fromBottom: fromBottom, top: top, bottom: bottom, left: left, right: right};
}

JAK.Chart.Bar.prototype._computeCoordsVerticalBar = function (bar, item, category) {
	var c = this._computed;
	var activeItems = this._numberOfActiveGroup;

	var fromBottom = (c.graphHeight / c.max * bar.value) - (this.options.lineWidth / 2) + c.top;
	var top = c.graphHeight - (c.graphHeight / c.max * bar.value) - (this.options.lineWidth / 2) + c.top;
	var bottom = c.bottom;
	var left = this._graphMove + ((item * this.options.barWidth) + (item * (activeItems - 1) * this.options.barWidth) + (category * this.options.barWidth) + ((item + 1) * this.options.spacing) + ((activeItems - 1) * item * this.options.categorySpacing) + (category * this.options.categorySpacing) + c.left + ( ( this.options.lineColor == "none" ) ? 0 : ( this.options.lineWidth ) ));
	if ( this.options.incremental ) { left = this._graphMove + ((item * this.options.barWidth) + ((item + 1) * this.options.spacing) + c.left); }
	var right = left + this.options.barWidth - ( ( this.options.lineColor == "none" ) ? 0 : ( this.options.lineWidth * 2 ) );

	if ( top < 0 ) { top = 0; }

	this._actualComputedGroup = bar.category;

	return {fromBottom: fromBottom, top: top, bottom: bottom, left: left, right: right};
}

JAK.Chart.Bar.prototype._computeStepY = function() {
	var c = this._computed;

	var diff = c.max - c.min;
	var step = diff / this.options.rows.count;
	var base = Math.floor(Math.log(step) / Math.log(10));
	var divisor = Math.pow(10, base);
	var optimal = Math.round(step / divisor) * divisor;

	if ( this.options.min !== null && this.options.max !== null && !this.options.graphType ) { /* uzivatel zadal obe meze */
		c.stepY = step;
	} else if ( !this.options.graphType ) {
		c.stepY = optimal;
	} else {
		if ( this.options.labels.length == 0 || this._computeLabel ) {
			c.stepY = c.graphHeight / this.options.labelsY.length;

			this.options.labels = [];
			this._labelsX = [];

			this.options.labels[0] = {name: "0" };

			for ( var i = 1; ( optimal * i ) < c.max; i++ ) {
				this.options.labels[i] = {name: optimal * i };
			}

			this.options.labels[this.options.labels.length] = {name: optimal * ( this.options.labels.length ) };
			this._computeLabel = true;
		}
	}

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

JAK.Chart.Bar.prototype._computeStepX = function(toEnd) {
	var displacement = (this.options.graphType) ? 0 : this.options.spacing;
	var labelsLength = ( toEnd ) ? (this.options.labels.length - 1) : this.options.labels.length; // rozhodnuti zda ma byt labels az do konce grafu
	this._c.stepX = ( this._c.graphWidth * (1 + this._zoomLevel/10) - displacement ) / labelsLength;
}

JAK.Chart.Bar.prototype._computeBars = function() {
	var dataLabels = [];
	this._bars = [];

	for ( var i = 0; i < this._data.length; i++ ) {
		var data = this._data[i];
		this._bars[i] = [];

		//if ( this.options.items[i].deactive ) { continue; }

		for ( var x = 0; x < data.length; x++ ) {
			var value = data[x].data;

			var color = ( this.__insertToChart ) ? this._colorMap(i, this.__insertToChart._data.length) : this._colorMap(i);

			this._bars[i].push({
				percentage: value / this._c.max * 100,
				color: color,
				value: value,
				label: [data[x].label],
				category: i,
				size: data[x].size,

			});
		}
	}
}

JAK.Chart.Bar.prototype._recountParentChart = function () {
	if ( this.options.sameMetric ) {
		if ( this._c.max > this.__insertToChart._c.max ) {
			this.__insertToChart.options.max = this._c.max;
			this.__insertToChart._c.stepY = this._c.stepY;
		}
		else {
			this._c.max = this.__insertToChart._c.max;
			this._computeBars();
		}
	}
	if ( this._c.stepX / 2 > this.options.barWidth ) { this.__insertToChart.options.gridPadding = ( this.options.barWidth / 2 + this.options.spacing ) * (1 + this._zoomLevel/10); }
	else { this.__insertToChart.options.gridPadding = ( this._c.stepX / 2 + this.options.spacing ) * (1 + this._zoomLevel/10); }

	this.__insertToChart.options.spacing = this.options.spacing;

	this.__insertToChart._compute();
	this.__insertToChart._draw();
}

JAK.Chart.Bar.prototype._draw = function() {
	var c = this._computed;
	var displacement = ( (this.options.graphType) ? 0 : this.options.spacing );

	if ( !this._redrawing ) {
		this._backend.clear();

		this._gridGroup = this._b.createGroup();
		this._textGroupX = this._b.createGroup();
		this._textGroupY = this._b.createGroup();
		if ( this._eventLabel ) { this._eventLabelGroup = this._b.createGroup(); }

	}
	else {
		if ( this._gridGroup ) { JAK.DOM.clear(this._gridGroup[1]); }
		if ( this._textGroupX ) { JAK.DOM.clear(this._textGroupX[1]); }
		if ( this._textGroupY ) { JAK.DOM.clear(this._textGroupY[1]); }

		if ( this._eventLabelGroup ) {
			JAK.DOM.clear(this._eventLabelGroup[1]);
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
			this._note = [];

			this.legendElm.parentNode.removeChild(this.legendElm);
			this.legendElm = null;
		}
	}

	this._drawBars();

	this._actualComputedGroup = null;

	// otoceni poradi aby nedochazelo k prekrivani pri incremental = true
	for ( var i = 1; i <= this._groups.length; i++ ) {
		if ( this.options.items[this._groups.length - i] && this.options.items[this._groups.length - i].deactive ) { continue; }
		this._b._g.appendChild(this._groups[this._groups.length - i][1]);
	}

	// Vertikální mřížka
	this._drawVarticalGrid(displacement);

	// Horizontální mřížka
	this._drawHorizontalGrid();

	if ( this._eventLabel ) { this._drawEventLabel(); }

	// Rámeček
	if ( !this._redrawing ) { this._drawFrameGrid(); }
	else { this._b._g.appendChild(JAK.gel(this._gridFrame)); }

	// Popisky na ose Y
	this._drawLabelsY(this.options.labelsY);

	// Popisky na ose X
	this._drawLabelsX(displacement);

	if ( this.options.secondLabelsX.length > 0 ) { this._drawVarticalGridSec(); }

	if ( this.legend.elm && !this._redrawing ) {
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

	this._insertToPage();

	if ( this.options.computeOverlap && this._labelsX.length > 0/* && this.options.graphType*/ ) { this._computeOverlap(this._labelsX, this._c.graphWidth); }

	if ( this.options.showBarsValue && !this._redrawing ) { this._createBarValContainer(); }

	if ( this.options.onloadAnimation && !this._redrawing) { this._onloadAnimation(); }
}

// Vykreslení do existujiciho grafu
JAK.Chart.Bar.prototype._drawToGraph = function() {
	var c = this._computed;

	this._drawBars();

	this._actualComputedGroup = null;

	// otoceni poradi aby nedochazelo k prekrivani pri incremental = true
	for ( var i = 1; i <= this._groups.length; i++ ) {
		if ( this.options.items && this.options.items[this._groups.length - i] && this.options.items[this._groups.length - i].deactive ) { continue; }
		this._b._g.appendChild(this._groups[this._groups.length - i][1]);
	}

	if ( !this.options.sameMetric ) {
		if ( !this._redrawing ) {
			//this._textGroup = this._b.createGroup();
			this._gridGroup = this._b.createGroup();
			this._textGroupX = this._b.createGroup();
			this._textGroupY = this._b.createGroup();
		}
		else {
			JAK.DOM.clear(this._gridGroup[1]);
			JAK.DOM.clear(this._textGroupX[1]);
		}
		this.options.labelsYPosition = "right";
		this.options.frame.position = "right";

		// Horizontální mřížka sekundární osy
		this._drawHorizontalGridSec();

		this._drawFrameGrid();

		// Popisky na ose Y
		this._drawLabelsY();
	}

	if ( this.options.secondLabelsX.length > 0 ) {
		this._drawVarticalGridSec(this.options.spacing);

		this.options.labelsXPosition = "top";
		this.options.labels = this.options.secondLabelsX;
		this._c.stepX = ( this._c.graphWidth - this.options.spacing * 2 ) / ( this.options.secondLabelsX.length - 1 );

		this._drawLabelsX(this.options.spacing * 2);
	}

	this._insertToPage();

	if ( this.options.showBarsValue ) { this._createBarValContainer(); }

	if ( this.options.onloadAnimation ) { this._onloadAnimation(); }

}

JAK.Chart.Bar.prototype._drawBars = function () {
	var c = this._computed;
	var numberOfDeactiveGroup = 0;
	this._eventLabel = [];

	if ( this.origItems ) { this.options.items = JSON.parse(JSON.stringify(this.origItems)); }

	for( var i = 0; i < this._data.length; i++ ) {
		var data = this._data[i];
		var dataLabels = [];

		if ( !this._redrawing ) {
			this._groups[i] = this._b.createGroup();
			this._labels[i] = [];
		}
		else {
			JAK.DOM.clear(this._groups[i][1]);
		}

		var bars = this._bars[i];

		var path = [];
		var barPosition = [];

		for( var x = 0; x < bars.length; x++ ) {
			var bar = bars[x];
			var coords = {};

			if ( this.options.graphType ) { coords = this._computeCoordsHorizontalBar(bar, x, i-numberOfDeactiveGroup); }
			else { coords = this._computeCoordsVerticalBar(bar, x, i-numberOfDeactiveGroup); }

			if ( ( coords.right < c.left || coords.left > (c.left + c.graphWidth) ) && !data[x].note ) { continue; }

			if ( data[x].note && data[x].note.id ) {

				var eventLabel = data[x].note;

				if ( !this._eventLabel[eventLabel.id] ) {
					this._eventLabel[eventLabel.id] = eventLabel;
					this._eventLabel[eventLabel.id].start = coords.left;
				}

				if ( eventLabel.end && this._eventLabel[eventLabel.id] ) {
					this._eventLabel[eventLabel.id].end = coords.right;
				}

				if ( !eventLabel.start ) { this._data[i][x].note.hide = true; }
			}

			if ( data[x].note ) { data[x].note.point = [coords.left + ( coords.right - coords.left ) / 2, coords.top]; }
			dataLabels[x] = [data[x].label, data[x].data, data[x].note];

			if ( ( !this.options.items[i] || !this.options.items[i].deactive ) && bar.value != null ) {
				//var barElm = this._b.drawPolygon([[coords.left,coords.top],[coords.right,coords.top],[coords.right,coords.bottom],[coords.left,coords.bottom],[coords.left,coords.top]], {fillColor: bar.color, strokeColor: (this.options.lineColor) ? this.options.lineColor : "#fff", lineWidth: this.options.lineWidth, fillOpacity: this.options.fillOpacity},this._groups[i][1]);
				path.push([" M", coords.left, coords.top, "L", coords.right, coords.top, "L", coords.right, coords.bottom, "L", coords.left, coords.bottom, "Z"]);

				//bar.elm = barElm;
				//this._sectorIds[barElm] = [i, x];
				barPosition.push([i, x, coords]);

				if ( this.options.showLabel == "alltime" ) {
					if ( this.options.graphType ) { this._labels[i][x] = this.createLabel(coords.right, c.graphHeight - coords.fromBottom  + this.options.padding * 2 - (this.options.barWidth / 2), bar.label[0], {display: "block"}); }
					else { this._labels[i][x] = this.createLabel(( coords.left + this.options.barWidth / 2 ), coords.fromBottom, bar.label[0], {display: "block"}); }
				} else {
					this._labels[i][x] = { coords: coords, label: bar.label };
				}
			}

			if ( this.options.noteShow && data[x].note ) {
				this._note.push(data[x].note);
			}
		}

		if ( !this.options.items[i] || !this.options.items[i].deactive ) {
			var barsElm = this._b.drawPath(path,{fillColor: bar.color, strokeColor: (this.options.lineColor) ? this.options.lineColor : "#fff", lineWidth: this.options.lineWidth, fillOpacity: this.options.fillOpacity},this._groups[i][1]);
			this._sectorIds[barsElm] = barPosition;
		}

		if ( this.options.items[i] && this.options.items[i].deactive ) {
			numberOfDeactiveGroup++;
		}
	}
}

JAK.Chart.Bar.prototype._createBarValContainer = function () {
	var valContainer;

	valContainer = JAK.mel("p", {className: "barValueContainer"});
	this._barValueContainer = valContainer;

	this._parentElm.appendChild(valContainer);
}

JAK.Chart.Bar.prototype._previewGraph = function () {
	var coordinates = [];
	var barsIndex = 0;
	var previewGraph = null;
	var previewGraphActive = null;

	while ( !this.options.incremental && this.origItems && this.origItems[barsIndex] && this.origItems[barsIndex].deactive ) {
		barsIndex++;
	}

	if ( this.options.incremental ) {
		for ( var i = 0; i < this._bars.length; i++ ) {
			if ( !this.origItems || !this.origItems[i] || !this.origItems[i].deactive ) {
				barsIndex = i;
			}
		}
	}

	var bars = this._bars[barsIndex];

	if ( bars ) {
		var barWidth = this._c.graphWidth / bars.length;

		coordinates.push([this._c.left, this._c.bottom + this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph]);

		for ( var x = 0; x < bars.length; x++ ) {
			var barHeight = this._c.bottom + this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph - ( bars[x].percentage / 100 * this.options.previewGraph.height );

			coordinates.push([this._c.left + barWidth * x, barHeight]);
			coordinates.push([this._c.left + barWidth * (x+1), barHeight]);
		}

		coordinates.push([this._c.right, this._c.bottom + this.options.previewGraph.height + this.options.previewGraph.paddingFromGraph]);

		previewGraph = this._b.drawPolygon([coordinates], {lineWidth:this.options.previewGraph.lineWidth, strokeColor:this.options.previewGraph.colorLine, fillColor: (this.options.previewGraph.path) ? this.options.previewGraph.colorPath : "none", fillOpacity: this.options.previewGraph.fillOpacity},this._zoomableGroup[1]);
		previewGraphActive = this._b.drawPolygon([coordinates], {lineWidth:this.options.previewGraph.lineWidth, strokeColor:this.options.previewGraph.activeColorLine, fillColor: (this.options.previewGraph.path) ? this.options.previewGraph.activeColorPath : "none", fillOpacity: this.options.previewGraph.fillOpacity},this._zoomableGroup[1]);

	}

	return [previewGraph, previewGraphActive];
}

JAK.Chart.Bar.prototype._onloadAnimation = function () {
	this.onloadAnimation = [];
	var type = this.options.onloadAnimationType;
	var timeoutInc = 0;
	this.timeout = null;

	if ( type == "horizontal" || type == "vertical" || type == "fade" ) {
		for ( var i = 0; i < this._data.length; i++ ) {
			if ( this.options.items[i] && this.options.items[i].deactive ) { continue; }
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

			if ( type == "fade" ) {
				settings.animeAttribute = "style";
				settings.startWidth = "100%";
				settings.startValue = 0,
				settings.endValue = 1
			}

			this._closeanimation = false;

			var animation = this._createBasicAnimation(settings, i)
			this.onloadAnimation.push(animation);

			if ( this.options.onloadAnimationDelay <= 0 ) { animation.start(); }
		}

		if ( this.options.onloadAnimationDelay > 0 ) {
			timeoutInc = ( this.options.onloadAnimationReverse ) ? 1 : 0;
			var completeTimeout = this._numberOfActiveGroup * this.options.onloadAnimationDelay;

			this.timeout = new JAK.Interpolator([0], [completeTimeout], completeTimeout, null);
			this.timeout.itemDelay = this.options.onloadAnimationDelay;
			this.timeout.animation = this.onloadAnimation;
			this.timeout.itemCount = this._numberOfActiveGroup;
			this.timeout.reverse = this.options.onloadAnimationReverse;
			this.timeout.callback = function(step) {
				if ( step >= ( this.itemDelay * timeoutInc ) ) {
					var index = ( this.reverse ) ? ( this.itemCount - timeoutInc ) : timeoutInc;
					if ( this.animation[index] ) { this.animation[index].start(); }
					timeoutInc++;
				}
			};
			this.timeout.start();
		}
	}
}

JAK.Chart.Bar.prototype._oncloseAnimation = function () {
	this.oncloseAnimation = [];
	var type = this.options.oncloseAnimationType;
	var timeoutInc = 0;
	this.timeout = null;

	if ( type == "horizontal" || type == "vertical" ) {
		for ( var i = 0; i < this._data.length; i++ ) {
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

			var animation = this.onloadAnimation.push(this._createBasicAnimation(settings, i));
			if ( this.options.oncloseAnimationDelay <= 0 ) { animation.start(); }

			timeoutInc++;
		}

		if ( this.options.oncloseAnimationDelay > 0 ) {
			timeoutInc = ( this.options.oncloseAnimationReverse ) ? 1 : 0;
			var completeTimeout = this._numberOfActiveGroup * this.options.oncloseAnimationDelay;

			this.timeout = new JAK.Interpolator([0], [completeTimeout], completeTimeout, null);
			this.timeout.itemDelay = this.options.oncloseAnimationDelay;
			this.timeout.animation = this.oncloseAnimation;
			this.timeout.itemCount = this._numberOfActiveGroup;
			this.timeout.reverse = this.options.oncloseAnimationReverse;
			this.timeout.callback = function(step) {
				if ( step >= ( this.itemDelay * timeoutInc ) ) {
					var index = ( this.reverse ) ? ( this.itemCount - timeoutInc ) : timeoutInc;
					if ( this.animation[index] ) { this.animation[index].start(); }
					timeoutInc++;
				}
			};
			this.timeout.start();
		}
	}
}

JAK.Chart.Bar.prototype.addBars = function(data) {
	this._origData.push(data);

	this._compute();
	this._draw();
}

JAK.Chart.Bar.prototype.removeBars = function(index) {
	this._origData.splice(index, 1);

	this._compute();
	this._draw();
}