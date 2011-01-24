/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @version 2.0
 * @author zara
 * @class Mnozina prohazovacich prvku, ktere se drag'n'drop daji radit
 * @group jak-widgets
 */   
JAK.Reorder = JAK.ClassMaker.makeClass({
	NAME: "JAK.Reorder",
	VERSION: "2.0"
});

/**
 * @param {node || string} container id nebo reference kontejneru, obsahujiciho prohazovaci prvky
 * @param {object} optObj asociativni pole parametru
 * @param {string} optObj.handleClass CSS trida k elementu, za ktery se ma chytat. Pokud je false (default), taha se za cely node</li>
 * @param {object} callbackObj objekt, jehoz metoda bude volana po zmene poradi
 * @param {string} callbackMethod nazev metody, ktera bude volana po zmene poradi. Jedinym parametrem bude nove pole indexu.
 */
JAK.Reorder.prototype.$constructor = function(container, optObj, callbackObj, callbackMethod) {
	this.ec = [];
	this.items = [];
	
	this.options = {
		handleClass:false,
		direction:"xy",
		ghostProcess:false
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }
	
	this.dom = {
		container:JAK.gel(container),
		ghost:false
	};
	
	this.itemDragged = false; /* currently dragged */
	this.itemAbove = false; /* active */
	this.callbackObj = callbackObj;
	this.callbackMethod = callbackMethod;
	
	this.appended = false;
	this.dragging = false;

	var children = this.dom.container.childNodes;
	for (var i=0;i<children.length;i++) {
		var node = children[i];
		if (node.nodeType == 1) { 
			var item = new JAK.ReorderBox(this,node);
			this.items.push(item);
		}
	}
	
	this.ec.push(JAK.Events.addListener(document, "mousemove",this, "_mouseMove"));
	this.ec.push(JAK.Events.addListener(document, "mouseup", this, "_mouseUp"));
	this.ec.push(JAK.Events.addListener(window, "scroll", this, "_pageScroll"));
}

/**
 * @method Explicitni desktruktor. Odvesi udalosti a maze vsechny vlastnosti.
 */
JAK.Reorder.prototype.$destructor = function() {
	for (var i=0;i<this.items.length;i++) {
		this.items[i].$destructor();
	}
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.Reorder.prototype._startDrag = function(item, e, elm) {
	if (this.dragging) { return; }
	this.itemDragged = item;
	this.itemAbove = false;
	this.dom.ghost = item.dom.container.cloneNode(true);
	var pos = JAK.DOM.getPortBoxPosition(item.dom.container);
	var scroll = JAK.DOM.getScrollPos();
	
	if (this.options.ghostProcess) {
		this.dom.ghost = this.options.ghostProcess(this.dom.ghost);
	}
	this.dom.ghost.style.position = "absolute";
	var x = pos.left+scroll.x;
	var y = pos.top+scroll.y;
	this.dom.ghost.style.left = x+"px";
	this.dom.ghost.style.top = y+"px";
	this.dom.ghost.style.opacity = "0.5";
	JAK.DOM.addClass(this.dom.ghost,"reorder-dragged");
	if (JAK.Browser.client == "ie") {
		this.dom.ghost.style.filter = "alpha(opacity=50)";
	}
	
	this.ghostX = x;
	this.ghostY = y;
	this.clientX = e.clientX;
	this.clientY = e.clientY;
	this.scrollX = scroll.x;
	this.scrollY = scroll.y;
	this.dragging = true;
}

JAK.Reorder.prototype._mouseMove = function(e, elm) {
	if (!this.dragging) { return; }
	if (!this.appended) { /* append ghost */
		this.appended = true;
		document.body.appendChild(this.dom.ghost);
	}
	
	JAK.Events.cancelDef(e);
	
	var dx = e.clientX - this.clientX;
	var dy = e.clientY - this.clientY;
	this.clientX = e.clientX;
	this.clientY = e.clientY;
	
	this._refresh(dx, dy);
}

JAK.Reorder.prototype._pageScroll = function(e,elm){
	if (!this.dragging) { return; }

	var scroll = JAK.DOM.getScrollPos();
	var dx = scroll.x - this.scrollX;
	var dy = scroll.y - this.scrollY;
	this.scrollX = scroll.x;
	this.scrollY = scroll.y;
	
	this._refresh(dx, dy);
}

JAK.Reorder.prototype._refresh = function(dx, dy) {
	var g = this.dom.ghost;

	/* move ghost */
	if (this.options.direction.indexOf("x") != -1) { 
		this.ghostX += dx;
		g.style.left = this.ghostX+"px";
	}
	if (this.options.direction.indexOf("y") != -1) { 
		this.ghostY += dy;
		g.style.top = this.ghostY+"px"; 
	}
	
	/* test position */
	var above = this._getAbove();
	
	if (!above || above != this.itemAbove) { /* remove active */
		if (this.itemAbove) { 
			this.itemAbove._removeActive(); 
			this.itemAbove = false;
		}
	}
	if (above && above != this.itemAbove) {
		above._addActive();
		this.itemAbove = above;
	}
}

JAK.Reorder.prototype._getAbove = function() {
	var x = this.ghostX + this.dom.ghost.offsetWidth/2;
	var y = this.ghostY + this.dom.ghost.offsetHeight/2;
	
	var scroll = JAK.DOM.getScrollPos();
	for (var i=0;i<this.items.length;i++) {
		var item = this.items[i];
		var pos = JAK.DOM.getPortBoxPosition(item.dom.container);
		pos.left += scroll.x;
		pos.top += scroll.y;
		var w = item.dom.container.offsetWidth;
		var h = item.dom.container.offsetHeight;
		var ok_x = true;
		var ok_y = true;
		if (this.options.direction.indexOf("x") != -1) { ok_x = x >= pos.left && x <= pos.left+w; }
		if (this.options.direction.indexOf("y") != -1) { ok_y = y >= pos.top && y <= pos.top+h; }
		if (ok_x && ok_y) { return item; }
	}
	return false;
}

JAK.Reorder.prototype._mouseUp = function(e, elm) {
	if (!this.dragging) { return; }
	this.dragging = false;
	if (this.itemAbove) { this.itemAbove._removeActive(); }
	if (!this.dom.ghost || !this.dom.ghost.parentNode) { return; }
	this.dom.ghost.parentNode.removeChild(this.dom.ghost);
	this.appended = false;
	
	if (!this.itemAbove || this.itemAbove == this.itemDragged) { return; } /* no repositioning */
	
	var dragId = -1;
	var aboveId = -1;
	var arr = [];
	for (var i=0;i<this.items.length;i++) {
		arr.push(i);
		var item = this.items[i];
		if (item == this.itemDragged) { dragId = i; }
		if (item == this.itemAbove) { aboveId = i; }
	}
	var target = false;
	arr.splice(dragId,1);
	arr.splice(aboveId,0,dragId);
	this.items.splice(dragId,1);
	this.items.splice(aboveId,0,this.itemDragged);
	if (dragId > aboveId) { /* backward */
		target = this.itemAbove.dom.container;
	} else { /* forward */
		target = this.itemAbove.dom.container.nextSibling;
	}
	this.dom.container.insertBefore(this.itemDragged.dom.container, target);

	if (this.callbackObj && this.callbackMethod) {
		this.callbackObj[this.callbackMethod](arr);
	}
}

/* ------------------------------------------------------------- */

/**
 * @class JAK.ReorderBox
 * @group jak-widgets
 * @private
 */
JAK.ReorderBox = JAK.ClassMaker.makeClass({
	NAME: "ReorderBox",
	VERSION: "1.0",
	CLASS: "class"
});

JAK.ReorderBox.prototype.$constructor = function(owner, container) {
	this.owner = owner;
	this.dom = {
		container:container
	}
	this.ec = [];
	var handle = this.dom.container;
	if (this.owner.options.handleClass) {
		var c = this.owner.options.handleClass;
		var all = this.dom.container.getElementsByTagName("*");
		for (var i=0;i<all.length;i++) {
			if (JAK.DOM.hasClass(all[i],c)) { handle = all[i]; }
		}
	}
	this.ec.push(JAK.Events.addListener(handle,"mousedown",this,"_mouseDown",false,true));
}

JAK.ReorderBox.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.ReorderBox.prototype._mouseDown = function(e, elm) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	this.owner._startDrag(this, e, elm);
}

JAK.ReorderBox.prototype._addActive = function() {
	JAK.DOM.addClass(this.dom.container,"reorder-active");
}

JAK.ReorderBox.prototype._removeActive = function() {
	JAK.DOM.removeClass(this.dom.container,"reorder-active");
}
