JAK.Chart.Backend.Canvas = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart.Backend.Canvas",
	VERSION: "0.1",
	EXTEND: JAK.Chart.Backend
})

JAK.Chart.Backend.Canvas.prototype.$constructor = function(width, height, styles) {
	this._canvas = document.createElement('canvas');
	this._c = this._context = this._canvas.getContext('2d');
	this._elements = [];
	this._currentEvent = {eventType:null}
	this.$super(width,height,styles);

	this._eventRefreshed = false;
    var clearRefreshed = function() {this._eventRefreshed = false};
    setInterval(clearRefreshed.bind(this),20);
}

JAK.Chart.Backend.Canvas.prototype._click = function(event) {
    this._currentEvent.eventType = "click";
	this._findElement(event);
};

JAK.Chart.Backend.Canvas.prototype._mousemove = function(event) {
	if(!this._eventRefreshed) {
		this._currentEvent.eventType = "mouseMove";
		this._findElement(event);
		this._eventRefreshed = true;
	}
};

JAK.Chart.Backend.Canvas.prototype._mouseout = function(event) {};

JAK.Chart.Backend.Canvas.prototype._mouseover = function(event) {};

// Projde zaregistrované elementy, znova je vykreslí (jen na oko)
JAK.Chart.Backend.Canvas.prototype._findElement = function(event) {
    var target = JAK.Events.getTarget(event),
    	coords = JAK.DOM.getBoxPosition(target),
    	left = event.clientX,
    	top = event.clientY,
    	scroll = JAK.DOM.getScrollPos();

    var x = left - coords.left + scroll.x,
        y = top - coords.top + scroll.y;

    // Pozice myši na canvasu
    this._currentEvent.x = x;
    this._currentEvent.y = y;

    for(var i=0; i< this._elements.length; i++) {
    	var element = this._elements[i];
    	var elementType = element[1];
    	elementType = elementType[0].toUpperCase() + elementType.substring(1);
	   	this._currentEvent.element = element;
		this["draw" + elementType].apply(this, element[2]);
    }

    this._currentEvent.eventType = null;
};

// Zavolá se po překreslení elementu a zkontroluje zda na ném je myš. Pokud ano, vyvolá to signál click, nebo mousemove;
JAK.Chart.Backend.Canvas.prototype._checkElementForEvents = function() {
	var currentEvent = this._currentEvent;
	if((currentEvent.element[1] == "path" || currentEvent.element[1] == "polygon") && this._context.isPointInPath(currentEvent.x, currentEvent.y)) {
		this.makeEvent(currentEvent.eventType, {id: currentEvent.element[0]})
	}

};

// Vymaźe celý canvas nebo jeho část
JAK.Chart.Backend.Canvas.prototype.clear = function(x,y,w,h) {
	var x = x || 0,
		y = y || 0,
		w = w || this._canvas.width,
		h = h || this._canvas.height;

	this._context.clearRect(x,y,w,h);
}
JAK.Chart.Backend.Canvas.prototype.resize = function(width, height) {
	this._canvas.height = height;
	this._canvas.width = width;
}
JAK.Chart.Backend.Canvas.prototype.setScale = function(scale) {
	this._c.scale(scale,scale);
}
// Vrátí canvas element
JAK.Chart.Backend.Canvas.prototype.getContainer = function() {
	return this._canvas;
}
// Vrátí kreslící kontext
JAK.Chart.Backend.Canvas.prototype.getContent = function() {
	return this._context;
}

JAK.Chart.Backend.Canvas.prototype.drawPolyline = function(coords, styles) {
	var s = this._applyStyles(styles),
		c = this._c;

	this._c.beginPath();
	this._drawPolyline(coords);

	if(this._currentEvent.eventType) {
		this._checkElementForEvents();
	} else {
		var id = this._registerElement('polyline', arguments, styles.ignoreEvents);

		c.globalAlpha = s.strokeOpacity;
		this._c.stroke();
	}
	return id;
}

JAK.Chart.Backend.Canvas.prototype.drawPolygon = function(coords, styles) {
	var s = this._applyStyles(styles),
		c = this._c;

	c.beginPath();
	this._drawPolyline(coords);

	// Pokud existuje událost, kterou momentálně hledáme, přeskočíme vykreslenía  vybarvení prvku a jdeme zkontrolovat zda se v ném nachází myš.
	if(this._currentEvent.eventType) {
		this._checkElementForEvents();
	} else {

		c.closePath();

		// Zaregistruje element a vrátí unikátní ID.
		var id = this._registerElement('polygon', arguments, styles.ignoreEvents);

		c.globalAlpha = s.fillOpacity;
		if(s.fillColor != "none") { this._c.fill(); }
		c.globalAlpha = s.strokeOpacity;
		if(s.strokeColor != "none") { this._c.stroke(); }
	}

	return id;
}

JAK.Chart.Backend.Canvas.prototype._drawPolyline = function(coords) {
	this._moveTo(coords[0]);
	for(var i = 1; i < coords.length; i++) {
		var curCoords = coords[i]
		this._lineTo(curCoords);
	}
}

JAK.Chart.Backend.Canvas.prototype.drawCircle = function(x, y, radius, styles) {
	var s = this._applyStyles(styles),
		c = this._c;

	c.beginPath();
	c.arc(x,y,radius,0,Math.PI*2,true);

	if(this._currentEvent.eventType) {
		this._checkElementForEvents();
	} else {
		var id = this._registerElement('circle', arguments, styles.ignoreEvents);

		c.closePath();
		c.globalAlpha = s.fillOpacity;
		if(s.fillColor != "none") { this._c.fill(); }
		c.globalAlpha = s.strokeOpacity;
		if(s.strokeColor != "none") { this._c.stroke(); }
	}

	return id;
}

JAK.Chart.Backend.Canvas.prototype.drawPath = function(coords, styles) {
	var s = this._applyStyles(styles),
		c = this._c;

	c.beginPath();
	for(var i = 0; i < coords.length; i++) {
		var step = coords[i];
		var type = step[0];
		var params = step;
		c.save()
		switch(type)
		{
			case 'M':
				this._moveTo(params.slice(1));
				break;
			case 'A':
				var lastStep = coords[i-1];

				var res = this._generateArc(params.slice(1),lastStep.slice(1));
				this._rotate(res[6].rotate[0],res[6].rotate[1],res[6].rotate[2]);
				this._scale(res[6].scale[0],res[6].scale[1]);

				c.arc.apply(c, res);
				break;
			case 'L':
				this._lineTo(params.slice(1));
				break;
		}
		c.restore()
	}

	if(this._currentEvent.eventType) {
		this._checkElementForEvents();
	} else {
		var id = this._registerElement('path', arguments, styles.ignoreEvents);

		c.closePath();
		c.globalAlpha = s.fillOpacity;
		if(s.fillColor != "none") { this._c.fill(); }
		c.globalAlpha = s.strokeOpacity;
		if(s.strokeColor != "none") { this._c.stroke(); }
	}

	return id;
}

JAK.Chart.Backend.Canvas.prototype.drawText = function(coords, text, styles) {
	var s = this._applyStyles(styles),
		c = this._c;

	if(this._currentEvent.eventType) {
		this._checkElementForEvents();
	} else {
		var id = this._registerElement('text', arguments, styles.ignoreEvents);

		c.fillText(text, coords[0], coords[1]);
	}
	return id;
};

JAK.Chart.Backend.Canvas.prototype._applyStyles = function(styles) {
	var s = this.$super(styles),
		c = this._c;

    c.font = s.fontSize + '  '+ s.fontFamily
    c.textAlign = s.textAlign
    c.textBaseline = s.textBaseline
	c.strokeStyle = s.strokeColor;
	c.lineWidth = s.lineWidth;
	c.fillStyle = s.fillColor;
	c.lineCap = s.lineCap;
	c.lineJoin = s.lineJoin;

	// if(s.rotate) {
	// 	this._rotate.apply(this,s.rotate)
	// 	console.log("rotating")
	// }

	// if(s.scale) {
	// 	this._scale.apply(this,s.scale)
	// 	console.log("scaling")
	// }
	return s;
}

JAK.Chart.Backend.Canvas.prototype._moveTo = function(coords) {
	this._c.moveTo(coords[0], coords[1]);
}

JAK.Chart.Backend.Canvas.prototype._lineTo = function(coords) {
	this._c.lineTo(coords[0], coords[1]);
}

JAK.Chart.Backend.Canvas.prototype._scale = function(scaleX, scaleY) {
	this._c.scale(scaleX, scaleY);
}

JAK.Chart.Backend.Canvas.prototype._rotate = function(centerX, centerY, angle) {
	this._c.translate(centerX, centerY);
    this._c.rotate(angle);
    this._c.translate(-centerX, -centerY);
}

JAK.Chart.Backend.Canvas.prototype._generateArc = function(params, coords) {
    /* parameters: radius_x, radius_y, x_rotation, large_flag, sweep_flag, end_x, end_y */
    /* output: center_x, center_y, radius_x, radius_y, angle_1, angle_2 */

	/* smernice vektoru */
    function uhel(dx, dy) {
        var result = Math.atan2(dy, dx);
        if (result < 0) result += 2*Math.PI;
        return result;
    }

	/* 1. inicializace */
    var r1 = params[0]; var r2 = params[1];
    var endx = params[5]; var endy = params[6];
    var startx = coords[0]; var starty = coords[1];
    var largeArcFlag = params[3];
    var sweepFlag = params[4];
    var angle = params[2]; // stupne, CW
    angle = angle*Math.PI/180; // na radiany
    var clockWise = !sweepFlag;
    var scale = r1/r2;

	/* 2. vypocitat souradnice stredu elipsy */
    var xp = Math.cos(angle)*(startx-endx)/2 + Math.sin(angle)*(starty-endy)/2;
    var yp = -Math.sin(angle)*(startx-endx)/2 + Math.cos(angle)*(starty-endy)/2;
    var root = 0; /* make sure radii are large enough */
    var numerator = r1*r1*r2*r2 - r1*r1*yp*yp - r2*r2*xp*xp;
    if (numerator < 0) {
        var s = Math.sqrt(1 - numerator/(r1*r1*r2*r2));
        r1 *= s;
        r2 *= s;
        root = 0;
    } else {
        root = Math.sqrt(numerator/(r1*r1*yp*yp + r2*r2*xp*xp));
        if (largeArcFlag == sweepFlag) { root = -root; }
    }
    var cxp = root*r1*yp/r2;
    var cyp = -root*r2*xp/r1;
    var centerX = Math.cos(angle)*cxp - Math.sin(angle)*cyp + (startx+endx)/2;
    var centerY = Math.sin(angle)*cxp + Math.cos(angle)*cyp + (starty+endy)/2;

	/* 3. pootocit oba body okolo stredu na druhou stranu */
	var dx = startx - centerX;
	var dy = starty - centerY;
	var dist = Math.sqrt(dx*dx + dy*dy);
	var uhelStart = uhel(dx, dy) - angle;
	startx = centerX + dist*Math.cos(uhelStart);
	starty = centerY + dist*Math.sin(uhelStart);

	var dx = endx - centerX;
	var dy = endy - centerY;
	var dist = Math.sqrt(dx*dx + dy*dy);
	var uhelEnd = uhel(dx, dy) - angle;
	endx = centerX + dist*Math.cos(uhelEnd);
	endy = centerY + dist*Math.sin(uhelEnd);

	/* 4. vzdalenosti od stredu, Yova nasobena dle scale (tj. prepocteno na nedeformovanou kruznici) */
	var dx = startx - centerX;
	var dy = scale * (starty - centerY);
	uhelStart = uhel(dx, dy);

	var dx = endx - centerX;
	var dy = scale * (endy - centerY);
	uhelEnd = uhel(dx, dy);

    var style = {
    	scale: [1, 1/scale],
    	rotate: [centerX, centerY, angle]
    }
    return [centerX, centerY * scale, r1, uhelStart, uhelEnd , clockWise, style];
};

// Registrování elementu. Pouze v případě, že nepřekreslujeme nebo není ignorovaný
JAK.Chart.Backend.Canvas.prototype._registerElement = function(type,args, ignoreEvents) {
    if (!this._redrawing && !ignoreEvents) {
    	var id = JAK.idGenerator();
    	this._elements.push([id, type, args])
    } else {
    	var id = 0;
    }
    return id;
};

JAK.Chart.Backend.Canvas.prototype.redrawing = function(status) {
	this._redrawing = !!status
};

JAK.Chart.Backend.Canvas.prototype._reDraw = function() {
	this._redrawing = true;
	//this.clear();
    for(var i=0; i< this._elements.length; i++) {
    	var element = this._elements[i];
    	var elementType = element[1];
    	elementType = elementType[0].toUpperCase() + elementType.substring(1);
	   	this._currentEvent.element = element;
		this["draw" + elementType].apply(this, element[2]);
    }
    this._redrawing = false;
};