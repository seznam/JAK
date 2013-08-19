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

/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview ImageSlider.Main
 * @version 1.0
 * @author ethan
*/   

/**
 * @class ImageSlider.Main
 * @group jak-widgets
 */
JAK.ImageSlider.Main = JAK.ClassMaker.makeClass({
	NAME: "JAK.ImageSlider.Main",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

/**
 * @param {object} [owner] instance ImageSlideru, která tuto komponentu inicializovala a používá
 */
JAK.ImageSlider.Main.prototype.$constructor = function(owner) {
	this._conf = owner.getConf();
	
	this._data = owner.getData();
	this._owner = owner;
	
	this._dom = [];
	this._ec = [];
	this._sc = [];
	
	this._build();
}

JAK.ImageSlider.Main.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this.removeListeners(this._sc);
}

JAK.ImageSlider.Main.prototype._build = function() {
	this._dom.container = JAK.mel("div", { className: this._conf.className + "-main" });
	this._sc.push(this.addListener("imageslider-show", "_show", this._owner));
	
	this._dom.images = [];
	for (var i = 0, len = this._data.length; i < len; i++) {
		var image = JAK.mel ("img", { src: this._data[i].big.url }, { display: "none" });
		this._dom.container.appendChild(image);
		this._dom.images.push(image);
	}
	
	this._owner.getContainer().appendChild(this._dom.container);
	
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousewheel DOMMouseScroll", this, "_mouseWheel"));
}

JAK.ImageSlider.Main.prototype._show = function(e) {
	// TODO: pamatovat si aktivni, neprochazet vsechny
	for (var i = 0, len = this._dom.images.length; i < len; i++) {
		this._dom.images[i].style.display = "none";
	}
	// TODO: vyrobit a zapojit nejake prolinacky - jako samostatnou tridu, kterou na to pujde pouzit
	this._dom.images[e.data.index].style.display = "";
}

JAK.ImageSlider.Main.prototype._mouseWheel = function(e) {
	((e.wheelDelta || -e.detail) > 0 ? this._owner.prev() : this._owner.next());
}
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview ImageSlider.Description
 * @version 1.0
 * @author ethan
*/   

/**
 * @class ImageSlider.Description
 * @group jak-widgets
 */
JAK.ImageSlider.Description = JAK.ClassMaker.makeClass({
	NAME: "JAK.ImageSlider.Description",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

/**
 * @param {object} [owner] instance ImageSlideru, která tuto komponentu inicializovala a používá
 */
JAK.ImageSlider.Description.prototype.$constructor = function(owner) {
	this._conf = owner.getConf();
	
	this._data = owner.getData();
	this._owner = owner;
	
	this._dom = [];
	this._ec = [];
	this._sc = [];
	
	this._build();
}

JAK.ImageSlider.Description.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this.removeListeners(this._sc);
}

JAK.ImageSlider.Description.prototype._build = function() {
	this._dom.container = JAK.mel("div", { className: this._conf.className + "-description" });
	
	this._sc.push(this.addListener("imageslider-show", "_show", this._owner));
	
	this._owner.getContainer().appendChild(this._dom.container);
}

JAK.ImageSlider.Description.prototype._show = function(e) {
	this._dom.container.innerHTML = this._data[e.data.index].alt;
}
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview ImageSlider.Navigation
 * @version 1.0
 * @author ethan
*/   

/**
 * @class ImageSlider.Navigation
 * @group jak-widgets
 */
JAK.ImageSlider.Navigation = JAK.ClassMaker.makeClass({
	NAME: "JAK.ImageSlider.Navigation",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

/**
 * @param {object} [owner] instance ImageSlideru, která tuto komponentu inicializovala a používá
 */
JAK.ImageSlider.Navigation.prototype.$constructor = function(owner) {
	this._conf = owner.getConf();
	
	this._data = owner.getData();
	this._owner = owner;
	
	this._dom = [];
	this._ec = [];
	this._sc = [];
	
	this._keyboardControl = null;
	
	this._build();
}

JAK.ImageSlider.Navigation.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this.removeListeners(this._sc);
	if (this._keyboardControl) { JAK.Events.removeListener(this._keyboardControl); }
}

JAK.ImageSlider.Navigation.prototype._build = function() {
	this._sc.push(this.addListener("imageslider-show", "_show", this._owner));
	
	var container = this._owner.getContainer();
	
	this._dom.prev = JAK.mel("div", { className: this._conf.className + "-button previous" });
	this._ec.push(JAK.Events.addListener(this._dom.prev, "click", this, "_click"));
	container.appendChild(this._dom.prev);
	
	this._dom.next = JAK.mel("div", { className: this._conf.className + "-button next"});
	this._ec.push(JAK.Events.addListener(this._dom.next, "click", this, "_click"));
	container.appendChild(this._dom.next);
	
	this._dom.close = JAK.mel("div", { className: this._conf.className + "-button close"});
	this._ec.push(JAK.Events.addListener(this._dom.close, "click", this, "_click"));
	container.appendChild(this._dom.close);
	
	if (!this._conf.parentNode) { this._ec.push(JAK.Events.addListener(document, "keydown", this, "_keydown")); }
}

JAK.ImageSlider.Navigation.prototype._show = function(e) {
	// zakazani prvniho tlacitka, pokud neni strip nekonecny - jen se nastavi trida
	if (!this._conf.infinite && e.data.index == 0) {
		this._dom.prev.classList.add("disabled");
	} else {
		this._dom.prev.classList.remove("disabled");
	}
	
	// zakazani druheho tlacitka, pokud neni strip nekonecny - jen se nastavi trida
	if (!this._conf.infinite && e.data.index == this._data.length - 1) {
		this._dom.next.classList.add("disabled");
	} else {
		this._dom.next.classList.remove("disabled");
	}
}

JAK.ImageSlider.Navigation.prototype._click = function(e) {
	var target = JAK.Events.getTarget(e);
	
	// dalsi obrazek
	if (target === this._dom.next) {
		this._owner.next();
	}
	
	// predchozi obrazek
	if (target === this._dom.prev) {
		this._owner.prev();
	}
	
	// zavri lightbox
	if (target === this._dom.close) {
		this._owner.close();
	}
}

JAK.ImageSlider.Navigation.prototype._keydown = function(e) {
	if (!this._owner.isVisible()) { return; }
	
	var key = e.keyCode;
	
	switch (key) {
		// sipka doprava
		case 39:
		// sipka dolu
		case 40:
			this._owner.next();
			break;
		// sipka doleva
		case 37:
		// sipka nahoru
		case 38:
			this._owner.prev();
			break;
		// escape
		case 27:
			this._owner.close();
			break;
		default:
			return;
	}
	
	JAK.Events.cancelDef(e);
}
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview ImageSlider.Strip
 * @version 1.0
 * @author ethan
*/   

/**
 * @class ImageSlider.Strip
 * @group jak-widgets
 */
JAK.ImageSlider.Strip = JAK.ClassMaker.makeClass({
	NAME: "JAK.ImageSlider.Strip",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

/**
 * @param {object} [owner] instance ImageSlideru, která tuto komponentu inicializovala a používá
 */
JAK.ImageSlider.Strip.prototype.$constructor = function(owner) {
	this._conf = owner.getConf();
	this._owner = owner;
	
	this._dom = [];
	this._ec = [];
	this._sc = [];
	
	this._build();
}

JAK.ImageSlider.Strip.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this.removeListeners(this._sc);
}

JAK.ImageSlider.Strip.prototype._build = function() {
	this._dom.container = JAK.mel("div", { className: this._conf.className + "-strip" });
	
	this._dom.thumbnails = [];
	this._dom.images = [];
	var data = this._owner.getData();
	
	for (var i = 0, len = data.length; i < len; i++) {
		var thumbnail = JAK.mel("div", { className: this._conf.className + "-strip-item", tabindex: "-1" });
		this._dom.thumbnails.push(thumbnail);
		
		this._owner.bindElement(thumbnail, i);
		
		this._dom.container.appendChild(thumbnail);
		
		// nahled
		var image = JAK.mel("img");
		image.src = data[i].small.url;
		thumbnail.appendChild(image);
		this._dom.images.push(image);
		
		// ramecek aktivniho nahledu
		thumbnail.appendChild(JAK.mel("div"));
	}
	
	this._sc.push(this.addListener("imageslider-show", "_show", this._owner));
	this._ec.push(JAK.Events.addListener(window, "resize", this, "_positionActive"));
	
	this._owner.getContainer().appendChild(this._dom.container);
}

JAK.ImageSlider.Strip.prototype._show = function(e) {
	var elm = this._dom.container.querySelector(".active");
	if (elm) { elm.classList.remove("active"); }
	
	if (this._dom.thumbnails[e.data.index]) { this._dom.thumbnails[e.data.index].classList.add("active"); }
	
	this._positionActive();
}

JAK.ImageSlider.Strip.prototype._positionActive = function(e) {
	var index = this._owner.getIndex();
	var thumb = this._dom.thumbnails[index];
	var cont = this._dom.container;
	
	// reakce na zvoleny mod centrovani nahledu
	if (this._conf.thumbnailMode == JAK.ImageSlider.TM_CENTERED) {
		// vertikalne
		cont.scrollTop = thumb.offsetTop + (thumb.clientHeight / 2) - (cont.clientHeight / 2);
		// horizontalne
		cont.scrollLeft = thumb.offsetLeft + (thumb.clientWidth / 2) - (cont.clientWidth / 2);
	} else if (this._conf.thumbnailMode == JAK.ImageSlider.TM_VISIBLE) {
		// vertikalne
		if (cont.scrollTop > thumb.offsetTop) {
			cont.scrollTop = thumb.offsetTop;
		}
		if (cont.clientHeight + cont.scrollTop < thumb.offsetTop + thumb.clientHeight) {
			cont.scrollTop = thumb.offsetTop + thumb.clientHeight - cont.clientHeight;
		}
		
		// horizontalne
		if (cont.scrollLeft > thumb.offsetLeft) {
			cont.scrollLeft = thumb.offsetLeft;
		}
		if (cont.clientWidth + cont.scrollLeft < thumb.offsetLeft + thumb.clientWidth) {
			cont.scrollLeft = thumb.offsetLeft + thumb.clientWidth - cont.clientWidth;
		}
	} // na JAK.ImageSlider.TM_NONE neni treba reagovat, to je default
}
