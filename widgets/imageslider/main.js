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
