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
	
	this._enabled = true;
	this._editor = editor;
	this._dom = {};
	this._ec = [];
	this._range = null;
	
	this._build(); /* create DOM */
}

JAK.Editor2.Control.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
	this._dom.container.parentNode.removeChild(this._dom.container);
}

JAK.Editor2.Control.prototype.getContainer = function() {
	return this._dom.container;
}

JAK.Editor2.Control.prototype.refresh = function() {
	/* Podle povolenosti prikazu enable/disable */
	if (!this._options.command) { return; }
	var state = this._editor.commandQuerySupported(this._options.command);
	if (state == this._enabled) { return; }
	if (state) { this.enable(); } else { this.disable(); }
}

JAK.Editor2.Control.prototype.enable = function() { 
	if (this._enabled) { return; }
	this._enabled = true; 
	JAK.DOM.removeClass(this._dom.container, "disabled");
}

JAK.Editor2.Control.prototype.disable = function() { 
	if (!this._enabled) { return; }
	this._enabled = false; 
	JAK.DOM.addClass(this._dom.container, "disabled");
}

JAK.Editor2.Control.prototype._defaultOptions = function() {
	this._options = {
		image: "none.gif",
		title: ""
	}
}

JAK.Editor2.Control.prototype._build = function() {
	var img = this._buildImage();

	this._dom.container = JAK.mel("span", {title:this._options.title});
	this._dom.container.appendChild(img);

	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));

	/* Opera obskurne zrusi pri kliku selection, takze si ji schovame a po kliku zase ukazeme */
	if (JAK.Browser.client == "opera" && parseFloat(JAK.Browser.version) >= 12) {
		this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", this, "_storeRange"));
	}
}

JAK.Editor2.Control.prototype._buildImage = function() {
	var src = this._editor.getOptions().imagePath + this._options.image;
	var img = JAK.mel("img", {src:src});
	return img;
}

JAK.Editor2.Control.prototype._click = function(e, elm) {
	if (this._range) {
		this._range.show();
		this._range = null;
	}

	JAK.Events.cancelDef(e);
	if (this._enabled) { this._clickAction(e); }
}

JAK.Editor2.Control.prototype._clickAction = function(e) {}

JAK.Editor2.Control.prototype._storeRange = function() {
	this._range = JAK.Range.fromSelection();
}

/**
 * @class Výběr barvy
 * @augments JAK.Editor2.Controls
 */
JAK.Editor2.Control.Color = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.Color",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control
});

JAK.Editor2.Control.Color.prototype.$constructor = function(editor, options) {
	this.$super(editor, options);
	this._state = false;
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", JAK.Events.stopEvent)); /* aby se nezavrelo */
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", JAK.Events.cancelDef)); /* aby se nedeselectlo */
	this._ec.push(JAK.Events.addListener(this._dom.popup, "mousedown", this, "_popupDown"));
	this._ec2 = [];
}

JAK.Editor2.Control.Color.prototype._defaultOptions = function() {
	this._options = {
		colors: [],
		title: ""
	}
}

JAK.Editor2.Control.Color.prototype._build = function() {
	this._dom.container = JAK.mel("span", {title:this._options.title});
	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));

	/* Opera obskurne zrusi pri kliku selection, takze si ji schovame a po kliku zase ukazeme */
	if (JAK.Browser.client == "opera" && parseFloat(JAK.Browser.version) >= 12) {
		this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", this, "_storeRange"));
	}

	this._dom.popup = JAK.mel("div", {className:"editor-control-popup"}, {position:"absolute", zIndex:999});
	this._dom.colors = [];
	for (var i=0;i<this._options.colors.length;i++) {
		var c = JAK.mel("div", {className:"editor-control-color"});
		c.style.backgroundColor = this._options.colors[i];
		this._dom.popup.appendChild(c);
		this._dom.colors.push(c);
	}
	this._dom.color = JAK.mel("div", {className:"editor-control-color"});
	this._dom.container.appendChild(this._dom.color);
	
	var pulldown = JAK.mel("img", {src:this._editor.getOptions().imagePath + "pulldown.png", className:"pulldown"});
	this._dom.container.appendChild(pulldown);
}

JAK.Editor2.Control.Color.prototype._clickAction = function(e, elm) {
	if (this._state) {
		this._close();
	} else {
		this._state = true;
		JAK.DOM.addClass(this._dom.container, "pressed");
		document.body.appendChild(this._dom.popup);
		var pos = JAK.DOM.getBoxPosition(this._dom.container);
		this._dom.popup.style.top = (pos.top + this._dom.container.offsetHeight) + "px";
		this._dom.popup.style.left = pos.left + "px";
		this._ec2.push(JAK.Events.addListener(document, "mousedown", this, "_documentDown"));
		
		for (var i=0;i<this._dom.colors.length;i++) {
			var node = this._dom.colors[i];
			JAK.DOM.removeClass(node, "active");
			if (i == this._index) { JAK.DOM.addClass(node, "active"); }
		}
	}
}

JAK.Editor2.Control.Color.prototype._close = function() {
	this._state = false;
	JAK.DOM.removeClass(this._dom.container, "pressed");
	this._dom.popup.parentNode.removeChild(this._dom.popup);
	JAK.Events.removeListeners(this._ec2);
}

JAK.Editor2.Control.Color.prototype._documentDown = function(e, elm) {
	this._close(true);
}

JAK.Editor2.Control.Color.prototype._popupDown = function(e, elm) {
	JAK.Events.cancelDef(e); /* at neprijdeme o focus editoru */
	JAK.Events.stopEvent(e); /* aby smirovadlo nemerilo mousedown na necem, co tam neni */
	var node = JAK.Events.getTarget(e);
	var index = this._dom.colors.indexOf(node);
	if (index == -1) { return; }
	this._editor.commandExec(this._options.command, this._options.colors[index]); 
	this._close();
}

JAK.Editor2.Control.Color.prototype.refresh = function() {
	this.$super();
	this._index = -1;
	
	var value = this._editor.commandQueryValue(this._options.command) || "";
	var color = JAK.Parser.color(value);
	if (color) {
		for (var i=0;i<this._options.colors.length;i++) {
			var test = JAK.Parser.color(this._options.colors[i]);
			if (color.r == test.r && color.g == test.g && color.b == test.b) {
				this._index = i;
				break;
			}
		}
	}
	
	var index = (this._index == -1 ? 0 : this._index);
	this._dom.color.style.backgroundColor = this._options.colors[index];
}

/**
 * @class Výběr
 * @augments JAK.Editor2.Controls
 */
JAK.Editor2.Control.Select = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.Select",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control
});

JAK.Editor2.Control.Select.prototype.$constructor = function(editor, options) {
	this.$super(editor, options);
	this._state = false;
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", JAK.Events.stopEvent)); /* aby se nezavrelo */
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", JAK.Events.cancelDef)); /* aby se nedeselectlo */
	this._ec.push(JAK.Events.addListener(this._dom.popup, "mousedown", this, "_popupDown"));
	this._ec2 = [];
}

JAK.Editor2.Control.Select.prototype._defaultOptions = function() {
	this.$super();
	this._options.conf = [];
}

JAK.Editor2.Control.Select.prototype._build = function() {
	this._dom.container = JAK.mel("span", {title:this._options.title});
	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));

	this._dom.popup = JAK.mel("div", {className:"editor-control-popup"}, {position:"absolute", zIndex:999});
	this._dom.items = [];
	for (var i=0;i<this._options.conf.length;i++) {
		var conf = this._options.conf[i];
		var c = JAK.mel("div", {className:"editor-control-popup-item", innerHTML:conf.innerHTML});
		this._dom.popup.appendChild(c);
		this._dom.items.push(c);
	}
	
	var src = this._editor.getOptions().imagePath + this._options.image;
	var img = JAK.mel("img", {src:src});
	this._dom.container.appendChild(img);
	
	var pulldown = JAK.mel("img", {src:this._editor.getOptions().imagePath + "pulldown.png", className:"pulldown"});
	this._dom.container.appendChild(pulldown);
}

JAK.Editor2.Control.Select.prototype._clickAction = function(e, elm) {
	if (this._state) {
		this._close();
	} else {
		this._state = true;
		JAK.DOM.addClass(this._dom.container, "pressed");
		document.body.appendChild(this._dom.popup);
		var pos = JAK.DOM.getBoxPosition(this._dom.container);
		this._dom.popup.style.top = (pos.top + this._dom.container.offsetHeight) + "px";
		this._dom.popup.style.left = (pos.left + this._dom.container.offsetWidth - this._dom.popup.offsetWidth) + "px";
		this._ec2.push(JAK.Events.addListener(document, "mousedown", this, "_documentDown"));
	}
}

JAK.Editor2.Control.Select.prototype._close = function() {
	this._state = false;
	JAK.DOM.removeClass(this._dom.container, "pressed");
	this._dom.popup.parentNode.removeChild(this._dom.popup);
	JAK.Events.removeListeners(this._ec2);
}

JAK.Editor2.Control.Select.prototype._documentDown = function(e, elm) {
	this._close();
}

JAK.Editor2.Control.Select.prototype._popupDown = function(e, elm) {
	JAK.Events.cancelDef(e); /* at neprijdeme o focus editoru */
	JAK.Events.stopEvent(e); /* aby smirovadlo nemerilo mousedown na necem, co tam neni */
	var node = JAK.Events.getTarget(e);
	while (node && !JAK.DOM.hasClass(node, "editor-control-popup-item")) { node = node.parentNode; }
	
	var index = this._dom.items.indexOf(node);
	if (index == -1) { return; }
	this._editor.commandExec(this._options.command, this._options.conf[index].value); 
	this._close();
}

/**
 * @class Dvoustavové tlačítko (zapnuto/vypnuto)
 * @augments JAK.Editor2.Control
 */
JAK.Editor2.Control.TwoStateButton = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.TwoStateButton",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control
});

JAK.Editor2.Control.TwoStateButton.prototype.$constructor = function(editor, options) {
	this.$super(editor, options);
	this._state = false;
	this._index = -1;
}

JAK.Editor2.Control.TwoStateButton.prototype._clickAction = function() {
	if (!this._options.command) { return; }
	this._editor.commandExec(this._options.command);
}

JAK.Editor2.Control.TwoStateButton.prototype.refresh = function() {
	this.$super(); /* enable/disable */

	this._state = this._editor.commandQueryState(this._options.command);
	if (this._state) {
		JAK.DOM.addClass(this._dom.container, "pressed");
	} else {
		JAK.DOM.removeClass(this._dom.container, "pressed");
	}
}

/**
 * @class Ask, then insert/edit link
 * @augments JAK.Editor2.Control.TwoStateButton
 */
JAK.Editor2.Control.Link = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.Link",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control.TwoStateButton
});

JAK.Editor2.Control.Link.prototype.MODE_LINK = 0;	/* vrabime odkaz z oznaceneho textu pres command z options*/
JAK.Editor2.Control.Link.prototype.MODE_CHANGE = 1;	/* pouze menime url odkazu */
JAK.Editor2.Control.Link.prototype.MODE_NODE = 2;	/* vyrabime uplne novy odkaz */
JAK.Editor2.Control.Link.prototype._editMode = this.MODE_LINK;
JAK.Editor2.Control.Link.prototype._ec2 = [];

JAK.Editor2.Control.Link.prototype.refresh = function() {
	var a = this._findLink();
	if (a) {
		this._state = true;
		JAK.DOM.addClass(this._dom.container, "pressed");
	} else {
		this._state = false;
		JAK.DOM.removeClass(this._dom.container, "pressed");
	}
}

JAK.Editor2.Control.Link.prototype._build = function() {
	this.$super();
	this._dom.popup = JAK.mel("div", {className:"editor-control-popup"}, {position:"absolute", zIndex:999});
	this._dom.popupBox = JAK.mel("div",{className:"popup-innerBox"});
	this._dom.text = JAK.mel("input",{type:"text"});
	this._dom.link = JAK.mel("input",{type:"text"});
	var line = JAK.mel("div",{className:"popup-formLine"})
	var textLabel = JAK.mel("label",{innerHTML:"<span>" + this._options.labels.text + ": </span>"});
	var linkLabel = JAK.mel("label",{innerHTML:"<span>" + this._options.labels.href + ": </span>"})
	textLabel.appendChild(this._dom.text);
	linkLabel.appendChild(this._dom.link);
	var text = line.cloneNode(true);
	var href = line.cloneNode(true);
	text.appendChild(textLabel);
	href.appendChild(linkLabel);
	this._dom.popupBox.appendChild(text);
	this._dom.popupBox.appendChild(href);
	var cancel = JAK.mel("button",{className:"wm-button", innerHTML:this._options.labels.cancel});
	var accept = JAK.mel("button",{className:"wm-button accept", innerHTML:this._options.labels.accept});
	var line = JAK.mel("div",{className:"button-line"});
	line.appendChild(cancel);
	line.appendChild(accept);
	this._dom.popupBox.appendChild(line);
	this._dom.popup.appendChild(this._dom.popupBox);
	
	this._ec.push(JAK.Events.addListener(this._dom.popup,"mousedown",JAK.Events.stopEvent));
	this._ec.push(JAK.Events.addListener(cancel,"click",this, "_cancel"));
	this._ec.push(JAK.Events.addListener(accept,"click",this, "_accept"));
	
}

JAK.Editor2.Control.Link.prototype._findLink = function() {
	var elm = this._editor.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "a") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}


JAK.Editor2.Control.Link.prototype._cancel = function() {
	this._close(true);
}

JAK.Editor2.Control.Link.prototype._accept = function() {
	this._editor.focus();
	if(this._editMode == this.MODE_LINK){ /* odkaz z oznaceneho textu */
		this._editor.commandExec(this._options.command, this._dom.link.value);
	} else {
		/* nejdrive jen zmenime href odkazu */
		this._node.href = this._dom.link.value;
		if(this._editMode == this.MODE_NODE) { /* vyrobime novy odkaz */
			this._node.appendChild(JAK.ctext(this._dom.text.value));
			this._editor.insertNode(this._node);
			this._node = null;
		} 
	}
	this._node = null;
	this._close(false);
}



JAK.Editor2.Control.Link.prototype._clickAction = function() {
	if (!this._enabled) { return; }
	
	if (this._state) { /* at link - change href */
		var a = this._findLink();
		this._editMode = this.MODE_CHANGE;
		this._node = a;
		var text = JAK.XML.textContent(this._node);
		this._openDialog(a.getAttribute("href"),text)
	} else { /* insert link */
		if(this._editor.getSelectedText() || this._editor.getSelectedHTML()) { /* pouzijeme execCommand z options (vyrabime link z oznaceneho textu)*/
			this._editMode = this.MODE_LINK;
			this._node = null;
			this._openDialog(this._editor.getSelectedText(),this._editor.getSelectedText());
		} else { /* pouzijeme insertNode editoru - vyrabime novy odkaz */
			this._editMode = this.MODE_NODE;
			this._node = JAK.mel("a");
			this._openDialog(null,this._editor.getSelectedText());
		}
	}
	this._ec2.push(JAK.Events.addListener(document, "mousedown", this, "_documentDown"));
}

JAK.Editor2.Control.Link.prototype._documentDown = function(e, elm) {
	this._close(true);
}

JAK.Editor2.Control.Link.prototype._openDialog = function(link,text) {
	document.body.appendChild(this._dom.popup);
	var pos = JAK.DOM.getBoxPosition(this._dom.container);
	this._dom.popup.style.top = (pos.top + this._dom.container.offsetHeight) + "px";
	this._dom.popup.style.left = (pos.left ) + "px";
	this._dom.text.value = text
	this._dom.text.disabled = this._editMode == this.MODE_NODE ? false : true;
	
	var url = link ? link : "http://";
	var test = url.match(/^[a-z]+(.)/i);
	if(test[1] != ":") {
		url = "http://" + url;
	}
	
	this._dom.link.value = url;
}

JAK.Editor2.Control.Link.prototype._close = function(makeFocus) {
	if(makeFocus) {
		this._editor.focus();
	}
	this._dom.link.value = "";
	this._dom.text.value = "";
	JAK.Events.removeListeners(this._ec2);
	this._dom.popup.parentNode.removeChild(this._dom.popup);
}

JAK.Editor2.Control.Link.prototype._defaultOptions = function() {
	this.$super();
	this._options.prompt = "";
}

/* ---------------------------------------------------------------- */

JAK.Editor2.Controls["bold"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"bold", image:"bold.png"}};
JAK.Editor2.Controls["italic"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"italic", image:"italic.png"}};
JAK.Editor2.Controls["underline"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"underline", image:"underline.png"}};
JAK.Editor2.Controls["color"] = {object:JAK.Editor2.Control.Color, options: {command:"forecolor", image:"color.png"}};
JAK.Editor2.Controls["justifycenter"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifycenter", image:"justifycenter.png"}};
JAK.Editor2.Controls["justifyleft"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifyleft", image:"justifyleft.png"}};
JAK.Editor2.Controls["justifyright"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifyright", image:"justifyright.png"}};
JAK.Editor2.Controls["justifyfull"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifyfull", image:"justifyfull.png"}};
JAK.Editor2.Controls["link"] = {object:JAK.Editor2.Control.Link, options: {command:"createlink", image:"link.png"}};

var conf = [
	{innerHTML:"<font size='1'>1&nbsp;(8pt)</font>", value:"1"},
	{innerHTML:"<font size='2'>2&nbsp;(10pt)</font>", value:"2"},
	{innerHTML:"<font size='3'>3&nbsp;(12pt)</font>", value:"3"},
	{innerHTML:"<font size='4'>4&nbsp;(14pt)</font>", value:"4"},
	{innerHTML:"<font size='5'>5&nbsp;(18pt)</font>", value:"5"},
	{innerHTML:"<font size='6'>6&nbsp;(24pt)</font>", value:"6"},
	{innerHTML:"<font size='7'>7&nbsp;(36pt)</font>", value:"7"}
]
JAK.Editor2.Controls["size"] = {object:JAK.Editor2.Control.Select, options: {command:"fontsize", conf:conf, image:"size.png"}};
