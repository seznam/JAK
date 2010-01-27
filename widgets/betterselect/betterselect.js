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
 * @overview better select
 * @version 1.0
 * @author zara
*/   

/**
 * @class BetterSelect je nahrada klasickeho selectu. Namisto roletky nabizi moznosti v ostinovanem okenku
 * @group jak-widgets
 */
JAK.BetterSelect = JAK.ClassMaker.makeClass({
	NAME: "BetterSelect",
	VERSION: "1.0",
	CLASS: "class",
	DEPEND:[{
		sClass:JAK.Window,
		ver:"1.0"
	}]
});

/**
 * @param {String || Element} selectID existujici select, ktery ma byt nahrazen
 * @param {Object} windowOptions volitelne asociativni pole parametru pro JAK.Window
 */
JAK.BetterSelect.prototype.$constructor = function(selectID, windowOptions) {
	this.select = JAK.gEl(selectID);
	this.windowOptions = windowOptions;
	this.ec = [];
	this._appended = false;
	this.options = [];

	/* hide select */
	this.select.style.display = "none";
	
	/* new element */
	this.elm = JAK.cEl("div",false,"better-select");
	this.select.parentNode.insertBefore(this.elm,this.select);
	
	/* window */
	this.window = new JAK.Window(this.windowOptions);
	JAK.DOM.addClass(this.window.container,"better-select-box");
	var opts = this.select.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		var bo = new JAK.BetterOption(this,opts[i].innerHTML,i);
		this.options.push(bo);
		this.window.content.appendChild(bo.elm);
	}
	
	this.ec.push(JAK.Events.addListener(this.elm,"click",this,"_show",false,true));
	
	var close = JAK.cEl("div",false,"close");
	this.window.content.appendChild(close);
	this.ec.push(JAK.Events.addListener(close,"click",this,"_hide",false,true));
	
	this.window.container.style.position = "absolute";
	this._select(this.select.selectedIndex);
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
JAK.BetterSelect.prototype.$destructor = function() {
	for (var i=0;i<this.options.length;i++) {
		this.options[i].$destructor();
	}
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.BetterSelect.prototype._show = function(e, elm) {
	
	if (!this._appended) {
		document.body.appendChild(this.window.container);
		this._appended = true;
	}

	this.window.show();
	/* position */
	var w = this.window.container.offsetWidth;
	var pos = JAK.DOM.getBoxPosition(this.elm);
	
	var l = Math.round(pos.left + this.elm.offsetWidth/2 - w/2);
	var t = Math.max(0,pos.top - 15);
	var win = JAK.DOM.getDocSize();
	var scroll = JAK.DOM.getScrollPos();
	
	var b = t + this.window.container.offsetHeight - scroll.y;
	if (b > win.height) { t -= b-win.height; }
	
	this.window.container.style.left = l+"px";
	this.window.container.style.top = t+"px";
}

JAK.BetterSelect.prototype._hide = function(e,elm) {
	this.window.hide();
}

JAK.BetterSelect.prototype._select = function(index) {
	this._hide();
	this.select.selectedIndex = index;
	JAK.DOM.clear(this.elm);
	this.elm.appendChild(JAK.cTxt(this.select.getElementsByTagName("option")[index].innerHTML));
}

/**
 * @class
 * @private
 * @group jak-widgets
 */
JAK.BetterOption = JAK.ClassMaker.makeClass({
	NAME: "BetterOption",
	VERSION: "1.0",
	CLASS: "class"
});
JAK.BetterOption.prototype.$constructor = function(owner, label, index) {
	this.owner = owner;
	this.index = index;
	this.label = label;
	this.ec = [];

	this.elm = JAK.cEl("div");
	var a = JAK.cEl("a");
	a.href = "#";
	a.innerHTML = this.label;
	this.elm.appendChild(a);
	
	this.ec.push(JAK.Events.addListener(this.elm,"click",this,"_click",false,true));
}

JAK.BetterOption.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.BetterOption.prototype._click = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.owner._select(this.index);
}
