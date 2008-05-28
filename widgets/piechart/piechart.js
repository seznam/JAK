/**
 * @overview pie chart
 * @version 1.0
 * @author zara
*/   

/**
 * @class PieChart
 * @constructor
 * @param {string} id id prvku, do ktereho se graf vlozi
 * @param {array} data pole objektu s vlastnostmi 'data' a 'label'
 * @param {object} options asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>radius</em> - polomer kolace, default "img/"</li>
 *   	<li><em>padding</em> - leve margo</li>
 *   	<li><em>skew</em> - vertikalni zmacknuti</li>
 *   	<li><em>depth</em> - hloubka</li>
 *   	<li><em>legendWidth</em> - velikost ctverecku s legendou</li>
 *   	<li><em>legend</em> - bool, zda-li zobrazovat legendu</li>
 *   	<li><em>colors</em> - pole barve (v RGB() formatu !)</li>
 *   </ul>
 */
SZN.PieChart = SZN.ClassMaker.makeClass({
	NAME:"PieChart",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.PieChart.prototype.$constructor = function(id, data, options) {
	this.options = {
		radius: 40,
		padding: 15,
		skew: 0.7,
		depth: 10,
		legendWidth: 15,
		legend: true,
		colors: ["rgb(153,153,255)","rgb(153,51,205)","rgb(255,255,204)","rgb(204,255,255)","rgb(102,0,102)", 
				"rgb(255,128,128)","rgb(0,102,204)","rgb(204,204,255)","rgb(0,0,128)","rgb(255,0,255)",
				"rgb(0,255,255)","rgb(255,255,0)"]
	}
	for (var p in options) { this.options[p] = options[p]; }
	this.container = SZN.gEl(id);
	
	this.options.width = this.container.offsetWidth;
	this.options.height = this.container.offsetHeight;
	
	this.data = data;
	this.canvas = SZN.Vector.getCanvas(this.options.width, this.options.height);
	this.container.style.position = "relative";
	this.container.appendChild(this.canvas.getContainer());
	
	this._draw();
}

/**
 * @method
 * @private
 * vykresli graf
 */
 SZN.PieChart.prototype._draw = function() {
	var o = this.options;
	var total = 0;
	var colors = o.colors;
	for (var i=0;i<this.data.length;i++) { total += parseFloat(this.data[i].data); }
	var r = o.radius;
	var cx = r+o.padding;
	var cy = o.height / 2;

	if (this.options.depth) {
		var angle = 2*Math.PI - Math.PI/2;
		for (var i=0;i<this.data.length;i++) { /* middle part */
			var v = this.data[i].data;
			var color = colors[i % colors.length];
			angle = this._drawPie(v,total,angle,cx,cy+this.options.depth,color,1);
		} /* for all data */
	}
	var angle = 2*Math.PI - Math.PI/2;
	for (var i=0;i<this.data.length;i++) { /* top part */
		var v = this.data[i].data;
		var color = colors[i % colors.length];
		angle = this._drawPie(v,total,angle,cx,cy,color,0);
		/* legend */
		if (this.options.legend) {
			var x1 = 2*o.radius+3*o.padding;
			var x2 = x1 + o.legendWidth;
			var y1 = i*(o.legendWidth + 10) + o.padding;
			var y2 = y1 + o.legendWidth;
			new SZN.Vector.Polygon(this.canvas, 
								[new SZN.Vec2d(x1,y1), new SZN.Vec2d(x2,y1), new SZN.Vec2d(x2,y2), new SZN.Vec2d(x1,y2)], 
								{color:color, outlineColor:"#000", outlineWidth:1});

			var l = 2*o.radius+3*o.padding+o.legendWidth+5;
			var t = i*(o.legendWidth+10) + o.padding;
			
			var text = SZN.cEl("div", false, false, {position:"absolute", left:l+"px", top:t+"px", fontSize:"80%"});
			text.innerHTML = this.data[i].label;
			this.container.appendChild(text);
		}
	} /* for all data */
}


/**
 * @method
 * @private
 * vykresli segment grafu
 */
SZN.PieChart.prototype._drawPie = function(value,total,start_angle,cx,cy,color,middle) {
		/* compute important data */
		var ycoef = this.options.skew;
		var r = this.options.radius;
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
			
			if (deg1 < 360 && deg2 > 360) { deg1 = 360; }
			if (deg1 < 540 && deg2 > 540) { deg2 = 540; }
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
			var newr = c[0] + 20; if (newr > 255) { newr = 255; }
			var newg = c[1] + 20; if (newg > 255) { newg = 255; }
			var newb = c[2] + 20; if (newb > 255) { newb = 255; }

			new SZN.Vector.Path(this.canvas, path, {outlineColor:"#000", color:"rgb("+newr+","+newg+","+newb+")"});
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
			new SZN.Vector.Path(this.canvas, path, {outlineColor:"#000", color:color});

			var mid_angle = (start_angle + end_angle) / 2;
			var x3 = (r+25) * Math.cos(mid_angle) + cx;
			var y3 = (r+25) * ycoef * Math.sin(mid_angle) + cy - 5;
			y3 += (mid_angle % (2*Math.PI) < Math.PI ? this.options.depth : 0);
			
			var text1 = SZN.cEl("div", false, false, {position:"absolute", left:x3+"px", top:y3+"px", fontSize:"80%", textAlign:"center"});
			var text2 = SZN.cEl("div", false, false, {position:"relative", left:"-50%"});
			text2.innerHTML = value;
			SZN.Dom.append([text1, text2], [this.container, text1]);
		}
	return end_angle;
}
