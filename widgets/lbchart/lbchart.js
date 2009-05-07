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
 * @class Carovy a sloupcovy graf
 * @group jak-widgets
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

/**
 * @param {string} id id prvku, do ktereho se graf vlozi
 * @param {object[]} data pole objektu s vlastnostmi:
 *	 <ul>
 *		<li><em>data</em> - pole hodnot</li>
 *		<li><em>label</em> - nazev datove sady</li>
 *		<li><em>marker</em> - jakou pouzit znacku</li>
 *		<li><em>type</em> - bar/line</li>
 *   </ul>
 * @param {object[]} labels pole popisujici osu X. Kazda polozka je bud jen popisek, nebo objekt s vlastnostmi
 *	 <ul>
 *		<li><em>label</em> - popisek</li>
 *		<li><em>color</em> - barva svisle cary</li>
 *		<li><em>width</em> - sirka svisle cary</li>
 *   </ul>
 * @param {object} [options] asociativni pole parametru
 * @param {int} [options.padding=30] Vycpavka
 * @param {object} [options.rows] {count:priblizny pocet vodorovnych radek, color:barva vodorovnych radek}
 * @param {object} [options.legend] {draw:bool zda-li kreslit legendu, width:sirka prvku legendy}
 * @param {int} [options.markerSize=8] Velikost znacky
 * @param {int} [options.barWidth=10] Sirka sloupce
 * @param {int} [options.lineWidth=1] Sirka cary
 * @param {int} [options.outlineWidth=1] Sirka oramovani sloupce
 * @param {bool} [options.zero=false] Ma-li graf zahrnovat nulu
 * @param {bool} [options.merge=false] Maji-li se sloupce kreslit pres sebe
 * @param {object} [options.axes] {draw:bool maji-li se vykreslit osy, color: barva os}
 * @param {string[]} [options.colors] Pole barev
 */
SZN.LBChart.prototype.$constructor = function(id, data, labels, options) {
	this.options = {
		padding: 30,
		rows: {count:6,	color: "#888"},
		legend: {draw:true, width: 25},
		markerSize: 8,
		barWidth: 10,
		lineWidth: 1,
		outlineWidth: 1,
		zero:false,
		merge:false,
		axes: {draw:true, color: "#ffd625"},
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
	
	this.labels = [];
	for (var i=0;i<labels.length;i++) {
		var o = labels[i];
		if (typeof(o) == "string") { o = {label:o, width:0, color:""}; }
		this.labels.push(o);
	}
	this.data = data;
	for (var i=0;i<this.data.length;i++) {
		if (data[i].type == "bar") { 
			this.barCount++; 
			this.barLength = data[i].data.length;
		}
	}
	if (this.barCount && this.options.merge) { this.barCount = 1; }
	
	if (!this.data.length) { return; }

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
 * prepocita rozmery volne plochy + krok osy X
 */
SZN.LBChart.prototype._compute = function() {
	var o = this.options;
	this.availh = this.height - 2*o.padding;
	this.availw = this.width - (o.padding + this.offsetLeft + this.lw);

	if (this.barCount) {
		this.barInterval = (this.availw - this.barCount * this.barLength * o.barWidth) / this.barLength;
	}
}

/**
 * vykresli graf
 */
SZN.LBChart.prototype._draw = function() {
	var o = this.options;
	/* nalezt extremy */
	var all = [];
	for (var i=0;i<this.data.length;i++) {
		var dataset = this.data[i];
		for (var j=0;j<dataset.data.length;j++) { all.push(dataset.data[j]); }
	}
	all.sort(function(a,b) {return a-b;});
	var min = all.shift();
	var max = all.pop();
	
	this.lw = 0;
	if (o.legend.draw) { this.lw = this._prepareLegend(); } /* predpocitat sirku legendy */
	this._compute();

	if (o.zero) {
		if (min > 0) { min = 0; }
		if (max < 0) { max = 0; }
	}
	
	/* nalezt pocet vodorovnych car */
	if (this.options.rows.count) {
		var step = (max-min) / (this.options.rows.count);
		var base = Math.floor(Math.log(step) / Math.log(10));
		var divisor = Math.pow(10,base);
		var result = Math.round(step / divisor) * divisor;
		max = Math.ceil(max / result) * result;
		min = Math.floor(min / result) * result;
	}
		
	var availh = this.availh;
	var scale = function(value) { return Math.round((value-min) / (max-min) * availh); }
	
	if (this.options.rows.count) { /* vodorovne cary a jejich popisky */
		var style = {
			color:o.rows.color,
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
	

	
	if (this.labels.length) { /* popisky na ose X a svisle cary */
		var labels = [];
		var total = 0;
		var x = this.offsetLeft;
		if (this.barCount) { x += this.barInterval/2 + this.barCount * o.barWidth / 2; }
		var y = this.height - o.padding + 5;
		
		var interval = this.availw / (this.labels.length + (this.barCount ? 0 : -1));
		for (var i=0;i<this.labels.length;i++) {
			/* svisla cara */
			if (this.labels[i].width) {
				var a = new SZN.Vec2d(Math.round(x),this.height - o.padding);
				var b = new SZN.Vec2d(Math.round(x),this.height - o.padding - this.availh);
				var l = new SZN.Vector.Line(this.canvas, [a, b], {color:this.labels[i].color, width:this.labels[i].width});
				/* hack! */
				l.elm.setAttribute("shape-rendering", "crispEdges");
			}

			var label = SZN.cEl("div",false, false, {position:"absolute", top:y+"px", left:Math.round(x)+"px"});
			var l2 = SZN.cEl("div", false, false, {position:"relative", left:"-50%"});
			label.appendChild(l2);
			l2.innerHTML = this.labels[i].label;
			this.container.appendChild(label);
			this.appended.push(label);
			x += interval;
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

	if (o.axes.draw) { /* dve hlavni osy grafu */
		var style = {
			width:1,
			color:o.axes.color
		}
		var top = this.height - o.padding - scale(min);
		new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.offsetLeft, top), new SZN.Vec2d(this.offsetLeft+this.availw, top)], style)
		new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.offsetLeft, o.padding), new SZN.Vec2d(this.offsetLeft, this.height-o.padding)], style);
	}
	
	var idx = 0;
	for (var i=0;i<this.data.length;i++) {  /* sloupcove prvky */
		if (this.data[i].type == "bar") { 
			this._drawBars(i, idx, scale, min, max); 
			if (!this.options.merge) { idx++; }
		}
	}

	for (var i=0;i<this.data.length;i++) { /* radove prvky */
		if (this.data[i].type != "bar") { this._drawLine(i, scale); }
	}
	
	if (o.legend.draw) { this._drawLegend(); }

	/* svisla interaktivni cara */
	var a = new SZN.Vec2d(0,this.height - o.padding);
	var b = new SZN.Vec2d(0,this.height - o.padding - this.availh);
	this._vertical = new SZN.Vector.Line(this.canvas, [a,b], {color:"#000", width:1, opacity:0});
	this._vertical.elm.setAttribute("shape-rendering", "crispEdges");
}

/**
 * vykresli sloupcovy dataset
 * @param {int} indexTotal poradi datasetu
 * @param {int} index poradi datasetu v ramci sloupcovych datasetu
 * @param {function} scale skalovaci funkce
 * @param {float} min nejmensi hodnota, potreba k orientaci sloupce
 * @param {float} max nejvetsi hodnota, potreba k orientaci sloupce
 */
SZN.LBChart.prototype._drawBars = function(indexTotal, index, scale, min, max) {
	var o = this.options;
	var obj = this.data[indexTotal];
	var color = o.colors[indexTotal % o.colors.length];

	var points = [];
	var x1 = this.offsetLeft + index*o.barWidth + this.barInterval/2;
	
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
		
		var style = {color:color, outlineWidth:o.outlineWidth, outlineColor:"black", title:value};
		if (style.outlineWidth == 0) { style.outlineOpacity = 0; } /*safari/chrome hack*/
		new SZN.Vector.Polygon(this.canvas, 
							[new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y1), new SZN.Vec2d(x2,y2), new SZN.Vec2d(x1,y2)], 
							style);

		x1 += this.barInterval + this.barCount	* o.barWidth;
	}
}

/**
 * vykresli carovy dataset
 * @param {int} index poradi datasetu
 * @param {function} scale skalovaci funkce
 */
SZN.LBChart.prototype._drawLine = function(index, scale) {
	var o = this.options;
	var obj = this.data[index];
	var dataLength = obj.data.length;
	
	
	var interval = this.availw / (dataLength + (this.barCount ? 0 : -1));
	var color = o.colors[index % o.colors.length];

	var points = [];
	var x = this.offsetLeft;
	if (this.barCount) { x += this.barInterval/2 + this.barCount * o.barWidth / 2; }
	for (var i=0;i<dataLength;i++) {
		var value = obj.data[i];
		var y = this.height - o.padding - scale(value);
		points.push(new SZN.Vec2d(x, y));
		x += interval;
	}
	
	new SZN.Vector.Line(this.canvas, points, {color:color, width:o.lineWidth});

	var m = obj.marker || SZN.Marker;
	for (var i=0;i<points.length;i++) {
		new m(this.canvas, points[i], o.markerSize, color, obj.data[i]);
	}	
}

/**
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
	return max + 2*o.padding + 10 + o.legend.width;
}

/**
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
			var x2 = x1 + o.legend.width;

			var y1 = i*(o.legend.width + 10) + o.padding;
			var y2 = y1 + o.legend.width;

			new SZN.Vector.Polygon(this.canvas, 
								[new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y1), new SZN.Vec2d(x2,y2), new SZN.Vec2d(x1,y2)], 
								{color:color, outlineColor:"#000", outlineWidth:o.outlineWidth});
		} else {
			var x1 = this.offsetLeft + w + 2*o.padding;
			var x2 = x1 + o.legend.width;
			var y = i*(o.legend.width + 10) + o.padding + Math.round(o.legend.width/2);
			new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(x1,y), new SZN.Vec2d(x2,y)], {color:color, width:1+o.lineWidth});

			/* marker */
			if (dataset.marker) { new dataset.marker(this.canvas, new SZN.Vec2d(x1 + o.legend.width/2,y), o.markerSize, color); }
		}
		
		var l = this.offsetLeft + w + 2*o.padding+o.legend.width+10;
		var t = i*(o.legend.width+10) + o.padding;
		var text = labels[i];

		t += Math.round((o.legend.width - text.offsetHeight)/2);
		text.style.left = l+"px";
		text.style.top = t+"px";
	}
}

/**
 * Marker - znacka na care grafu
 * @class
 * @group jak-widgets
 */
SZN.Marker = SZN.ClassMaker.makeClass({
	NAME:"Marker",
	VERSION:"1.0",
	CLASS:"class"
});

/**
 * @param {object} canvas vektorovy canvas, do ktereho se kresli
 * @param {vec2d} point souradnice bodu
 * @param {int} size velikost znacky
 * @param {string} color barva znacky
 * @param {string} title title znacky
 */
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
	new SZN.Vector.Circle(this.canvas, this.point, this.size * 1.5, {opacity:0, outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * znacka kolecka
 * @class
 * @see SZN.Marker
 * @augments SZN.Marker
 */
SZN.Marker.Circle = SZN.ClassMaker.makeClass({
	NAME:"Circle",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Marker
});

SZN.Marker.Circle.prototype._draw = function() {
	new SZN.Vector.Circle(this.canvas, this.point, this.size/2, {color:this.color, outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * znacka ctverecku
 * @class
 * @see SZN.Marker
 * @augments SZN.Marker
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
	], {color:this.color, outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * znacka krizku 'x'
 * @class
 * @see SZN.Marker
 * @augments SZN.Marker
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
 * @class
 * @see SZN.Marker
 * @augments SZN.Marker
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
	
	new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(x1,this.point.getY()), new SZN.Vec2d(x2,this.point.getY())], {color:this.color, width:2, outlineWidth:0, outlineOpacity:0, title:this.title});
	new SZN.Vector.Line(this.canvas, [new SZN.Vec2d(this.point.getX(),y1), new SZN.Vec2d(this.point.getX(),y2)], {color:this.color, width:2, outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * znacka trojuhelnicku
 * @class
 * @see SZN.Marker
 * @augments SZN.Marker
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
		{color:this.color, outlineWidth:0, outlineOpacity:0, title:this.title});
}
