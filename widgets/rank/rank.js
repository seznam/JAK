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
 * @overview rank
 * @version 1.0
 * @author zara
*/   

/**
 * @class Hodnotici widget
 * @group jak-widgets
 */
JAK.Rank = JAK.ClassMaker.makeClass({
	NAME:"Rank",
	VERSION:"1.0",
	CLASS:"class"
});

JAK.Rank.prototype.$destructor = function() {
	this._removeEvents();
	for (var i=0;i<this.items.length;i++) {
		this.items[i].$destructor();
	}
	for (var p in this) { this[p] = null; }
}

/**
 * @param {Object || String} container id nebo reference na kontejner - prvek obsahujici hodnotici odkazy
 * @param {Object} pole s parametry:
 * <ul>
 *  <li>ajax true/false hodnota, urcujici, ma-li se pouzit na odeslani hodnoceni AJAX</li>
 *  <li>post true/false hodnota, urcujici, ma-li se pouzit na odeslani POST (jinak GET)</li>
 *  <li>selectedClass nazev css tridy vybrane ikonky</li>
 * </ul>
 */
JAK.Rank.prototype.$constructor = function(container, options) {
	this.ec = [];
	this.dom = {
		container:JAK.gEl(container)
	}
	this.items = [];
	
	this.options = {
		ajax:false,
		post:false,
		selectedClass:"selected"
	}
	for (var p in options) { this.options[p] = options[p]; }
	
	
	var children = [];
	for (var i=0;i<this.dom.container.childNodes.length;i++) {
		children.push(this.dom.container.childNodes[i]);
	}
	for (var i=0;i<children.length;i++) {
		var item = children[i];
		if (item.nodeType != 1) {
			item.parentNode.removeChild(item);
		} else if (item.tagName.toLowerCase() == "a") {
			this.items.push(new JAK.RankItem(this,item));
		} else {
//			alert("Unknown ranking node!");
		}
	}
	
	this._addEvents();
}

JAK.Rank.prototype.disable = function() {
	this._removeEvents();
	this._mouseout();
	for (var i=0;i<this.items.length;i++) {
		this.items[i]._disable();
	}
}

JAK.Rank.prototype._addEvents = function() {
	for (var i=0;i<this.items.length;i++) { this.items[i]._addEvents(); }
	this.ec.push(JAK.Events.addListener(this.dom.container,"mouseover",this,"_mouseover",false,true));
	this.ec.push(JAK.Events.addListener(this.dom.container,"mouseout",this,"_mouseout",false,true));
}

JAK.Rank.prototype._removeEvents = function() {
	for (var i=0;i<this.items.length;i++) { this.items[i]._removeEvents(); }
	for (var i=0;i<this.ec.length;i++) { JAK.Events.removeListener(this.ec[i]); }
}

JAK.Rank.prototype._mouseover = function(e, elm) {
	JAK.DOM.addClass(this.dom.container,"rank-active");
}

JAK.Rank.prototype._mouseout = function(e, elm) {
	JAK.DOM.removeClass(this.dom.container,"rank-active");
	for (var i=0;i<this.items.length;i++) {
		this.items[i]._removeActive();
	}
}

JAK.Rank.prototype._makeActive = function(item) {
	var done = false;
	for (var i=0;i<this.items.length;i++) {
		var it = this.items[i];
		if (!done && !it.active) { it._addActive(); }
		if (done && it.active) { it._removeActive(); }
		if (it == item) { done = true; }
	}
}

JAK.Rank.prototype._send = function(url) {
	var data = "";
	var r = url.match(/^(.*)\?(.*)$/);
	if (r) {
		var u = r[1];
		data = r[2];
	} else {
		var u = url;
	}
	
	var rq = new JAK.Request(JAK.Request.TEXT, {method: this.options.post ? "post" : "get"})
	rq.setCallback(this, "_response");
	rq.send(u, data);

}

JAK.Rank.prototype._response = function(response) {
	var data = eval("("+response+")");
	this.disable();
	if (data.error) {
		alert(data.error);
	} else {
		var rating = data.rating;
		if (!rating) { return; }
		for (var i=0;i<this.items.length;i++) {
			var item = this.items[i];
			item.dom.container.style.cursor = "default";
			if (i < rating) {
				item._select();
			} else {
				item._deselect();
			}
		}
	}
}

/* ------------------------------------------------------------------------------------------------ */

/**
 * @private
 * @group jak-widgets
 */
JAK.RankItem = JAK.ClassMaker.makeClass({
	NAME:"RankItem",
	VERSION:"1.0",
	CLASS:"class"
});

JAK.RankItem.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = false; }
}

JAK.RankItem.prototype.$constructor = function(owner, link) {
	this.owner = owner;
	this.active = false;
	this.ec = [];
	this.dom = {
		container:link
	}
}

JAK.RankItem.prototype._addEvents = function() {
	this.ec.push(JAK.Events.addListener(this.dom.container,"mouseover",this,"_mouseover",false,true));
	if (this.owner.options.ajax) {
		this.ec.push(JAK.Events.addListener(this.dom.container,"click",this,"_click",false,true));
	}
}

JAK.RankItem.prototype._removeEvents = function() {
	for (var i=0;i<this.ec.length;i++) { JAK.Events.removeListener(this.ec[i]); }
}

JAK.RankItem.prototype._addActive = function() {
	this.active = true;
	JAK.DOM.addClass(this.dom.container,"rank-active");
}

JAK.RankItem.prototype._removeActive = function() {
	this.active = false;
	JAK.DOM.removeClass(this.dom.container,"rank-active");
}

JAK.RankItem.prototype._mouseover = function() {
	this.owner._makeActive(this);
}

JAK.RankItem.prototype._click = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.owner._send(this.dom.container.href);
}

JAK.RankItem.prototype._disable = function() {
	this.dom.container.href = "#";
	JAK.DOM.addClass(this.dom.container, "disabled");
}

JAK.RankItem.prototype._select = function() {
	JAK.DOM.addClass(this.dom.container,this.owner.options.selectedClass);
}

JAK.RankItem.prototype._deselect = function() {
	JAK.DOM.removeClass(this.dom.container,this.owner.options.selectedClass);
}
