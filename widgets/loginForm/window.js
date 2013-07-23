JAK.LoginForm.Window = JAK.ClassMaker.makeClass({
	NAME: "JAK.LoginForm.Window",
	VERSION: "1.0"
});

JAK.LoginForm.Window.overlay = JAK.mel("div", {id:"login-overlay"}, {position:"fixed", width:"100%", left:0, top:0});
JAK.LoginForm.Window.overflow = JAK.mel("div", {}, {position:"fixed", width:"100%", left:0, top:0, overflow:"hidden"});
JAK.LoginForm.Window.current = null;
JAK.Events.addListener(JAK.LoginForm.Window.overlay, "mousedown", function(e) {
	if (this.current && this.current.getOptions().close) { this.current.close(); }
}.bind(JAK.LoginForm.Window));
JAK.Events.addListener(window, "keydown", function(e) {
	if (e.keyCode == 27 && this.current && this.current.getOptions().close) { this.current.close(); }
}.bind(JAK.LoginForm.Window));

JAK.LoginForm.Window.prototype.$constructor = function(content, options) {
	this._event = null;

	this._options = {
		close: true,
		className: ""
	}
	for (var p in options) { this._options[p] = options[p]; }

	this._dom = {
		container: JAK.mel("div", {className:"login-window"}, {position:"absolute"}),
		close: JAK.mel("div", {className:"login-close"})
	}
	if (this._options.className) { this._dom.container.classList.add(this._options.className); }
	if (this._options.close) { this._dom.container.appendChild(this._dom.close); }

	JAK.Events.addListener(this._dom.container, "mousedown", this);

	this._dom.container.appendChild(content);
}

JAK.LoginForm.Window.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.LoginForm.Window.prototype.getOptions = function() {
	return this._options;
}

JAK.LoginForm.Window.prototype.open = function() {
	document.body.appendChild(this.constructor.overlay);
	document.body.appendChild(this.constructor.overflow);
	this.constructor.overflow.appendChild(this._dom.container);

	this._resize();
	if (!this._event) { this._event = JAK.Events.addListener(window, "resize", this, "_resize"); }
	this.constructor.current = this;
}

JAK.LoginForm.Window.prototype.close = function() {
	this._dom.container.parentNode.removeChild(this._dom.container);
	this.constructor.overlay.parentNode.removeChild(this.constructor.overlay);
	this.constructor.overflow.parentNode.removeChild(this.constructor.overflow);

	JAK.Events.removeListener(this._event);
	this._event = null;
	if (this.constructor.current == this) { this.constructor.current = null; }
}

JAK.LoginForm.Window.prototype.handleEvent = function(e) {
	JAK.Events.stopEvent(e);
	var target = JAK.Events.getTarget(e);
	if (target == this._dom.close) { this.close(); }
}

JAK.LoginForm.Window.prototype._resize = function() {
	var port = JAK.DOM.getDocSize();
	this.constructor.overlay.style.height = port.height + "px";
	this.constructor.overflow.style.height = port.height + "px";
	var w = this._dom.container.offsetWidth;
	var h = this._dom.container.offsetHeight;
	this._dom.container.style.left = Math.round(port.width/2-w/2) + "px";
	this._dom.container.style.top = Math.round(port.height/2.5-h/2) + "px";
}