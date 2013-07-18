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
