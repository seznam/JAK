/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @namespace
 * @group jak-widgets
 */
JAK.Editor2.Controls = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Editor2.Controls",
	VERSION: "1.0"
});

/* basic control: enable/disable, hover */
/**
 * @class Zakladni abstraktni ovladaci prvek
 * @group jak-widgets
 * @augments JAK.ISignals
 */ 
JAK.Editor2.Control = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control",
	VERSION: "2.0",
	IMPLEMENT: JAK.ISignals
});

JAK.Editor2.Control.prototype.$constructor = function(editor, options) {
	this._options = {};
	this._defaultOptions();

	for (var p in options) { this._options[p] = options[p]; }
	if ("text" in this._options && typeof(this._options.text) == "string") { this._options.text = [this._options.text]; }
	
	this._enabled = true;
	this._editor = editor;
	this._dom = {};
	this._ec = [];
	
	this._build(); /* create DOM */
	this._init(); /* control-specific init */
}

JAK.Editor2.Control.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this._dom.container.parentNode.removeChild(this._dom.container);
}

JAK.Editor2.Control.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.Editor2.Control.prototype.refresh = function() {}

JAK.Editor2.Control.prototype.enable = function() { 
	if (this._enabled) { return; }
	this._enabled = true; 
	JAK.DOM.removeClass(this._dom.container, "disabled");
}

JAK.Editor2.Control.prototype.disable = function() { 
	if (!this._enabled) { return; }
	this._enabled = false; 
	JAK.DOM.addClass(this._dom.container, "disabled");
	JAK.DOM.removeClass(this._dom.container, "mouseover");
}

JAK.Editor2.Control.prototype._build = function() {
	this._dom.container = JAK.mel("div");
}

JAK.Editor2.Control.prototype._init = function() {}

JAK.Editor2.Control.prototype._defaultOptions = function() {}

JAK.Editor2.Control.prototype._addMouseEvents = function(elm) {
	this._ec.push(JAK.Events.addListener(elm, "mouseover", this, "_mouseover"));
	this._ec.push(JAK.Events.addListener(elm, "mouseout", this, "_mouseout"));
}

JAK.Editor2.Control.prototype._mouseover = function(e, elm) {
	if (this._enabled) {	JAK.DOM.addClass(elm, "mouseover"); }
}

JAK.Editor2.Control.prototype._mouseout = function(e, elm) {
	if (this._enabled) { JAK.DOM.removeClass(elm, "mouseover"); }
}

/**
 * @class
 * @augments JAK.EditorControl
 */
JAK.Editor2.Control.Interactive = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.Interactive",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control
});

JAK.Editor2.Control.Interactive.prototype._defaultOptions = function() {
	this._options = {
		image:"none.gif",
		text:""
	}
}

JAK.Editor2.Control.Interactive.prototype._build = function() {
	this._dom.container = JAK.mel("img", {className:"button"});
	this._dom.container.src = this._editor.getOptions().imagePath + this._options.image;
	this._ec.push(JAK.Events.addListener(this._dom.container,"click",this,"_click",false,true));
	if (this._options.text[0]) { this._dom.container.title = this._options.text[0]; }
}

JAK.Editor2.Control.Interactive.prototype._click = function(e, elm) {
	JAK.Events.cancelDef(e);
	if (this._enabled) { this._clickAction(e); }
}

JAK.Editor2.Control.Interactive.prototype._init = function() {
	this._addMouseEvents(this._dom.container);
}

JAK.Editor2.Control.Interactive.prototype._clickAction = function(e) {}

/* --- */

/**
 * @class
 * @augments JAK.Editor2.Control.Interactive
 */
JAK.Editor2.Control.OneStateButton = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.OneStateButton",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control.Interactive
});

JAK.Editor2.Control.OneStateButton.prototype._clickAction = function() {
	if (!this._options.command) { return; }
	this._editor.commandExec(this._options.command, "red"); /* FIXME */
}

JAK.Editor2.Control.OneStateButton.prototype._refresh = function() {
	if (!this._options.command) { return; }
	var state = this._editor.commandQuerySupported(this._options.command);
	if (state == this._enabled) { return; }
	if (state) { this.enable(); } else { this.disable(); }
}

/* change state on refresh */
/**
 * @class
 * @augments JAK.EditorControl.Interactive
 */
JAK.Editor2.Control.TwoStateButton = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.TwoStateButton",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control.Interactive
});

JAK.Editor2.Control.TwoStateButton.prototype._clickAction = function() {
	if (!this._options.command) { return; }
	this._editor.commandExec(this._options.command);
}

JAK.Editor2.Control.TwoStateButton.prototype._init = function() {
	this._addMouseEvents(this._dom.container);
	this.state = 0;
}

JAK.Editor2.Control.TwoStateButton.prototype._toggleState = function(state) {
	this._state = state;
	if (this._state) {
		JAK.DOM.addClass(this._dom.container,"pressed");
	} else {
		JAK.DOM.removeClass(this._dom.container,"pressed");
	}
}

JAK.Editor2.Control.TwoStateButton.prototype.refresh = function() {
	if (!this._options.command) { return; }

	var state = this._editor.commandQuerySupported(this._options.command);
	if (state != this._enabled) { 
		if (state) { this.enable(); } else { this.disable(); }
	}
	
	var s = this._editor.commandQueryState(this._options.command);
	s = (s ? 1 : 0);
	if (s != this._state) { this._toggleState(s); }
}
/* ---------------------------------------------------------------- */

JAK.Editor2.Controls["bold"] = {object:JAK.Editor2.Control.TwoStateButton, command:"bold", image:"bold.gif"};
JAK.Editor2.Controls["color"] = {object:JAK.Editor2.Control.OneStateButton, command:"hilitecolor", image:"bold.gif"};
JAK.Editor2.Controls["justifycenter"] = {object:JAK.Editor2.Control.TwoStateButton, command:"justifycenter", image:"justifycenter.gif"};
JAK.Editor2.Controls["justifyleft"] = {object:JAK.Editor2.Control.TwoStateButton, command:"justifyleft", image:"justifyleft.gif"};
JAK.Editor2.Controls["justifyright"] = {object:JAK.Editor2.Control.TwoStateButton, command:"justifyright", image:"justifyright.gif"};
JAK.Editor2.Controls["justifyfull"] = {object:JAK.Editor2.Control.TwoStateButton, command:"justifyfull", image:"justifyfull.gif"};
