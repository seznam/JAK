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
SZN.BetterSelect = SZN.ClassMaker.makeClass({
	NAME: "BetterSelect",
	VERSION: "1.0",
	CLASS: "class",
	DEPEND:[{
		sClass:SZN.Window,
		ver:"1.0"
	}]
});

/**
 * @param {String || Element} selectID existujici select, ktery ma byt nahrazen
 * @param {Object} windowOptions volitelne asociativni pole parametru pro SZN.Window
 */
SZN.BetterSelect.prototype.$constructor = function(selectID, windowOptions) {
	this.select = SZN.gEl(selectID);
	this.windowOptions = windowOptions;
	this.ec = [];
	this._appended = false;
	this.options = [];

	/* hide select */
	this.select.style.display = "none";
	
	/* new element */
	this.elm = SZN.cEl("div",false,"better-select");
	this.select.parentNode.insertBefore(this.elm,this.select);
	
	/* window */
	this.window = new SZN.Window(this.windowOptions);
	SZN.Dom.addClass(this.window.container,"better-select-box");
	var opts = this.select.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		var bo = new SZN.BetterOption(this,opts[i].innerHTML,i);
		this.options.push(bo);
		this.window.content.appendChild(bo.elm);
	}
	
	this.ec.push(SZN.Events.addListener(this.elm,"click",this,"_show",false,true));
	
	var close = SZN.cEl("div",false,"close");
	this.window.content.appendChild(close);
	this.ec.push(SZN.Events.addListener(close,"click",this,"_hide",false,true));
	
	this.window.container.style.position = "absolute";
	this._select(this.select.selectedIndex);
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.BetterSelect.prototype.$destructor = function() {
	for (var i=0;i<this.options.length;i++) {
		this.options[i].$destructor();
	}
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.BetterSelect.prototype._show = function(e, elm) {
	
	if (!this._appended) {
		document.body.appendChild(this.window.container);
		this._appended = true;
	}

	this.window.show();
	/* position */
	var w = this.window.container.offsetWidth;
	var pos = SZN.Dom.getBoxPosition(this.elm);
	
	var l = Math.round(pos.left + this.elm.offsetWidth/2 - w/2);
	var t = Math.max(0,pos.top - 15);
	var win = SZN.Dom.getDocSize();
	var scroll = SZN.Dom.getScrollPos();
	
	var b = t + this.window.container.offsetHeight - scroll.y;
	if (b > win.height) { t -= b-win.height; }
	
	this.window.container.style.left = l+"px";
	this.window.container.style.top = t+"px";
}

SZN.BetterSelect.prototype._hide = function(e,elm) {
	this.window.hide();
}

SZN.BetterSelect.prototype._select = function(index) {
	this._hide();
	this.select.selectedIndex = index;
	SZN.Dom.clear(this.elm);
	this.elm.appendChild(SZN.cTxt(this.select.getElementsByTagName("option")[index].innerHTML));
}

/**
 * @class
 * @private
 * @group jak-widgets
 */
SZN.BetterOption = SZN.ClassMaker.makeClass({
	NAME: "BetterOption",
	VERSION: "1.0",
	CLASS: "class"
});
SZN.BetterOption.prototype.$constructor = function(owner, label, index) {
	this.owner = owner;
	this.index = index;
	this.label = label;
	this.ec = [];

	this.elm = SZN.cEl("div");
	var a = SZN.cEl("a");
	a.href = "#";
	a.innerHTML = this.label;
	this.elm.appendChild(a);
	
	this.ec.push(SZN.Events.addListener(this.elm,"click",this,"_click",false,true));
}

SZN.BetterOption.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.BetterOption.prototype._click = function(e, elm) {
	SZN.Events.cancelDef(e);
	this.owner._select(this.index);
}
