/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Interpolace, animace
 * @version 2.0
 * @author Zara
 */

/**
 * @class Periodicky interpolator
 * @group jak-utils
 */
JAK.Interpolator = JAK.ClassMaker.makeClass({
	NAME: "JAK.Interpolator",
	VERSION: "2.1",
	DEPEND: [{
		sClass: JAK.Timekeeper,
		ver: "1.0"
	}]
});

/** @constant */ JAK.Interpolator.LINEAR	= 1;
/** @constant */ JAK.Interpolator.QUADRATIC	= 2;
/** @constant */ JAK.Interpolator.SQRT		= 3;
/** @constant */ JAK.Interpolator.SIN		= 4;
/** @constant */ JAK.Interpolator.ASIN		= 5;

/**
 * @param {float} startVal počáteční hodnota
 * @param {float} endVal koncová hodnota
 * @param {int} interval doba trvání v msec
 * @param {function} callback periodicky callback
 * @param {object} [options] opšny
 * @param {int} [options.count=1] počet tiknutí pro Timekeeper
 * @param {int} [options.interpolation=JAK.Interpolator.LINEAR]
 * @param {function} [options.endCallback]
 */
JAK.Interpolator.prototype.$constructor = function(startVal, endVal, interval, callback, options) {
	this.startVal = startVal;
	this.endVal = endVal;
	this.interval = interval;
	this.callback = callback;
	this.options = {
		interpolation: JAK.Interpolator.LINEAR,
		count: 1,
		endCallback: false
	}
	this.running = false;

	for (var p in options) { this.options[p] = options[p]; }
}

/**
 * zavola callback
 * @private
 * @param {float} frac cislo mezi nulou a jednickou
 */
JAK.Interpolator.prototype._call = function(frac) {
	var result = this._interpolate(frac);
	var delta = this.endVal - this.startVal;
	this.callback(this.startVal + delta*result);
}

/**
 * provede interpolaci na zaklade this.options.interpolation
 * @private
 * @param {float} val cislo mezi nulou a jednickou
 */
JAK.Interpolator.prototype._interpolate = function(val) {
	if (typeof(this.options.interpolation) == "function") {
		return this.options.interpolation(val);
	}
	switch (this.options.interpolation) {
		case JAK.Interpolator.QUADRATIC: return val*val;
		case JAK.Interpolator.SQRT: return Math.sqrt(val);
		case JAK.Interpolator.SIN: return (Math.sin(Math.PI * (val-0.5)) + 1) / 2;
		case JAK.Interpolator.ASIN: return (Math.asin(2 * (val-0.5)) + Math.PI/2) / Math.PI;
		default: return val; /* default, linear */
	}
}

/**
 * spusti animaci
 */
JAK.Interpolator.prototype.start = function() {
	if (this.running) { return; }
	this.running = true;
	this.startTime = (new Date()).getTime();
	this._call(0);
	JAK.Timekeeper.getInstance().addListener(this, "_tick", this.options.count);
}

/**
 * zastavi animaci
 */
JAK.Interpolator.prototype.stop = function() {
	if (!this.running) { return; }
	this.running = false;
	JAK.Timekeeper.getInstance().removeListener(this);
}

/**
 * krok interpolace
 * @private
 */
JAK.Interpolator.prototype._tick = function() {
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
 * @group jak-utils
 */
JAK.CSSInterpolator = JAK.ClassMaker.makeClass({
	NAME: "CSSInterpolator",
	VERSION: "2.0"
});

/**
 * @param {element} elm HTML prvek
 * @param {int} interval doba animace v msec
 * @param {object} [options] opsny pro interpolator
 * @see JAK.Interpolator
 */
JAK.CSSInterpolator.prototype.$constructor = function(elm, interval, options) {
	this.elm = elm;
	this.properties = [];
	this.colors = [];

	this._tick = this._tick.bind(this);
	this.interpolator = new JAK.Interpolator(0, 1, interval, this._tick, options);
}

/**
 * prida novou vlastnost k animovani
 * @param {string} property CSS vlastnost
 * @param {float} startVal pocatecni hodnota
 * @param {float} endVal koncova hodnota
 * @param {string} [suffix=""] volitelna pripona pro CSS hodnotu (typicky 'px')
 */
JAK.CSSInterpolator.prototype.addProperty = function(property, startVal, endVal, suffix) {
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
 * @param {string} property CSS vlastnost
 * @param {string} startVal pocatecni hodnota
 * @param {string} endVal koncova hodnota
 */
JAK.CSSInterpolator.prototype.addColorProperty = function(property, startVal, endVal) {
	var o = {
		startVal:JAK.Parser.color(startVal),
		endVal:JAK.Parser.color(endVal),
		property:property
	};
	this.colors.push(o);
}

/**
 * spusti animaci
 */
JAK.CSSInterpolator.prototype.start = function() {
	this.interpolator.start();
}

/**
 * zastavi animaci
 */
JAK.CSSInterpolator.prototype.stop = function() {
	this.interpolator.stop();
}

/**
 * nastavi spravne hodnoty pro opacity v zavislosti na prohlizeci
 * @private
 */
JAK.CSSInterpolator.prototype._setOpacity = function(obj, prop, frac) {
	var property = "";
	var val = prop.startVal + frac * (prop.endVal - prop.startVal);

	// tady spocitej hodnotu pro ruzne klienty
	if (JAK.Browser.client == "ie" && JAK.Browser.version < 9) {
		property = 'filter';
		val = Math.round(100*val);
		val = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + val + ');';
	} else {
		property = 'opacity';
	}
	obj[property] = val;
}

/**
 * krok animace
 * @private
 */
JAK.CSSInterpolator.prototype._tick = function(frac) {
	for (var i=0;i<this.properties.length;i++) {
		var prop = this.properties[i];

		switch (prop.property) {
			case "opacity" :
				this._setOpacity(this.elm.style, prop, frac);
			break;

			default:
				var val = prop.startVal + frac * (prop.endVal - prop.startVal);
				val += prop.suffix;
				this.elm.style[prop.property] = val;
			break;
		}
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
