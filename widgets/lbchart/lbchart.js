/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview line + bar chart
 * @version 2.1
 * @author zara
*/   

/**
 * @class Čárový a sloupcový graf
 * @group jak-widgets
 * @css .legend
 * @css .label-x
 * @css .label-y
 */
JAK.LBChart = JAK.ClassMaker.makeClass({
	NAME: "JAK.LBChart",
	VERSION: "2.1",
	DEPEND:[{
		sClass:JAK.Vector,
		ver:"2.0"
	}]
});

/**
 * @param {string} id id prvku, do kterého se graf vlozi
 * @param {object[]} data pole objektů s vlastnostmi:
 *	 <ul>
 *		<li><em>data</em> - pole hodnot</li>
 *		<li><em>label</em> - název datové sady</li>
 *		<li><em>marker</em> - jakou použít značku</li>
 *		<li><em>type</em> - bar/line</li>
 *		<li><em>color</em> - volitelně barva</li>
 *		<li><em>style</em> - volitelně konstanta stylu pro čáru (JAK.Vector.STYLE_*)</li>
 *   </ul>
 * @param {object[]} labels pole popisující osu X. Každá položka je buď jen popisek, nebo objekt s vlastnostmi
 *	 <ul>
 *		<li><em>label</em> - popisek</li>
 *		<li><em>color</em> - barva svisle cary</li>
 *		<li><em>width</em> - sirka svisle cary</li>
 *   </ul>
 * @param {object} [options] asociativní pole parametrů
 * @param {int} [options.padding=30] Vycpávka
 * @param {object} [options.rows] {count:přibližný počet vodorovných řádek, color:barva vodorovných řádek}
 * @param {object} [options.legend] {draw:[false|left|top|right|bottom] zda-li a kde kreslit legendu, width:šířka a výška prvků legendy, vertical:mají-li být prvky legendy pod sebou}
 * @param {int} [options.markerSize=8] Velikost značky
 * @param {int} [options.barWidth=10] Šířka sloupce
 * @param {int} [options.barMinSize=0] Minimální výška sloupce (v pixelech)
 * @param {int} [options.lineWidth=1] Šířka čáry
 * @param {int} [options.min=null] Minimální hodnota, null=auto
 * @param {int} [options.max=null] Maximální hodnota, null=auto
 * @param {int} [options.outlineWidth=1] Šířka orámování sloupce
 * @param {bool} [options.zero=false] Má-li graf zahrnovat nulu
 * @param {bool} [options.merge=false] Maji-li se sloupce kreslit pres sebe
 * @param {object} [options.axes] {draw:bool mají-li se vykreslit osy, color: barva os}
 * @param {function || null} [options.format=null] Formátovač popisků osy Y. Při nezadání se použije identita.
 * @param {string[]} [options.colors] Pole barev
 * @param {bool} [options.pointer=false] Zobrazovat-li svislou dynamickou caru
 */
JAK.LBChart.prototype.$constructor = function(id, data, labels, options) {
	this.options = {
		padding: 30,
		rows: {count: 6, color: "#888"},
		legend: {draw:"right", width:26, vertical:true},
		markerSize: 8,
		barWidth: 10,
		barMinSize: 0,
		lineWidth: 1,
		outlineWidth: 1,
		min: null,
		max: null,
		zero: false,
		merge: false,
		pointer: false,
		axes: {draw:true, color: "#ffd625"},
		format: null,
		colors: ["#004c8c", "#ff4911", "#ffd625", "#5ea221", "#840026", "#89cdff", "#374705", "#b3d200", "#522476", "#ff9b11", "#c9000e", "#008ad4"]
	}
	
	this._mergeOptions(this.options, options);
	if (this.options.legend.draw === true) { this.options.legend.draw = "right"; }
	
	this.container = JAK.gel(id);
	this.appended = [];
	
	this.widget = {
		width: this.container.offsetWidth,
		height: this.container.offsetHeight
	}
	this.chart = {
		width: 0,
		height: 0,
		left: 0,
		top: 0
	}
	this.legend = {
		width: 0,
		height: 0,
		left: 0,
		top: 0
	}
	this.bar = {
		count: 0,
		length: 0,
		step: 0
	}
	this.misc = {
		min: 0,
		max: 0,
		step: 0
	}
	
	this.canvas = JAK.Vector.getCanvas(this.widget.width, this.widget.height);
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
			this.bar.count++; 
			this.bar.length = data[i].data.length;
		}
	}
	if (this.bar.count && this.options.merge) { this.bar.count = 1; }
	
	if (!this.data.length) { return; }

	this._draw(); 
	if (this.options.pointer) {
		var c = this.canvas.getContainer();
		JAK.Events.addListener(c, "mousemove", this, "_mousemove");
		JAK.Events.addListener(c, "mouseout", this, "_mouseout");
	}
}

/**
 * Zrušit canvas a popisky
 */
JAK.LBChart.prototype.$destructor = function() {
	this.canvas.$destructor();
	for (var i=0;i<this.appended.length;i++) {
		var elm = this.appended[i];
		elm.parentNode.removeChild(elm);
	}
}

/**
 * Rekurzivní merge
 */
JAK.LBChart.prototype._mergeOptions = function(oldData, newData) {
	for (var p in newData) {
		if (!(p in oldData)) { continue; } /* neznama polozka */
		
		var newVal = newData[p];
		if (typeof(newVal) == "object" && !(newVal instanceof Array) && newVal !== null) {
			arguments.callee(oldData[p], newData[p]);
		} else {
			oldData[p] = newVal;
		}
	}
}

JAK.LBChart.prototype._mousemove = function(e, elm) {
	var s = JAK.DOM.getScrollPos();
	var pos = JAK.DOM.getBoxPosition(this.container);
	s.x += e.clientX;
	s.y += e.clientY;
	s.x -= pos.left;
	s.y -= pos.top;
	
	if (s.x >= this.chart.left && s.x <= this.chart.left + this.chart.width && s.y >= this.chart.top && s.y <= this.chart.top + this.chart.height) {
		var o = 1;
		var a = new JAK.Vec2d(s.x, this.chart.top);
		var b = new JAK.Vec2d(s.x, this.chart.top+this.chart.height);
		this._vertical.setPoints([a,b]);
	} else {
		var o = 0;
	}
	this._vertical.setOptions({opacity:o});
}

JAK.LBChart.prototype._mouseout = function(e, elm) {
	this._vertical.setOptions({opacity:0});
}

/**
 * Škálovací funkce
 */ 
JAK.LBChart.prototype.scale = function(value) {
	return Math.round((value-this.misc.min) / (this.misc.max-this.misc.min) * this.chart.height);
}

JAK.LBChart.prototype._lesser = function(a, b) {
	return a-b < 1e-8;
}

/**
 * Vykreslí graf
 */
JAK.LBChart.prototype._draw = function() {
	var o = this.options;

	/* 1. spocitat velikost legendy */
	if (o.legend.draw) { this._prepareLegend(); } 
	
	/* 2. najit extremy a krok y */
	this._computeExtremes();
	if (o.rows.count) { this._computeStepY(); }
	
	/* 3. pripravit popisky a spocitat rozmery grafu */
	this._prepareLabels();

	/* 4. vykreslit vodorovne cary a jejich popisky */
	if (o.rows.count) { this._drawLabelsY(); }
	
	/* 5. najit krok x */
	if (this.bar.count) { this._computeStepX(); }
	
	/* 7. popisky na ose X a svisle cary */	
	if (this.labels.length) { this._drawLabelsX(); }

	/* 8. dve hlavni osy */
	if (o.axes.draw) { this._drawAxes(); }
	
	/* 9. sloupcove prvky */
	var idx = 0;
	for (var i=0;i<this.data.length;i++) {
		if (this.data[i].type == "bar") { 
			this._drawBars(i, idx); 
			if (!this.options.merge) { idx++; }
		}
	}

	/* 10. radkove prvky */
	for (var i=0;i<this.data.length;i++) {
		if (this.data[i].type != "bar") { this._drawLine(i); }
	}
	
	/* 11. legenda */
	if (o.legend.draw) { this._drawLegend(); }

	/* 12. svisla interaktivni cara */
	if (o.pointer) { 
		var a = new JAK.Vec2d(0, 0);
		var b = new JAK.Vec2d(0, 0);
		this._vertical = new JAK.Vector.Line(this.canvas, [a,b], {color:"#000", width:1, opacity:0});
		this._vertical.elm.setAttribute("shape-rendering", "crispEdges");
	}
}

/**
 * Vykreslí hlavní osy
 */
JAK.LBChart.prototype._drawAxes = function() {
	var style = {
		width:1,
		color:this.options.axes.color
	}
	
	var bottom = this.chart.top + this.chart.height;
	
	new JAK.Vector.Line( /* x */
		this.canvas, 
		[new JAK.Vec2d(this.chart.left, bottom), new JAK.Vec2d(this.chart.left + this.chart.width, bottom)],
		style
	);
	new JAK.Vector.Line( /* y */
		this.canvas, 
		[new JAK.Vec2d(this.chart.left, bottom), new JAK.Vec2d(this.chart.left, this.chart.top)],
		style
	);
}

/**
 * Vykreslí sloupcový dataset
 * @param {int} indexTotal Pořadí datasetu
 * @param {int} index Pořadí datasetu v rámci sloupcových datasetů
 */
JAK.LBChart.prototype._drawBars = function(indexTotal, index) {
	var o = this.options;
	var obj = this.data[indexTotal];
	var color = obj.color || o.colors[indexTotal % o.colors.length];

	var points = [];
	var x1 = this.chart.left + index*o.barWidth + this.bar.step/2;
	
	for (var i=0;i<obj.data.length;i++) {
		var value = obj.data[i];

		var x2 = x1 + o.barWidth;
		
		var ref = 0;
		if (this.misc.min >= 0) {
			ref = this.misc.min;
		} else if (this.misc.max <= 0) {
			ref = this.misc.max;
		}
		var y1 = this.chart.top + this.chart.height - this.scale(ref);
		var y2 = this.chart.top + this.chart.height - this.scale(value);
		
		if (this.options.barMinSize && Math.abs(y2-y1) < this.options.barMinSize) {
			y2 = y1 - this.options.barMinSize;
		}
		
		var style = {color:color, outlineWidth:o.outlineWidth, outlineColor:"black", title:value};
		if (style.outlineWidth == 0) { style.outlineOpacity = 0; } /* safari/chrome hack */
		new JAK.Vector.Polygon(
			this.canvas, 
			[new JAK.Vec2d(x1,y1), new JAK.Vec2d(x2,y1), new JAK.Vec2d(x2,y2), new JAK.Vec2d(x1,y2)], 
			style
		);

		x1 += this.bar.step + this.bar.count * o.barWidth;
	}
}

/**
 * Vykreslí čárový dataset
 * @param {int} index Pořadí datasetu
 */
JAK.LBChart.prototype._drawLine = function(index) {
	var o = this.options;
	var obj = this.data[index];
	var dataLength = obj.data.length;
	
	var interval = this.chart.width / (dataLength + (this.bar.count ? 0 : -1));
	var color = obj.color || o.colors[index % o.colors.length];

	var points = [];
	var lines = [[]];
	var x = this.chart.left;
	if (this.bar.count) { x += this.bar.step/2 + this.bar.count * o.barWidth / 2; }
	
	for (var i=0;i<dataLength;i++) {
		var value = obj.data[i];
		if (value !== null && value !== undefined) {
			var y = this.chart.top+this.chart.height - this.scale(value);
			var point = new JAK.Vec2d(x, y);
			points.push(point);
			lines[lines.length-1].push(point);
		}
		if (value === undefined) { lines.push([]); }
		x += interval;
	}

	var style = {color:color, width:o.lineWidth};
	if (obj.style) { style.style = obj.style; }
	for (var i=0;i<lines.length;i++) {
		if (lines[i].length < 2) { continue; }
		new JAK.Vector.Line(this.canvas, lines[i], style);
	}

	var m = obj.marker || JAK.Marker;
	for (var i=0;i<points.length;i++) {
		new m(this.canvas, points[i], o.markerSize, color, obj.data[i]);
	}	
}

/**
 * Vykreslit popisky osy x
 */
JAK.LBChart.prototype._drawLabelsX = function() {
	var labels = [];
	var total = 0;
	var x = this.chart.left;
	if (this.bar.count) { x += this.bar.step/2 + this.bar.count * this.options.barWidth / 2; }
	var y = this.chart.top + this.chart.height + 5;
	
	var interval = this.chart.width / (this.labels.length + (this.bar.count ? 0 : -1));
	for (var i=0;i<this.labels.length;i++) {
		/* svisla cara */
		if (this.labels[i].width) {
			var a = new JAK.Vec2d(Math.round(x), this.chart.top);
			var b = new JAK.Vec2d(Math.round(x), this.chart.top+this.chart.height);
			var l = new JAK.Vector.Line(this.canvas, [a, b], {color:this.labels[i].color, width:this.labels[i].width});
			/* hack! */
			l.elm.setAttribute("shape-rendering", "crispEdges");
		}

		var label = JAK.mel("div", null, {position:"absolute", top:y+"px", left:Math.round(x)+"px"});
		var l2 = JAK.mel("div", {className:"label-x"}, {position:"relative", left:"-50%"});
		label.appendChild(l2);
		l2.innerHTML = this.labels[i].label;
		this.container.appendChild(label);
		this.appended.push(label);
		x += interval;
		total += 5 + label.offsetWidth;
		labels.push(label);
	}

	if (total > this.chart.width) {
		var frac = Math.ceil(total / this.chart.width);
		for (var i=0;i<labels.length;i++) {
			if (i % frac) { labels[i].style.display = "none"; }
		}
	}
}

/**
 * Vykreslit vodorovné čáry a rozmístit jejich popisky 
 */
JAK.LBChart.prototype._drawLabelsY = function() {
	var idx = 0;
	var style = {
		color:this.options.rows.color,
		width:1
	}
	
	for (var i=this.misc.min;this._lesser(i, this.misc.max);i+=this.misc.step) {
		var top = this.chart.top + this.chart.height - this.scale(i);

		/* cara */
		new JAK.Vector.Line(
			this.canvas, 
			[new JAK.Vec2d(this.chart.left, top), new JAK.Vec2d(this.chart.left + this.chart.width, top)], 
			style
		);

		/* umisteni popisku */		
		var text = this._labels[idx];
		var w = text.offsetWidth;
		var h = text.offsetHeight;
		top -= Math.round(h/2);
		text.style.top = top+"px";
		text.style.left = (this.chart.left - 10 - w) + "px";
		
		idx++;
	}
}

/**
 * Vykreslí legendu
 */
JAK.LBChart.prototype._drawLegend = function() {
	var labels = this._legendLabels;
	var size = this.options.legend.width;
	var vertical = this.options.legend.vertical;
	var x1 = this.legend.left;
	var y1 = this.legend.top;

	for (var i=0;i<this.data.length;i++) {
		var dataset = this.data[i];
		var color = dataset.color || this.options.colors[i % this.options.colors.length];

		var x2 = x1 + this.options.legend.width;

		if (dataset.type == "bar") {
			var y2 = y1 + size;
			new JAK.Vector.Polygon(this.canvas, 
								[new JAK.Vec2d(x1,y1), new JAK.Vec2d(x2,y1), new JAK.Vec2d(x2,y2), new JAK.Vec2d(x1,y2)], 
								{color:color, outlineColor:"#000", outlineWidth:this.options.outlineWidth});
		} else {
			var y = y1 + Math.round(size/2);
			var style = {color:color, width:1+this.options.lineWidth};
			if (dataset.style) { style.style = dataset.style; }
			new JAK.Vector.Line(this.canvas, [new JAK.Vec2d(x1,y), new JAK.Vec2d(x2,y)], style);

			/* marker */
			if (dataset.marker) { new dataset.marker(this.canvas, new JAK.Vec2d(x1 + size/2,y), this.options.markerSize, color); }
		}
		
		var l = x1 + size + 10;
		var t = y1;
		var text = labels[i];

		t += Math.round((size - text.offsetHeight)/2);
		text.style.left = l+"px";
		text.style.top = t+"px";
		
		if (vertical) {
			y1 += size + 10;
		} else {
			x1 += this.options.legend.width + 10 + text.offsetWidth + 20;
		}
	}
}

/**
 * Předvyrobit popisky osy Y a spočítat rozměry a pozici grafu
 */
JAK.LBChart.prototype._prepareLabels = function() {
	if (this.options.rows.count) {
		var m = 0;
		var labels = [];
		
		var format = (this.options.format || function(x) { return x; });
		
		for (var i=this.misc.min;this._lesser(i, this.misc.max);i+=this.misc.step) {
			var text = JAK.mel("div", {className:"label-y"}, {position:"absolute"});
			text.innerHTML = format(Math.round(i * 1000) / 1000);
			this.container.appendChild(text);
			this.appended.push(text);
			var w = text.offsetWidth;
			m = Math.max(m, w);
			labels.push(text);
		}
		
		this.chart.left = m+10;
		this._labels = labels;
	}

	switch (this.options.legend.draw) {
		case "left":
			this.chart.left += this.legend.left + this.legend.width + this.options.padding;
			this.chart.top = this.options.padding;
			this.chart.width = this.widget.width - this.chart.left - this.options.padding;
			this.chart.height = this.widget.height - this.chart.top - this.options.padding;
		break;
		case "right":
			this.chart.left += this.options.padding;
			this.chart.top = this.options.padding;
			this.chart.width = this.legend.left - this.options.padding - this.chart.left;
			this.chart.height = this.widget.height - this.chart.top - this.options.padding;
		break;
		case "top":
			this.chart.left += this.options.padding;
			this.chart.top = this.legend.top + this.legend.height + this.options.padding;
			this.chart.width = this.widget.width - this.chart.left - this.options.padding;
			this.chart.height = this.widget.height - this.chart.top - this.options.padding;
		break;
		case "bottom":
			this.chart.left += this.options.padding;
			this.chart.top = this.options.padding;
			this.chart.width = this.widget.width - this.chart.left - this.options.padding;
			this.chart.height = this.legend.top - 2*this.options.padding;
		break;
		default:
			this.chart.left += this.options.padding;
			this.chart.top = this.options.padding;
			this.chart.width = this.widget.width - this.chart.left - this.options.padding;
			this.chart.height = this.widget.height - this.chart.top - this.options.padding;
		break;
	}
}

/**
 * Vyrobí popisky k legendě a spočte, kolik zabírají místa. Rozhodne o umístění legendy.
 */
JAK.LBChart.prototype._prepareLegend = function() {
	var labels = [];
	var maxWidth = 0;
	var totalWidth = 0;
	
	var count = this.data.length;
	for (var i=0;i<count;i++) {
		var text = JAK.mel("div", {className:"legend"}, {position:"absolute"});
		text.innerHTML = this.data[i].label;
		this.container.appendChild(text);
		this.appended.push(text);
		var w = text.offsetWidth;
		totalWidth += w;
		maxWidth = Math.max(maxWidth, w);
		labels.push(text);
	}
	
	this._legendLabels = labels;
	if (this.options.legend.vertical) {
		this.legend.width = maxWidth + 10 + this.options.legend.width;
		this.legend.height = this.data.length * this.options.legend.width + count*10;
	} else {
		this.legend.width = totalWidth + count * (10 + this.options.legend.width) + (count-1) * (2*10);
		this.legend.height = this.options.legend.width;
	}
	
	switch (this.options.legend.draw) {
		case "left":
			this.legend.left = this.options.padding;
			this.legend.top = Math.round((this.widget.height - this.legend.height) / 2);
		break;
		case "right":
			this.legend.top = Math.round((this.widget.height - this.legend.height) / 2);
			this.legend.left = this.widget.width - this.legend.width - this.options.padding;
		break;
		case "top":
			this.legend.top = this.options.padding;
			this.legend.left = Math.round((this.widget.width - this.legend.width) / 2);
		break;
		case "bottom":
			this.legend.top = this.widget.height - this.options.padding - this.legend.height;
			this.legend.left = Math.round((this.widget.width - this.legend.width) / 2);
		break;
	}
}

/**
 * Nalézt počet vodorovných čar 
 */
JAK.LBChart.prototype._computeStepY = function() {
	var diff = this.misc.max-this.misc.min;
	var step = diff / (this.options.rows.count);
	var base = Math.floor(Math.log(step) / Math.log(10));
	var divisor = Math.pow(10, base);
	var optimal = Math.round(step / divisor) * divisor;
	
	if (this.options.min !== null && this.options.max !== null) { /* uzivatel zadal obe meze */
		this.misc.step = step;
	} else {
		this.misc.step = optimal;
		var rounded = Math.ceil(diff / optimal) * optimal;
		
		if (this.options.min !== null) { /* uzivatel zadal spodni mez */
			this.misc.max = this.misc.min + rounded;
		} else if (this.options.max !== null) { /* uzivatel zadal horni mez */
			this.misc.min = this.misc.max - rounded;
		} else { /* uzivatel nezadal zadnou mez */
			this.misc.min = Math.floor(this.misc.min / optimal) * optimal;
			this.misc.max = Math.ceil(this.misc.max / optimal) * optimal;
		}
	}
	
}

/**
 * Nalézt počet kroků na ose X
 */
JAK.LBChart.prototype._computeStepX = function() {
	this.bar.step = (this.chart.width - this.bar.count * this.bar.length * this.options.barWidth) / this.bar.length;
}

/**
 * Nalézt extrémy
 */
JAK.LBChart.prototype._computeExtremes = function() {
	var all = [];
	for (var i=0;i<this.data.length;i++) {
		var dataset = this.data[i];
		for (var j=0;j<dataset.data.length;j++) { 
			var value = dataset.data[j];
			if (value !== null && value != undefined) { all.push(value); }
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
	this.misc.min = min;
	this.misc.max = max;
}

/**
 * Marker - značka na čáře grafu
 * @class
 * @group jak-widgets
 */
JAK.Marker = JAK.ClassMaker.makeClass({
	NAME:"Marker",
	VERSION:"1.0",
	CLASS:"class"
});

/**
 * @param {object} canvas vektorový canvas, do kterého se kreslí
 * @param {JAK.Vec2d} point souřadnice bodu
 * @param {int} size velikost značky
 * @param {string} color barva značky
 * @param {string} title title značky
 */
JAK.Marker.prototype.$constructor = function(canvas, point, size, color, title) {
	this.canvas = canvas;
	this.point = point;
	this.size = size;
	this.color = color;
	this.title = title || "";
	this._draw();
	this._dummy();
}

JAK.Marker.prototype._draw = function() {}

JAK.Marker.prototype._dummy = function() {
	new JAK.Vector.Circle(this.canvas, this.point, this.size, {opacity:0, color:"white", outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * značka kolečka
 * @class
 * @see JAK.Marker
 * @augments JAK.Marker
 */
JAK.Marker.Circle = JAK.ClassMaker.makeClass({
	NAME:"Circle",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:JAK.Marker
});

JAK.Marker.Circle.prototype._draw = function() {
	new JAK.Vector.Circle(this.canvas, this.point, this.size/2, {color:this.color, outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * značka čtverečku
 * @class
 * @see JAK.Marker
 * @augments JAK.Marker
 */
JAK.Marker.Square = JAK.ClassMaker.makeClass({
	NAME:"Square",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:JAK.Marker
});

JAK.Marker.Square.prototype._draw = function() {
	var x1 = this.point.getX() - this.size/2;
	var y1 = this.point.getY() - this.size/2;
	var x2 = x1 + this.size;
	var y2 = y1 + this.size;
	
	new JAK.Vector.Polygon(this.canvas, [
		new JAK.Vec2d(x1,y1), new JAK.Vec2d(x2,y1), 
		new JAK.Vec2d(x2,y2), new JAK.Vec2d(x1,y2)
	], {color:this.color, outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * značka křížku 'x'
 * @class
 * @see JAK.Marker
 * @augments JAK.Marker
 */
JAK.Marker.Cross = JAK.ClassMaker.makeClass({
	NAME:"Cross",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:JAK.Marker
});

JAK.Marker.Cross.prototype._draw = function() {
	var x1 = this.point.getX() - this.size/2;
	var y1 = this.point.getY() - this.size/2;
	var x2 = x1 + this.size;
	var y2 = y1 + this.size;
	
	new JAK.Vector.Line(this.canvas, [new JAK.Vec2d(x1,y1), new JAK.Vec2d(x2,y2)], {color:this.color, outlineWidth:0, width:2, title:this.title});
	new JAK.Vector.Line(this.canvas, [new JAK.Vec2d(x2,y1), new JAK.Vec2d(x1,y2)], {color:this.color, outlineWidth:0, width:2, title:this.title});
}

/**
 * značka plus
 * @class
 * @see JAK.Marker
 * @augments JAK.Marker
 */
JAK.Marker.Plus = JAK.ClassMaker.makeClass({
	NAME:"Plus",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:JAK.Marker
});

JAK.Marker.Plus.prototype._draw = function() {
	var x1 = this.point.getX() - this.size/2;
	var y1 = this.point.getY() - this.size/2;
	var x2 = x1 + this.size;
	var y2 = y1 + this.size;
	
	new JAK.Vector.Line(this.canvas, [new JAK.Vec2d(x1,this.point.getY()), new JAK.Vec2d(x2,this.point.getY())], {color:this.color, width:2, outlineWidth:0, outlineOpacity:0, title:this.title});
	new JAK.Vector.Line(this.canvas, [new JAK.Vec2d(this.point.getX(),y1), new JAK.Vec2d(this.point.getX(),y2)], {color:this.color, width:2, outlineWidth:0, outlineOpacity:0, title:this.title});
}

/**
 * značka trojúhelníčku
 * @class
 * @see JAK.Marker
 * @augments JAK.Marker
 */
JAK.Marker.Triangle = JAK.ClassMaker.makeClass({
	NAME:"Triangle",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:JAK.Marker
});

JAK.Marker.Triangle.prototype._draw = function() {
	var coef = Math.sqrt(3);
	var x = this.point.getX();
	var y = this.point.getY();
	
	new JAK.Vector.Polygon(this.canvas, [
		new JAK.Vec2d(x-this.size/2, y+this.size*coef/5), new JAK.Vec2d(x+this.size/2, y+this.size*coef/5), 
		new JAK.Vec2d(x, y-this.size*coef/3)],
		{color:this.color, outlineWidth:0, outlineOpacity:0, title:this.title});
}
