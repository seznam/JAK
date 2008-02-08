/**
 * @overview kalendar
 * @version 2.0
 * @author zara
*/   

/**
 * @class WYSIWYG Editor
 * Pokud pouzivame i ColorPicker, bude tento vyuzit. Jeho optiony patri do vlastnosti 'colorPickerOptions' v definici 
 * ovladacich prvku na barvu textu a/nebo pozadi.
 * @param {Node || String} id textarea, ktera ma byt editorem nahrazena
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>imagePath</em> - cesta k obrazkum s lomitkem na koncim, default "img/"</li>
 *   	<li><em>controls</em> - pole ovladacich prvku editoru</li>
 *   	<li><em>style</em> - objekt vychozich stylu</li>
 * @constructor
 */
SZN.Editor = SZN.ClassMaker.makeClass({
	NAME: "Editor",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.Editor.prototype.$constructor = function(id, opts) {
	if (SZN.Browser.client == "konqueror") { return; }

	/* init */
	this.options = {
		imagePath:"img/",
		controls:[],
		style:{}
	}
	for (var p in opts) { this.options[p] = opts[p]; }
	this.dom = {
		container:SZN.cEl("div",false,"editor",{position:"relative"})
	}
	this.ec = [];
	this.controls = [];
	
	this.dom.ta = SZN.gEl(id);
	this.width = this.dom.ta.width || this.dom.ta.clientWidth;
	this.height = this.dom.ta.height || this.dom.ta.clientHeight;
	if (!this.width || !this.height) { return; }
	this.dom.container.style.width = this.width+"px";
	

	/* construct */
	this.dom.ta.style.display = "none";
	this.dom.ta.parentNode.insertBefore(this.dom.container,this.dom.ta.nextSibling);
	this._buildControls();
	this._buildInstance(this.width,this.height);
	this._lock(this.dom.controls);
	
	/* insert initial text */
	this.setContent(this.dom.ta.value);
	if (this.dom.ta.form) {
		SZN.Events.addListener(this.dom.ta.form,"submit",this,"submit");
	}
	this.refresh();
}

SZN.Editor.prototype.$destructor = function() {
	for (var i=0;i<this.controls.length;i++) {
		this.controls[i].$destructor();
	}
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
}

SZN.Editor.prototype.insertContent = function(data) {
	this.instance.insertContent(data);
}

SZN.Editor.prototype.setContent = function(data) {
	this.instance.setContent(data);
}

SZN.Editor.prototype.getContent = function() {
	return this.instance.getContent();
}

SZN.Editor.prototype.submit = function() {
	for (var i=0;i<this.controls.length;i++) {
		this.controls[i].submit();
	}
	this.dom.ta.value = this.getContent();
}

SZN.Editor.prototype.commandExec = function(command, args) {
	if (SZN.Browser.client == "gecko" && command == "hilitecolor") {
		this.instance.commandExec("usecss",false);
		this.instance.commandExec(command, args);
		this.instance.commandExec("usecss",true);
	} else {
		if (this.instance.commandQuerySupported("stylewithcss")) { this.instance.commandExec("stylewithcss",false); }
		if (this.instance.commandQuerySupported("usecss")) { this.instance.commandExec("usecss",true); }
		this.instance.commandExec(command, args);
	}
	this.refresh();
}

SZN.Editor.prototype.commandQueryState = function(command) {
	return this.instance.commandQueryState(command);
}

SZN.Editor.prototype.commandQueryValue = function(command) {
	return this.instance.commandQueryValue(command);
}

SZN.Editor.prototype.commandQuerySupported = function(command) {
	return this.instance.commandQuerySupported(command);
}

SZN.Editor.prototype._buildControls = function() {
	this.dom.controls = SZN.cEl("div",false,"editor-controls");
	this.dom.container.appendChild(this.dom.controls);
	if (SZN.Browser.client != "opera") {
		this.ec.push(SZN.Events.addListener(this.dom.controls,"mousedown",this,"_cancelDef",false,true));
		this.ec.push(SZN.Events.addListener(this.dom.controls,"click",this,"_cancelDef",false,true));
	}
	for (var i=0;i<this.options.controls.length;i++) {
		var c = this.options.controls[i];
		if (!(c.type in SZN.EditorControls)) { continue; }
		var obj = SZN.EditorControls[c.type];
		
		var opts = {};
		for (var p in obj) { if (p != "object") { opts[p] = obj[p]; } }
		for (var p in c) { if (c != "type") { opts[p] = c[p]; } }
		
		var inst = new obj.object(this,opts);
		this.controls.push(inst);
		this.dom.controls.appendChild(inst.dom.container);
		if (obj.label) { inst.dom.container.title = obj.label; }
	}
}

SZN.Editor.prototype._buildInstance = function(w,h) {
	var p = 3;
	var width = w-2*p;
	var height = h-2*p;
	this.dom.content = SZN.cEl("div",false,"editor-content",{padding:p+"px",width:width+"px",height:height+"px",overflow:"auto",position:"relative"});
	this.dom.container.appendChild(this.dom.content);
	if (this.dom.content.contentEditable /*|| SZN.Browser.client == "opera"*/) {
		this.instance = new SZN.EditorInstance(this,w,height);
	} else {
		this.instance = new SZN.EditorInstanceIframe(this,w,height);
	}
	
	for (var p in this.options.style) {
		this.instance.elm.style[p] = this.options.style[p];
	}
	
	/* inherit styles 
	this.instance.elm.style.fontSize = SZN.Dom.getStyle(this.dom.ta,"fontSize");
	this.instance.elm.style.fontFamily = SZN.Dom.getStyle(this.dom.ta,"fontFamily");
	this.instance.elm.style.fontWeight = SZN.Dom.getStyle(this.dom.ta,"fontWeight");
	this.instance.elm.style.color = SZN.Dom.getStyle(this.dom.ta,"color");
	*/
	
	this.ec.push(SZN.Events.addListener(this.instance.elm,"click",this,"_click",false,true));
	this.ec.push(SZN.Events.addListener(this.instance.elm,"mouseup",this,"refresh",false,true));
	this.ec.push(SZN.Events.addListener(this.instance.key,"keyup",this,"refresh",false,true));
}

SZN.Editor.prototype.refresh = function() {
	this.instance.refresh();
	for (var i=0;i<this.controls.length;i++) {
		this.controls[i].refresh();
	}
}

SZN.Editor.prototype._cancelDef = function(e, elm) {
	SZN.Events.cancelDef(e);
}

SZN.Editor.prototype._lock = function(node) {
	if (node.setAttribute && node.contentEditable != true && node.nodeName != 'input' && node.nodeName != 'textarea') {
		node.setAttribute('unselectable','on');
	}

	for (var i=0;i<node.childNodes.length;i++) {
		this._lock(node.childNodes[i]);
	}
}

SZN.Editor.prototype.getFocusElement = function() {
	var elm = false;
	var r = this.instance._getRange();
	if (SZN.Browser.klient == "ie") {
		elm = (r.item ? r.item(0) : r.parentElement());
	} else {
		elm = r.commonAncestorContainer;
		if (!r.collapsed && r.startContainer == r.endContainer && r.startOffset - r.endOffset < 2) {
			if (r.startContainer.hasChildNodes()) { elm = r.startContainer.childNodes[r.startOffset]; }
		}
	}
	return elm;
}

SZN.Editor.prototype.selectNode = function(node) {
	if (SZN.Browser.klient == "ie") {
		var r = this.instance.doc.body.createTextRange();
		r.moveToElementText(node);
		r.select();
	} else {
		var s = this.instance._getSelection();
		var r = this.instance.doc.createRange();
		r.selectNode(node);
		s.removeAllRanges();
		s.addRange(r);
	}
}

SZN.Editor.prototype._click = function(e, elm) {
	if (SZN.Browser.client == "safari") {
		var tag = e.target.tagName;
		if (tag && tag.toLowerCase() == "img") { this.selectNode(e.target); }
	}
	this.refresh();
}

/* --- */

SZN.EditorInstance = SZN.ClassMaker.makeClass({
	NAME:"EditorInstance",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.EditorInstance.prototype.$constructor = function(owner, w, h) {
	this.ec = [];
	this.owner = owner;
	this.elm = this.owner.dom.content;
	this.doc = document;
	this.win = window;
	this.elm.setAttribute('contentEditable','true');	
	this.key = this.elm;
}

SZN.EditorInstance.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
}

SZN.EditorInstance.prototype.getContent = function() {
	return this.elm.innerHTML;
}

SZN.EditorInstance.prototype.setContent = function(data) {
	var d = data || "<br/>";
	this.elm.innerHTML = d;
}

SZN.EditorInstance.prototype.insertContent = function(data) {
	this.setContent(data);
}

SZN.EditorInstance.prototype.commandExec = function(command, args) {
	this.doc.execCommand(command,false,args);
}

SZN.EditorInstance.prototype.commandQueryState = function(command) {
	return this.doc.queryCommandState(command);
}

SZN.EditorInstance.prototype.commandQueryValue = function(command) {
	return this.doc.queryCommandValue(command);
}

SZN.EditorInstance.prototype.commandQuerySupported = function(command) {
	return (SZN.Browser.client == "gecko" ? this.doc.queryCommandEnabled(command) : this.doc.queryCommandSupported(command));
}

SZN.EditorInstance.prototype._getSelection = function() {
	return (this.win.getSelection ? this.win.getSelection() : this.doc.selection);
}

SZN.EditorInstance.prototype._getRange = function() {
	var s = this._getSelection();
	if (!s) { return false; }
	if (s.rangeCount > 0) { return s.getRangeAt(0); }
	return (s.createRange ? s.createRange() : this.doc.createRange());
}

SZN.EditorInstance.prototype.saveRange = function() {
	this.selection = this._getSelection();
	this.range = this._getRange();
}

SZN.EditorInstance.prototype.loadRange = function() {
	if (this.range) {
		if (window.getSelection) {
			this.selection.removeAllRanges();
			this.selection.addRange(this.range);
		} else {
			this.range.select();
		}
	}
}

SZN.EditorInstance.prototype.refresh = function() {}

/* --- */

SZN.EditorInstanceIframe = SZN.ClassMaker.makeClass({
	NAME:"EditorInstanceIframe",
	VERSION:"1.0",
	EXTEND:SZN.EditorInstance,
	CLASS:"class"
});

SZN.EditorInstanceIframe.prototype.$constructor = function(owner, w, h) {
	this.ec = [];
	this.owner = owner;
	this.ifr = SZN.cEl("iframe",false,false,{width:"100%", height:"100%"});
	this.ifr.setAttribute("frameBorder","0");
	this.ifr.setAttribute("allowTransparency","true");
	this.ifr.setAttribute("scrolling","no");
	
	this.owner.dom.content.appendChild(this.ifr);
	
	this.win = this.ifr.contentWindow;
	this.doc = this.ifr.contentWindow.document;
    this.doc.open();
    this.doc.write('<html><head></head><body style="margin:0px !important; background-color:transparent !important; ""></body></html>');
    this.doc.close();
	
	this.doc.designMode = "on";
    this.elm = this.doc.body;
	this.key = this.elm.parentNode;
	this.h = h;
	
	SZN.Events.addListener(this.elm.parentNode, "click", window, SZN.EditorControl.Select.checkHide);
}

SZN.EditorInstanceIframe.prototype.refresh = function() {
	var h = this.elm.offsetHeight;
	h = Math.max(h,this.h);
	this.ifr.style.height = h + "px";
}

