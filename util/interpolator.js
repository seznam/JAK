/**
 * @overview Interpolace, animace
 * @version 1.0
 * @author Zara
 */ 

/**
 * @class Periodicky interpolator
 * @param {number} startVal pocatecni hodnota
 * @param {number} endVal koncova hodnota
 * @param {number} interval doba trvani v msec
 * @param {function} callback periodicky callback
 * @param {object} [options] opsny, povolene hodnoty: frequency, interpolation, endCallback
 */ 
SZN.Interpolator = SZN.ClassMaker.makeClass({
	NAME:"Interpolator",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Interpolator.LINEAR = 1;
SZN.Interpolator.QUADRATIC = 2;
SZN.Interpolator.SQRT = 3;
SZN.Interpolator.SIN = 4;
SZN.Interpolator.ASIN = 5;

SZN.Interpolator.prototype.$constructor = function(startVal, endVal, interval, callback, options) {
	this.startVal = startVal;
	this.endVal = endVal;
	this.interval = interval;
	this.callback = callback;
	this.options = {
		interpolation:SZN.Interpolator.LINEAR,
		frequency:20,
		endCallback:false
	}
	this.running = false;
	this._tick = SZN.bind(this, this._tick);
	
	for (var p in options) { this.options[p] = options[p]; }
}

/**
 * zavola callback
 * @method
 * @private
 * @param {number} frac cislo mezi nulou a jednickou
 */ 
SZN.Interpolator.prototype._call = function(frac) {
	var result = this._interpolate(frac);
	var delta = this.endVal - this.startVal;
	this.callback(this.startVal + delta*result);
}

/**
 * provede interpolaci na zaklade this.options.interpolation
 * @method
 * @private
 * @param {number} val cislo mezi nulou a jednickou
 */ 
SZN.Interpolator.prototype._interpolate = function(val) {
	if (typeof(this.options.interpolation) == "function") {
		return this.options.interpolation(val);
	}
	switch (this.options.interpolation) {
		case SZN.Interpolator.QUADRATIC: return val*val;
		case SZN.Interpolator.SQRT: return Math.sqrt(val);
		case SZN.Interpolator.SIN: return (Math.sin(Math.PI * (val-0.5)) + 1) / 2;
		case SZN.Interpolator.ASIN: return (Math.asin(2 * (val-0.5)) + Math.PI/2) / Math.PI;
		default: return val; /* default, linear */
	}
}

/**
 * spusti animaci
 * @method
 */ 
SZN.Interpolator.prototype.start = function() {
	if (this.running) { return; }
	this.running = true;
	this.startTime = (new Date()).getTime();
	this._call(0);
	this.handle = setInterval(this._tick, this.options.frequency);
}

/**
 * zastavi animaci
 * @method
 */ 
SZN.Interpolator.prototype.stop = function() {
	if (!this.running) { return; }
	this.running = false;
	clearInterval(this.handle);
}

/**
 * krok interpolace
 * @method
 * @private
 */ 
SZN.Interpolator.prototype._tick = function() {
	var now = (new Date()).getTime();
	var elapsed = now - this.startTime;
	if (elapsed >= this.interval) {
		this.stop();
		this._call(1);
		if (this.options.endCallback) { this.options.endCallback(); }
	} else {
		this._call(elapsed / this.interval);
	}
}

/**
 * @class Interpolator CSS vlastnosti
 * @param {element} elm HTML prvek
 * @param {number} interval doba animace v msec
 * @param {object} [options] opsny pro interpolator
 * @see SZN.Interpolator#$constructor
 */ 
SZN.CSSInterpolator = SZN.ClassMaker.makeClass({
	NAME:"CSSInterpolator",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.CSSInterpolator.prototype.$constructor = function(elm, interval, options) {
	this.elm = elm;
	this.properties = [];
	this.colors = [];
	
	this._tick = SZN.bind(this, this._tick);
	this.interpolator = new SZN.Interpolator(0, 1, interval, this._tick, options);
}

/**
 * prida novou vlastnost k animovani
 * @method
 * @param {string} property CSS vlastnost
 * @param {number} startVal pocatecni hodnota
 * @param {number} endVal koncova hodnota
 * @param {string} [suffix] volitelna pripona pro CSS hodnotu (typicky 'px')
 */ 
SZN.CSSInterpolator.prototype.addProperty = function(property, startVal, endVal, suffix) {
	var o = {
		property:property,
		startVal:startVal,
		endVal:endVal,
		suffix:suffix || ""
	}
	this.properties.push(o);
}

/**
 * prida novou barevnou vlastnost k animovani
 * @method
 * @param {string} property CSS vlastnost
 * @param {string} startVal pocatecni hodnota
 * @param {string} endVal koncova hodnota
 */ 
SZN.CSSInterpolator.prototype.addColorProperty = function(property, startVal, endVal) {
	var o = {
		startVal:SZN.Parser.color(startVal),
		endVal:SZN.Parser.color(endVal),
		property:property
	};
	this.colors.push(o);
}

/**
 * spusti animaci
 * @method
 */ 
SZN.CSSInterpolator.prototype.start = function() {
	this.interpolator.start();
}

/**
 * zastavi animaci
 * @method
 */ 
SZN.CSSInterpolator.prototype.stop = function() {
	this.interpolator.stop();
}

/**
 * krok animace
 * @method
 * @private
 */ 
SZN.CSSInterpolator.prototype._tick = function(frac) {
	for (var i=0;i<this.properties.length;i++) {
		var prop = this.properties[i];
		var val = prop.startVal + frac * (prop.endVal - prop.startVal);
		val += prop.suffix;
		this.elm.style[prop.property] = val;
	}
	
	var names = ["r", "g", "b"];
	for (var i=0;i<this.colors.length;i++) {
		var c = this.colors[i];
		var out = [0,0,0];
		for (var j=0;j<names.length;j++) {
			var name = names[j];
			out[j] = c.startVal[name] + Math.round(frac*(c.endVal[name]-c.startVal[name]));
		}
		var result = "rgb(" + out.join(",") + ")";
		this.elm.style[c.property] = result;
	}
}
