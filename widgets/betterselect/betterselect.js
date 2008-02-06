/**
 * @overview better select
 * @version 1.0
 * @author zara
*/   

/**
 * @class BetterSelect je nahrada klasickeho selectu. Namisto roletky nabizi moznosti v ostinovanem okenku
 * @param {String || Element} selectID existujici select, ktery ma byt nahrazen
 * @param {Object} windowOptions volitelne asociativni pole parametru pro SZN.Window
 * @name SZN.BetterSelect
 * @constructor
 */
SZN.BetterSelect = SZN.ClassMaker.makeClass({
	NAME: "BetterSelect",
	VERSION: "1.0",
	CLASS: "class"
});

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
		this.data[options].$destructor();
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
	var t = pos.top - 15;
	
	this.window.container.style.left = l+"px";
	this.window.container.style.top = t+"px";
}

SZN.BetterSelect.prototype._hide = function(e,elm) {
	this.window.hide();
}

SZN.BetterSelect.prototype._select = function(index) {
	this._hide();
	this.select.selectedIndex = index;
	this.elm.innerHTML = this.select.getElementsByTagName("option")[index].innerHTML;
}

/**
 * @name SZN.BetterOption
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
	a.href = "javascript:void(0)";
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
	this.owner._select(this.index);
}
