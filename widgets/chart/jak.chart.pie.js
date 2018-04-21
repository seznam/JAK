/**
 *        /\
 *  _____//\\    _____
 *  _____/  \\  /_____
 *           \\//
 *            \/
 *
 * @overview Koláčový graf
 * @version 1.4
 * @author zara, majak
 */

JAK.Chart.Pie = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart.Pie",
	VERSION: "1.4",
	EXTEND: JAK.Chart,
	IMPLEMENT: [JAK.ISignals]
})

/**
 * @constructor
 * @param {node} obj - element do ktereho se bude vygenerovany graf vkladat
 * @param {Array} data - data
 * @param {Object} options
 */
JAK.Chart.Pie.prototype.$constructor = function(obj, data, options) {
	this.options = {
		backend: JAK.Chart.Backend.SVG, // pouzity backend
		width: 200, // sirka elementu do ktereho se bude graf vkladat
		height: 200, // vyska elementu do ktereho se bude graf vkladat
		//min: null,
		//max: null,
		padding: 40, // padding grafu od okraje elementu
		sectorColors: ["#a71e72","#e51114","#f37944","#fcc83e","#aad400",
				"#70c21a","#1dbdc0","#3f6fd3","#214478"], // paleta barev
		colorsMap: [[1],
					[1,7],
					[1,3,7],
					[1,3,5,7],
					[1,2,3,5,7],
					[1,2,3,5,6,7],
					[0,1,2,3,5,6,7],
					[0,1,2,3,4,5,6,7],
					[0,1,2,3,4,5,6,7,8]], // mapa pouziti barev
		label: true, // zobrazeni labelu [ false || true ]
		showLabel: "mouseover", // na jakou udalost se bude label zobrazovat [ 'alltime' || events ('click', 'mouseover') ]
		labelOnCursor: false, // zdali se bude label prichytavat ke kurzoru mysi [ true || false ]
		labelPosition: {
			displacementY: 7, // posunuti labelu od osy Y (v px)
			displacementX: -14, // posunuti labelu od osy X (v px)
			position: (2.5/2) // pozice labelu na polomeru vysece
		},

		legendShow: false, // zobrazeni legendy [ true || false ]
		legendPosition: "right", // pozice legendy [ "left" || "top" || "right" || "bottom ]
		legendWidth: 150, // sirka legendy (v px)
		legendHeight: 150, // vyska legendy (v px)
		legendColorWidth: 12, // sirka barevneho ctverecku zobrazeneho u daneho itemu v legende (v px)
		legendColorHeight: 12, // vyska barevneho ctverecku zobrazeneho u daneho itemu v legende (v px)

		showWatermark: true, // zobrazeni vodoznaku s procenty [ true || false ]
		watermarkConstant: 0.5, // konstanta pro prepocet zobrazeni watermarku
		active: true, // moznost zaktivnit vysec [ true || false ]
		activeTranslate: 10, // posunuti aktivni vysece od stredu (v px)
		activeAnimation: true, // animace pri zaktivneni vysece [ true || false ]
		activeAnimationLength: 100, // delka animace (v ms)

		callback: {
			mouseOver: {obj: window, method: null}, // return originalEvent
			mouseOut: {obj: window, method: null}, // return originalEvent
			sectorSelect: {obj: window, method: null}, // return element
			click: {obj: window, method: null} // return originalEvent
		}
	}

	this._sectorIds = {};
	this._ev = [];
	this._groups = [];
	this._anime = [];
	this._labels = [];

	this.$super(obj, data, options);

	this._ev.push(this.addListener('click', '_click', this._backend));
	this._ev.push(this.addListener('click', '_click', this));
	this._ev.push(this.addListener('mouseMove', '_mouseMove', this._backend));
	this._ev.push(this.addListener('mouseOver', '_mouseOver', this._backend));
	this._ev.push(this.addListener('mouseOut', '_mouseOut', this._backend));
}

JAK.Chart.Pie.prototype._click = function(event) {
	if ( event.data.id ) {
		var group = JAK.gel(event.data.id).parentNode;
		var label = JAK.gel(this._labels[this._sectorIds[event.data.id]]);

		if ( this.options.showLabel == "click" ) {
			if ( JAK.gel(label[0]).style.display == "none" )
				this._showElm(null, JAK.gel(label[0]));
			else
				this._hideElm(null, JAK.gel(label[0]));
		}

		if ( this.options.active ) {
			if ( this.options.activeAnimation ) {
				var callbackFc = function(a){
					group.setAttribute("transform", "translate(" + a.join(",") + ")");
				};
				if ( group.getAttribute("transform") == "translate(0,0)" || group.getAttribute("transform") == null ) {
					this._anime[this._sectorIds[event.data.id]][0].callback = callbackFc;
					this._anime[this._sectorIds[event.data.id]][0].start();

					if ( this.options.legendShow ) { JAK.DOM.addClass(JAK.gel("label-" + group.id), "active"); }

					if ( this.options.callback.sectorSelect.method ) {
						this.options.callback.sectorSelect.obj[this.options.callback.sectorSelect.method](group);
					}
				}
				else {
					this._anime[this._sectorIds[event.data.id]][1].callback = callbackFc;
					this._anime[this._sectorIds[event.data.id]][1].start();

					if ( this.options.legendShow ) { JAK.DOM.removeClass(JAK.gel("label-" + group.id), "active"); }
				}
			}
			else {
				if ( group.getAttribute("transform") == "translate(0,0)" || group.getAttribute("transform") == null ) {
					group.setAttribute("transform", "translate(" + this.options.translateActive[this._sectorIds[event.data.id]][0] + ", " + this.options.translateActive[this._sectorIds[event.data.id]][1] + ")");
				}
				else {
					group.setAttribute("transform", "translate(0,0)");
				}
			}
		}
	}
	if ( this.options.callback.click.method ) {
		this.options.callback.click.obj[this.options.callback.click.method](event.data.originalEvent);
	}
};

JAK.Chart.Pie.prototype._mouseMove = function(event) {
	if ( this.options.labelOnCursor && this.options.label ) {
		var label = JAK.gel(this._labels[this._sectorIds[event.data.id]]);
		JAK.DOM.setStyle(JAK.gel(label[0]), {
			left: (event.data.originalEvent.layerX+10)+"px",
			top: (event.data.originalEvent.layerY+10)+"px",
			bottom: "auto",
			right: "auto"
		});
	}
};

JAK.Chart.Pie.prototype._mouseOver = function(event) {
	if ( this.options.label && this.options.showLabel == "mouseover" ) {
		var label = JAK.gel(this._labels[this._sectorIds[event.data.id]]);

		this._showElm(null, JAK.gel(label[0]));

		if ( this.options.labelOnCursor && this.options.label ) {
			JAK.gel(label[0]).style.left = (event.data.originalEvent.layerX+10)+"px";
			JAK.gel(label[0]).style.top = (event.data.originalEvent.layerY+10)+"px";
		}
	}
	if ( this.options.callback.mouseOver.method ) {
		this.options.callback.mouseOver.obj[this.options.callback.mouseOver.method](event.data.originalEvent);
	}
};

JAK.Chart.Pie.prototype._mouseOut = function(event) {
	var label = JAK.gel(this._labels[this._sectorIds[event.data.id]]);
	if ( this.options.label && this.options.showLabel == "mouseover" ) {
		this._hideElm(null, JAK.gel(label[0]));
	}
	else if ( this.options.label && ( this.options.showLabel == "alltime" || this.options.showLabel == "click" ) ) {
		JAK.DOM.setStyle(JAK.gel(label[0]), {
			left: ( label[3] == "left" )? ( label[1] + this.options.labelPosition.displacementX ) + "px" : "auto",
			top: "auto",
			bottom: ( label[2] + this.options.labelPosition.displacementY )+"px",
			right: ( label[3] == "right" )? ( label[1] + this.options.labelPosition.displacementX ) + "px" : "auto"
		});
	}
	if ( this.options.callback.mouseOut.method ) {
		this.options.callback.mouseOut.obj[this.options.callback.mouseOut.method](event.data.originalEvent);
	}
};

JAK.Chart.Pie.prototype._compute = function() {
	this._c = this._computed = {
		centerX: (this.options.width + (this.legend.reduceWidth * ( ( this.options.legendPosition == "right" )? -1 : 1 ))) / 2,
		centerY: (this.options.height + (this.legend.reduceHeight * ( ( this.options.legendPosition == "bottom" )? -1 : 1 ))) / 2,
		radius: (Math.min(this.options.width - this.legend.reduceWidth, this.options.height - this.legend.reduceHeight) / 2) - this.options.padding,
		total: 0
	}

	for (var i=0;i<this._data.length;i++) { this._c.total += parseFloat(this._data[i].data); }

	this._computeSectors();
}

JAK.Chart.Pie.prototype._draw = function() {
	var c = this._computed;
	var r = c.radius;
	var cx = c.centerX;
	var cy = c.centerY;
	this.options.translateActive = [];

	//Vykreslení jednotlivých sektorů
	for(var i=0; i < this._sectors.length; i++) {
		var sector = this._sectors[i];
		if(this._sectors.length > 1) {

			var angle = sector.angle,
				startAngle = sector.startAngle,
				endAngle = sector.startAngle + sector.angle,
				large = (sector.angle >= Math.PI ? 1 : 0);
			var textAngle = (startAngle + endAngle) / 2;

			var textAlign = textAngle <  (3 * Math.PI - Math.PI / 2) ? "left" : "right";

			var x1 = r * Math.cos(startAngle) + cx,
				y1 = r * Math.sin(startAngle) + cy,
				x2 = r * Math.cos(endAngle) + cx,
				y2 = r * Math.sin(endAngle) + cy,
				xT = cx + ( r / (this.options.labelPosition.position) ) * Math.cos(textAngle) * ((textAlign=="right") ? -1 : 1),
				yT = cy - ( r / (this.options.labelPosition.position) ) * Math.sin(textAngle),
				xWM = (r * (4/5)) * Math.cos(textAngle) + cx,
				yWM = (r * (4/5)) * Math.sin(textAngle) + cy,
				aX = (this.options.activeTranslate) * Math.cos(textAngle),
				aY = (this.options.activeTranslate) * Math.sin(textAngle);

			var path = [];

			path.push(['M', cx, cy]);
			path.push(['L', x1, y1]);
			path.push(['A', r, r, 0, large, 1, x2, y2]);
			path.push(['L', cx, cy]);

			this._groups[i] = this._b.createGroup();

			var pathElm = this._b.drawPath(path,{fillColor:sector.color},this._groups[i][1], "main");

			this._sectorIds[pathElm] = i;
			sector.id = pathElm;

			if ( angle * r / 100 > this.options.watermarkConstant && this.options.showWatermark) {
				this._sectorIds[this._b.drawText([xWM, yWM], Math.round(angle / (2 * Math.PI / 100)) + " %", {textAlign:"center", fillColor:"#fff", fontSize: ((r / 100) * 10 > 13 )? ((r / 100) * 10) + "px" : 13 + "px", fillOpacity:0.5}, this._groups[i][1])] = i;
			}

			if ( this.options.label ) { this._addLabel(i, xT, yT, sector.label, textAlign); }

			if ( this.options.activeAnimation ) { this._createAnimation(i, [aX, aY]); }
			else { this.options.translateActive[i] = [aX, aY]; }

			if ( sector.active ) { this._groups[i][1].setAttribute("transform", "translate(" + aX + ", " + aY + ")"); }

		} else {
			var xT = cx,
				yT = cy,
				xWM =cx,
				yWM =cy;

			this._groups[i] = this._b.createGroup();

			this._sectorIds[this._b.drawCircle(cx, cy, r, {fillColor:sector.color}, this._groups[i][1])] = i;

			if ( 2 * Math.PI * r / 100 > this.options.watermarkConstant && this.options.showWatermark) {
				this._sectorIds[this._b.drawText([xWM, yWM], "100 %", {textAlign:"center", fillColor:"#fff", fontSize: ((r / 100) * 10 > 13 )? ((r / 100) * 10) + "px" : 13 + "px", fillOpacity:0.5}, this._groups[i][1])] = i;
			}

			if ( this.options.label ) { this._addLabel(i, xT, yT, sector.label, textAlign); }
		}
	}

	if (this.options.legendShow) { this.legend.elm = this._drawLegend(this._sectors); }

	this._insertToPage();
}

JAK.Chart.Pie.prototype._computeSectors = function() {
	var soFar = 0;
	this._sectors = [];
	var startAngle = 2 * Math.PI - Math.PI / 2;
	for (var i=0; i < this._data.length; i++) {
		var data = this._data[i];
		var value = data.data;
		if (!value) { continue; };
		angle = value / this._c.total * 2 * Math.PI;
		var color = data.color || this._colorMap(i);
		var active = ( data.active ) ? true : false;
		this._sectors.push({
			color: color,
			value: value,
			label: data.label,
			startAngle: startAngle,
			angle: angle,
			active: active
		});
		startAngle += angle;
	}
}

JAK.Chart.Pie.prototype._addLabel = function(i, xT, yT, txt, textAlign) {
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

	if ( this.options.legendShow ) {
		if (( this.options.legendPosition == "right" || this.options.legendPosition == "left" ) && textAlign == "right" ) { xT += this.legend.width; }
		if (( this.options.legendPosition == "bottom" || this.options.legendPosition == "top" ) ) { yT += this.legend.height; }
	}

	this._labels[i] = [this.createLabel(xT, yT, txt, {textAlign: textAlign, display: display})];

	if ( display ) {
		this._labels[i].push(xT);
		this._labels[i].push(yT);
		this._labels[i].push(textAlign);

		this._sectorIds[this._labels[i]] = i;
	}
}

JAK.Chart.Pie.prototype._createAnimation = function(i, animeCoordinates) {
	this._anime[i] = [];
	this._anime[i].push(new JAK.Interpolator(
		[0,0],
		animeCoordinates,
		this.options.activeAnimationLength)
	);
	this._anime[i].push(new JAK.Interpolator(
		animeCoordinates,
		[0,0],
		this.options.activeAnimationLength)
	);
}

JAK.Chart.Pie.prototype._legendClick = function(e, elm) {

	var groupId = elm.parentNode.getAttribute("id").replace("label-","");
	var mainId = JAK.DOM.getElementsByClass("main", JAK.gel(groupId))[0].getAttribute("id");

	this.makeEvent("click", {originalEvent: e, id: mainId})

	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
}

JAK.Chart.Pie.prototype._legendOver = function(e, elm){}
JAK.Chart.Pie.prototype._legendOut = function(e, elm){}

// only for joke :D
JAK.Chart.Pie.prototype.rotateAnim = function() {
	var mainGroup = JAK.DOM.getElementsByClass("mainGroup", this._parentElm);
	var cx = this._c.centerX;
	var cy = this._c.centerY;
	var rotateAnim = new JAK.Interpolator(
		[0],
		[720],
		4000
	);
	rotateAnim.callback = function (a) {
		mainGroup[0].setAttribute("transform", "rotate(" + (a || 0) + "," + cx + "," + cy + ")");
	}
	rotateAnim.start();

	return "Tocim se jak silenej!!!";
}
