/**
 *        /\
 *  _____//\\    _____
 *  _____/  \\  /_____
 *           \\//
 *            \/
 *
 * @overview zobrazení mřížky
 * @version 1.1
 * @author zara, majak
 */


JAK.Chart.Grid = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart.Grid",
	VERSION: "1.1",
	EXTEND: JAK.Chart
})

JAK.Chart.Grid.prototype.$constructor = function(data, options) {
	this.options = {
		min:null,
		max:null,
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
		labels: [],
		labelsPosition: "start" // start || center
	}

	this._mergeOptions(this.options, options);
}

JAK.Chart.Grid.prototype._drawVarticalGrid = function(displacement) {
	// Vertikální mřížka
	var c = this._c;
	var displacement = displacement || 0;
	if ( this.options.cols.show ) {
		var gridData = [];
		var gridHighlightData = [];
		for ( var i = 0; i < this.options.labels.length ; i++ ) {
			var label = this.options.labels[i];
			var top = c.top;
			var step = this._graphMove + c.stepX * i + c.left + displacement / 2;
			var path = (label.highlight ? gridHighlightData : gridData);

			if ( !i && c.left < ( step - this._graphMove ) && displacement && ( step + c.stepX ) > this.left ) {
				//this._b.drawPolygon([[this._graphMove + c.left,c.bottom],[this._graphMove + c.left, top],[step+c.stepX, top],[step+c.stepX,c.bottom]], {lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: (label.highlight) ? 1 : 0},this._gridGroup[1]);
				path.push([this._graphMove + c.left,c.bottom],[this._graphMove + c.left, top],[step+c.stepX, top],[step+c.stepX,c.bottom]);
			}
			else if ( ( (c.graphWidth + c.left) - step ) < c.stepX && ( (c.graphWidth + c.left) - step ) > 0 ) {
				//this._b.drawPolygon([[step,c.bottom],[step, top],[c.left+c.graphWidth, top],[c.left+c.graphWidth,c.bottom]], {lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: (label.highlight) ? 1 : 0},this._gridGroup[1]);
				path.push([step,c.bottom],[step, top],[c.left+c.graphWidth, top],[c.left+c.graphWidth,c.bottom]);
			}
			else if ( (i + 1) == this.options.labels.length && ( c.graphWidth + c.left ) > step ) {
				//this._b.drawPolygon([[step,c.bottom],[step, top],[c.left+c.graphWidth, top],[c.left+c.graphWidth,c.bottom]], {lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: (label.highlight) ? 1 : 0},this._gridGroup[1]);
				path.push([step,c.bottom],[step, top],[c.left+c.graphWidth, top],[c.left+c.graphWidth,c.bottom]);
			}
			else if ( c.left < ( step + c.stepX ) && ( c.graphWidth + c.left ) > step ) {
				//this._b.drawPolygon([[step,c.bottom],[step, top],[step+c.stepX, top],[step+c.stepX,c.bottom]], {lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: (label.highlight) ? 1 : 0},this._gridGroup[1]);
				path.push([step,c.bottom],[step, top],[step+c.stepX, top],[step+c.stepX,c.bottom]);
			}
		}

		if ( gridData.length > 0 ) {
			var pathData = this._createPathData(gridData);
			var pathElm = this._b.drawPath(pathData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: "#fff", fillOpacity: 0},this._gridGroup[1]);
		}

		if ( gridHighlightData.length > 0 ) {
			var pathHighlightData = this._createPathData(gridHighlightData);
			var pathHighlightElm = this._b.drawPath(pathHighlightData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: this.options.cols.highlightBg, fillOpacity: 1},this._gridGroup[1]);
		}
	}
}

JAK.Chart.Grid.prototype._drawVarticalGridSec = function(displacement) {
	// Vertikální mřížka
	var c = this._c;
	var displacement = displacement || 0;
	var stepSecondX = ( c.graphWidth - displacement * 2 ) / ( this.options.secondLabelsX.length - 1 );
	if ( this.options.cols.show ) {
		var gridData = [];
		for ( var i = 0; i < this.options.secondLabelsX.length ; i++ ) {
			var label = this.options.secondLabelsX[i];
			var top = c.top;
			var step = stepSecondX * i + c.left + displacement;
			var path = gridData;

			path.push([" M",step, c.top-2," L ",step,c.top+6, " Z"]);
		}

		var pathElm = this._b.drawPath(gridData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: "#fff", fillOpacity: 0},this._gridGroup[1]);
	}
}

JAK.Chart.Grid.prototype._drawHorizontalGrid = function() {
	// Horizontální mřížka
	var c = this._c;
	var gridData = [];
	var gridHighlightData = [];

	if ( this.options.labelsY && this.options.labelsY.length > 0 ) {
		for ( var i = 0; i < this.options.labelsY.length ; i++ ) {
			var label = this.options.labelsY[i];
			var step = c.top + c.stepY * i;
			var left = c.left;
			var path = (label.highlight ? gridHighlightData : gridData);

			if ( ( (c.graphHeight + c.left) - step ) < c.stepY  && ( (c.graphHeight + c.left) - step ) > 0 ) {
				//this._b.drawPolygon([[left,step],[c.right, step],[c.right, c.bottom],[c.left,c.bottom]], {lineWidth:this.options.rows.width, strokeColor:this.options.rows.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: 0},this._gridGroup[1])
				path.push([left,step],[c.right, step],[c.right, c.bottom],[c.left,c.bottom]);
			} else {
				//this._b.drawPolygon([[left,step],[c.right, step],[c.right, step + c.stepY],[left, step + c.stepY]], {lineWidth:this.options.rows.width, strokeColor:this.options.rows.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: 0},this._gridGroup[1])
				path.push([left,step],[c.right, step],[c.right, step + c.stepY],[left, step + c.stepY]);
			}
		}

		if ( gridData.length > 0 ) {
			var pathData = this._createPathData(gridData);
			var pathElm = this._b.drawPath(pathData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: "#fff", fillOpacity: 0},this._gridGroup[1]);
		}

		if ( gridHighlightData.length > 0 ) {
			var pathHighlightData = this._createPathData(gridHighlightData);
			var pathHighlightElm = this._b.drawPath(pathHighlightData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: this.options.cols.highlightBg, fillOpacity: 1},this._gridGroup[1]);
		}
	} else {
		var path = gridData;
		for (var i = c.min; this._lesser(i, c.max);i += c.stepY) {
			var top = c.top + c.graphHeight - this._scale(i);
			//this._b.drawPolyline([[c.left,top],[c.right, top]], {lineWidth:this.options.rows.width, strokeColor:this.options.rows.color},this._gridGroup[1])
			path.push([" M",c.left,top," L ",c.right, top, " Z"]);
		}

		var pathElm = this._b.drawPath(gridData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: "#fff", fillOpacity: 0},this._gridGroup[1]);
	}
}

JAK.Chart.Grid.prototype._drawHorizontalGridSec = function() {
	// Horizontální mřížka
	var c = this._c;
	var gridData = [];
	var gridHighlightData = [];

	if ( this.options.labelsY && this.options.labelsY.length > 0 ) {
		for ( var i = 0; i < this.options.labelsY.length ; i++ ) {
			var label = this.options.labelsY[i];
			var step = c.top + c.stepY * i;
			var left = c.left;
			var path = (label.highlight ? gridHighlightData : gridData);

			if ( ( (c.graphHeight + c.left) - step ) < c.stepY ) {
				//this._b.drawPolygon([[left,step],[c.right, step],[c.right, c.bottom],[c.left,c.bottom]], {lineWidth:this.options.rows.width, strokeColor:this.options.rows.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: (label.highlight) ? 1 : 0},this._gridGroup[1])
				path.push([left,step],[c.right, step],[c.right, c.bottom],[c.left,c.bottom]);
			} else {
				//this._b.drawPolygon([[left,step],[c.right, step],[c.right, step + c.stepY],[left, step + c.stepY]], {lineWidth:this.options.rows.width, strokeColor:this.options.rows.color, fillColor: (label.highlight) ? this.options.cols.highlightBg : "#fff", fillOpacity: (label.highlight) ? 1 : 0},this._gridGroup[1])
				path.push([left,step],[c.right, step],[c.right, step + c.stepY],[left, step + c.stepY]);
			}
		}

		if ( gridData.length > 0 ) {
			var pathData = this._createPathData(gridData);
			var pathElm = this._b.drawPath(pathData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: "#fff", fillOpacity: 0},this._gridGroup[1]);
		}

		if ( gridHighlightData.length > 0 ) {
			var pathHighlightData = this._createPathData(gridHighlightData);
			var pathHighlightElm = this._b.drawPath(pathHighlightData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: this.options.cols.highlightBg, fillOpacity: 1},this._gridGroup[1]);
		}
	} else {
		for (var i = c.min; this._lesser(i, c.max);i += c.stepY) {
			var top = c.top + c.graphHeight - this._scale(i);
			//this._b.drawPolyline([[c.right-6,top],[c.right+2, top]], {lineWidth:this.options.rows.width, strokeColor:this.options.rows.color},this._gridGroup[1])
			path.push([" M",c.right-6,top," L ",c.right+2, top, " Z"]);
		}

		var pathElm = this._b.drawPath(gridData,{lineWidth:this.options.cols.width, strokeColor:this.options.cols.color, fillColor: "#fff", fillOpacity: 0},this._gridGroup[1]);
	}

}

JAK.Chart.Grid.prototype._drawFrameGrid = function() {
	var c = this._c;
	if ( this.options.frame.complete ) {
		this._gridFrame = this._b.drawPolyline([[c.right, c.bottom],[c.left,c.bottom],[c.left,c.top],[c.right,c.top],[c.right,c.bottom]], {lineWidth:this.options.frame.width, strokeColor:this.options.frame.color});
	}
	else if ( this.options.frame.position == "right") {
		this._gridFrame = this._b.drawPolyline([[c.left, c.bottom],[c.right,c.bottom],[c.right,c.top]], {lineWidth:this.options.frame.width, strokeColor:this.options.frame.color});
	}
	else {
		this._gridFrame = this._b.drawPolyline([[c.right, c.bottom],[c.left,c.bottom],[c.left,c.top]], {lineWidth:this.options.frame.width, strokeColor:this.options.frame.color});
	}
}

JAK.Chart.Grid.prototype._drawLabelsY = function(labels) {
	var c = this._c;
	if ( labels && labels.length > 0 ) {
		var stepY = c.graphHeight / labels.length;

		for ( var i = 0; i < labels.length; i++ ) {
			var lab = labels[i].name;

			if ( lab ) {
				if ( this.options.legendPosition == "left" || this.options.labelsYPosition == "right" ) { this._labelsY[i] = this._b.drawText([c.right + 3, stepY * i + 3 + this.options.padding], lab,{fillColor:"#999", width:1, textAlign: "left", fontSize: "11px", fillOpacity: 1}, this._textGroupY[1]); }
				else { this._labelsY[i] = this._b.drawText([c.left - 3, stepY * i + 3 + c.top], lab,{fillColor:"#999", width:1, textAlign: "right", fontSize: "11px", fillOpacity: 1}, this._textGroupY[1]); }
			}
		}
	} else {
		for ( var i = c.min; this._lesser(i, c.max); i += c.stepY ) {
			var top = c.top + c.graphHeight - this._scale(i);
			if ( this.options.legendPosition == "left" || this.options.labelsYPosition == "right" ) { this._labelsY.push(this._b.drawText([c.right + 3, top + 3], i,{fillColor:"#999", width:1, textAlign: "left", fontSize: "11px", fillOpacity: 1}, this._textGroupY[1])); }
			else { this._labelsY.push(this._b.drawText([c.left - 3, top + 3], this.numToString(i),{fillColor:"#999", width:1, textAlign: "right", fontSize: "11px", fillOpacity: 1}, this._textGroupY[1])); }
		}
	}
}

JAK.Chart.Grid.prototype._drawLabelsX = function(disp) {
	var labels = this.options.labels;
	var displacement = disp || 0;
	this._labelsX = [];
	if ( labels.length ) {
		var c = this._c;
		var positionCorrecting = (this.options.labelsPosition == "center") ? (c.stepX / 2) : 0;

		for( var i = 0; i < labels.length; i++ ) {
			var lab = labels[i].name;
			var label = "";
			if ( lab ) {
				var coords = [];

				if ( this.options.labelsXPosition == "top" ) { coords = [this._graphMove + ( c.left + ( displacement / 2 ) + ( i * c.stepX ) + positionCorrecting ), ( c.top - 11 - 4 )]; }
				else { coords = [this._graphMove + ( c.left + ( displacement / 2 ) + ( i * c.stepX ) + positionCorrecting ), ( c.bottom + 11 + 4 )]; }

				if ( c.left - c.stepX < this._graphMove + ( c.left + ( displacement / 2 ) + ( i * c.stepX ) + positionCorrecting ) && ( c.graphWidth + c.left + c.stepX ) > this._graphMove + ( c.left + ( displacement / 2 ) + ( i * c.stepX ) + positionCorrecting ) ) {
					this._labelsX.push(this._b.drawText(coords, lab, {textAlign:"center", fillColor: "#999", fillOpacity: 1}, this._textGroupX[1]));
				}
			}
		}
	}
};

JAK.Chart.Grid.prototype._computeOverlap = function(elmIds, comparisonSize, size) {
	var totalW = 0;
	var size = {};
	for ( var i = 0; i < elmIds.length; i++ ) {
		size = JAK.gel(elmIds[i]).getBBox();
		//size = JAK.gel(elmIds[i]).getStartPositionOfChar(0) + JAK.gel(elmIds[i]).getComputedTextLength();
		totalW += this.options.minSpaceLabelX + size.width;
	}

	if ( totalW > comparisonSize ) {
		var frac = Math.ceil(totalW / comparisonSize);
		for ( var i = 0; i < elmIds.length; i++ ) {
			if (i % frac) { JAK.gel(elmIds[i]).style.display = "none"; }
		}
	}
}

JAK.Chart.Grid.prototype._lesser = function(a, b) {
	return a-b < 1e-8;
}

JAK.Chart.Grid.prototype._scale = function(value) {
	return Math.round((value-this._c.min) / (this._c.max-this._c.min) * this._c.graphHeight);
}