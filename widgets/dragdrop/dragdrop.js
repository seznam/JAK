/**
 * trida zajistuje tahani predanych prvku nad prvky, ktere mohou tahnuty element prijmout
 *
 * @signal dragdrop-start
 * @signal dragdrop-end
 * @signal dragdrop-mousemove
 * @signal dragdrop-change
 */
JAK.DragDrop = JAK.ClassMaker.makeClass({
	NAME: 'JAK.DragDrop',
	VERSION: '1.0',
	IMPLEMENT: [JAK.ISignals]
});

/**
 * konstruktor
 * @param {object} [opt]
 * @param {string || function} opt.helper - zda pri tazeni budem tahnout s originalnim prvkem, nebo jeho klonem, nebo to bude nejaka funkce resit
 * @param {bool} opt.revert - pokud je true, pak pri neupusteni do droppable, se premisti zpet na sve misto
 * @param {object} opt.callbackObject
 * @param {string || function} opt.callbackMethod
 * @param {string} opt.draggableClass - trida, predavana prvku, ktery je pri tazeni pod mysi
 * @param {int} opt.revertAnimationSpeed - rycholost animace navratu elementu pri neuspesnem pusteni, udava se v PX/20ms
 * @param {int} opt.minDistance - nejmensi vzdalenost (v pixelech), po jejimz potazeni je vytvoren klon
 */
JAK.DragDrop.prototype.$constructor = function(opt) {
	this.options = {
		helper: "clone", //original, clone, func
		revert: false, //true, vraci v pripade nepusteni do droppable
		callbackObject: null,
		callbackMethod: null,
		draggableClass: "draggable",
		revertAnimationSpeed: 3, // 3px/20ms rychlost animace navratu elementu na puvodni misto
		minDistance: 5
	};

	for (var p in opt) {
		this.options[p] = opt[p];
	}

	if (this.options.revert && !JAK.CSSInterpolator) { throw new Error("Cannot find JAK.CSSInterpolator."); }

	this.ec = []; /* event cache, jen pro sdilene udalosti */

	this.draggable = []; //pole poli pridanych tahacich elementu, kazdy prvek obsahuje pole [elm, handle, event], handle je to na co navesuji udalost, pokud neni zadane, handle = elm; event je ID mousedown eventu
	this.droppable = []; //pole elementu, kde mohu pustit
	this.activeDroppables = [];  // pole elementu kde mohu pustit, nad kterymi se nachazi prave mys pri tazeni 

	this.dragging = {
		left: false,		//posunuti oproti poslednimu mousemove
		top: false,			//posunuti oproti poslednimu mousemove
		x: false,			//posledni pozice kurzoru
		y: false,			//posledni pozice kurzoru
		initTop: false,		//puvodni pozice elementu
		initLeft: false,	//puvodni pozice elementu
		originalElm : null, //element, ktery vyvolal tazeni
		originalElmParent : null,		//pokud tahnu originalem a delam revert, musim ho pastnout do spravneho rodice
		originalElmNextSibling : null,  //a pred spravneho sourozence
		cloneElm : null,	//element, ktery tahnu (clone), nebo original
		mouseup : false,    //udalost mouseup navesena pri mousedown
		mousemove: false    //udalost mousemove navesena pri mousedown
	};
};

/**
 * destruktor
 */
JAK.DragDrop.prototype.$destructor = function() {
	JAK.Events.removeListeners(this.ec);
	
	this.removeAllDraggables();
	this.removeAllDroppables();
	this.activeDroppables = [];

	this.dragging.originalElm = null;
	this.dragging.originalElmParent = null;
	this.dragging.originalElmNextSibling = null;
	this.dragging.cloneElm = null;
};

/**
 * pridani prvku pro tazeni, druhym volitelnym parametrem jde urcit cast, za kterou pujde tahnout
 * @param elm
 * @param handle
 */
JAK.DragDrop.prototype.addDraggable = function(elm, handle) {
	var h = handle || elm;
	var e = JAK.Events.addListener(h, "mousedown", this, "_mousedown");
	this.draggable.push([elm, h, e]);
};

/**
 * Odebrani jednoho tahaciho prvku
 */
JAK.DragDrop.prototype.removeDraggable = function(elm) {
	var index = -1;
	for (var i=0;i<this.draggable.length;i++) {
		if (this.draggable[i][0] == elm) { index = i; }
	}
	if (index == -1) { throw new Error("Cannot remove draggable "+elm); }
	
	var e = this.draggable[index][2];
	JAK.Events.removeListener(e);
	this.draggable.splice(index, 1);
}

/**
 * Zruseni vsech tahacich prvku
 */
JAK.DragDrop.prototype.removeAllDraggables = function() {
	while (this.draggable.length) { this.removeDraggable(this.draggable[0][0]); }
}

/**
 * pridani prvku pro pusteni
 * @param elm
 */
JAK.DragDrop.prototype.addDroppable = function(elm) {
	this.droppable.push(elm);
};

/**
 * odstraneni vsech droppable elementu
 */
JAK.DragDrop.prototype.removeAllDroppables = function() {
	this.droppable = [];
};

/**
 * Odstraneni prvku pro pusteni
 * @param elm
 */
JAK.DragDrop.prototype.removeDroppable = function(elm) {
	var index = this.droppable.indexOf(elm);
	if (index == -1) { throw new Error("Cannot remove droppable "+elm); }
	this.droppable.splice(index, 1);
};

/**
 * metoda je navesena na vsechny draggable elementy
 * @param e
 * @param elm
 */
JAK.DragDrop.prototype._mousedown = function(e, elm) {
	JAK.Events.cancelDef(e);

	this.dragging.mouseup = JAK.Events.addListener(document, "mouseup", this, "_mouseup");
	this.dragging.mousemove = JAK.Events.addListener(document, "mousemove", this, "_mousemove");

	var container = null;
	for (var i = 0; i < this.draggable.length; i++) {
		if (this.draggable[i][1] == elm) {
			container = this.draggable[i][0];
			break;
		}
	}

	if (container) {
		this.dragging.x = e.clientX;
		this.dragging.y = e.clientY;
		this.dragging.originalElm = container;
		this.dragging.originalElmParent = container.parentNode;
		this.dragging.originalElmNextSibling = container.nextSibling;
		// pro pozici shodna s puvodnim prvkem zjistim jeste pred zobrazenim klona
		this.dragging.pos = JAK.DOM.getPortBoxPosition(this.dragging.originalElm);
		this.dragging.scroll = JAK.DOM.getScrollPos();
	}
};

/**
 * pro mousedown navesena tato metoda, abychom zachytili konec tazeni
 * @param e
 * @param elm
 */
JAK.DragDrop.prototype._mouseup = function (e, elm) {
	//zruseni udalosti
	if (this.dragging.mouseup) { 
		JAK.Events.removeListener(this.dragging.mouseup);
		this.dragging.mouseup = null;
	}
	if (this.dragging.mousemove) {
		JAK.Events.removeListener(this.dragging.mousemove);
		this.dragging.mousemove = null;
	}

	//pokud nastal klik, tak nenastalo tazeni, tudiz tento element je prazdny a my netahneme
	if (!this.dragging.cloneElm) { return; }

	var drops = this._getActiveDropboxes(e.clientX, e.clientY);
	//pustenim jsme zasahli drop elementy
	if (drops.length > 0) {
		//pokud mame pozitivni pripad nadjeti, informujeme callbackem, o objektu, ktery byl pretahovan a jake dropy ho mohou obslouzit
		if (this.options.callbackObject && this.options.callbackMethod) {
			if (typeof(this.options.callbackMethod) == 'string') {
				this.options.callbackObject[this.options.callbackMethod](this.dragging.originalElm, this.dragging.cloneElm, drops);
			} else {
				this.options.callbackMethod.call(this.options.callbackObject, this.dragging.originalElm, this.dragging.cloneElm, drops);
			}
		}
		this.dragging.cloneElm = null;
	} else { //pustili jsme mimo
		//musime hezky vyanimovat na puvodni misto
		if (this.options.revert) {
			 this._revert();
		} else {
			this._clearCloneElm(this.dragging.cloneElm, this.dragging.originalElmParent, this.dragging.originalElmNextSibling);
		}
	}

	this.makeEvent('dragdrop-end', {droppable: drops, draggedElm: this.dragging.originalElm, coords:{x: e.clientX, y: e.clientY}});
};

/**
 * metoda zajistujici vytvoreni iluze tahnuti, vytvoreni ducha, a obsluhu jeho posouvani za kurzorem
 * @param e
 * @param elm
 */
JAK.DragDrop.prototype._mousemove = function(e, elm) {
	JAK.Events.cancelDef(e);

	//zruseni vyberu textu pri tazeni elementem
	if (window.getSelection) {
		try {
			window.getSelection().removeAllRanges();
		} catch (e) {}
	} else if (document.selection) {
		document.selection.empty();
	}

	//vytvoreni elementu, ktery budeme tahat, pri prvnim zatazeni
	if (!this.dragging.cloneElm) {
		this.makeEvent("dragdrop-start", {draggedElm: this.dragging.originalElm});

		if (this.options.helper == "original") {
			this.dragging.cloneElm = this.dragging.originalElm;
		} else {
			var dx = e.clientX - this.dragging.x;
			var dy = e.clientY - this.dragging.y;
			var dist = Math.sqrt(dx*dx+dy*dy);
			if (dist < this.options.minDistance) { return; } /* klon/helper nevyrabime, dokud uzivatel nepotahnul dostatecne daleko */

			if (this.options.helper == "clone") {
				this.dragging.cloneElm = this.dragging.originalElm.cloneNode(true);
				this._removeId(this.dragging.cloneElm);
			} else {
				this.dragging.cloneElm = this.options.helper(this.dragging.originalElm, e.clientX, e.clientY);
			}
		}

		this.dragging.cloneElm.style.position = "absolute";
		JAK.DOM.addClass(this.dragging.cloneElm, this.options.draggableClass);
		document.body.appendChild(this.dragging.cloneElm);

		this.dragging.left = this.dragging.pos.left + this.dragging.scroll.x;
		this.dragging.top = this.dragging.pos.top + this.dragging.scroll.y;
		this.dragging.initLeft = this.dragging.pos.left + this.dragging.scroll.x;
		this.dragging.initTop = this.dragging.pos.top + this.dragging.scroll.y;
	}

	//o tolik jsme se posunuli oproti minule
	this.dragging.left += e.clientX - this.dragging.x;
	this.dragging.top += e.clientY - this.dragging.y;
	//zaznamenat posledni pozici kurzoru
	this.dragging.x = e.clientX;
	this.dragging.y = e.clientY;
	
	//zmena polohy ducha
	this.dragging.cloneElm.style.top = this.dragging.top + "px";
	this.dragging.cloneElm.style.left = this.dragging.left + "px";

	//zjisteni kde jsem a vyslani signalu o zmene dropu
	var drops = this._getActiveDropboxes(e.clientX, e.clientY);
	if (drops.length != this.activeDroppables.length) {   //@todo: ne vzdy takhle jednoduchy test staci, asi bude nutne projit pole a porovnat prvek proti prvku
		this.makeEvent('dragdrop-change', {droppable: drops, draggedElm: this.dragging.originalElm, coords:{x: e.clientX, y: e.clientY}});
		this.activeDroppables = drops;
	}
	this.makeEvent('dragdrop-mousemove', {droppable: drops, draggedElm: this.dragging.originalElm, coords:{x: e.clientX, y: e.clientY}});
};

/**
 * pri klonovani originalniho prvku musim jeho klon zbavit vsech IDcek, jinak by to rozbilo selektory
 * @param elm
 */
JAK.DragDrop.prototype._removeId = function(elm) {
	elm.id = '';
	var allChilds = elm.getElementsByTagName('*');
	for (var i = 0; i < allChilds.length; i++) {
		allChilds[i].id = '';
	}
};

/**
 * zjisteni, zda se kurzorem pri pusteni mysi nachazime nad nekterym z dropboxu
 * @param {int} x pozice kurzoru mysi
 * @param {int} y pozice kurzoru mysi
 * @return Array pole dropu, ktere jsou aktivni kurzorem
 */
JAK.DragDrop.prototype._getActiveDropboxes = function(x, y) {
	var ret = [];

	for (var i = 0; i < this.droppable.length; i++) {
		var d = this.droppable[i];
		var pos = JAK.DOM.getPortBoxPosition(d);

		if (pos.top < y && pos.top + d.offsetHeight > y && pos.left < x && pos.left + d.offsetWidth > x) {
			ret.push(d);
		}
	}

	return ret;
};

/**
 * metoda zacina animaci navratu elementu na puvodni misto
 * animace je provadena pomoci vnitrni funkce _revert (closure stavu zacatku animace)
 */
JAK.DragDrop.prototype._revert = function() {
	//pocatecni a cilove hodnoty
	var pos = JAK.DOM.getPortBoxPosition(this.dragging.cloneElm);
	var scroll = JAK.DOM.getScrollPos();

	var x = pos.left;
	var y = pos.top;

	var ix = this.dragging.initLeft;
	var iy = this.dragging.initTop;

	//vypocet vzdalenosti a rychlosti
	var lx = (pos.left + scroll.x - this.dragging.initLeft);
	var ly = (pos.top + scroll.y - this.dragging.initTop);
	var routeLength = Math.sqrt(Math.pow(lx,2) + Math.pow(ly,2));
	var time = Math.floor(routeLength / this.options.revertAnimationSpeed);

	//uzavera na elms a this
	var elm = this.dragging.cloneElm;
	var parent = this.dragging.originalElmParent;
	var nextElm = this.dragging.originalElmNextSibling;
	var that = this;

	var interpolator = new JAK.CSSInterpolator(elm, time, {interpolation: JAK.Interpolator.SIN, endCallback: function(){that._clearCloneElm(elm, parent, nextElm);}});
	interpolator.addProperty('top', y, iy, 'px');
	interpolator.addProperty('left', x, ix, 'px');
	interpolator.start();
};

/**
 * schovani elementu, ktery byl tahan za mysi pri neuspesnem tazeni.
 * jelikoz je volano i z animace navratu, proto jena poslednim radku test smazani, mohl jsem zacit tahnout uz jiny
 * parametr 2 a 3 pouzity pouze pri u
 * @param elm - element, ktery je pod kurzorem
 * @param parent - rodic puvodniho tazeneho prvku
 * @param next - nasledujici sourozenec puvodniho tazeneho prvku
 */
JAK.DragDrop.prototype._clearCloneElm = function(elm, parent, next) {
	if (this.options.helper == 'original') {
		elm.style.position = '';
		parent.insertBefore(elm, next);
	} else {
		elm.parentNode.removeChild(elm);
	}
	
	JAK.DOM.removeClass(elm, this.options.draggableClass);
	if (this.dragging.cloneElm == elm) {
		this.dragging.cloneElm = null;
	}
};
