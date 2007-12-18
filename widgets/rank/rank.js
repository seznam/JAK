/**
 * @overview rank
 * @version 1.0
 * @author zara
*/   

/**
 * @class Hodnotici widget
 * @name SZN.Rank
 * @param {Object || String} container id nebo reference na kontejner - prvek obsahujici hodnotici odkazy
 * @param {Boolean} ajax true/false hodnota, urcujici, ma-li se pouzit na odeslani hodnoceni AJAX
 * @constructor
 */
SZN.Rank = SZN.ClassMaker.makeClass({
	NAME: "Rank",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.Rank.prototype.$destructor = function() {
	this._removeEvents();
	for (var p in this) { this[p] = null; }
}

SZN.Rank.prototype.$constructor = function(container, ajax) {
	this.ec = [];
	this.dom = {
		container:SZN.gEl(container)
	}
	this.items = [];
	
	var children = [];
	for (var i=0;i<this.dom.container.childNodes.length;i++) {
		children.push(this.dom.container.childNodes[i]);
	}
	for (var i=0;i<children.length;i++) {
		var item = children[i];
		if (item.nodeType != 1) {
			item.parentNode.removeChild(item);
		} else if (item.tagName.toLowerCase() == "a") {
			this.items.push(new SZN.RankItem(this,item,ajax));
		} else {
			alert("Unknown ranking node!");
		}
	}
	
	if (ajax) {
		this.rq = new SZN.HTTPRequest();
		this.rq.setMethod("get");
		this.rq.setFormat("json");
		this.rq.setMode("async");
	}
	
	this._addEvents();
}

SZN.Rank.prototype.disable = function() {
	this._removeEvents();
	this._mouseout();
	for (var i=0;i<this.items.length;i++) {
		this.items[i]._disable();
	}
}

SZN.Rank.prototype._addEvents = function() {
	for (var i=0;i<this.items.length;i++) { this.items[i]._addEvents(); }
	this.ec.push(SZN.Events.addListener(this.dom.container,"mouseover",this,"_mouseover",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.container,"mouseout",this,"_mouseout",false,true));
}

SZN.Rank.prototype._removeEvents = function() {
	for (var i=0;i<this.items.length;i++) { this.items[i]._removeEvents(); }
	for (var i=0;i<this.ec.length;i++) { SZN.Events.removeListener(this.ec[i]); }
}

SZN.Rank.prototype._mouseover = function(e, elm) {
	SZN.Dom.addClass(this.dom.container,"rank-active");
}

SZN.Rank.prototype._mouseout = function(e, elm) {
	SZN.Dom.removeClass(this.dom.container,"rank-active");
	for (var i=0;i<this.items.length;i++) {
		this.items[i]._removeActive();
	}
}

SZN.Rank.prototype._makeActive = function(item) {
	var done = false;
	for (var i=0;i<this.items.length;i++) {
		var it = this.items[i];
		if (!done && !it.active) { it._addActive(); }
		if (done && it.active) { it._removeActive(); }
		if (it == item) { done = true; }
	}
}

SZN.Rank.prototype._send = function(url) {
	var u = url + (url.match(/\?/) ? "&" : "?") + "ajax=1";
	this.rq.send(u,this,"_response");
}

SZN.Rank.prototype._response = function(data) {
	if (!data) { this.disable(); }
}

/* ------------------------------------------------------------------------------------------------ */

/**
 * @name SZN.RankItem
 */
SZN.RankItem = SZN.ClassMaker.makeClass({
	NAME: "RankItem",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.RankItem.prototype.$destructor = function() {
}

SZN.RankItem.prototype.$constructor = function(owner, link, ajax) {
	this.owner = owner;
	this.active = false;
	this.ajax = ajax;
	this.ec = [];
	this.dom = {
		container:link
	}
}

SZN.RankItem.prototype._addEvents = function() {
	this.ec.push(SZN.Events.addListener(this.dom.container,"mouseover",this,"_mouseover",false,true));
	if (this.ajax) {
		this.ec.push(SZN.Events.addListener(this.dom.container,"click",this,"_click",false,true));
	}
}

SZN.RankItem.prototype._removeEvents = function() {
	for (var i=0;i<this.ec.length;i++) { SZN.Events.removeListener(this.ec[i]); }
}

SZN.RankItem.prototype._addActive = function() {
	this.active = true;
	SZN.Dom.addClass(this.dom.container,"rank-active");
}

SZN.RankItem.prototype._removeActive = function() {
	this.active = false;
	SZN.Dom.removeClass(this.dom.container,"rank-active");
}

SZN.RankItem.prototype._mouseover = function() {
	this.owner._makeActive(this);
}

SZN.RankItem.prototype._click = function(e, elm) {
	SZN.Events.cancelDef(e);
	this.owner._send(this.dom.container.href);
}

SZN.RankItem.prototype._disable = function() {
	this.dom.container.href = "#";
	SZN.Dom.addClass(this.dom.container, "disabled");
}
