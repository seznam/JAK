/*
Licencováno pod MIT Licencí

© 2008 Seznam.cz, a.s.

Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.

Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené 
soubory (dále jen „software“) je oprávněn k nakládání se softwarem bez 
jakýchkoli omezení, včetně bez omezení práva software užívat, pořizovat si 
z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě 
(podlicence) či prodávat jeho kopie, za následujících podmínek:

- výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo 
podstatných součástech Softwaru.

- software je poskytován tak jak stojí a leží, tzn. autor neodpovídá 
za jeho vady, jakož i možné následky, ledaže věc nemá vlastnost, o níž autor 
prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.



Licenced under the MIT License

Copyright (c) 2008 Seznam.cz, a.s.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * @overview line + bar chart
 * @version 1.0
 * @author zara
*/   

/**
 * @class LBChart
 * @constructor
 * carovy a sloupcovy graf
 * @param {string} id id prvku, do ktereho se graf vlozi
 * @param {array} data pole objektu s vlastnostmi 'data', 'label', 'marker', 'type'; 'data' je pole hodnot
 * @param {object} options asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>padding</em> - vycpavka</li>
 *		<li><em>rows</em> - priblizny pocet vodorovnych radek</li>
 *		<li><em>rowsColor</em> - barva vodorovnych radek</li>
 *		<li><em>legend</em> - bool, zda-li kreslit legendu</li>
 *		<li><em>legendWidth</em> - sirka prvku legendy</li>
 *		<li><em>markerSize</em> - velikost znacky</li>
 *		<li><em>labels</em> - pole popisku osy x</li>
 *		<li><em>barWidth</em> - sirka sloupce</li>
 *		<li><em>lineWidth</em> - sirka cary</li>
 *		<li><em>outlineWidth</em> - sirka oramovani sloupce</li>
 *		<li><em>zero</em> - bool, ma-li graf zahrnovat nulu</li>
 *		<li><em>merge</em> - bool, maji-li se sloupce kreslit pres sebe</li>
 *		<li><em>axes</em> - bool, maji-li se vykreslit osy</li>
 *		<li><em>axesColor</em> - barva os</li>
 *		<li><em>colors</em> - pole barev</li>
 *   </ul>
 */

SZN.LBChart = SZN.ClassMaker.makeClass({
	NAME:"LBChart",
	VERSION:"1.0",
	CLASS:"class",
	DEPEND:[{
		sClass:SZN.Vector,
		ver:"1.0"
	}]
});

SZN.LBChart.prototype.$constructor = function(id, data, options) {
	this.options = {
		padding: 30,
		rows: 6,
		rowsColor: "#888",
		legend: true,
		legendWidth: 25,
		markerSize: 8,
		labels: [],
		barWidth: 10,
		lineWidth: 1,
		outlineWidth: 1,
		zero:false,
		merge:false,
		axes:true,
		axesColor: "#ffd625",
		colors: ["#004c8c", "#ff4911", "#ffd625", "#5ea221", "#840026", "#89cdff", "#374705", "#b3d200", "#522476", "#ff9b11", "#c9000e", "#008ad4"]
	}
	
	for (var p in options) { this.options[p] = options[p]; }
	this.container = SZN.gEl(id);
	this.barCount = 0;
	this.appended = [];
	
	this.width = this.container.offsetWidth;
	this.height = this.container.offsetHeight;
	this.offsetLeft = this.options.padding;
	
	this.canvas = SZN.Vector.getCanvas(this.width, this.height);
	this.container.style.position = "relative";
	this.container.appendChild(this.canvas.getContainer());
	
	this.data = data;
	for (var i=0;i<this.data.length;i++) {
		if (data[i].type == "bar") { this.barCount++; }
	}
	if (this.barCount && this.options.merge) { this.barCount = 1; }
	
	if (!this.data.length) { return; }

	this.dataLength = this.data[0].data.length;
	this._draw(); 

	var c = this.canvas.getContainer();
	SZN.Events.addListener(c, "mouseover", this, "_mouseover");
	SZN.Events.addListener(c, "mousemove", this, "_mousemove");
	SZN.Events.addListener(c, "mouseout", this, "_mouseout");
}

SZN.LBChart.prototype.$destructor = function() {
	this.canvas.$destructor();
	for (var i=0;i<this.appended.length;i++) {
		var elm = this.appended[i];
		elm.parentNode.removeChild(elm);
	}
}

SZN.LBChart.prototype._mouseover = function(e, elm) {
}

SZN.LBChart.prototype._mousemove = function(e, elm) {
	var s = SZN.Dom.getScrollPos();
	var pos = SZN.Dom.getBoxPosition(this.container);
	s.x += e.clientX;
	s.y += e.clientY;
	s.x -= pos.left;
	s.y -= pos.top;
	
	if (s.x >= this.offsetLeft && s.x <= this.offsetLeft + this.availw && s.y >= this.options.padding && s.y <= this.options.padding + this.availh) {
		var o = 1;
		var a = new SZN.Vec2d(s.x, this.height - this.options.padding);
		var b = new SZN.Vec2d(s.x, this.height - this.options.padding - this.availh);
		this._vertical.setPoints([a,b]);
	} else {
		var o = 0;
	}
	this._vertical.setOptions({opacity:o});
}

SZN.LBChart.prototype._mouseout = function(e, elm) {
	this._vertical.setOptions({opacity:0});
}

/**
 * @method
 * @private
 * prepocita rozmery volne plochy + krok osy X
 */
SZN.LBChart.prototype._compute = function() {
	var o = this.options;
	this.availh = this.height - 2*o.padding;
	this.availw = this.width - (o.padding + this.offsetLeft + this.lw);

	if (this.barCount) {
		this.interval = (this.availw - this.dataLength * this.barCount * o.barWidth) / this.dataLength;
	} else {
		this.interval = this.availw / (this.dataLength - 1);
	}
}

/**
 * @method
 * @private
 * vykresli graf
 */
SZN.LBChart.prototype._draw = function() {
	var o = this.options;
	var all = [];
	for (var i=0;i<this.data.length;i++) {
		var dataset = this.data[i];
		for (var j=0;j<this.dataLength;j++) { all.push(dataset.data[j]); }
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
			color:o.rowsColor,
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
			this.appended.push(text);
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
	}
	
	if (o.axes) {
		var style = {
			width:1,
			color:o.axesColor
		}
		var top = this.height - o.padding - scale(min);
		new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.offsetLeft, top), new SZN.Vec2d(this.offsetLeft+this.availw, top)], style)
		new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.offsetLeft, o.padding), new SZN.Vec2d(this.offsetLeft, this.height-o.padding)], style);
	}
	
	if (o.labels) {
		var labels = [];
		var total = 0;
		var x = this.offsetLeft;
		if (this.barCount) { x += this.interval/2 + this.barCount * o.barWidth / 2; }
		var y = this.height - o.padding + 5;
		
		for (var i=0;i<o.labels.length;i++) {
			var label = SZN.cEl("div",false, false, {position:"absolute", top:y+"px", left:Math.round(x)+"px"});
			var l2 = SZN.cEl("div", false, false, {position:"relative", left:"-50%"});
			label.appendChild(l2);
			l2.innerHTML = o.labels[i];
			this.container.appendChild(label);
			this.appended.push(label);
			x += this.interval + this.barCount * o.barWidth;
			total += 5 + label.offsetWidth;
			labels.push(label);
		}

		if (total > this.availw) {
			var frac = Math.ceil(total / this.availw);
			for (var i=0;i<labels.length;i++) {
				if (i % frac) { labels[i].style.display = "none"; }
			}
		}
	}
	
	var idx = 0;
	for (var i=0;i<this.data.length;i++) { 
		if (this.data[i].type == "bar") { 
			this._drawBars(i, idx, scale, min, max); 
			if (!this.options.merge) { idx++; }
		}
	}

	for (var i=0;i<this.data.length;i++) { 
		if (this.data[i].type != "bar") { this._drawLine(i, scale); }
	}
	
	if (o.legend) { this._drawLegend(); }

	var a = new SZN.Vec2d(0,this.height - o.padding);
	var b = new SZN.Vec2d(0,this.height - o.padding - this.availh);
	this._vertical = new SZN.Vector.Line(this.canvas, [a,b], {color:o.rowsColor, width:1, opacity:0});
}

/**
 * @method
 * @private
 * vykresli sloupcovy dataset
 * @param {number} indexTotal poradi datasetu
 * @param {number} index poradi datasetu v ramci sloupcovych datasetu
 * @param {function} scale skalovaci funkce
 * @param {number} min nejmensi hodnota, potreba k orientaci sloupce
 * @param {number} max nejvetsi hodnota, potreba k orientaci sloupce
 */
SZN.LBChart.prototype._drawBars = function(indexTotal, index, scale, min, max) {
	var o = this.options;
	var obj = this.data[indexTotal];
	var color = o.colors[indexTotal % o.colors.length];

	var points = [];
	var x1 = this.offsetLeft + index*o.barWidth + this.interval/2;
	
	for (var i=0;i<obj.data.length;i++) {
		var value = obj.data[i];

		var x2 = x1 + o.barWidth;
		
		var ref = 0;
		if (min >= 0) {
			ref = min;
		} else if (max <= 0) {
			ref = max;
		}
		var y1 = this.height - o.padding - scale(ref);
		var y2 = this.height - o.padding - scale(value);
		

		new SZN.Vector.Polygon(this.canvas, 
							[new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y1), new SZN.Vec2d(x2,y2), new SZN.Vec2d(x1,y2)], 
							{color:color, outlineWidth:o.outlineWidth, outlineColor:"black", title:value});

		x1 += this.interval + this.barCount	* o.barWidth;
	}
}

/**
 * @method
 * @private
 * vykresli carovy dataset
 * @param {number} index poradi datasetu
 * @param {function} scale skalovaci funkce
 */
SZN.LBChart.prototype._drawLine = function(index, scale) {
	var o = this.options;
	var obj = this.data[index];
	var color = o.colors[index % o.colors.length];

	var points = [];
	var x = this.offsetLeft;
	if (this.barCount) { x += this.interval/2 + this.barCount * o.barWidth / 2; }
	for (var i=0;i<obj.data.length;i++) {
		var value = obj.data[i];
		var y = this.height - o.padding - scale(value);
		points.push(new SZN.Vec2d(x, y));
		x += this.interval + this.barCount * o.barWidth;
	}
	
	new SZN.Vector.Line(this.canvas, points, {color:color, width:o.lineWidth});

	if (!obj.marker) { return; }
	for (var i=0;i<points.length;i++) {
		new obj.marker(this.canvas, points[i], o.markerSize, color, obj.data[i]);
	}	
}

/**
 * @method
 * @private
 * vyrobi popisky k legende a spocte, kolik zabiraji mista
 */
SZN.LBChart.prototype._prepareLegend = function() {
	var labels = [];
	var max = 0;
	
	var o = this.options;
	for (var i=0;i<this.data.length;i++) {
		var text = SZN.cEl("div", false, false, {position:"absolute"});
		text.innerHTML = this.data[i].label;
		this.container.appendChild(text);
		this.appended.push(text);
		var w = text.offsetWidth;
		max = Math.max(max, w);
		labels.push(text);
	}
	
	this.legendLabels = labels;
	return max + 2*o.padding + 10 + o.legendWidth;
}

/**
 * @method
 * @private
 * vykresli legendu
 */
SZN.LBChart.prototype._drawLegend = function() {
	var labels = this.legendLabels;
	var o = this.options;

	var w = this.availw;

	for (var i=0;i<this.data.length;i++) {
		var dataset = this.data[i];
		var color = o.colors[i % o.colors.length];

		if (dataset.type == "bar") {
			var x1 = this.offsetLeft + w + 2*o.padding;
			var x2 = x1 + o.legendWidth;

			var y1 = i*(o.legendWidth + 10) + o.padding;
			var y2 = y1 + o.legendWidth;

			new SZN.Vector.Polygon(this.canvas, 
								[new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y1), new SZN.Vec2d(x2,y2), new SZN.Vec2d(x1,y2)], 
								{color:color, outlineColor:"#000", outlineWidth:o.outlineWidth});
		} else {
			var x1 = this.offsetLeft + w + 2*o.padding;
			var x2 = x1 + o.legendWidth;
			var y = i*(o.legendWidth + 10) + o.padding + Math.round(o.legendWidth/2);
			new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(x1,y), new SZN.Vec2d(x2,y)], {color:color, width:1+o.lineWidth});

			/* marker */
			if (dataset.marker) { new dataset.marker(this.canvas, new SZN.Vec2d(x1 + o.legendWidth/2,y), o.markerSize, color); }
		}
		
		var l = this.offsetLeft + w + 2*o.padding+o.legendWidth+10;
		var t = i*(o.legendWidth+10) + o.padding;
		var text = labels[i];

		t += Math.round((o.legendWidth - text.offsetHeight)/2);
		text.style.left = l+"px";
		text.style.top = t+"px";
	}
}

/**
 * @class Marker
 * @constructor
 * znacka na care grafu
 * @param {object} canvas vektorovy canvas, do ktereho se kresli
 * @param {vec2d} point souradnice bodu
 * @param {number} size velikost znacky
 * @param {string} color barva znacky
 * @param {string} title title znacky
 */
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
	this._dummy();
}

SZN.Marker.prototype._draw = function() {}

SZN.Marker.prototype._dummy = function() {
	new SZN.Vector.Circle(this.canvas, this.point, this.size * 1.5, {opacity:0, outlineWidth:0, title:this.title});
}

/**
 * znacka kolecka
 * @see SZN.Marker
 */
SZN.Marker.Circle = SZN.ClassMaker.makeClass({
	NAME:"Circle",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Circle.prototype._draw = function() {
	new SZN.Vector.Circle(this.canvas, this.point, this.size/2, {color:this.color, outlineWidth:0, title:this.title});
}

/**
 * znacka ctverecku
 * @see SZN.Marker
 */
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

/**
 * znacka krizku 'x'
 * @see SZN.Marker
 */
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

/**
 * znacka plus
 * @see SZN.Marker
 */
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

/**
 * znacka trojuhelnicku
 * @see SZN.Marker
 */
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
