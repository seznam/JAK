/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview pie chart
 * @version 2.0
 * @author zara
*/   

/**
 * @class PieChart
 * @group jak-widgets
 * @css .legend
 * @css .label
 */
JAK.PieChart = JAK.ClassMaker.makeClass({
	NAME: "JAK.PieChart",
	VERSION: "2.0",
	DEPEND:[{
		sClass:JAK.Vector,
		ver:"2.0"
	}]
});

/**
 * @param {string} id id prvku, do kteráho se graf vloží
 * @param {object[]} data pole objektů s vlastnostmi 'data' a 'label'
 * @param {object} [options] asociativní pole parametrů
 * @param {int} [options.padding=15] vycpávka
 * @param {float} [options.skew=0.7] vertikální zmáčknutí
 * @param {int} [options.depth=10] hloubka
 * @param {int} [options.legendWidth=15] velikost čtverečku s legendou
 * @param {int} [options.legendDistance=15] vzdálenost legendy od okraje koláče
 * @param {int} [options.labelDistance=20] vzdálenost popisků od okraje koláče
 * @param {bool || string} [options.legend="right"] false|left|right|top|bottom, kde a zda-li zobrazovat legendu
 * @param {string} [options.prefix=""] řetězec před každou hodnotou
 * @param {string} [options.suffix=""] řetězec za každou hodnotou
 * @param {object} [options.outlineColor="#000"] barvy rámečků, parametrem je objekt s vlastnostmi graph a legend - obě nutno zadat!
 * @param {string[]} [options.colors] pole barev (v RGB() formátu !)
 */
JAK.PieChart.prototype.$constructor = function(id, data, options) {
	this.options = {
		padding: 15,
		skew: 0.7,
		depth: 10,
		legendWidth: 15,
		legendDistance: 15,
		labelDistance: 20,
		legend: "right",
		prefix: "",
		suffix: "",
		outlineColor: {graph: "#000", legend: "#000"},
		colors: ["rgb(0,76,140)","rgb(255,73,17)","rgb(255,214,37)","rgb(94,162,33)","rgb(132,0,38)", 
				"rgb(137,205,255)","rgb(55,71,5)","rgb(179,210,0)","rgb(82,36,118)","rgb(255,155,17)",
				"rgb(201,0,14)","rgb(0,138,212)"]
	}
	for (var p in options) { this.options[p] = options[p]; }
	
	if (this.options.legend === true) { this.options.legend = "right"; }
	this.container = JAK.gel(id);
	
	this.appended = [];
	this.lastLabel = null;
	
	this.widget = {
		width: this.container.offsetWidth,
		height: this.container.offsetHeight
	}
	this.legend = {
		left: 0,
		top: 0,
		width: 0,
		height: 0
	}
	this.chart = {
		radius: 0,
		cx: 0,
		cy: 0
	}
	
	this.data = data;
	this.canvas = JAK.Vector.getCanvas(this.widget.width, this.widget.height);
	this.container.style.position = "relative";
	this.container.appendChild(this.canvas.getContainer());
	
	this._draw();
}

JAK.PieChart.prototype.$destructor = function() {
	this.canvas.$destructor();
	for (var i=0;i<this.appended.length;i++) {
		var elm = this.appended[i];
		elm.parentNode.removeChild(elm);
	}
}

/**
 * vykreslí graf
 */
 JAK.PieChart.prototype._draw = function() {
	var o = this.options;

	if (o.legend) { this._prepareLegend(); }
	this._computePosition();
	
	var total = 0;
	for (var i=0;i<this.data.length;i++) { total += parseFloat(this.data[i].data); }

	if (this.options.depth) {
		var angle = 2*Math.PI - Math.PI/2;
		for (var i=0;i<this.data.length;i++) { /* middle part */
			var v = this.data[i].data;
			if (!v) { continue; }
			var color = o.colors[i % o.colors.length];
			angle = this._drawPie(v,total,angle,color,1);
		} /* for all data */
	}

	var angle = 2*Math.PI - Math.PI/2;
	for (var i=0;i<this.data.length;i++) { /* top part */
		var v = this.data[i].data;
		if (!v) { continue; }
		var color = o.colors[i % o.colors.length];
		angle = this._drawPie(v,total,angle,color,0);
	} /* for all data */
	
	if (this.options.legend) { this._drawLegend(); }
}


/**
 * vykreslí segment grafu
 */
JAK.PieChart.prototype._drawPie = function(value,total,start_angle,color,middle) {
	var ycoef = this.options.skew;
	var r = this.chart.radius;
	var cx = this.chart.cx;
	var cy = this.chart.cy;
	
	var angle = parseFloat(value) / total * 2 * Math.PI;
	var end_angle = start_angle + angle;
	var large = (angle >= Math.PI ? 1 : 0);

	if (middle) { 
		cy += Math.round(this.options.depth/2);
		
		var deg1 = (start_angle / Math.PI * 180) % 360;
		var deg2 = (end_angle / Math.PI * 180) % 360;
		if (deg2 <= deg1) { deg2 += 360; }
		
		if (deg1 > 180 && deg2 < 360) { return end_angle; }
		
		if (deg2 > 360) { deg1 = 360; large = 0; }
		if (deg1 < 540 && deg2 > 540) { deg2 = 540; large = 0; }
		if (deg1 < 180 && deg2 > 180) { deg2 = 180; large = 0; }
		var rad1 = deg1 / 180 * Math.PI;
		var rad2 = deg2 / 180 * Math.PI;
		
		var x1 = r * Math.cos(rad1) + cx;
		var y1 = ycoef * r * Math.sin(rad1) + cy;

		var x2 = r * Math.cos(rad2) + cx;
		var y2 = ycoef * r * Math.sin(rad2) + cy;
		
		var d = this.options.depth;
		var path = "M "+x1+" "+y1+" L "+x1+" "+(y1-d)+" ";
		path += "A "+r*1+" "+(r*ycoef)+" 0 "+large+" 1 "+x2+" "+(y2-d)+" ";
		path += "L "+x2+" "+y2+" ";
		path += "A "+r+" "+(r*ycoef)+" 0 "+large+" 0 "+x1+" "+y1+" ";
		
		/* lighter color */
		var r = color.match(/([0-9]+) *, *([0-9]+) *, *([0-9]+)/);
		var c = [parseInt(r[1],10), parseInt(r[2],10), parseInt(r[3],10)];

		var newr = c[0] - 50; if (newr < 0) { newr = 0; }
		var newg = c[1] - 50; if (newg < 0) { newg = 0; }
		var newb = c[2] - 50; if (newb < 0) { newb = 0; } 

		new JAK.Vector.Path(this.canvas, path, {outlineColor:this.options.outlineColor.graph, color:"rgb("+newr+","+newg+","+newb+")"});
	} else {
		cy -= Math.round(this.options.depth/2);
		var x1 = r * Math.cos(start_angle) + cx;
		var y1 = ycoef * r * Math.sin(start_angle) + cy;
		var x2 = r * Math.cos(end_angle) + cx;
		var y2 = ycoef * r * Math.sin(end_angle) + cy;		
		
		if (value == total) {
			var path = "M "+(cx-r)+" "+cy+" ";
			path += "A "+r+" "+r*(ycoef)+" 0 "+large+" 1 "+(cx+r)+" "+cy+" ";
			path += "A "+r+" "+r*(ycoef)+" 0 "+large+" 1 "+(cx-r)+" "+cy+" ";
		} else {
			var path = "M "+cx+" "+cy+" L "+x1+" "+y1+" ";
			path += "A "+r+" "+r*(ycoef)+" 0 "+large+" 1 "+x2+" "+y2+" ";
			path += "L "+cx+" "+cy+" z";
		}
		new JAK.Vector.Path(this.canvas, path, {outlineColor:this.options.outlineColor.graph, color:color});

		var mid_angle = (start_angle + end_angle) / 2;
		this._drawLabel(mid_angle, value, cy);
	}
	return end_angle;
}

JAK.PieChart.prototype._drawLabel = function(angle, value, cy) {
	var cx = this.chart.cx;
	var r = this.chart.radius;
	
	var x = (r+this.options.labelDistance) * Math.cos(angle) + cx;
	var y = (r+this.options.labelDistance) * this.options.skew * Math.sin(angle) + cy;
	y += (angle % (2*Math.PI) < Math.PI ? this.options.depth : 0);

	var text1 = JAK.mel("div", null, {position:"absolute", left:Math.round(x)+"px", top:Math.round(y)+"px"});
	var text2 = JAK.mel("div", {className:"label"}, {position:"relative", left:"-50%"});
	text2.innerHTML = this.options.prefix + value + this.options.suffix;
	JAK.DOM.append([text1, text2], [this.container, text1]);
	this.appended.push(text1);
	var oh = text2.offsetHeight;
	y -= oh/2;
	text1.style.top = Math.round(y) + "px";
	
	if (this.lastLabel) { /* popisky se protinaji, posuneme ... */
		this._testShift(this.lastLabel, text2, text1, angle);
		if (this.lastLabel != this.firstLabel) { this._testShift(this.firstLabel, text2, text1, angle); }
	} else {
		this.firstLabel = text2;
	}
	this.lastLabel = text2;
}

JAK.PieChart.prototype._testShift = function(oldLabel, newLabel, holder, angle) {
	var pos1 = JAK.DOM.getBoxPosition(oldLabel);
	var pos2 = JAK.DOM.getBoxPosition(newLabel);
	var dims1 = [oldLabel.offsetWidth, oldLabel.offsetHeight];
	var dims2 = [newLabel.offsetWidth, newLabel.offsetHeight];
	var coef = 0.8;
	dims1[1] *= coef;
	dims2[1] *= coef;
	
	var ok1 = (pos1.left+dims1[0] <= pos2.left) || (pos2.left+dims2[0] <= pos1.left);
	var ok2 = (pos1.top+dims1[1] <= pos2.top) || (pos2.top+dims2[1] <= pos1.top);
	if (!ok1 && !ok2) { 
		var amount = Math.sqrt(dims2[0]*dims2[1]) / coef;
		var x = holder.offsetLeft + Math.cos(angle) * amount;
		var y = holder.offsetTop + Math.sin(angle) * amount * this.options.skew;
		holder.style.left = Math.round(x)+"px";
		holder.style.top = Math.round(y)+"px";
	}
}

JAK.PieChart.prototype._prepareLegend = function() {
	var labels = [];
	var max = 0;
	
	for (var i=0;i<this.data.length;i++) {
		var text = JAK.mel("div", {className:"legend"}, {position:"absolute"});
		text.innerHTML = this.data[i].label;
		this.container.appendChild(text);
		this.appended.push(text);
		var w = text.offsetWidth;
		max = Math.max(max, w);
		labels.push(text);
	}
	
	this._legendLabels = labels;
	
	this.legend.width = max + 10 + this.options.legendWidth;
	this.legend.height = this.data.length * this.options.legendWidth + (this.data.length-1)*10;
	
	switch (this.options.legend) {
		case "left":
			this.legend.left = this.options.padding;
			this.legend.top = Math.round((this.widget.height - this.legend.height) / 2);
		break;
		case "right":
			this.legend.left = this.widget.width - this.options.padding - this.legend.width;
			this.legend.top = Math.round((this.widget.height - this.legend.height) / 2);
		break;
		case "top":
			this.legend.left = Math.round((this.widget.width - this.legend.width) / 2);
			this.legend.top = this.options.padding;
		break;
		case "bottom":
			this.legend.left = Math.round((this.widget.width - this.legend.width) / 2);
			this.legend.top = this.widget.height - this.options.padding - this.legend.height;
		break;
	}
}

JAK.PieChart.prototype._drawLegend = function(labels) {
	var labels = this._legendLabels;
	var size = this.options.legendWidth;
	
	for (var i=0;i<this.data.length;i++) {
		var color = this.options.colors[i % this.options.colors.length];
		var x1 = this.legend.left;
		var x2 = x1 + size;
		var y1 = this.legend.top + i*(size + 10);
		var y2 = y1 + size;
		new JAK.Vector.Polygon(this.canvas, 
							[new JAK.Vec2d(x1,y1), new JAK.Vec2d(x2,y1), new JAK.Vec2d(x2,y2), new JAK.Vec2d(x1,y2)], 
							{color:color, outlineColor:this.options.outlineColor.legend, outlineWidth:1});

		var l = this.legend.left + 10 + size;
		var t = this.legend.top + i*(size + 10);
		var text = labels[i];

		t += Math.round((size - text.offsetHeight)/2);
		text.style.left = l+"px";
		text.style.top = t+"px";
	}
}

/**
 * Spočítá rozměry a pozici grafu
 */
JAK.PieChart.prototype._computePosition = function() {
	var o = this.options;
	var w = 0;
	var h = 0;
	var left = 0;
	var top = 0;
	
	switch (this.options.legend) {
		case "left":
			w = this.widget.width - 2*o.padding - this.legend.width - o.legendDistance;
			h = this.widget.height - 2*o.padding;
			left = this.widget.width - o.padding - w;
			top = o.padding;
		break;
		case "right":
			w = this.widget.width - 2*o.padding - this.legend.width - o.legendDistance;
			h = this.widget.height - 2*o.padding;
			left = o.padding;
			top = o.padding;
		break;
		case "top":
			w = this.widget.width - 2*o.padding;
			h = this.widget.height - 2*o.padding - this.legend.height - o.legendDistance;
			left = o.padding;
			top = this.widget.height - o.padding - h;
		break;
		case "bottom":
			left = o.padding;
			top = o.padding;
			w = this.widget.width - 2*o.padding;
			h = this.widget.height - 2*o.padding - this.legend.height - o.legendDistance;
		break;
		default:
			w = this.widget.width - 2*o.padding;
			h = this.widget.height - 2*o.padding;
			left = o.padding;
			top = o.padding;
		break;
	}
	
	this.chart.cx = left + Math.round(w/2);
	this.chart.cy = top + Math.round(h/2)

	h /= o.skew;
	h -= o.depth;
	this.chart.radius = Math.round(Math.min(w, h)/2);
}
