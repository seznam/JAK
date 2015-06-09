/**
 * @class Cross-browser nahrada za console.log a podobne
 * Z ConsoleAPI (http://getfirebug.com/wiki/index.php/Console_API) implementuje log,info,warn,debug,error,clear,dir.
 * @signal change
 * @group jak
 */
JAK.C = JAK.ClassMaker.makeClass({
	NAME: "JAK.C",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals
});

JAK.C.prototype.$constructor = function() {
	this.LIMIT = 1000;
	this.DEBUG = false;
	this.REMOTE = {
		active: false,
		limit: 10,
		what: ["error"]
	}
	
	this._native = window.console;
	this._data = [];
	this._lost = 0; /* zahozene zaznamy */

	this._defineLogMethod("log");
	this._defineLogMethod("info");
	this._defineLogMethod("warn");
	this._defineLogMethod("debug");
	this._defineLogMethod("error");
	this._defineLogMethod("dir");
}

/**
 * Vycisti konzoli
 */
JAK.C.prototype.clear = function() {
	this._lost = 0;
	this._data = [];
	this.makeEvent("change");
}

/**
 * Vrati pocet zahozenych zaznamu
 */
JAK.C.prototype.getLost = function() {
	return this._lost;
}

/**
 * Vrati ulozene zaznamy
 */
JAK.C.prototype.getData = function() {
	return this._data;
}

JAK.C.prototype._defineLogMethod = function(type) {
	var self = this;
	this[type] = function() { return self._log(type, arguments); }
}

/**
 * Obecna logovaci funkce
 * @param {string} type Druh (log, warn, ...)
 * @param {array} args Data k logovani
 */
JAK.C.prototype._log = function(type, args) {
	/* pridat do zasobniku udalosti */
	this._data.push({
		type: type,
		args: args,
		ts: new Date().getTime()
	});
	
	/* procistit zasobnik */
	while (this._data.length > this.LIMIT) { 
		this._data.shift(); 
		this._lost++;
	}
	
	/* vzdalene logovani: musi byt zaple, pritomen dot, spravny loglevel a mene udalosti nez limit */
	if (this.REMOTE.active && window.DOT && (this.REMOTE.what.indexOf(type) > -1) && this.REMOTE.limit) {
		this.REMOTE.limit--;
		DOT.hit("error", {d:{
			type: type,
			args: args
		}});
	}

	/* je-li zapnuto, preposlat do nativniho */
	if (this.DEBUG && this._native) {
		var nativeMethod = this._native[type];
		if (!nativeMethod) { /* tuto metodu nativni konzole nema */
			nativeMethod = this._native.log;
			if (!nativeMethod) { return; } /* nativni konzole nema ani log, sereme na ni */
		}
		
		/* trik: v IE nelze pouzit console.X.apply */
		return Function.prototype.apply.call(nativeMethod, this._native, args);
	}

	this.makeEvent("change");
}

!window.console && (window.console = new JAK.C());
