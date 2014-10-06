/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @namespace
 * @group jak-widgets
 */
JAK.EditorControls = JAK.ClassMaker.makeStatic({
	NAME: "JAK.EditorControls",
	VERSION: "1.0"
});

/* basic control: enable/disable, hover */
/**
 * @class
 * @group jak-widgets
 * @augments JAK.ISignals
 */ 
JAK.EditorControl = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl",
	VERSION: "2.0",
	IMPLEMENT: JAK.ISignals
});

JAK.EditorControl.prototype.$constructor = function(owner, options) {
	this.options = {};
	this._defaultOptions();
	for (var p in options) { this.options[p] = options[p]; }
	if ("text" in this.options && typeof(this.options.text) == "string") { this.options.text = [this.options.text]; }
	
	this.enabled = true;
	this.owner = owner;
	this.dom = {};
	this.ec = [];
	
	this._build(); /* create DOM */
	this._init(); /* control-specific init */
}

JAK.EditorControl.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	this.dom.container.parentNode.removeChild(this.dom.container);
	for (var p in this) { this[p] = null; }
}

JAK.EditorControl.prototype.refresh = function() {}

JAK.EditorControl.prototype.submit = function() {}

JAK.EditorControl.prototype.enable = function() { 
	this.enabled = true; 
	JAK.DOM.removeClass(this.dom.container,"disabled");
}

JAK.EditorControl.prototype.disable = function() { 
	this.enabled = false; 
	JAK.DOM.addClass(this.dom.container,"disabled");
	JAK.DOM.removeClass(this.dom.container,"mouseover");
}

JAK.EditorControl.prototype._build = function() {
	this.dom.container = JAK.cel("div");
}

JAK.EditorControl.prototype._init = function() {}

JAK.EditorControl.prototype._defaultOptions = function() {}

JAK.EditorControl.prototype._addMouseEvents = function(elm) {
	this.ec.push(JAK.Events.addListener(elm,"mouseover",this,"_mouseover",false,true));
	this.ec.push(JAK.Events.addListener(elm,"mouseout",this,"_mouseout",false,true));
}

JAK.EditorControl.prototype._mouseover = function(e, elm) {
	if (this.enabled) {	JAK.DOM.addClass(elm,"mouseover"); }
}

JAK.EditorControl.prototype._mouseout = function(e, elm) {
	if (this.enabled) { JAK.DOM.removeClass(elm,"mouseover"); }
}

/* --- */

/**
 * @class
 * @augments JAK.EditorControl
 */
JAK.EditorControl.Dummy = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.Dummy",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl
});

JAK.EditorControl.Dummy.prototype._build = function() {
	this.dom.container = JAK.cel("img");
	this.dom.container.src = this.owner.options.imagePath + this.options.image;
	if (this.options.className) { JAK.DOM.addClass(this.dom.container,this.options.className); }
}

JAK.EditorControl.Dummy.prototype.disable = function(){}
/* --- */

/* click action */
/**
 * @class
 * @augments JAK.EditorControl
 */
JAK.EditorControl.Interactive = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.Interactive",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl
});

JAK.EditorControl.Interactive.prototype._defaultOptions = function() {
	this.options = {
		image:"none.gif",
		text:""
	}
}

JAK.EditorControl.Interactive.prototype._build = function() {
	this.dom.container = JAK.cel("img", "button");
	this.dom.container.src = this.owner.options.imagePath + this.options.image;
	this.ec.push(JAK.Events.addListener(this.dom.container,"click",this,"_click",false,true));
	if (this.options.text[0]) { this.dom.container.title = this.options.text[0]; }
}

JAK.EditorControl.Interactive.prototype._click = function(e, elm) {
	JAK.Events.cancelDef(e);
	if (this.enabled) { this._clickAction(e); }
}

JAK.EditorControl.Interactive.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
}

JAK.EditorControl.Interactive.prototype._clickAction = function(e) {}

/* --- */

/* exec command on action */
/**
 * @class
 * @augments JAK.EditorControl.Interactive
 */
JAK.EditorControl.OneStateButton = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.OneStateButton",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.Interactive
});

JAK.EditorControl.OneStateButton.prototype._clickAction = function() {
	if (!this.options.command) { return; }
	this.owner.commandExec(this.options.command);
}

JAK.EditorControl.OneStateButton.prototype._refresh = function() {
	if (!this.options.command) { return; }
	var state = this.owner.commandQuerySupported(this.options.command);
	if (state == this.enabled) { return; }
	if (state) { this.enable(); } else { this.disable(); }
}

/* --- */

/* change state on refresh */
/**
 * @class
 * @augments JAK.EditorControl.Interactive
 */
JAK.EditorControl.TwoStateButton = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.TwoStateButton",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.Interactive
});

JAK.EditorControl.TwoStateButton.prototype._clickAction = function() {
	if (!this.options.command) { return; }
	this.owner.commandExec(this.options.command);
}

JAK.EditorControl.TwoStateButton.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
	this.state = 0;
}

JAK.EditorControl.TwoStateButton.prototype._toggleState = function(state) {
	this.state = state;
	if (this.state) {
		JAK.DOM.addClass(this.dom.container,"pressed");
	} else {
		JAK.DOM.removeClass(this.dom.container,"pressed");
	}
}

JAK.EditorControl.TwoStateButton.prototype.refresh = function() {
	if (!this.options.command) { return; }

	var state = this.owner.commandQuerySupported(this.options.command);
	if (state != this.enabled) { 
		if (state) { this.enable(); } else { this.disable(); }
	}
	
	var s = this.owner.commandQueryState(this.options.command);
	s = (s ? 1 : 0);
	if (s != this.state) { this._toggleState(s); }
}

/* --- */

/* ask, then insert/edit image */
/**
 * @class
 * @augments JAK.EditorControl.TwoStateButton
 */
JAK.EditorControl.InsertImage = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.InsertImage",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TwoStateButton
});

JAK.EditorControl.InsertImage.prototype.refresh = function() {
	var elm = this.owner.getSelectedNode();
	var state = (elm.tagName && elm.tagName.toLowerCase() == "img" ? 1 : 0);
	this._toggleState(state);
}

JAK.EditorControl.InsertImage.prototype._clickAction = function() {
	if (this.state) { /* at image - change url */
		var elm = this.owner.getSelectedNode();
		var url = prompt(this.options.text[1],elm.src);
		if (url) { elm.src = url; }
	} else { /* insert image */
		var url = prompt(this.options.text[1],"http://");
		if (url) { this.owner.commandExec("insertimage",url); }
	}
}

/* --- */

/* select from some options */
/**
 * @class
 * @augments JAK.EditorControl.Interactive
 */
JAK.EditorControl.Select = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.Select",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.Interactive
});

JAK.EditorControl.Select.prototype._defaultOptions = function() {
	this.options = {
		text:"",
		command:"",
		options:[]
	}
}

JAK.EditorControl.Select.prototype._build = function() {
	this.dom.container = JAK.cel("span", "select");
	this.dom.content = JAK.mel("div", {className:"options"}, {position:"absolute",zIndex:10});
	this.dom.opts = [];
	
	this.dom.container.innerHTML = this.options.text[0];

	for (var i=0;i<this.options.options.length;i++) {
		var o = this.options.options[i];
		var div = JAK.cel("div", "option");
		this.dom.opts.push(div);
		this.ec.push(JAK.Events.addListener(div,"click",this,"_optionClick",false,true));
		div.innerHTML = o.innerHTML;
		this.dom.content.appendChild(div);
		this._addMouseEvents(div);
	}
	
	this.owner._lock(this.dom.content);
	this._addMouseEvents(this.dom.container);
	this.ec.push(JAK.Events.addListener(this.dom.container,"click",this,"_click",false,true));
	this.ec.push(JAK.Events.addListener(this.dom.content,"mousedown",JAK.Events,"cancelDef",false,true));
}

JAK.EditorControl.Select.prototype._init = function() {
	this.state = 0;
	this.widthCounted = false;
}

JAK.EditorControl.Select.prototype.show = function() {
	JAK.EditorControl.Select.active = this;
	this.state = 1;
	this.owner.dom.controlBox.appendChild(this.dom.content);
	/* position */
	var pos = JAK.DOM.getPortBoxPosition(this.dom.container);
	var pos2 = JAK.DOM.getPortBoxPosition(this.owner.dom.controlBox);
	pos.left -= pos2.left;
	pos.top -= pos2.top + 1;
	
	this.dom.content.style.left = pos.left+"px";
	this.dom.content.style.top = (pos.top + this.dom.container.offsetHeight) + "px";
	
	if (!this.widthCounted) {
		var w = this.dom.content.offsetWidth;
		for (var i=0;i<this.dom.opts.length;i++) {
			this.dom.opts[i].style.width = w+"px";
		}
		this.widthCounted = true;
	}
}

JAK.EditorControl.Select.prototype.hide = function() {
	JAK.EditorControl.Select.active = false;
	this.state = 0;
	for (var i=0;i<this.dom.opts.length;i++) {
		JAK.DOM.removeClass(this.dom.opts[i],"mouseover");
	}
	this.dom.content.parentNode.removeChild(this.dom.content);
}

JAK.EditorControl.Select.prototype._click = function(e, elm) {
	if (!this.enabled) { return; }
	JAK.Events.stopEvent(e);
	if (JAK.EditorControl.Select.active == this) {
		JAK.EditorControl.Select.active = false;
	}
	JAK.EditorControl.Select.checkHide(e, elm);
	if (this.state) {
		this.hide();
	} else {
		this.show();
	}
}

JAK.EditorControl.Select.active = false;
JAK.EditorControl.Select.checkHide = function(e, elm) {
	if (JAK.EditorControl.Select.active) { JAK.EditorControl.Select.active.hide(); }
}

JAK.Events.addListener(document,"click",window,JAK.EditorControl.Select.checkHide);
	
JAK.EditorControl.Select.prototype._optionClick = function(e, elm) {
	var index = -1;
	for (var i=0;i<this.dom.opts.length;i++) {
		if (this.dom.opts[i] == elm) { index = i; }
	}
	
	this.hide();
	var val = this.options.options[index].value;
	//@note aichi: v IE je nutne pridat <> pouze k formatovacimu prikazu (h1-6,p,div) a ne velikosti a typu pisma
	if (JAK.Browser.client == "ie" && !(val.match(/</)) && this.options.command == 'formatblock') {
		val = "<"+val+">";
	}
	this.owner.commandExec(this.options.command, val);
}

/* --- */

/* ask, then insert/edit link */
/**
 * @class
 * @augments JAK.EditorControl.TwoStateButton
 */
JAK.EditorControl.InsertLink = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.InsertLink",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TwoStateButton
});

JAK.EditorControl.InsertLink.prototype._findLink = function() {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "a") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

JAK.EditorControl.InsertLink.prototype.refresh = function() {
	var a = this._findLink();
	var state = (a ? 1 : 0);
	this._toggleState(state);
}

JAK.EditorControl.InsertLink.prototype._clickAction = function() {
	if (this.state) { /* at link - change href */
		var a = this._findLink();
		var url = prompt(this.options.text[1],a.href);
		if (url) { a.href = url; }
	} else { /* insert link */
		var url = prompt(this.options.text[1],"http://");
		if (url) { this.owner.commandExec("createlink",url); }
	}
}

/* --- */

/* remove link */
/**
 * @class
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.Unlink = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.Unlink",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.OneStateButton
});

JAK.EditorControl.Unlink.prototype._findLink = function() {
	var elm = this.owner.getSelectedNode();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "a") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

JAK.EditorControl.Unlink.prototype.refresh = function() {
	var a = this._findLink();
	if (a != this.enabled) { 
		if (a) { this.enable(); } else { this.disable(); }
	}
}

JAK.EditorControl.Unlink.prototype._clickAction = function() {
	var a = this._findLink();
	if (!a) { return; }
	this.owner.instance.saveRange();
	this.owner.selectNode(a);
	this.owner.commandExec("unlink");
	this.owner.instance.loadRange();
}

/* --- */

/**
 * @class
 * @group jak-widgets
 */
JAK.EditorControl.Window = JAK.ClassMaker.makeInterface({
	NAME: "JAK.EditorControl.Window",
	VERSION: "2.0"
});

JAK.EditorControl.Window.prototype.openWindow = function(url, optObj) {
	var options = {
		left:null,
		top:null,
		toolbar:"no",
		status:"yes",
		location:"no",
		scrollbars:"no",
		width:null,
		height:null,
		resizable:"yes"
	}
	for (var p in optObj) { options[p] = optObj[p]; }
	
	var arr = [];
	for (var p in options) {
		var val = options[p];
		if (val !== null) { arr.push(p+"="+val); }
	}
	var w = window.open(url,"_blank",arr.join(","));
	return w;
}

/* --- */

/* ask, then insert/edit link */
JAK.EditorControl.AdvancedLink = JAK.ClassMaker.makeClass({
	NAME: "AdvancedLink",
	VERSION: "1.0",
	EXTEND: JAK.EditorControl.InsertLink,
	IMPLEMENT: JAK.EditorControl.Window
});

JAK.EditorControl.AdvancedLink.prototype._clickAction = function() {
	var url = "";
	var blank = false;
	if (this.state) {
		var a = this._findLink();
		if (a.href) { url = a.href; }
		if (a.target == "_blank") { blank = true; }
	}

	var html = "<html><head><title>"+this.options.text[0]+"</title></head><body>";
	html += '<label for="url">'+this.options.text[1]+'</label> <input type="text" id="url" value="'+url+'" /><br/>';
	html += '<label for="blank">'+this.options.text[2]+'</label> <input type="checkbox" '+(blank ? 'checked="checked"' : '')+ ' id="blank" /><br/>';
	html += '<input type="button" id="btn" value="OK" />';
	html += "</body></html>";
	
	var opts = {
		width:300,
		height:100
	}
	if (screen) {
		var l = Math.round((screen.width - opts.width)/2);
		var t = Math.round((screen.height - opts.height)/2);
		opts.left = l;
		opts.top = t;
	}
	
	
	this.win = this.openWindow("",opts);
	this.win.document.write(html);
	this.win.document.close();
	
	var btn = this.win.document.getElementById("btn");
	JAK.Events.addListener(btn, "click", this, "_feedback");
}

JAK.EditorControl.AdvancedLink.prototype._feedback = function() {
	var url = this.win.document.getElementById("url").value;
	var blank = this.win.document.getElementById("blank").checked;
	
	this.win.close();
	if (!url) { return; }

	if (this.state) { /* at link - change href */
		var a = this._findLink();
		if (a) { 
			a.href = url; 
			a.target = (blank ? "_blank" : "");
		}
	} else { /* insert image */
		this.owner.commandExec("createlink",url);
		var a = this._findLink();
		if (a) { 
			a.href = url; 
			a.target = (blank ? "_blank" : "");
		}
	}
}

/* --- */

/**
 * @class
 * @augments JAK.EditorControl.OneStateButton
 */
JAK.EditorControl.Color = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.Color",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.OneStateButton
});

JAK.EditorControl.Color.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
	this.picker = (JAK.ColorPicker ? new JAK.ColorPicker(this.options.colorPickerOptions) : false);
	if (this.picker) {
		this.owner._lock(this.picker.dom.container); /* tezkej hack pro IE */
		this.addListener("colorselect","_selectColor",this.picker);
	}
	this._selectColor = this._selectColor.bind(this);
}

JAK.EditorControl.Color.prototype._clickAction = function(e,elm) {
	this.owner.getInstance().saveRange();
	if (this.picker) {
		var scroll = JAK.DOM.getScrollPos();
		this.picker.pick(scroll.x+e.clientX-20,scroll.y+e.clientY-20,false,false);
	} else {
		var color = prompt(this.options.text[1]);
		if (color) { this._selectColor(color); }
	}
}

JAK.EditorControl.Color.prototype._selectColor = function(color) {
	var c = (this.picker ? this.picker.getColor() : color);
	this.owner.getInstance().loadRange();
	if (this.options.command.toLowerCase() == "backcolor" && JAK.Browser.client != "ie") {
		this.owner.commandExec("hilitecolor", c); 
	} else {
		this.owner.commandExec(this.options.command, c); 
	}
}

/* --- */

/* edit html in textarea */
/**
 * @class
 * @augments JAK.EditorControl.TwoStateButton
 */
JAK.EditorControl.HTML = JAK.ClassMaker.makeClass({
	NAME: "JAK.EditorControl.HTML",
	VERSION: "2.0",
	EXTEND: JAK.EditorControl.TwoStateButton
});

JAK.EditorControl.HTML.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
	this.state = 0;
}

JAK.EditorControl.HTML.prototype.show = function() {
	this._toggleState(1);
	var w = this.owner.width-4;
	var h = this.owner.height-4;
	this.ta = JAK.mel("textarea", null, {width:w+"px",height:h+"px"});
	this.ta.value = this.owner.getContent();
	this.elm = this.owner.dom.container.insertBefore(this.ta,this.owner.dom.content);
	this.owner.dom.content.style.display = "none";
	
	for (var i=0;i<this.owner.controls.length;i++) {
		var c = this.owner.controls[i];
		if (c != this) { c.disable(); }
	}
}

JAK.EditorControl.HTML.prototype.hide = function() {
	this._toggleState(0);
	this.owner.setContent(this.ta.value);
	this.ta.parentNode.removeChild(this.ta);
	this.owner.dom.content.style.display = "block";
	
	for (var i=0;i<this.owner.controls.length;i++) {
		var c = this.owner.controls[i];
		c.enable();
	}
	
	this.owner.refresh();
	
}

JAK.EditorControl.HTML.prototype.submit = function() {
	if (this.state) {
		this.owner.setContent(this.ta.value);
		this.hide();
	}
}

JAK.EditorControl.HTML.prototype._clickAction = function() {
	if (this.state) {
		this.hide();
	} else {
		this.show();
	}
}


/* ---------------------------------------------------------------- */

JAK.EditorControls["separator"] = {object:JAK.EditorControl.Dummy, image:"separator.gif", className:"separator"};
JAK.EditorControls["br"] = {object:JAK.EditorControl.Dummy, image:"blank.gif", className:"br"};

JAK.EditorControls["line"] = {object:JAK.EditorControl.OneStateButton, command:"inserthorizontalrule", image:"line.gif"};
JAK.EditorControls["indent"] = {object:JAK.EditorControl.OneStateButton, command:"indent", image:"indent.gif"};
JAK.EditorControls["outdent"] = {object:JAK.EditorControl.OneStateButton, command:"outdent", image:"outdent.gif"};

JAK.EditorControls["bold"] = {object:JAK.EditorControl.TwoStateButton, command:"bold", image:"bold.gif"};
JAK.EditorControls["italic"] = {object:JAK.EditorControl.TwoStateButton, command:"italic", image:"italic.gif"};
JAK.EditorControls["underline"] = {object:JAK.EditorControl.TwoStateButton, command:"underline", image:"underline.gif"};
JAK.EditorControls["justifycenter"] = {object:JAK.EditorControl.TwoStateButton, command:"justifycenter", image:"justifycenter.gif"};
JAK.EditorControls["justifyleft"] = {object:JAK.EditorControl.TwoStateButton, command:"justifyleft", image:"justifyleft.gif"};
JAK.EditorControls["justifyright"] = {object:JAK.EditorControl.TwoStateButton, command:"justifyright", image:"justifyright.gif"};
JAK.EditorControls["justifyfull"] = {object:JAK.EditorControl.TwoStateButton, command:"justifyfull", image:"justifyfull.gif"};
JAK.EditorControls["strikethrough"] = {object:JAK.EditorControl.TwoStateButton, command:"strikethrough", image:"strikethrough.gif"};
JAK.EditorControls["superscript"] = {object:JAK.EditorControl.TwoStateButton, command:"superscript", image:"superscript.gif"};
JAK.EditorControls["subscript"] = {object:JAK.EditorControl.TwoStateButton, command:"subscript", image:"subscript.gif"};
JAK.EditorControls["orderedlist"] = {object:JAK.EditorControl.TwoStateButton, command:"insertorderedlist", image:"orderedlist.gif"};
JAK.EditorControls["unorderedlist"] = {object:JAK.EditorControl.TwoStateButton, command:"insertunorderedlist", image:"unorderedlist.gif"};

JAK.EditorControls["image"] = {object:JAK.EditorControl.InsertImage, image:"image.gif"};
JAK.EditorControls["link"] = {object:JAK.EditorControl.InsertLink, image:"link.gif"};
JAK.EditorControls["unlink"] = {object:JAK.EditorControl.Unlink, image:"unlink.gif"};
JAK.EditorControls["advlink"] = {object:JAK.EditorControl.AdvancedLink, image:"link.gif"};
JAK.EditorControls["forecolor"] = {object:JAK.EditorControl.Color, command:"forecolor", image:"forecolor.gif", colorPickerOptions:{}};
JAK.EditorControls["backcolor"] = {object:JAK.EditorControl.Color, command:"backcolor", image:"backcolor.gif", colorPickerOptions:{}};
JAK.EditorControls["html"] = {object:JAK.EditorControl.HTML, image:"html.gif"};

var obj = [
	{innerHTML:"<font size='1'>1&nbsp;(8pt)</font>", value:"1"},
	{innerHTML:"<font size='2'>2&nbsp;(10pt)</font>", value:"2"},
	{innerHTML:"<font size='3'>3&nbsp;(12pt)</font>", value:"3"},
	{innerHTML:"<font size='4'>4&nbsp;(14pt)</font>", value:"4"},
	{innerHTML:"<font size='5'>5&nbsp;(18pt)</font>", value:"5"},
	{innerHTML:"<font size='6'>6&nbsp;(24pt)</font>", value:"6"},
	{innerHTML:"<font size='7'>7&nbsp;(36pt)</font>", value:"7"}
]
JAK.EditorControls["fontsize"] = {object:JAK.EditorControl.Select, command:"fontsize", options:obj};

var obj = [
	{innerHTML:"<font face='arial'>Arial</font>", value:"arial"},
	{innerHTML:"<font face='comic sans ms'>Comic Sans</font>", value:"comic sans ms"},
	{innerHTML:"<font face='courier new'>Courier New</font>", value:"courier new"},
	{innerHTML:"<font face='georgia'>Georgia</font>", value:"georgia"},
	{innerHTML:"<font face='helvetica'>Helvetica</font>", value:"helvetica"},
	{innerHTML:"<font face='impact'>Impact</font>", value:"impact"},
	{innerHTML:"<font face='times new roman'>Times New</font>", value:"times new roman"},
	{innerHTML:"<font face='trebuchet'>Trebuchet</font>", value:"trebuchet"},
	{innerHTML:"<font face='verdana'>Verdana</font>", value:"verdana"}
]
JAK.EditorControls["fontname"] = {object:JAK.EditorControl.Select, command:"fontname", options:obj};

var obj = [
	{innerHTML:"<h1 style='margin:0px;padding:0px;'>Heading 1</h1>", value:"h1"},
	{innerHTML:"<h2 style='margin:0px;padding:0px;'>Heading 2</h2>", value:"h2"},
	{innerHTML:"<h3 style='margin:0px;padding:0px;'>Heading 3</h3>", value:"h3"},
	{innerHTML:"<h4 style='margin:0px;padding:0px;'>Heading 4</h4>", value:"h4"},
	{innerHTML:"<h5 style='margin:0px;padding:0px;'>Heading 5</h5>", value:"h5"},
	{innerHTML:"<h6 style='margin:0px;padding:0px;'>Heading 6</h6>", value:"h6"},
	{innerHTML:"<p style='margin:0px;padding:0px;'>Paragraph</p>", value:"p"},
	{innerHTML:"<pre style='margin:0px;padding:0px;'>Pre</pre>", value:"pre"}
]
JAK.EditorControls["format"] = {object:JAK.EditorControl.Select, command:"formatblock", options:obj};
