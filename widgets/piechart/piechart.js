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
 * @overview pie chart
 * @version 1.0
 * @author zara
*/   

/**
 * @class PieChart
 * @group jak-widgets
 */
SZN.PieChart = SZN.ClassMaker.makeClass({
	NAME:"PieChart",
	VERSION:"1.0",
	CLASS:"class",
	DEPEND:[{
		sClass:SZN.Vector,
		ver:"1.0"
	}]
});

/**
 * @param {string} id id prvku, do ktereho se graf vlozi
 * @param {array} data pole objektu s vlastnostmi 'data' a 'label'
 * @param {object} options asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *   	<li><em>padding</em> - vycpavka</li>
 *   	<li><em>skew</em> - vertikalni zmacknuti</li>
 *   	<li><em>depth</em> - hloubka</li>
 *   	<li><em>legendWidth</em> - velikost ctverecku s legendou</li>
 *   	<li><em>labelDistance</em> - vzdalenost popisku od okraje kolace</li>
 *   	<li><em>legend</em> - bool, zda-li zobrazovat legendu</li>
 *   	<li><em>prefix</em> - retezec pred kazdou hodnotou</li>
 *   	<li><em>suffix</em> - retezec za kazdou hodnotou</li>
 *   	<li><em>outlineColor</em> - lze predefinovat barvu ramecku, parametrem je objekt s vlastnostmi graph a legend, obe musi byt zadane, vychozi je cerna barva #000</li>
 *   	<li><em>colors</em> - pole barev (v RGB() formatu !)</li>
 *   </ul>
 */
SZN.PieChart.prototype.$constructor = function(id, data, options) {
	this.radius = 0;
	this.width = 0;
	this.height = 0;
	
	this.options = {
		padding: 15,
		skew: 0.7,
		depth: 10,
		legendWidth: 15,
		labelDistance: 20,
		legend: true,
		prefix: "",
		suffix: "",
		outlineColor: {graph: '#000', legend: '#000'},
		colors: ["rgb(0,76,140)","rgb(255,73,17)","rgb(255,214,37)","rgb(94,162,33)","rgb(132,0,38)", 
				"rgb(137,205,255)","rgb(55,71,5)","rgb(179,210,0)","rgb(82,36,118)","rgb(255,155,17)",
				"rgb(201,0,14)","rgb(0,138,212)"]
	}
	for (var p in options) { this.options[p] = options[p]; }
	this.container = SZN.gEl(id);
	
	this.appended = [];
	this.lastLabel = null;
	this.width = this.container.offsetWidth;
	this.height = this.container.offsetHeight;
	
	this.data = data;
	this.canvas = SZN.Vector.getCanvas(this.width, this.height);
	this.container.style.position = "relative";
	this.container.appendChild(this.canvas.getContainer());
	
	this._draw();
}

SZN.PieChart.prototype.$destructor = function() {
	this.canvas.$destructor();
	for (var i=0;i<this.appended.length;i++) {
		var elm = this.appended[i];
		elm.parentNode.removeChild(elm);
	}
}

/**
 * vykresli graf
 */
 SZN.PieChart.prototype._draw = function() {
	var o = this.options;
	
	var lw = 0;
	if (o.legend) { lw = this._prepareLegend(); }
	
	var availh = this.height - 2*o.padding;
	var availw = this.width - 2*o.padding - lw;
	availh /= o.skew;
	availh -= o.depth;
	
	this.radius = Math.round(Math.min(availw, availh)/2);
	
	var total = 0;
	for (var i=0;i<this.data.length;i++) { total += parseFloat(this.data[i].data); }
	var r = this.radius;
	var cx = r+o.padding;
	var cy = (this.height-o.depth) / 2;

	if (this.options.depth) {
		var angle = 2*Math.PI - Math.PI/2;
		for (var i=0;i<this.data.length;i++) { /* middle part */
			var v = this.data[i].data;
			if (!v) { continue; }
			var color = o.colors[i % o.colors.length];
			angle = this._drawPie(v,total,angle,cx,cy+this.options.depth,color,1);
		} /* for all data */
	}
	var angle = 2*Math.PI - Math.PI/2;
	for (var i=0;i<this.data.length;i++) { /* top part */
		var v = this.data[i].data;
		if (!v) { continue; }
		var color = o.colors[i % o.colors.length];
		angle = this._drawPie(v,total,angle,cx,cy,color,0);
	} /* for all data */
	
	if (this.options.legend) { this._drawLegend(); }
}


/**
 * vykresli segment grafu
 */
SZN.PieChart.prototype._drawPie = function(value,total,start_angle,cx,cy,color,middle) {
	/* compute important data */
	var ycoef = this.options.skew;
	var r = this.radius;
	var x1 = r * Math.cos(start_angle) + cx;
	var y1 = ycoef * r * Math.sin(start_angle) + cy;
	var angle = parseFloat(value) / total * 2 * Math.PI;
	var end_angle = start_angle + angle;
	var x2 = r * Math.cos(end_angle) + cx;
	var y2 = ycoef * r * Math.sin(end_angle) + cy;
	var large = (angle >= Math.PI ? 1 : 0);

	if (middle) { 
		var deg1 = (start_angle / Math.PI * 180) % 360;
		var deg2 = (end_angle / Math.PI * 180) % 360;
		if (deg2 <= deg1) { deg2 += 360; }
		
		if (deg1 > 180 && deg2 < 360) { return end_angle; }
		
		if (deg2 > 360) { deg1 = 360; large = 0; }
		if (deg1 < 540 && deg2 > 540) { deg2 = 540; large = 0; }
		if (deg1 < 180 && deg2 > 180) { deg2 = 180; large = 0; }
		var rad1 = deg1 / 180 * Math.PI;
		var rad2 = deg2 / 180 * Math.PI;
		
		x1 = r * Math.cos(rad1) + cx;
		y1 = ycoef * r * Math.sin(rad1) + cy;

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

		new SZN.Vector.Path(this.canvas, path, {outlineColor:this.options.outlineColor.graph, color:"rgb("+newr+","+newg+","+newb+")"});
	} else { 
		if (value == total) {
			var path = "M "+(cx-r)+" "+cy+" ";
			path += "A "+r+" "+r*(ycoef)+" 0 "+large+" 1 "+(cx+r)+" "+cy+" ";
			path += "A "+r+" "+r*(ycoef)+" 0 "+large+" 1 "+(cx-r)+" "+cy+" ";
		} else {
			var path = "M "+cx+" "+cy+" L "+x1+" "+y1+" ";
			path += "A "+r+" "+r*(ycoef)+" 0 "+large+" 1 "+x2+" "+y2+" ";
			path += "L "+cx+" "+cy+" z";
		}
		new SZN.Vector.Path(this.canvas, path, {outlineColor:this.options.outlineColor.graph, color:color});

		var mid_angle = (start_angle + end_angle) / 2;
		this._drawLabel(cx, cy, mid_angle, value);
	}
	return end_angle;
}

SZN.PieChart.prototype._drawLabel = function(cx, cy, angle, value) {
	var x = (this.radius+this.options.labelDistance) * Math.cos(angle) + cx;
	var y = (this.radius+this.options.labelDistance) * this.options.skew * Math.sin(angle) + cy;
	y += (angle % (2*Math.PI) < Math.PI ? this.options.depth : 0);

	var text1 = SZN.cEl("div", false, false, {position:"absolute", left:Math.round(x)+"px", top:Math.round(y)+"px"});
	var text2 = SZN.cEl("div", false, false, {position:"relative", left:"-50%"});
	text2.innerHTML = this.options.prefix + value + this.options.suffix;
	SZN.Dom.append([text1, text2], [this.container, text1]);
	this.appended.push(text1);
	var oh = text2.offsetHeight;
	y -= oh/2;
	text1.style.top = Math.round(y) + "px";
	
	if (this.lastLabel) { /* popisky se protinaji, posuneme ... */
		var pos1 = SZN.Dom.getBoxPosition(this.lastLabel);
		var pos2 = SZN.Dom.getBoxPosition(text2);
		var dims1 = [this.lastLabel.offsetWidth, this.lastLabel.offsetHeight];
		var dims2 = [text2.offsetWidth, text2.offsetHeight];
		var ok1 = (pos1.left+dims1[0] < pos2.left) || (pos2.left+dims2[0] < pos1.left);
		var ok2 = (pos1.top+dims1[1] < pos2.top) || (pos2.top+dims2[1] < pos1.top);
		if (!ok1 && !ok2) { 
			var amount = Math.sqrt(dims2[0]*dims2[1]);
			x += Math.cos(angle) * amount;
			y += Math.sin(angle) * amount;
			text1.style.left = Math.round(x)+"px";
			text1.style.top = Math.round(y)+"px";
		}
	}
	this.lastLabel = text2;
}

SZN.PieChart.prototype._prepareLegend = function() {
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

SZN.PieChart.prototype._drawLegend = function(labels) {
	var labels = this.legendLabels;
	var o = this.options;
	
	for (var i=0;i<this.data.length;i++) {
		var color = o.colors[i % o.colors.length];
		var x1 = 2*this.radius+3*o.padding;
		var x2 = x1 + o.legendWidth;
		var y1 = i*(o.legendWidth + 10) + o.padding;
		var y2 = y1 + o.legendWidth;
		new SZN.Vector.Polygon(this.canvas, 
							[new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y1), new SZN.Vec2d(x2,y2), new SZN.Vec2d(x1,y2)], 
							{color:color, outlineColor:this.options.outlineColor.legend, outlineWidth:1});

		var l = 2*this.radius+3*o.padding+10+o.legendWidth;
		var t = i*(o.legendWidth+10) + o.padding;
		var text = labels[i];

		t += Math.round((o.legendWidth - text.offsetHeight)/2);
		text.style.left = l+"px";
		text.style.top = t+"px";
	}
}
