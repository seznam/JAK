/* list of available controls */
SZN.EditorControls = SZN.ClassMaker.makeClass({
	NAME: "EditorControls",
	VERSION: "1.0",
	CLASS: "static"
});

/* basic control: enable/disable, hover */
SZN.EditorControl = SZN.ClassMaker.makeClass({
	NAME: "EditorControl",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.EditorControl.prototype.$constructor = function(owner, options) {
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

SZN.EditorControl.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	this.dom.container.parentNode.removeChild(this.dom.container);
}

SZN.EditorControl.prototype.refresh = function() {}

SZN.EditorControl.prototype.submit = function() {}

SZN.EditorControl.prototype.enable = function() { 
	this.enabled = true; 
	SZN.Dom.removeClass(this.dom.container,"disabled");
}

SZN.EditorControl.prototype.disable = function() { 
	this.enabled = false; 
	SZN.Dom.addClass(this.dom.container,"disabled");
}

SZN.EditorControl.prototype._build = function() {
	this.dom.container = SZN.cEl("div");
}

SZN.EditorControl.prototype._init = function() {}

SZN.EditorControl.prototype._defaultOptions = function() {}

SZN.EditorControl.prototype._addMouseEvents = function(elm) {
	this.ec.push(SZN.Events.addListener(elm,"mouseover",this,"_mouseover",false,true));
	this.ec.push(SZN.Events.addListener(elm,"mouseout",this,"_mouseout",false,true));
}

SZN.EditorControl.prototype._mouseover = function(e, elm) {
	if (this.enabled) {	SZN.Dom.addClass(elm,"mouseover"); }
}

SZN.EditorControl.prototype._mouseout = function(e, elm) {
	if (this.enabled) { SZN.Dom.removeClass(elm,"mouseover"); }
}

/* --- */

SZN.EditorControl.Dummy = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.Dummy",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl,
	CLASS: "class"
});

SZN.EditorControl.Dummy.prototype._build = function() {
	this.dom.container = SZN.cEl("img");
	this.dom.container.src = this.owner.options.imagePath + this.options.image;
	if (this.options.className) { SZN.Dom.addClass(this.dom.container,this.options.className); }
}

SZN.EditorControl.Dummy.prototype.disable = function(){}
/* --- */

/* click action */
SZN.EditorControl.Interactive = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.Interactive",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl,
	CLASS: "class"
});

SZN.EditorControl.Interactive.prototype._defaultOptions = function() {
	this.options = {
		image:"none.gif",
		text:""
	}
}

SZN.EditorControl.Interactive.prototype._build = function() {
	this.dom.container = SZN.cEl("img",false,"button");
	this.dom.container.src = this.owner.options.imagePath + this.options.image;
	this.ec.push(SZN.Events.addListener(this.dom.container,"click",this,"_click",false,true));
	if (this.options.text[0]) { this.dom.container.title = this.options.text[0]; }
}

SZN.EditorControl.Interactive.prototype._click = function(e, elm) {
	SZN.Events.cancelDef(e);
	if (this.enabled) { this._clickAction(e); }
}

SZN.EditorControl.Interactive.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
}

SZN.EditorControl.Interactive.prototype._clickAction = function(e) {}

/* --- */

/* exec command on action */
SZN.EditorControl.OneStateButton = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.OneStateButton",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.Interactive,
	CLASS: "class"
});

SZN.EditorControl.OneStateButton.prototype._clickAction = function() {
	if (!this.options.command) { return; }
	this.owner.commandExec(this.options.command);
}

SZN.EditorControl.OneStateButton.prototype._refresh = function() {
	if (!this.options.command) { return; }
	var state = this.owner.commandQuerySupported(this.options.command);
	if (state == this.enabled) { return; }
	if (state) { this.enable(); } else { this.disable(); }
}

/* --- */

/* change state on refresh */
SZN.EditorControl.TwoStateButton = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.TwoStateButton",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.Interactive,
	CLASS: "class"
});

SZN.EditorControl.TwoStateButton.prototype._clickAction = function() {
	if (!this.options.command) { return; }
	this.owner.commandExec(this.options.command);
}

SZN.EditorControl.TwoStateButton.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
	this.state = 0;
}

SZN.EditorControl.TwoStateButton.prototype._toggleState = function(state) {
	this.state = state;
	if (this.state) {
		SZN.Dom.addClass(this.dom.container,"pressed");
	} else {
		SZN.Dom.removeClass(this.dom.container,"pressed");
	}
}

SZN.EditorControl.TwoStateButton.prototype.refresh = function() {
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
SZN.EditorControl.InsertImage = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.InsertImage",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TwoStateButton,
	CLASS: "class"
});

SZN.EditorControl.InsertImage.prototype.refresh = function() {
	var elm = this.owner.getFocusElement();
	var state = (elm.tagName && elm.tagName.toLowerCase() == "img" ? 1 : 0);
	this._toggleState(state);
}

SZN.EditorControl.InsertImage.prototype._clickAction = function() {
	if (this.state) { /* at image - change url */
		var elm = this.owner.getFocusElement();
		var url = prompt(this.options.text[1],elm.src);
		if (url) { elm.src = url; }
	} else { /* insert image */
		var url = prompt(this.options.text[1],"http://");
		if (url) { this.owner.commandExec("insertimage",url); }
	}
}

/* --- */

/* select from some options */
SZN.EditorControl.Select = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.Select",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.Interactive,
	CLASS: "class"
});

SZN.EditorControl.Select.prototype._defaultOptions = function() {
	this.options = {
		text:"",
		command:"",
		options:[]
	}
}

SZN.EditorControl.Select.prototype._build = function() {
	this.dom.container = SZN.cEl("span",false,"select");
	this.dom.content = SZN.cEl("div",false,"options",{position:"absolute",zIndex:10});
	this.dom.opts = [];
	
	this.dom.container.innerHTML = this.options.text[0];

	for (var i=0;i<this.options.options.length;i++) {
		var o = this.options.options[i];
		var div = SZN.cEl("div",false,"option");
		this.dom.opts.push(div);
		this.ec.push(SZN.Events.addListener(div,"click",this,"_optionClick",false,true));
		div.innerHTML = o.innerHTML;
		this.dom.content.appendChild(div);
		this._addMouseEvents(div);
	}
	
	this.owner._lock(this.dom.content);
	this._addMouseEvents(this.dom.container);
	this.ec.push(SZN.Events.addListener(this.dom.container,"click",this,"_click",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.content,"mousedown",SZN.Events,"cancelDef",false,true));
}

SZN.EditorControl.Select.prototype._init = function() {
	this.state = 0;
	this.widthCounted = false;
}

SZN.EditorControl.Select.prototype.show = function() {
	SZN.EditorControl.Select.active = this;
	this.state = 1;
	this.owner.dom.container.appendChild(this.dom.content);
	/* position */
	var pos = SZN.Dom.getFullBoxPosition(this.dom.container);
	var pos2 = SZN.Dom.getFullBoxPosition(this.owner.dom.container);
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

SZN.EditorControl.Select.prototype.hide = function() {
	SZN.EditorControl.Select.active = false;
	this.state = 0;
	for (var i=0;i<this.dom.opts.length;i++) {
		SZN.Dom.removeClass(this.dom.opts[i],"mouseover");
	}
	this.dom.content.parentNode.removeChild(this.dom.content);
}

SZN.EditorControl.Select.prototype._click = function(e, elm) {
	if (!this.enabled) { return; }
	SZN.Events.stopEvent(e);
	if (SZN.EditorControl.Select.active == this) {
		SZN.EditorControl.Select.active = false;
	}
	SZN.EditorControl.Select.checkHide(e, elm);
	if (this.state) {
		this.hide();
	} else {
		this.show();
	}
}

SZN.EditorControl.Select.active = false;
SZN.EditorControl.Select.checkHide = function(e, elm) {
	if (SZN.EditorControl.Select.active) { SZN.EditorControl.Select.active.hide(); }
}

SZN.Events.addListener(document,"click",window,SZN.EditorControl.Select.checkHide);
	
SZN.EditorControl.Select.prototype._optionClick = function(e, elm) {
	var index = -1;
	for (var i=0;i<this.dom.opts.length;i++) {
		if (this.dom.opts[i] == elm) { index = i; }
	}
	
	this.hide();
	this.owner.commandExec(this.options.command, this.options.options[index].value);
}

/* --- */

/* ask, then insert/edit link */
SZN.EditorControl.InsertLink = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.InsertLink",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TwoStateButton,
	CLASS: "class"
});

SZN.EditorControl.InsertLink.prototype.findLink = function() {
	var elm = this.owner.getFocusElement();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "a") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

SZN.EditorControl.InsertLink.prototype.refresh = function() {
	var a = this.findLink();
	var state = (a ? 1 : 0);
	this._toggleState(state);
}

SZN.EditorControl.InsertLink.prototype._clickAction = function() {
	if (this.state) { /* at link - change href */
		var a = this.findLink();
		var url = prompt(this.options.text[1],a.href);
		if (url) { a.href = url; }
	} else { /* insert image */
		var url = prompt(this.options.text[1],"http://");
		if (url) { this.owner.commandExec("createlink",url); }
	}
}

/* --- */

/* remove link */
SZN.EditorControl.Unlink = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.Unlink",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	CLASS: "class"
});

SZN.EditorControl.Unlink.prototype.findLink = function() {
	var elm = this.owner.getFocusElement();
	do {
		if (elm.tagName && elm.tagName.toLowerCase() == "a") { return elm; }
		elm = elm.parentNode;
	} while (elm);
	return false;
}

SZN.EditorControl.Unlink.prototype.refresh = function() {
	var a = this.findLink();
	if (a != this.enabled) { 
		if (a) { this.enable(); } else { this.disable(); }
	}
}

SZN.EditorControl.Unlink.prototype._clickAction = function() {
	var a = this.findLink();
	if (!a) { return; }
	this.owner.instance.saveRange();
	this.owner.selectNode(a);
	this.owner.commandExec("unlink");
	this.owner.instance.loadRange();
}

/* --- */

SZN.EditorControl.Color = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.Color",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.OneStateButton,
	CLASS: "class"
});

SZN.EditorControl.Color.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
	this.picker = (SZN.ColorPicker ? new SZN.ColorPicker(this.options.colorPickerOptions) : false);
	this._selectColor = SZN.bind(this,this._selectColor);
}


SZN.EditorControl.Color.prototype._clickAction = function(e,elm) {
	if (this.picker) {
		this.picker.pick(e.clientX-20,e.clientY-20,false,this._selectColor);
	} else {
		var color = prompt(this.options.text[1]);
		if (color) { this._selectColor(color); }
	}
}

SZN.EditorControl.Color.prototype._selectColor = function(color) {
	var c = (typeof(color) == "object" ? color.x : color);
	if (this.options.command.toLowerCase() == "backcolor" && SZN.Browser.client != "ie") {
		this.owner.commandExec("hilitecolor", c); 
	} else {
		this.owner.commandExec(this.options.command, c); 
	}
}

/* --- */

/* edit html in textarea */
SZN.EditorControl.HTML = SZN.ClassMaker.makeClass({
	NAME: "EditorControl.HTML",
	VERSION: "1.0",
	EXTEND: SZN.EditorControl.TwoStateButton,
	CLASS: "class"
});

SZN.EditorControl.HTML.prototype._init = function() {
	this._addMouseEvents(this.dom.container);
	this.state = 0;
}

SZN.EditorControl.HTML.prototype.show = function() {
	this._toggleState(1);
	var w = this.owner.width-4;
	var h = this.owner.height-4;
	this.ta = SZN.cEl("textarea",false,false,{width:w+"px",height:h+"px"});
	this.ta.value = this.owner.getContent();
	this.elm = this.owner.dom.container.insertBefore(this.ta,this.owner.dom.content);
	this.owner.dom.content.style.display = "none";
	
	for (var i=0;i<this.owner.controls.length;i++) {
		var c = this.owner.controls[i];
		if (c != this) { c.disable(); }
	}
}

SZN.EditorControl.HTML.prototype.hide = function() {
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

SZN.EditorControl.HTML.prototype.submit = function() {
	if (this.state) {
		this.owner.setContent(this.ta.value);
		this.hide();
	}
}

SZN.EditorControl.HTML.prototype._clickAction = function() {
	if (this.state) {
		this.hide();
	} else {
		this.show();
	}
}

/* --- */

/* ---------------------------------------------------------------- */

SZN.EditorControls["separator"] = {object:SZN.EditorControl.Dummy, image:"separator.gif", className:"separator"};
SZN.EditorControls["br"] = {object:SZN.EditorControl.Dummy, image:"blank.gif", className:"br"};

SZN.EditorControls["line"] = {object:SZN.EditorControl.OneStateButton, command:"inserthorizontalrule", image:"line.gif"};
SZN.EditorControls["indent"] = {object:SZN.EditorControl.OneStateButton, command:"indent", image:"indent.gif"};
SZN.EditorControls["outdent"] = {object:SZN.EditorControl.OneStateButton, command:"outdent", image:"outdent.gif"};

SZN.EditorControls["bold"] = {object:SZN.EditorControl.TwoStateButton, command:"bold", image:"bold.gif"};
SZN.EditorControls["italic"] = {object:SZN.EditorControl.TwoStateButton, command:"italic", image:"italic.gif"};
SZN.EditorControls["underline"] = {object:SZN.EditorControl.TwoStateButton, command:"underline", image:"underline.gif"};
SZN.EditorControls["justifycenter"] = {object:SZN.EditorControl.TwoStateButton, command:"justifycenter", image:"justifycenter.gif"};
SZN.EditorControls["justifyleft"] = {object:SZN.EditorControl.TwoStateButton, command:"justifyleft", image:"justifyleft.gif"};
SZN.EditorControls["justifyright"] = {object:SZN.EditorControl.TwoStateButton, command:"justifyright", image:"justifyright.gif"};
SZN.EditorControls["justifyfull"] = {object:SZN.EditorControl.TwoStateButton, command:"justifyfull", image:"justifyfull.gif"};
SZN.EditorControls["strikethrough"] = {object:SZN.EditorControl.TwoStateButton, command:"strikethrough", image:"strikethrough.gif"};
SZN.EditorControls["superscript"] = {object:SZN.EditorControl.TwoStateButton, command:"superscript", image:"superscript.gif"};
SZN.EditorControls["subscript"] = {object:SZN.EditorControl.TwoStateButton, command:"subscript", image:"subscript.gif"};
SZN.EditorControls["orderedlist"] = {object:SZN.EditorControl.TwoStateButton, command:"insertorderedlist", image:"orderedlist.gif"};
SZN.EditorControls["unorderedlist"] = {object:SZN.EditorControl.TwoStateButton, command:"insertunorderedlist", image:"unorderedlist.gif"};

SZN.EditorControls["image"] = {object:SZN.EditorControl.InsertImage, image:"image.gif"};
SZN.EditorControls["link"] = {object:SZN.EditorControl.InsertLink, image:"link.gif"};
SZN.EditorControls["unlink"] = {object:SZN.EditorControl.Unlink, image:"unlink.gif"};
SZN.EditorControls["forecolor"] = {object:SZN.EditorControl.Color, command:"forecolor", image:"forecolor.gif", colorPickerOptions:{}};
SZN.EditorControls["backcolor"] = {object:SZN.EditorControl.Color, command:"backcolor", image:"backcolor.gif", colorPickerOptions:{}};
SZN.EditorControls["html"] = {object:SZN.EditorControl.HTML, image:"html.gif"};

var obj = [
	{innerHTML:"<font size='1'>1&nbsp;(8pt)</font>", value:"1"},
	{innerHTML:"<font size='2'>2&nbsp;(10pt)</font>", value:"2"},
	{innerHTML:"<font size='3'>3&nbsp;(12pt)</font>", value:"3"},
	{innerHTML:"<font size='4'>4&nbsp;(14pt)</font>", value:"4"},
	{innerHTML:"<font size='5'>5&nbsp;(18pt)</font>", value:"5"},
	{innerHTML:"<font size='6'>6&nbsp;(24pt)</font>", value:"6"},
	{innerHTML:"<font size='7'>7&nbsp;(36pt)</font>", value:"7"}
]
SZN.EditorControls["fontsize"] = {object:SZN.EditorControl.Select, command:"fontsize", options:obj};

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
SZN.EditorControls["fontname"] = {object:SZN.EditorControl.Select, command:"fontname", options:obj};

var obj = [
	{innerHTML:"<h1 style='margin:0px;padding:0px;'>Heading 1</h1>", value:"<h1>"},
	{innerHTML:"<h2 style='margin:0px;padding:0px;'>Heading 2</h2>", value:"<h2>"},
	{innerHTML:"<h3 style='margin:0px;padding:0px;'>Heading 3</h3>", value:"<h3>"},
	{innerHTML:"<h4 style='margin:0px;padding:0px;'>Heading 4</h4>", value:"<h4>"},
	{innerHTML:"<h5 style='margin:0px;padding:0px;'>Heading 5</h5>", value:"<h5>"},
	{innerHTML:"<h6 style='margin:0px;padding:0px;'>Heading 6</h6>", value:"<h6>"},
	{innerHTML:"<p style='margin:0px;padding:0px;'>Paragraph</p>", value:"<p>"},
	{innerHTML:"<pre style='margin:0px;padding:0px;'>Pre</pre>", value:"<pre>"}
]
SZN.EditorControls["format"] = {object:SZN.EditorControl.Select, command:"formatblock", options:obj};
