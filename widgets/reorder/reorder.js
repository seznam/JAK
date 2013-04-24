/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @version 2.1
 * @author zara
 * @class Mnozina prohazovacich prvku, ktere se drag'n'drop daji radit
 * @group jak-widgets
 */   
JAK.Reorder = JAK.ClassMaker.makeClass({
	NAME: "JAK.Reorder",
	VERSION: "2.1",
	IMPLEMENT: JAK.ISignals
});

/**
 * @param {node || string} container id nebo reference kontejneru, obsahujiciho prohazovaci prvky
 * @param {object} [optObj] asociativni pole parametru
 * @param {string} [optObj.handleClass] CSS trida k elementu, za ktery se ma chytat. Pokud je false (default), taha se za cely node
 * @param {string} [optObj.ghostProcess] Volitelny callback na zprocessovani vzhledu ducha
 * @param {int} [optObj.scrollSpeed] Rychlost scrollovani rodice, pokud jsme u jeho okraje. 0 = nescrollovat.
 * @param {object} callbackObj objekt, jehoz metoda bude volana po zmene poradi
 * @param {string} callbackMethod nazev metody, ktera bude volana po zmene poradi. Jedinym parametrem bude nove pole indexu.
 */
JAK.Reorder.prototype.$constructor = function(container, optObj, callbackObj, callbackMethod) {
	this._ec = [];
	this._items = [];
	
	this._options = {
		handleClass: false,
		direction: "xy",
		ghostProcess: false,
		scrollSpeed: 0
	}
	for (var p in optObj) { this._options[p] = optObj[p]; }
	
	this._dom = {
		container: JAK.gel(container),
		ghost: null
	};
	
	this._itemDragged = false; /* currently dragged */
	this._itemAbove = false; /* active */
	this._callbackObj = callbackObj;
	this._callbackMethod = callbackMethod;
	
	this._appended = false;
	this._dragging = false;
	this._interval = null;

	var children = this._dom.container.childNodes;
	for (var i=0;i<children.length;i++) {
		var node = children[i];
		if (node.nodeType == 1) { 
			var item = new JAK.ReorderBox(this,node);
			this._items.push(item);
		}
	}
	
	this._ec.push(JAK.Events.addListener(document, "mousemove",this, "_mouseMove"));
	this._ec.push(JAK.Events.addListener(document, "mouseup", this, "_mouseUp"));
	this._ec.push(JAK.Events.addListener(window, "scroll", this, "_pageScroll"));
}

JAK.Reorder.prototype.$destructor = function() {
	while (this._items.length) { this._items.shift().$destructor(); }
	JAK.Events.removeListeners(this._ec);
}

JAK.Reorder.prototype.getOptions = function() {
	return this._options;
}

JAK.Reorder.prototype._startDrag = function(item, e, elm) {
	if (this._dragging) { return; }
	this._itemDragged = item;
	this._itemAbove = false;
	this._dom.ghost = item.getContainer().cloneNode(true);
	var pos = JAK.DOM.getPortBoxPosition(item.getContainer());
	var scroll = JAK.DOM.getScrollPos();
	
	if (this._options.ghostProcess) { this._dom.ghost = this._options.ghostProcess(this._dom.ghost); }
	this._dom.ghost.style.position = "absolute";
	var x = pos.left+scroll.x;
	var y = pos.top+scroll.y;
	this._dom.ghost.style.left = x+"px";
	this._dom.ghost.style.top = y+"px";
	this._dom.ghost.style.opacity = "0.5";
	JAK.DOM.addClass(this._dom.ghost, "reorder-dragged");
	if (JAK.Browser.client == "ie") { this._dom.ghost.style.filter = "alpha(opacity=50)"; }
	
	this.ghostX = x;
	this.ghostY = y;
	this.clientX = e.clientX;
	this.clientY = e.clientY;
	this.scrollX = scroll.x;
	this.scrollY = scroll.y;
	this._dragging = true;

	/* v cyklu koukame, jestli nemame scrollovat */
	if (this._options.scrollSpeed) { this._interval = setInterval(this._checkScroll.bind(this), 100); }
}

JAK.Reorder.prototype._mouseMove = function(e, elm) {
	if (!this._dragging) { return; }
	if (!this._appended) { /* append ghost */
		this._appended = true;
		document.body.appendChild(this._dom.ghost);
	}
	
	JAK.Events.cancelDef(e);
	
	var dx = e.clientX - this.clientX;
	var dy = e.clientY - this.clientY;
	this.clientX = e.clientX;
	this.clientY = e.clientY;
	
	this._refresh(dx, dy);
}

JAK.Reorder.prototype._pageScroll = function(e, elm) {
	if (!this._dragging) { return; }

	var scroll = JAK.DOM.getScrollPos();
	var dx = scroll.x - this.scrollX;
	var dy = scroll.y - this.scrollY;
	this.scrollX = scroll.x;
	this.scrollY = scroll.y;
	
	this._refresh(dx, dy);
}

JAK.Reorder.prototype._refresh = function(dx, dy) {
	var g = this._dom.ghost;

	/* move ghost */
	if (this._options.direction.indexOf("x") != -1) { 
		this.ghostX += dx;
		g.style.left = this.ghostX+"px";
	}
	if (this._options.direction.indexOf("y") != -1) { 
		this.ghostY += dy;
		g.style.top = this.ghostY+"px"; 
	}
	
	/* test position */
	var above = this._getAbove();
	
	if (!above || above != this._itemAbove) { /* remove active */
		if (this._itemAbove) { 
			this._itemAbove._removeActive(); 
			this._itemAbove = false;
		}
	}
	if (above && above != this._itemAbove) {
		above._addActive();
		this._itemAbove = above;
	}
}

JAK.Reorder.prototype._getAbove = function() {
	var x = this.ghostX + this._dom.ghost.offsetWidth/2;
	var y = this.ghostY + this._dom.ghost.offsetHeight/2;
	
	var scroll = JAK.DOM.getScrollPos();
	for (var i=0;i<this._items.length;i++) {
		var item = this._items[i];
		var pos = JAK.DOM.getPortBoxPosition(item.getContainer());
		pos.left += scroll.x;
		pos.top += scroll.y;
		var w = item.getContainer().offsetWidth;
		var h = item.getContainer().offsetHeight;
		var ok_x = true;
		var ok_y = true;
		if (this._options.direction.indexOf("x") != -1) { ok_x = x >= pos.left && x <= pos.left+w; }
		if (this._options.direction.indexOf("y") != -1) { ok_y = y >= pos.top && y <= pos.top+h; }
		if (ok_x && ok_y) { return item; }
	}
	return false;
}

JAK.Reorder.prototype._mouseUp = function(e, elm) {
	if (!this._dragging) { return; }
	this._dragging = false;

	if (this._interval) { /* uz nekoukame */
		clearInterval(this._interval);
		this._interval = null;
	}

	if (this._itemAbove) { this._itemAbove._removeActive(); }
	if (!this._dom.ghost || !this._dom.ghost.parentNode) { return; }
	this._dom.ghost.parentNode.removeChild(this._dom.ghost);
	this._appended = false;
	
	if (!this._itemAbove || this._itemAbove == this._itemDragged) { return; } /* no repositioning */
	
	var dragId = -1;
	var aboveId = -1;
	var arr = [];
	for (var i=0;i<this._items.length;i++) {
		arr.push(i);
		var item = this._items[i];
		if (item == this._itemDragged) { dragId = i; }
		if (item == this._itemAbove) { aboveId = i; }
	}
	var target = false;
	arr.splice(dragId, 1);
	arr.splice(aboveId, 0, dragId);
	this._items.splice(dragId, 1);
	this._items.splice(aboveId, 0, this._itemDragged);
	if (dragId > aboveId) { /* backward */
		target = this._itemAbove.getContainer();
	} else { /* forward */
		target = this._itemAbove.getContainer().nextSibling;
	}
	this._dom.container.insertBefore(this._itemDragged.getContainer(), target);

	if (this._callbackObj && this._callbackMethod) {
		this._callbackObj[this._callbackMethod](arr);
	}
}

JAK.Reorder.prototype._checkScroll = function() {
	var scrollingParent = null;
	var node = this._dom.container.parentNode;
	var x = this._options.direction.indexOf("x") != -1;
	var y = this._options.direction.indexOf("y") != -1;
	while (node) {
		if (node.scrollWidth > node.offsetWidth && x) {
			scrollingParent = node;
			break;
		}
		if (node.scrollHeight > node.offsetHeight && y) {
			scrollingParent = node;
			break;
		}
		node = node.parentNode;
	}

	if (!scrollingParent) { return; }

	var limit = 100; /* toliko pixelu od hrany scrollujeme */
	var pos = JAK.DOM.getPortBoxPosition(scrollingParent);

	var dx = 0;
	var dy = 0;

	if (x && this.clientX < pos.left + limit) { dx -= this._options.scrollSpeed; }
	if (x && this.clientX > pos.left + scrollingParent.offsetWidth - limit) { dx += this._options.scrollSpeed; }
	if (y && this.clientY < pos.top + limit) { dy -= this._options.scrollSpeed; }
	if (y && this.clientY > pos.top + scrollingParent.offsetHeight - limit) { dy += this._options.scrollSpeed; }

	if (dx || dy) {
		scrollingParent.scrollLeft += dx;
		scrollingParent.scrollTop += dy;
		this._refresh(0, 0);
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
	VERSION: "1.0"
});

JAK.ReorderBox.prototype.$constructor = function(owner, container) {
	this._owner = owner;
	this._dom = {
		container: container
	}
	this._ec = [];
	var handle = this._dom.container;
	if (this._owner.getOptions().handleClass) {
		var c = this._owner.getOptions().handleClass;
		var all = this._dom.container.getElementsByTagName("*");
		for (var i=0;i<all.length;i++) {
			if (JAK.DOM.hasClass(all[i],c)) { handle = all[i]; }
		}
	}
	this._ec.push(JAK.Events.addListener(handle,"mousedown",this,"_mouseDown",false,true));
}

JAK.ReorderBox.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
}

JAK.ReorderBox.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.ReorderBox.prototype._mouseDown = function(e, elm) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);
	this._owner._startDrag(this, e, elm);
}

JAK.ReorderBox.prototype._addActive = function() {
	JAK.DOM.addClass(this._dom.container, "reorder-active");
}

JAK.ReorderBox.prototype._removeActive = function() {
	JAK.DOM.removeClass(this._dom.container, "reorder-active");
}
