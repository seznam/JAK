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
