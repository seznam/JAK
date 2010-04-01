/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview better select
 * @version 2.0
 * @author zara
*/   

/**
 * @class BetterSelect je nahrada klasickeho selectu. Namisto roletky nabizi moznosti v ostinovanem okenku
 * @group jak-widgets
 */
JAK.BetterSelect = JAK.ClassMaker.makeClass({
	NAME: "JAK.BetterSelect",
	VERSION: "2.0",
	DEPEND:[{
		sClass: JAK.Window,
		ver: "2.0"
	}]
});

/**
 * @param {String || Element} selectID existujici select, ktery ma byt nahrazen
 * @param {Object} windowOptions volitelne asociativni pole parametru pro JAK.Window
 */
JAK.BetterSelect.prototype.$constructor = function(selectID, windowOptions) {
	this.select = JAK.gel(selectID);
	this.windowOptions = windowOptions;
	this.ec = [];
	this._appended = false;
	this.options = [];

	/* hide select */
	this.select.style.display = "none";
	
	/* new element */
	this.elm = JAK.cel("div", "better-select");
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
	
	var close = JAK.cel("div", "close");
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
	this.elm.appendChild(JAK.ctext(this.select.getElementsByTagName("option")[index].innerHTML));
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

	this.elm = JAK.cel("div");
	var a = JAK.cel("a");
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
