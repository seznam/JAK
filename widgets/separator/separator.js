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
 * @version 1.0
 * @author zara
 * @signal resize
 * @signal resize-start
 * @signal resize-end
 * @class Oddělovač mezi prvky, který tažením mění velikost některého z nich
 * @group jak-widgets
 */   
JAK.Separator = JAK.ClassMaker.makeClass({
	NAME: "JAK.Separator",
	VERSION: "1.0",
	IMPLEMENT: JAK.SigInterface
});

/** @constant */
JAK.Separator.MODE_CLICK	= 1 << 0;
/** @constant */
JAK.Separator.MODE_DRAG		= 1 << 1;

/** @constant */
JAK.Separator.LEFT			= 0;
/** @constant */
JAK.Separator.RIGHT			= 1;
/** @constant */
JAK.Separator.TOP			= 2;
/** @constant */
JAK.Separator.BOTTOM		= 3;

/**
 * @param {node} parent Rodičovský prvek, jemuž měníme rozměr
 * @param {object} [options]
 * @param {int} [options.location=JAK.Separator.RIGHT] Umístění separátoru
 * @param {int} [options.mode=JAK.Separator.MODE_CLICK | JAK.Separator.MODE_DRAG] Režim separátoru
 * @param {int} [options.min=0] Minimální rozměr
 * @param {int} [options.max=0] Maximální rozměr
 */
JAK.Separator.prototype.$constructor = function(parent, options) {
	this.options = {
		location: JAK.Separator.RIGHT,
		mode: JAK.Separator.MODE_CLICK | JAK.Separator.MODE_DRAG,
		min: 0,
		max: 0
	}
	
	this.ec = [];
	this.ecTmp = [];
	
	this.dom = {
		container: parent,
		content: null
	};
	
	this._noclick = false;
	this._restoredSize = null;
	
	this._sizeProperty = "";
	this._offsetProperty = "";
	this._miscProperties = [];
	this._eventProperty = "";
	this._event = 0;
	
	this._positions = {};
	this._positions[JAK.Separator.LEFT] = "left";
	this._positions[JAK.Separator.RIGHT] = "right";
	this._positions[JAK.Separator.TOP] = "top";
	this._positions[JAK.Separator.BOTTOM] = "bottom";
	
	for (var p in options) { this.options[p] = options[p]; }
	this._build();
}

JAK.Separator.prototype.$destructor = function() {
	this.ec.forEach(JAK.Events.removeListener, JAK.Events);
	this.ec = [];
	this.dom.content.parentNode.removeChild(this.dom.content);
}

/**
 * Zmenší obsah na minimální povolenou velikost
 */
JAK.Separator.prototype.minimize = function() {
	if (this._restoredSize !== null) { return; }
	var size = this._getSize();
	if (size == this.options.min) { return; }
	this._restoredSize = size;
	this._resize(this.options.min);
}

/**
 * Obnoví obsah na velikost před zmenšením
 */
JAK.Separator.prototype.restore = function() {
	if (this._restoredSize === null) { return; }
	this._resize(this._restoredSize);
	this._restoredSize = null;
}

/**
 * Tvorba DOM prvku, inicializace relevantních proměnných
 */
JAK.Separator.prototype._build = function() {
	this.dom.content = JAK.cEl("div", false, "separator", {position:"absolute"});
	this.dom.container.appendChild(this.dom.content);
	var thickness = 0;
	
	switch (this.options.location) {
		case JAK.Separator.LEFT:
		case JAK.Separator.RIGHT:
			thickness = this.dom.content.offsetWidth;
			this.dom.content.style.height = "100%";
			this.dom.content.style.top = "0px";
			this._sizeProperty = "width";
			this._offsetProperty = "offsetWidth";
			this._miscProperties = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"];
			this._eventProperty = "clientX";
		break;
		case JAK.Separator.TOP:
		case JAK.Separator.BOTTOM:
			thickness = this.dom.content.offsetHeight;
			this.dom.content.style.width = "100%";
			this.dom.content.style.left = "0px";
			this._sizeProperty = "height";
			this._offsetProperty = "offsetHeight";
			this._miscProperties = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
			this._eventProperty = "clientY";
		break;
	}
	
	this.dom.content.style[this._positions[this.options.location]] = "-"+thickness+"px";
	
	this.ec.push(JAK.Events.addListener(this.dom.content, "mouseover", this, "_mouseover"));
	this.ec.push(JAK.Events.addListener(this.dom.content, "mouseout", this, "_mouseout"));
	if (this.options.mode & JAK.Separator.MODE_CLICK) {
		this.ec.push(JAK.Events.addListener(this.dom.content, "click", this, "_click"));
	}
	
	if (this.options.mode & JAK.Separator.MODE_DRAG) {
		this.ec.push(JAK.Events.addListener(this.dom.content, "mousedown", this, "_mousedown"));
	}
	
}

/**
 * Pri nadjeti mysi pridame css tridu
 */
JAK.Separator.prototype._mouseover = function(e, elm) {
	JAK.Dom.addClass(this.dom.content, "hover");
}

/**
 * Pri opusteni mysi odebereme css tridu
 */
JAK.Separator.prototype._mouseout = function(e, elm) {
	JAK.Dom.removeClass(this.dom.content, "hover");
}

/**
 * Zacatek tazeni - navesit tahaci udalosti a zapamatovat souradnici
 */
JAK.Separator.prototype._mousedown = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.makeEvent("resize-start");
	this._noclick = false;

	this.ecTmp.push(JAK.Events.addListener(document, "mousemove", this, "_mousemove"));
	this.ecTmp.push(JAK.Events.addListener(document, "mouseup", this, "_mouseup"));
	this._event = e[this._eventProperty];
}

/**
 * Tazeni: kontrola obou mezi, nastaveni noveho rozmeru
 */
JAK.Separator.prototype._mousemove = function(e, elm) {
	JAK.Events.cancelDef(e);
	this._noclick = true;
	
	var delta = e[this._eventProperty] - this._event;
	var size = this._getSize();
	var nsize = size + delta;
	
	if (nsize < this.options.min) { delta -= nsize - this.options.min; }
	
	if (this.options.max) {
		if (nsize > this.options.max) { delta -= nsize - this.options.max; }
	}

	this._event += delta;
	nsize = size + delta;
	this._restoredSize = null;
	this._resize(nsize);
}


/**
 * Pusteni mysi jen odvesi tahaci udalosti
 */
JAK.Separator.prototype._mouseup = function(e, elm) {
	this.makeEvent("resize-end");
	this.ecTmp.forEach(JAK.Events.removeListener, JAK.Events);
	this.ecTmp = [];
}

/**
 * Klik nastal jen v pripade, ze mezi down a up nebyl move
 */
JAK.Separator.prototype._click = function(e, elm) {
	if (this._noclick) { return; }
	if (this._restoredSize === null) {
		this.minimize();
	} else {
		this.restore();
	}
}

/**
 * Zkusi spocitat "opravdovy" vnitrni rozmer prvku, tj. bez ramceku a paddingu
 */
JAK.Separator.prototype._getSize = function() {
	var c = this.dom.container;
	var style = c.style[this._sizeProperty];
	if (style) { return parseInt(style); }
	
	var offset = c[this._offsetProperty];
	for (var i=0;i<this._miscProperties.length;i++) {
		var prop = this._miscProperties[i];
		var value = JAK.Dom.getStyle(c, prop);
		var num = parseInt(value) || 0;
		offset -= num;
	}
	return offset;
}

/**
 * Zmenana rozmeru na zadanou hodnotu, posle signal
 */
JAK.Separator.prototype._resize = function(size) {
	this.dom.container.style[this._sizeProperty] = size + "px";
	this.makeEvent("resize", null, {size:size});
}
