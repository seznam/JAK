/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Nápovědní bublina
 * @group jak-widgets
 */
JAK.Help = JAK.ClassMaker.makeClass({
	NAME: "JAK.Help",
	VERSION: "1.0"
});

/**
 * @param {object} [options] Konfigurace bubliny
 * @param {string} [options.classPrefix="help"] Prefix CSS tříd bubliny a ikonky
 * @param {int} [options.openDelay=1000] Zpoždění otevření bubliny v msec
 * @param {int} [options.closeDelay=1000] Zpoždění zavření bubliny v msec
 * @param {bool} [options.build=false] Má-li se pro každý aktivní prvek vyrábět obrázek
 * @param {string} [options.image="/img/help.gif"] Cesta k obrázku pro build=true
 */
JAK.Help.prototype.$constructor = function(options) {
	this._data = {};
	this._ec = [];
	this._opened = false;
	this._id = null; /* id toho, u ktereho budeme otevirat */

	this._timeouts = {
		open: null,
		close: null
	}
	
	this._options = {
		classPrefix: "help",
		openDelay: 1000,
		closeDelay: 1000,
		build: false,
		image: "/img/help.gif"
	};
	for (var p in options) { this._options[p] = options[p]; }
	

	this._dom = {
		container: JAK.mel("div", {className:this._options.classPrefix + "-bubble"}, {position:"absolute"})
	};
	
	this._open = this._open.bind(this);
	this._close = this._close.bind(this);
	this._ec.push(JAK.Events.addListener(this._dom.container, "mouseover", this, "_mouseover"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "mouseout", this, "_mouseout"));
}

/**
 * Nastavení textu pro jeden či více prvků
 * @param {object} data Dvojice ID:text
 */
JAK.Help.prototype.setup = function(data) {
	for (var id in data) {
		this._data[id] = data[id];
		
		var node = JAK.gel(id);
		if (!node) { throw new Error("Cannot add help to nonexistent ID '"+id+"'"); }
		JAK.DOM.addClass(node, this._options.classPrefix + "-icon");
		
		if (this._options.build) { /* vyrobit obrazek */
			var img = JAK.mel("img", {src:this._options.image});
			node.appendChild(img);
		}
		
		this._ec.push(JAK.Events.addListener(node, "click", this, "_click"));
		this._ec.push(JAK.Events.addListener(node, "mouseover", this, "_mouseover"));
		this._ec.push(JAK.Events.addListener(node, "mouseout", this, "_mouseout"));
	}
}

/**
 * Nadjeti mysi nad okenko / ikonku
 */
JAK.Help.prototype._mouseover = function(e, elm) {
	if (this._timeouts.close) { 
		clearTimeout(this._timeouts.close);
		this._timeouts.close = null;
	}
	
	if (this._opened) { /* pokud je otevreno, mouseover nic dalsiho nedela, jen kdyz prejedeme na jinou ikonku */
		if (elm.id != this._id && elm.id in this._data) { /* otevrene okenko, prejeto na novou ikonku */
			this._id = elm.id;
			this._open();
		}
		return;
	} 
	
	if (elm.id in this._data) { /* neni otevreno, jsme nad ikonkou -> pustime otevirani */
		this._id = elm.id;
		this._timeouts.open = setTimeout(this._open, this._options.openDelay);
	}
}

/**
 * Opusteni okenka / ikonky
 */
JAK.Help.prototype._mouseout = function(e, elm) {
	/* overit, jestli to neni jen opusteni v ramci okenka -> pak by se nic nedelo */
	var node = e.relatedTarget || e.toElement;
	while (node != document.documentElement) {
		if (node == this._dom.container) { return; }
		node = node.parentNode;
	}
	
	if (this._timeouts.open) {
		clearTimeout(this._timeouts.open);
		this._timeouts.open = null;
	}
	
	if (!this._opened) { return; } /* pokud je zavreno, mouseout nic dalsiho nedela */
	this._timeouts.close = setTimeout(this._close, this._options.closeDelay);
}

JAK.Help.prototype._click = function(e, elm) {
	/* zrusit timeouty */
	
	if (this._timeouts.open) {
		clearTimeout(this._timeouts.open);
		this._timeouts.open = null;
	}

	if (this._timeouts.close) { 
		clearTimeout(this._timeouts.close);
		this._timeouts.close = null;
	}
	
	if (this._opened) {
		this._close();
	} else {
		this._id = elm.id;
		this._open();
	}
}

/** 
 * Otevrit
 */
JAK.Help.prototype._open = function() {
	this._timeouts.open = null;
	this._opened = true;

	var box = this._dom.container;
	box.innerHTML = this._data[this._id];
	
	/* spocitat umisteni okenka */
	var icon = JAK.gel(this._id);
	var pos = JAK.DOM.getBoxPosition(icon);
	pos.left += icon.offsetWidth;
	pos.top += icon.offsetHeight;
	
	box.style.visiblity = "hidden";
	box.style.left = pos.left + "px";
	box.style.top = pos.top + "px";
	document.body.appendChild(box);
	
	var offset = JAK.DOM.shiftBox(box);
	pos.left += offset[0];
	pos.top += offset[1];
	box.style.left = pos.left + "px";
	box.style.top = pos.top + "px";
	box.style.visibility = "";
}

/**
 * Zavrit
 */
JAK.Help.prototype._close = function() {
	this._timeouts.close = null;
	this._dom.container.parentNode.removeChild(this._dom.container);
	this._opened = false;
}
