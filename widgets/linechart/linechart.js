/**
 * @overview line chart
 * @version 1.0
 * @author zara
*/   

/**
 * @class LineChart
 * @constructor
 * @param {string} id id prvku, do ktereho se graf vlozi
 * @param {array} data pole objektu s vlastnostmi 'data', 'label', 'marker', data je pole hodnot
 * @param {object} options asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>padding</em> - vycpavka</li>
 *		<li><em>rows</em> - priblizny pocet vodorovnych radek</li>
 *		<li><em>legend</em> - bool, zda-li kreslit legendu</li>
 *		<li><em>markerSize</em> - velikost znacky</li>
 *		<li><em>legendWidth</em> - sirka prvku legendy</li>
 *		<li><em>colors</em> - pole barev</li>
 *		<li><em>labels</em> - pole popisku osy x</li>
 *		<li><em>zero</em> - bool, ma-li byt zahrnuta nula</li>
 *   </ul>
 */

SZN.LineChart = SZN.ClassMaker.makeClass({
	NAME:"LineChart",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.LineChart.prototype.$constructor = function(id, data, options) {
	this.options = {
		padding: 30,
		rows: 6,
		legend: true,
		markerSize: 8,
		legendWidth: 25,
		colors: ["rgb(0,76,140)","rgb(255,73,17)","rgb(255,214,37)","rgb(94,162,33)","rgb(132,0,38)", 
				"rgb(137,205,255)","rgb(55,71,5)","rgb(179,210,0)","rgb(82,36,118)","rgb(255,155,17)",
				"rgb(201,0,14)","rgb(0,138,212)"],
		labels: [],
		zero:false
	}
	
	for (var p in options) { this.options[p] = options[p]; }
	this.container = SZN.gEl(id);
	
	this.width = this.container.offsetWidth;
	this.height = this.container.offsetHeight;
	this.offsetLeft = this.options.padding;
	
	this.data = data;
	this.canvas = SZN.Vector.getCanvas(this.width, this.height);
	this.container.style.position = "relative";
	this.container.appendChild(this.canvas.getContainer());
	
	this._draw();
}

SZN.LineChart.prototype._compute = function() {
	var o = this.options;
	this.availh = this.height - 2*o.padding;
	this.availw = this.width - (o.padding + this.offsetLeft + this.lw);
	this.interval = this.availw / (this.data[0].data.length - 1);
}

SZN.LineChart.prototype._draw = function() {
	var o = this.options;
	var all = [];
	var length = 0;
	for (var i=0;i<this.data.length;i++) {
		var dataset = this.data[i];
		length = dataset.data.length;
		for (var j=0;j<length;j++) { all.push(dataset.data[j]); }
	}
	all.sort(function(a,b) {return a-b;});
	var min = all.shift();
	var max = all.pop();
	
	this.lw = 0;
	if (o.legend) { this.lw = this._prepareLegend(); }
	this._compute();

	if (o.zero) {
		if (min > 0) { min = 0; }
		if (max < 0) { max = 0; }
	}
	if (this.options.rows) {
		var step = (max-min) / (this.options.rows);
		var base = Math.floor(Math.log(step) / Math.log(10));
		var divisor = Math.pow(10,base);
		var result = Math.round(step / divisor) * divisor;
		max = Math.ceil(max / result) * result;
		min = Math.floor(min / result) * result;
	}
	
	var availh = this.availh;
	var scale = function(value) { return Math.round((value-min) / (max-min) * availh); }

	if (this.options.rows) { /* horizontal lines */
		var style = {
			color:"#888",
			width:1
		}

		var m = 0;
		var labels = [];
		for (var i=min;i<=max;i+=result) {
			i = Math.round(i * 1000) / 1000;
			var top = this.height - o.padding - scale(i);
			var text = SZN.cEl("div", false, false, {position:"absolute", left:"0px", top:top+"px"});
			text.innerHTML = i;
			this.container.appendChild(text);
			var w = text.offsetWidth;
			var h = text.offsetHeight;
			top -= Math.round(h/2);
			text.style.top = top+"px";
			
			m = Math.max(m, w);
			labels.push(text);
		}

		this.offsetLeft += m+10;
		this._compute();
		
		var idx = 0;
		for (var i=min;i<=max;i+=result) {
			var text = labels[idx];
			var ow = text.offsetWidth;
			text.style.left = (this.offsetLeft - 10 - ow) + "px";
			i = Math.round(i * 1000) / 1000;
			var top = this.height - o.padding - scale(i);
			
			new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.offsetLeft, top), new SZN.Vec2d(this.offsetLeft+this.availw, top)], style)
			idx++;
		}
		new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.offsetLeft, o.padding), new SZN.Vec2d(this.offsetLeft, this.height-o.padding)], style);
	}
	

	if (o.labels) {
		var x = this.offsetLeft;
		var y = this.height - o.padding + 5;
		for (var i=0;i<o.labels.length;i++) {
			var label = SZN.cEl("div",false, false, {position:"absolute", top:y+"px", left:x+"px", textAlign:"center"});
			var l2 = SZN.cEl("div", false, false, {position:"relative", left:"-50%"});
			label.appendChild(l2);
			l2.innerHTML = o.labels[i];
			this.container.appendChild(label);
			x += this.interval;
		}
	}
	
	for (var i=0;i<this.data.length;i++) { this._drawLine(i, scale); }
	
	if (o.legend) { this._drawLegend(); }
}

SZN.LineChart.prototype._drawLine = function(index, scale) {
	var o = this.options;
	var obj = this.data[index];
	var color = o.colors[index % o.colors.length];

	var points = [];
	var x = this.offsetLeft;
	for (var i=0;i<obj.data.length;i++) {
		var value = obj.data[i];
		var y = this.height - o.padding - scale(value);
		points.push(new SZN.Vec2d(x, y));
		x += this.interval;
	}
	
	new SZN.Vector.Line(this.canvas, points, {color:color, width:1});
	for (var i=0;i<points.length;i++) {
		new obj.marker(this.canvas, points[i], o.markerSize, color, obj.data[i]);
	}
	
}

SZN.LineChart.prototype._prepareLegend = function() {
	var labels = [];
	var max = 0;
	
	var o = this.options;
	for (var i=0;i<this.data.length;i++) {
		var text = SZN.cEl("div", false, false, {position:"absolute"});
		text.innerHTML = this.data[i].label;
		this.container.appendChild(text);
		var w = text.offsetWidth;
		max = Math.max(max, w);
		labels.push(text);
	}
	
	this.legendLabels = labels;
	return max + 2*o.padding + 10 + o.legendWidth;
}

SZN.LineChart.prototype._drawLegend = function() {
	var labels = this.legendLabels;
	var o = this.options;

	var w = (this.data[0].data.length - 1) * this.interval;

	for (var i=0;i<this.data.length;i++) {
		var m = this.data[i].marker;
		var color = o.colors[i % o.colors.length];
		var x1 = this.offsetLeft + w + 2*o.padding;
		var x2 = x1 + o.legendWidth;
		var y = i*(o.legendWidth + 10) + o.padding + Math.round(o.legendWidth/2);
		new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(x1,y), new SZN.Vec2d(x2,y)], {color:color, width:2});

		/* marker */
		new m(this.canvas, new SZN.Vec2d(x1 + o.legendWidth/2,y), o.markerSize, color);

		var l = this.offsetLeft + w + 2*o.padding+o.legendWidth+10;
		var t = i*(o.legendWidth+10) + o.padding;
		var text = labels[i];

		t += Math.round((o.legendWidth - text.offsetHeight)/2);
		text.style.left = l+"px";
		text.style.top = t+"px";
	}
}

SZN.Marker = SZN.ClassMaker.makeClass({
	NAME:"Marker",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Marker.prototype.$constructor = function(canvas, point, size, color, title) {
	this.canvas = canvas;
	this.point = point;
	this.size = size;
	this.color = color;
	this.title = title;
	this._draw();
}
SZN.Marker.prototype._draw = function() {}

SZN.Marker.None = SZN.ClassMaker.makeClass({
	NAME:"None",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Circle = SZN.ClassMaker.makeClass({
	NAME:"Circle",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Circle.prototype._draw = function() {
	new SZN.Vector.Circle(this.canvas, this.point, this.size/2, {color:this.color, outlineWidth:0, title:this.title});
}

SZN.Marker.Square = SZN.ClassMaker.makeClass({
	NAME:"Square",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Square.prototype._draw = function() {
	var x1 = this.point.getX() - this.size/2;
	var y1 = this.point.getY() - this.size/2;
	var x2 = x1 + this.size;
	var y2 = y1 + this.size;
	
	new SZN.Vector.Polygon(this.canvas, [
		new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y1), 
		new SZN.Vec2d(x2,y2), new SZN.Vec2d(x1,y2)
	], {color:this.color, outlineWidth:0, title:this.title});
}

SZN.Marker.Cross = SZN.ClassMaker.makeClass({
	NAME:"Cross",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Cross.prototype._draw = function() {
	var x1 = this.point.getX() - this.size/2;
	var y1 = this.point.getY() - this.size/2;
	var x2 = x1 + this.size;
	var y2 = y1 + this.size;
	
	new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y2)], {color:this.color, outlineWidth:0, width:2, title:this.title});
	new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(x2,y1), new SZN.Vec2d(x1,y2)], {color:this.color, outlineWidth:0, width:2, title:this.title});
}

SZN.Marker.Plus = SZN.ClassMaker.makeClass({
	NAME:"Plus",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Plus.prototype._draw = function() {
	var x1 = this.point.getX() - this.size/2;
	var y1 = this.point.getY() - this.size/2;
	var x2 = x1 + this.size;
	var y2 = y1 + this.size;
	
	new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(x1,this.point.getY()), new SZN.Vec2d(x2,this.point.getY())], {color:this.color, width:2, outlineWidth:0, title:this.title});
	new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.point.getX(),y1), new SZN.Vec2d(this.point.getX(),y2)], {color:this.color, width:2, outlineWidth:0, title:this.title});
}

SZN.Marker.Triangle = SZN.ClassMaker.makeClass({
	NAME:"Triangle",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Triangle.prototype._draw = function() {
	var coef = Math.sqrt(3);
	var x = this.point.getX();
	var y = this.point.getY();
	
	new SZN.Vector.Polygon(this.canvas, [
		new SZN.Vec2d(x-this.size/2, y+this.size*coef/6), new SZN.Vec2d(x+this.size/2, y+this.size*coef/6), 
		new SZN.Vec2d(x, y-this.size*coef/3)],
		{color:this.color, outlineWidth:0, title:this.title});
}
