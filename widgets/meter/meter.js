/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Widget pro práci s ukazatelem stavu. Využívá HTML5 tag &lt;meter&gt; pokud je k dispozici. Vychází ze specifikace: http://www.w3schools.com/html5/tag_meter.asp
 * @author jerry
 */ 
 
/**
 * @class Ukazatel stavu (&lt;meter&gt;)
 * @group jak-widgets
 * @version 1.0
 */
JAK.Meter = JAK.ClassMaker.makeClass({
	NAME: "JAK.Meter",
	VERSION: "1.0"
});

JAK.Meter.HTML5 = ("optimum" in JAK.mel("meter"));

/**
 * @param {object} options objekt volitelných nastavení
 * @param {number} options.max nastavuje maximum, tedy maximální možnou hodnotu, kterou lze zadat jako value
 * @param {number} options.value nastavuje ukazatel na aktuální hodnotu
 * @param {number} options.min nastavuje ukazatel na aktuální hodnotu
 * @param {number} options.low nastavuje hodnotu, DO které je aktuální hodnota považována za příliš malou (v případě !HTML5 se přiřadí class value-critical)
 * @param {number} options.optimum nastavuje hodnotu, VE které je stav považován za optimální (v případě !HTML5 se přiřadí class value-optimal)
 * @param {number} options.high nastavuje hodnotu, OD které je aktuální hodnota považována za příliš velkou (v případě !HTML5 se přiřadí class value-critical)
 */
JAK.Meter.prototype.$constructor = function(options) {
	this._defaultOptions();
	
	for (var i in options) {
		this._checkNumber(options[i],i);
		this._options[i] = options[i];
	}
	
	this._options.max = this._options.max || this._options.value;
	
	this._dom = {
		container: null,
		value: null
	};
	this._build();
}

/**
 * vrací html element s vytvořeným meterem
 * @returns {HTMLElement} element s vytvořeným meterem
 */
JAK.Meter.prototype.getContainer = function() {
	return this._dom.container;
}

/**
 * nastavuje ukazatel na aktuální hodnotu
 * @param {number} value aktuální hodnota 
 */
JAK.Meter.prototype.setValue = function(value) {
	this._checkNumber(value, "value");
	if (this._options.max && this._options.max < value) { throw new Error("Arg value must be lower or equal to max."); }
	if (this._options.min && this._options.min > value) { throw new Error("Arg value must be greater or equal to min."); }
	this._options.value = value;
	this._sync();
}

/**
 * nastavuje maximální hodnotu ukazatele
 * @param {number} max maximální možná hodnota 
 */
JAK.Meter.prototype.setMax = function(max) {
	this._checkNumber(max, "max");
	this._options.max = max;
	this._sync();
}

/**
 * nastavuje minimální hodnotu ukazatele
 * @param {number} min minimální možná hodnota 
 */
JAK.Meter.prototype.setMin = function(min) {
	this._checkNumber(min, "min");
	if (this._options.max && min > this._options.max) { throw new Error("Arg min must be lower than max value"); }
	if (this._options.value && min > this._options.value) { throw new Error("Arg min must be lower or equal to current value"); }
	this._options.min = min;
	this._sync();
}

/**
 * nastavuje hodnotu, VE které je stav považován za optimální (v případě !HTML5 se přiřadí class value-optimal)
 * @param {number} optimum optimální hodnota
 */
JAK.Meter.prototype.setOptimum = function(optimum) {
	this._checkNumber(optimum, "optimum");
	if (this._options.max && optimum > this._options.max) { throw new Error("Arg optimum must be lower or equal to max value"); }
	if (this._options.min && optimum < this._options.min) { throw new Error("Arg optimum must be greater or equal to minimum value"); }
	this._options.optimum = optimum;
	this._sync();
}

/**
 * nastavuje hodnotu, OD které je aktuální hodnota považována za příliš velkou
 * @param {number} high kritická hodnota (v případě !HTML5 se přiřadí class value-critical)
 */
JAK.Meter.prototype.setHigh = function(high) {
	this._checkNumber(high, "high");
	if (this._options.max && high > this._options.max) { throw new Error("Arg high must be lower or equal to max value"); }
	if (this._options.min && high < this._options.min) { throw new Error("Arg high must be greater or equal to minimum value"); }
	this._options.high = high;
	this._sync();
}

/**
 * nastavuje hodnotu, DO které hodnoty aktuální hodnota považována za příliš malou
 * @param {number} low příliš malá hodnota (v případě !HTML5 se přiřadí class value-critical)
 */
JAK.Meter.prototype.setLow = function(low) {
	this._checkNumber(low, "low");
	if (this._options.max && low > this._options.max) { throw new Error("Arg low must be lower or equal to max value"); }
	if (this._options.min && low < this._options.min) { throw new Error("Arg low must be greater or equal to minimum value"); }
	this._options.low = low;
	this._sync();
}

/**
 * vrací aktuálně nastavenou hodnotu ukazatele
 * @returns {number} aktuálně nastavená hodnota
 */
JAK.Meter.prototype.getValue = function(value) {
	return this._options.value;
}

/**
 * vrací maximálně nastavitelnou hodnotu ukazatele
 * @returns {number} maximálně nastavitelná hodnota ukazatele
 */
JAK.Meter.prototype.getMax = function(max) {
	return this._options.max;
}

/**
 * vrací minimálně nastavitelnou hodnotu ukazatele
 * @returns {number} manimálně nastavitelná hodnota ukazatele
 */
JAK.Meter.prototype.getMin = function(min) {
	return this._options.min;
}

/**
 * vrací hodnotu, VE které je stav považován za optimální
 * @returns {number} optimální hodnota
 */
JAK.Meter.prototype.getOptimum = function(optimum) {
	return this._options.optimum;
}

/**
 * vrací hodnotu, OD které hodnoty je stav považován za příliš velký
 * @returns {number} kritická hodnota
 */
JAK.Meter.prototype.getHigh = function(high) {
	return this._options.high;
}

/**
 * vrací hodnotu, DO které hodnoty je stav považován za příliš malý
 * @returns {number} příznivá hodnota
 */
JAK.Meter.prototype.getLow = function(high) {
	return this._options.low;
}

JAK.Meter.prototype._sync = function() {
	if (typeof(this._options.max) != "number" || typeof(this._options.value) != "number") { return; }
	if (this.constructor.HTML5) {
		for(var i in this._options) {
			if (typeof(this._options[i]) == "number") { this._dom.container[i] = this._options[i]; }
		}
	} else {
		var value = this._options.value;
		var max = this._options.max;
		var min = this._options.min;
		var optimum = this._options.optimum;
		var high = this._options.high;
		var low = this._options.low;
		
		JAK.DOM.removeClass(this._dom.value, "value-critical");
		JAK.DOM.removeClass(this._dom.value, "value-optimal");
		
		if (min) { value = value - min; max = max - min; }
		var percent = Math.round((value/max)*100);
		percent = percent > 100 ? 100 : percent;
		this._dom.value.style.width = percent + "%";
		
		if ((low && value < low) || (high && value > high)) { 
			JAK.DOM.addClass(this._dom.value, "value-critical");
		} else {
			JAK.DOM.addClass(this._dom.value, "value-optimal");
		}
	}
}

JAK.Meter.prototype._build = function() {
	var options = this._options;
	if (this.constructor.HTML5) {
		var value = options.value;
		var max = options.max;
		this._dom.container = JAK.mel("meter",{className:"meter", value: value, max: max});
	} else {
		this._buildCustom();
	}
	this._sync();
}

JAK.Meter.prototype._buildCustom = function() {
	var container = JAK.mel("span", {className:"meter"});
	var value = JAK.mel("em");
	container.appendChild(value);
	this._dom.container = container;
	this._dom.value = value;
}

JAK.Meter.prototype._defaultOptions = function() {
	this._options = {value:0};
}

JAK.Meter.prototype._checkNumber = function(value, type) {
	if (typeof(value) != "number") { throw new Error("Arg " + type + " must be a number."); }
}
