/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Zatmívač stránky
 * @group jak-widgets
 */
JAK.Shader = JAK.ClassMaker.makeClass({
	NAME: "JAK.Shader",
	VERSION: "2.0"
});

/**
 * @param {object} [options]
 * @param {int} [options.zIndex=1]
 * @param {float} [options.opacity=0.5]
 */
JAK.Shader.prototype.$constructor = function(options) {
	this.options = {
		zIndex: 1,
		opacity: 0.5
	}
	for (var p in options) { this.options[p] = options[p]; }
	
	this._visible = null;
	this.elm = JAK.mel("div", {className:"shader"}, {position:"absolute", zIndex: this.options.zIndex});
	
	if (JAK.Browser.client == "ie") {
		var o = Math.round(this.options.opacity * 100);
		this.elm.style.filter = "alpha(opacity="+o+")";
	} else {
		this.elm.style.opacity = this.options.opacity;
	}
	
	this.hide();
	
	document.body.insertBefore(this.elm, document.body.firstChild);
	JAK.Events.addListener(window, "resize", this, "_sync");
	JAK.Events.addListener(window, "scroll", this, "_sync");
}

/**
 * Ukáže shader
 */
JAK.Shader.prototype.show = function() {
	this._visible = true;
	this.elm.style.display = "block";
	this._sync();
}

/**
 * Schová shader
 */
JAK.Shader.prototype.hide = function() {
	this._visible = false;
	this.elm.style.display = "none";
}

JAK.Shader.prototype._sync = function() {
	if (!this._visible) { return; }
	
	var size = JAK.DOM.getDocSize();
	var pos = JAK.DOM.getScrollPos();
	
	this.elm.style.left = pos.x + "px";
	this.elm.style.top = pos.y + "px";
	this.elm.style.width = size.width + "px";
	this.elm.style.height = size.height + "px";
}
