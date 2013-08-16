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
