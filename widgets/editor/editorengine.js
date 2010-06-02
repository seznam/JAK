/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview WYSIWYG Editor
 * @version 2.0
 * @author zara
*/   

/**
 * Pokud pouzivame i ColorPicker, bude tento vyuzit. Jeho optiony patri do vlastnosti 'colorPickerOptions' v definici 
 * ovladacich prvku na barvu textu a/nebo pozadi.
 * @class Editor
 * @group jak-widgets
 */
JAK.Editor = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor",
	VERSION: "2.0"
});

/**
 * @param {node || string} id textarea, ktera ma byt editorem nahrazena
 * @param {object} [opts] asociativni pole parametru
 * @param {string} [opts.imagePath="img/"] cesta k obrazkum s lomitkem na konci
 * @param {object[]} [opts.controls] pole ovladacich prvku editoru
 * @param {object} [opts.style] objekt vychozich stylu
 * @param {HTMLElement} [opts.controlBox] element, kam se budou alternativne pripojovat tlacitka 
 */
JAK.Editor.prototype.$constructor = function(id, opts) {
	if (JAK.Browser.client == "konqueror") { return; }

	/* init */
	this.options = {
		imagePath:"img/",
		controls:[],
		style:{}
	}
	for (var p in opts) { this.options[p] = opts[p]; }
	this.dom = {
		container:JAK.mel("div", {className:"editor"}, {position:"relative"})
	}
	this.dom.controlBox = this.options.controlBox || this.dom.container;

	this.ec = [];
	this.controls = [];
	this.getContentHooks = []; //pole asociativnich odkazu {obj: obj, method: xxx}
	
	this.dom.ta = JAK.gel(id);
	this.width = this.dom.ta.width || this.dom.ta.clientWidth;
	this.height = this.dom.ta.height || this.dom.ta.clientHeight;
	if (!this.width || !this.height) { return; }
	this.dom.container.style.width = this.width+"px";
	

	/* construct */
	this.dom.ta.style.display = "none";
	this.dom.ta.parentNode.insertBefore(this.dom.container,this.dom.ta.nextSibling);
	this._buildInstance(this.width,this.height);
	this._buildControls();
	this._lock(this.dom.controls);
	/* insert initial text */
	this.setContent(this.dom.ta.value);
	if (this.dom.ta.form) {
		JAK.Events.addListener(this.dom.ta.form,"submit",this,"submit");
	}
	this.refresh();  
}

JAK.Editor.prototype.$destructor = function() {
	for (var i=0;i<this.controls.length;i++) {
		this.controls[i].$destructor();
	}
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.Editor.prototype.setContent = function(data) {
	this.instance.setContent(data);
}

JAK.Editor.prototype.getContent = function() {
	var txt = this.instance.getContent();
	for(var i = 0; i < this.getContentHooks.length; i++) {
		var obj = this.getContentHooks[i].obj;
		var method = this.getContentHooks[i].method;
		if (typeof method == 'string' ) {
			txt = obj[method].call(obj, txt);
		} else {
			txt = method.call(obj, txt);
		}
	}
	return txt;
}

JAK.Editor.prototype.getContainer = function() {
	return this.instance.getContainer();
}

JAK.Editor.prototype.getInstance = function() {
	return this.instance;
}

JAK.Editor.prototype.submit = function() {
	for (var i=0;i<this.controls.length;i++) {
		this.controls[i].submit();
	}
	this.dom.ta.value = this.getContent();
}

JAK.Editor.prototype.commandExec = function(command, args) {
	if (JAK.Browser.client == "gecko" && command == "hilitecolor") {
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

JAK.Editor.prototype.commandQueryState = function(command) {
	return this.instance.commandQueryState(command);
}

JAK.Editor.prototype.commandQueryValue = function(command) {
	return this.instance.commandQueryValue(command);
}

JAK.Editor.prototype.commandQuerySupported = function(command) {
	return this.instance.commandQuerySupported(command);
}

JAK.Editor.prototype._buildControls = function() {
	this.dom.controls = JAK.cel("div", "editor-controls");
	var elm = this.dom.controlBox;
	
	elm.insertBefore(this.dom.controls, elm.firstChild);
	if (JAK.Browser.client != "opera") {
		this.ec.push(JAK.Events.addListener(this.dom.controls,"mousedown",this,"_cancelDef",false,true));
		this.ec.push(JAK.Events.addListener(this.dom.controls,"click",this,"_cancelDef",false,true));
	}
	for (var i=0;i<this.options.controls.length;i++) {
		var c = this.options.controls[i];
		if (!(c.type in JAK.EditorControls)) { continue; }
		var obj = JAK.EditorControls[c.type];
		
		var opts = {};
		for (var p in obj) { if (p != "object") { opts[p] = obj[p]; } }
		for (var p in c) { if (c != "type") { opts[p] = c[p]; } }
		
		var inst = new obj.object(this,opts);
		this.controls.push(inst);
		this.dom.controls.appendChild(inst.dom.container);
		if (obj.label) { inst.dom.container.title = obj.label; }
	}
}

JAK.Editor.prototype._buildInstance = function(w,h) {
	var p = 3;
	var width = w-2*p;
	var height = h-2*p;
	this.dom.content = JAK.mel("div", null, {padding:p+"px",width:width+"px",height:height+"px",overflow:"auto",position:"relative"});
	this.dom.container.appendChild(this.dom.content);
	if (this.dom.content.contentEditable && JAK.Browser.client !== 'gecko' /*|| JAK.Browser.client == "opera"*/) { //Firefox 3 sice umi contentEditable ale hazi to chyby
		this.instance = new JAK.Editor.Instance(this,w,height);
	} else {
		this.instance = new JAK.Editor.Instance.Iframe(this,w,height);
	}
	if (typeof(this.options.style) == "string") {
		this.addStyle(this.options.style);
	} else {
		for (var p in this.options.style) {
			this.instance.elm.style[p] = this.options.style[p];
		}
	}
	this.ec.push(JAK.Events.addListener(this.instance.elm,"click",this,"_click",false,true));
	this.ec.push(JAK.Events.addListener(this.instance.elm,"mouseup",this,"refresh",false,true));
	this.ec.push(JAK.Events.addListener(this.instance.key,"keyup",this,"refresh",false,true));
}

JAK.Editor.prototype.refresh = function() {
	this.instance.refresh();
	for (var i=0;i<this.controls.length;i++) {
		this.controls[i].refresh();
	}
}

JAK.Editor.prototype.addStyle = function(str) {
	var s = this.instance.doc.createElement('style');
	s.type = "text/css";
	if (JAK.Browser.client == "ie") {
		s.styleSheet.cssText = str;
	} else {
		var t = JAK.ctext(str);
		s.appendChild(t);			
	}
	this.instance.doc.getElementsByTagName('head')[0].appendChild(s);
}

JAK.Editor.prototype.registerGetContentHook = function(obj, func) {
	this.getContentHooks.push({obj: obj, method: func});
}


JAK.Editor.prototype._cancelDef = function(e, elm) {
	JAK.Events.cancelDef(e);
}

JAK.Editor.prototype._lock = function(node) {
	if (node.setAttribute && node.contentEditable != true && node.nodeName != 'input' && node.nodeName != 'textarea') {
		node.setAttribute('unselectable','on');
	}

	for (var i=0;i<node.childNodes.length;i++) {
		this._lock(node.childNodes[i]);
	}
}

/* range metoda - zjisteni focusnuteho prvku */
JAK.Editor.prototype.getSelectedNode = function() {
	var elm = false;
	var r = this.instance._getRange();
	if (JAK.Browser.client == "ie") {
		elm = (r.item ? r.item(0) : r.parentElement());
	} else {
		elm = r.commonAncestorContainer;
		if (!r.collapsed && r.startContainer == r.endContainer && r.startOffset - r.endOffset < 2) {
			if (r.startContainer.hasChildNodes()) { elm = r.startContainer.childNodes[r.startOffset]; }
		}
	}
	return elm;
}

/* range metoda - presun range na dany node */
JAK.Editor.prototype.selectNode = function(node) {
	if (JAK.Browser.client == "ie") {
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

JAK.Editor.prototype.createRangeFromNode = function(node) {
	if (JAK.Browser.client == "ie") {
		var r = this.instance.doc.body.createTextRange();
		r.moveToElementText(node);
	} else {
		var r = this.instance.doc.createRange();
		r.selectNode(node);
	}
	return r;
}

/* range metoda - zjisteni vybraneho kodu */
JAK.Editor.prototype.getSelectedHTML = function() {
	var range = this.instance._getRange();
	if (JAK.Browser.client == "ie") {
		return range.htmlText;
	} else {
		var fragment = range.cloneContents();
		var div = this.instance.doc.createElement("div");
		while (fragment.firstChild) {
			div.appendChild(fragment.childNodes[0]);
		}
		return div.innerHTML;
	}
}

/* range metoda - vlozeni html */
JAK.Editor.prototype.insertHTML = function(html) {//  window.w = this.getSelectedNode();
	var range = this.instance._getRange();
	if (JAK.Browser.client == "ie") {
		//test zda vybrany node kam apenduju je uvnitr editoru
		var selectedNode = this.getSelectedNode();
		while(true) {
			if (selectedNode == this.instance.elm) {
				range.pasteHTML(html);
				break;
			}
			if (selectedNode.parentNode) {
				selectedNode = selectedNode.parentNode;
			} else {
				this.instance.elm.innerHTML += html;
				break;
			}
		}


	} else {
		var fragment = this.instance.doc.createDocumentFragment();
		var div = this.instance.doc.createElement("div");
		div.innerHTML = html;
		while (div.firstChild) {
			// the following call also removes the node from div
			fragment.appendChild(div.firstChild);
		}
		range.deleteContents();
		range.insertNode(fragment);
	}
}

/* range metoda - vlozeni node */
JAK.Editor.prototype.insertNode = function(node) {
	var range = this.instance._getRange();
	if (JAK.Browser.client == "ie") {
		this.insertHTML(node.outerHTML);
	} else {
		range.deleteContents();
		range.insertNode(node);
	}
}

JAK.Editor.prototype._click = function(e, elm) {
	if (JAK.Browser.client == "safari") {
		var tag = e.target.tagName;
		if (tag && tag.toLowerCase() == "img") { this.selectNode(e.target); }
	}
	this.refresh();
}

/* --- */

/**
 * @class 
 * @group jak-widgets
 */
JAK.Editor.Instance = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor.Instance",
	VERSION: "2.0"
});

JAK.Editor.Instance.prototype.$constructor = function(owner, w, h) {
	this.ec = [];
	this.owner = owner;
	this.elm = this.owner.dom.content;
	JAK.DOM.addClass(this.elm, "editor-content");
	this.doc = document;
	this.win = window;
	this.elm.setAttribute('contentEditable','true');
	this.key = this.elm;
}

JAK.Editor.Instance.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
}

JAK.Editor.Instance.prototype.getContent = function() {
	return this.elm.innerHTML;
}

JAK.Editor.Instance.prototype.getContainer = function() {
	return this.elm;
}

JAK.Editor.Instance.prototype.setContent = function(data) {
	var d = data || "<br/>";
	this.elm.innerHTML = d;
}

JAK.Editor.Instance.prototype.commandExec = function(command, args) {
	this.doc.execCommand(command,false,args);
}

JAK.Editor.Instance.prototype.commandQueryState = function(command) {
	return this.doc.queryCommandState(command);
}

JAK.Editor.Instance.prototype.commandQueryValue = function(command) {
	return this.doc.queryCommandValue(command);
}

JAK.Editor.Instance.prototype.commandQuerySupported = function(command) {
	return (JAK.Browser.client == "gecko" ? this.doc.queryCommandEnabled(command) : this.doc.queryCommandSupported(command));
}

JAK.Editor.Instance.prototype._getSelection = function() {
	return (this.win.getSelection ? this.win.getSelection() : this.doc.selection);
}

JAK.Editor.Instance.prototype._getRange = function() {
	var s = this._getSelection();
	if (!s) { return false; }
	if (s.rangeCount > 0) { return s.getRangeAt(0); }
	return (s.createRange ? s.createRange() : this.doc.createRange());
}

JAK.Editor.Instance.prototype.saveRange = function() {
	this.selection = this._getSelection();
	this.range = this._getRange();
}

JAK.Editor.Instance.prototype.loadRange = function() {
	if (this.range) {
		if (window.getSelection) {
			this.selection.removeAllRanges();
			this.selection.addRange(this.range);
		} else {
			this.range.select();
		}
	}
}

JAK.Editor.Instance.prototype.refresh = function() {}

/* --- */

/**
 * @class instance
 * @augments JAK.Editor.Instance
 */
JAK.Editor.Instance.Iframe = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor.Instance.Iframe",
	VERSION: "2.0",
	EXTEND: JAK.Editor.Instance
});

JAK.Editor.Instance.Iframe.prototype.$constructor = function(owner, w, h) {
	this.ec = [];
	this.owner = owner;
	this.ifr = JAK.mel("iframe", null, {width:"100%", height:"100%"});
	this.ifr.setAttribute("frameBorder","0");
	this.ifr.setAttribute("allowTransparency","true");
	this.ifr.setAttribute("scrolling","no");
	
	this.owner.dom.content.appendChild(this.ifr);
	
	this.win = this.ifr.contentWindow;
	this.doc = this.ifr.contentWindow.document;
	if (JAK.Browser.client == "ie") { this.doc.designMode = "on"; }
    this.doc.open();
    this.doc.write('<html><head></head><body class="editor-content" style="margin:0px !important; background-color:transparent !important; ""></body></html>');
    this.doc.close();
	if (JAK.Browser.client != "ie") { 
		this.doc.designMode = "on"; 
		this.doc.designMode = "off"; 
		this.doc.designMode = "on"; 
	}
	
    this.elm = this.doc.body;
	this.key = this.elm.parentNode;
	this.h = h;
	
	JAK.Events.addListener(this.elm.parentNode, "click", window, JAK.EditorControl.Select.checkHide);

}

JAK.Editor.Instance.Iframe.prototype.refresh = function() {
	var h = this.elm.offsetHeight;
	h = Math.max(h,this.h);
	this.ifr.style.height = h + "px";
}

