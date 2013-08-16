/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview ImageSlider
 * @version 1.0
 * @author ethan
*/   

/**
 * @class ImageSlider
 * @group jak-widgets
 * @signal imageslider-show
 */
JAK.ImageSlider = JAK.ClassMaker.makeClass({
	NAME: "JAK.ImageSlider",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

JAK.ImageSlider.darkboxContainer = JAK.mel("div", { id: "darkbox-container-all" });

/**
 * aktivní náhled je tam, kam se pruhem náhledů odscrolloval uživatel a nijak nereagujeme
 * @constant
 */
JAK.ImageSlider.TM_NONE		= 0;
/**
 * aktivní náhled se udržuje ve viditelné části pruhu náhledů
 * @constant
 */
JAK.ImageSlider.TM_VISIBLE	= 1;
/**
 * aktivní náhled je udržován ve středu pruhu náhledů
 * @constant
 */
JAK.ImageSlider.TM_CENTERED	= 2;

/**
 * Statická tovární metoda - vyrobí a vrátí ImageSlider v DarkBoxu z elementu obsahujícího obrázky obalené odkazy
 * @param {node} [elm] element, ve kterém budou obrázky v odkazech napojeny na ImageSlider
 * @param {object} [conf] konfigurace stejná jako v případě konstruktoru ImageSlideru
 */
JAK.ImageSlider.fromElement = function(elm, conf) {
	// nastaveni
	var config = {
		components: [
			JAK.ImageSlider.Main,
			JAK.ImageSlider.Strip,
			JAK.ImageSlider.Description,
			JAK.ImageSlider.Navigation
		]
	};
	for (var p in conf) { config[p] = conf[p]; }
	
	// data vycucana z DOMu
	var data = [];
	var l = [];
	var links = elm.getElementsByTagName("a");
	for (var i = 0; i < links.length; i++) {
		var img = links[i].getElementsByTagName("img")[0];
		if (!img) {
			continue;
		}
		data.push({alt: img.alt, small: {url: img.src}, big: {url: links[i].href} });
		l.push(links[i]);
	}
	
	var slider = new JAK.ImageSlider(config, data);
	
	for (var i = 0; i < l.length; i++) {
		slider.bindElement(l[i], i);
	}
	
	return slider;
}

/**
 * @param {object} [conf] asociativní pole parametrů
 * @param {element} [conf.parentNode="null"] rodič, do kterého se ImageSlider vloží (a nahradí jeho obsah), pokud není uveden, použije se DarkBox
 * @param {string} [conf.className="imageslider"] prefix CSS třídy, která se bude používat
 * @param {array} [conf.components="[]"] pole komponent, které se v ImageSlideru použijí
 * @param {number} [conf.startIndex="0"] index obrázku, který bude zobrazen bez jakékoliv uživatelské interakce (užitečné pouze pro ImageSlider mimo DarkBox)
 * @param {bool} [conf.infinite="false"] určuje zda se obrázky rotují nekonečně, nebo se přecházení mezi nimi zastaví na začátku a na konci seznamu
 * @param {string} [conf.thumbnailMode="JAK.ImageSlider.TM_CENTERED"] mód udržování thumbnailu aktivního obrázku v průhledu
 */
JAK.ImageSlider.prototype.$constructor = function(conf, data) {
	this._conf = {
		parentNode: null,
		className: "imageslider",
		darkboxClassName: "darkbox",
		components: [],
		startIndex: 0,
		infinite: false,
		thumbnailMode: JAK.ImageSlider.TM_CENTERED
	}
	for (var p in conf) { this._conf[p] = conf[p]; }
	this._data = data;
	
	this._dom = [];
	this._components = [];
	this._ec = [];
	this._index = 0;
	this._darkboxVisible = false;
	
	this._build();
}

JAK.ImageSlider.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	
	for (var i = 0, len = this._components.length; i < len; i++) {
		this._components[i].$destructor();
	}
}

JAK.ImageSlider.prototype._build = function() {
	this._dom.container = JAK.mel('div', { className: this._conf.className });
	var frag = document.createDocumentFragment();
	
	var anchor = JAK.idGenerator();
	var skipLink = JAK.mel("a", { href: "#" + anchor, innerHTML: "Přeskočit fotogalerii", className: "blind" });
	frag.appendChild(skipLink);
	frag.appendChild(this._dom.container);
	frag.appendChild(JAK.mel("a", { id: anchor }));
	
	if (this._conf.parentNode) { // bude to ve strance
		this._conf.parentNode.innerHTML = "";
		this._conf.parentNode.appendChild(frag);
	} else { // bude to v lightboxu
		// zatmaveni stranky (ale podle stylu taky klidne pruhledne)
		this._dom.dark = JAK.mel("div", { className: this._conf.darkboxClassName + "-dark" }, { display: "none" });
		JAK.ImageSlider.darkboxContainer.appendChild(this._dom.dark);
		this._ec.push(JAK.Events.addListener(this._dom.dark, "click", this, "_clickDark"));
		
		// samotne okno + wrapper, aby byly vetsi moznosti stylovani (nekdy je treba dvou vnorenych elementu na vystredeni a podobne veci)
		this._dom.darkbox = JAK.mel("div", { className: this._conf.darkboxClassName });	
		this._dom.wrapper = JAK.mel("div", { className: this._conf.darkboxClassName + "-wrapper hidden" });
		this._dom.wrapper.appendChild(this._dom.darkbox);
		
		// jsme prvni lightboxovana galerie vkladana do stranky, tak udelame preskoceni vsech
		if (!JAK.ImageSlider.darkboxContainer.parentNode) {
			var anchor = JAK.idGenerator();
			var skipLink = JAK.mel("a", { href: "#" + anchor, innerHTML: "Přeskočit všechny fotogalerie", className: "blind" });
			document.body.appendChild(skipLink);
			document.body.appendChild(JAK.ImageSlider.darkboxContainer);
			document.body.appendChild(JAK.mel("a", { id: anchor }));
		}
		
		JAK.ImageSlider.darkboxContainer.appendChild(this._dom.wrapper);
		this._dom.darkbox.appendChild(frag);
	}
	
	for (var i = 0, len = this._conf.components.length; i < len; i++) {
		this._components.push(new this._conf.components[i](this));
	}
	
	if (this._conf.parentNode) { this.show(this._conf.startIndex); }
}

/**
 * vrací element, do kterého se celý ImageSlider vykresluje
 * @return {element}
 */
JAK.ImageSlider.prototype.getContainer = function() {
	return this._dom.container;
}

/**
 * vrací data předaná konstruktoru
 * @return {array}
 */
JAK.ImageSlider.prototype.getData = function() {
	return this._data;
}

/**
 * vrací konfiguraci ImageSlideru
 * @return {object}
 */
JAK.ImageSlider.prototype.getConf = function() {
	return this._conf;
}

/**
 * navěsí posluchač kliknutí na element, který zobrazí obrázek s daným indexem
 * @param {element} [elm] element, na který se bude klikat (obvykle náhled)
 * @param {number} [index] index obrázku
 */
JAK.ImageSlider.prototype.bindElement = function(elm, index) {
	elm.setAttribute("data-gallery-index", index);
	this._ec.push(JAK.Events.addListener(elm, "click", this, "_clickHook"));
}

JAK.ImageSlider.prototype._clickHook = function(e, elm) {
	JAK.Events.cancelDef(e);
	
	var index = parseInt(elm.getAttribute("data-gallery-index"), 10);
	this.show(index);
}

/**
 * zobrazí obrázek s daným indexem
 * @param {number} [index] index obrázku
 */
JAK.ImageSlider.prototype.show = function(index) {
	this._index = (index >= 0 && index < this._data.length ? index : 0);
	if (!this._conf.parentNode && !this._darkboxVisible) { this._darkboxShow();	}
	this.makeEvent("imageslider-show", { index: this._index });
}

/**
 * zobrazí další obrázek
 */
JAK.ImageSlider.prototype.next = function() {
	if (this._index < this._data.length - 1) {
		this.show(this._index + 1);
	} else if (this._conf.infinite) {
		this.show(1);
	}
}

/**
 * zobrazí předchozí obrázek
 */
JAK.ImageSlider.prototype.prev = function() {
	if (this._index > 0) {
		this.show(this._index - 1);
	} else if (this._conf.infinite) {
		this.show(this._data.length - 1);
	}
}

/**
 * vrací index aktuálního obrázku
 * @return {number}
 */
JAK.ImageSlider.prototype.getIndex = function() {
	return this._index;
}

/**
 * zavře ImageSlider, dává smysl jen u takového, který je v darkBoxu
 */
JAK.ImageSlider.prototype.close = function() {
	if (!this._conf.parentNode && this._darkboxVisible) { this._darkboxHide(); }
}

/**
 * vrací stav viditelnosti ImageSlideru, který je v darkBoxu (jinak vždy true)
 * @return {bool}
 */
JAK.ImageSlider.prototype.isVisible = function() {
	return (!this._conf.parentNode ? this._darkboxVisible : true);
}


JAK.ImageSlider.prototype._clickDark = function(e) {
	this._darkboxHide();
}

/**
 * Zobrazí darkbox a jeho obsah
 */
JAK.ImageSlider.prototype._darkboxShow = function() {
	this._darkboxVisible = true;
	/* predchazi opakovanemu renderovani v IE, ktere se tam obcas rozbije
	 * a rozbite zustane uz naporad - proto ne display = "none"/""
	 */
	this._dom.wrapper.classList.remove("hidden");
	this._dom.dark.style.display = "";
}

/**
 * Skryje darkbox a jeho obsah
 */
JAK.ImageSlider.prototype._darkboxHide = function() {
	this._darkboxVisible = false;
	/* predchazi opakovanemu renderovani v IE, ktere se tam obcas rozbije
	 * a rozbite zustane uz naporad - proto ne display = "none"/""
	 */
	this._dom.wrapper.classList.add("hidden");
	this._dom.dark.style.display = "none";
}

