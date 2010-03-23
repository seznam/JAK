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
	VERSION: "2.0"
});

/** @constant */ JAK.Interpolator.LINEAR = 1;
/** @constant */ JAK.Interpolator.QUADRATIC = 2;
/** @constant */ JAK.Interpolator.SQRT = 3;
/** @constant */ JAK.Interpolator.SIN = 4;
/** @constant */ JAK.Interpolator.ASIN = 5;

/**
 * @param {float} startVal pocatecni hodnota
 * @param {float} endVal koncova hodnota
 * @param {int} interval doba trvani v msec
 * @param {function} callback periodicky callback
 * @param {object} [options] opsny
 * @param {int} [options.frequency=20]
 * @param {int} [options.interpolation=JAK.Interpolator.LINEAR]
 * @param {function} [options.endCallback]
 */
JAK.Interpolator.prototype.$constructor = function(startVal, endVal, interval, callback, options) {
	this.startVal = startVal;
	this.endVal = endVal;
	this.interval = interval;
	this.callback = callback;
	this.options = {
		interpolation:JAK.Interpolator.LINEAR,
		frequency:20,
		endCallback:false
	}
	this.running = false;
	this._tick = this._tick.bind(this);

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
	this.handle = setInterval(this._tick, this.options.frequency);
}

/**
 * zastavi animaci
 */
JAK.Interpolator.prototype.stop = function() {
	if (!this.running) { return; }
	this.running = false;
	clearInterval(this.handle);
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
	NAME:"CSSInterpolator",
	VERSION:"1.0",
	CLASS:"class"
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
JAK.CSSInterpolator.prototype._setOpacity = function(prop, frac){
	var propNew = {};

	// tady spocitej hodnotu pro ruzne klienty a prirad ji do cssPropValue;
	if (JAK.Browser.client == "ie" && JAK.Browser.version < 8) {
		propNew.property = 'filter';
		var val = Math.round(prop.startVal*100 + frac * (prop.endVal*100 - prop.startVal*100));
		propNew.val = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + val + ');';
	} else {
		propNew.property = 'opacity';
		var val = prop.startVal + frac * (prop.endVal - prop.startVal);
		propNew.val = val;
	}
	return propNew;
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
				var propNew = this._setOpacity(prop, frac);
				this.elm.style[propNew.property] = propNew.val;
				continue;
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
