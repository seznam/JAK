/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview WYSIWYG Editor nove generace
 * @version 1.0
 * @author zara
*/   

/**
 * Pokud pouzivame i ColorPicker, bude tento vyuzit. Jeho optiony patri do vlastnosti 'colorPickerOptions' v definici 
 * ovladacich prvku na barvu textu a/nebo pozadi.
 * @class Editor
 * @group jak-widgets
 */
JAK.Editor2 = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2",
	VERSION: "1.0"
});

/**
 * Staticka tovarni metoda - vyrobi editor, ktery nahrazuje textove pole.
 * Pri odeslani relevantniho formulare (pokud nejaky je) je textove pole nahrazeno vystupem z editoru.
 * @param {node} textarea
 */
JAK.Editor2.wrapTextarea = function(textarea, options) {
	var o = {
		content: textarea.value
	};
	for (var p in options) { o[p] = options[p]; }
	var editor = new JAK.Editor2(o);

	var width = textarea.offsetWidth;
	var height = textarea.offsetHeight;
	var wrapper = JAK.mel("div", {className:"editor"}, {width:width+"px"});
	
	editor.setSize("", height+"px");
	wrapper.appendChild(editor.getControls());
	wrapper.appendChild(editor.getContainer());
	
	textarea.style.display = "none";
	textarea.parentNode.insertBefore(wrapper, textarea);
	editor.refresh();
	
	if (textarea.form) {
		var submit = function(e, elm) { textarea.value = editor.getContent(); }
		JAK.Events.addListener(textarea.form, "submit", submit);
	}
	
	return editor;
}


/**
 * @param {object} [options] asociativni pole parametru
 * @param {string} [options.imagePath="img/"] cesta k obrazkum s lomitkem na konci
 * @param {object[]} [options.controls=[]] pole ovladacich prvku editoru
 * @param {string} [options.content=""] vychozi text
 * @param {string} [options.placeholder=""] text, zobrazovany v prazdnem blurovanem editoru
 * @param {HTMLElement} [options.controlBox] prvek, kam se budou alternativne pripojovat tlacitka 
 */
JAK.Editor2.prototype.$constructor = function(options) {
	this._options = {
		imagePath: "img/",
		controls: [],
		content: "",
		placeholder: "",
		controlBox: null
	}
	for (var p in options) { this._options[p] = options[p]; }
	
	this._dom = {
		container: JAK.mel("div", {className:"editor-content"}, {overflow:"auto"}),
		controls: JAK.mel("div", {className:"editor-controls"})
	}

	/* pro zalohovani vyberu */
	this._selection = null;
	this._range = null;

	this._contentProvider = null; /* alternativni poskytovatel obsahu */
	this._ec = [];
	this._controls = [];
	this._appended = false; /* jsme pripnuti ve strance? pokud ne, nema cenu volat commandy */
	this._focused = false; /* mame focus? */
	this._placeholderActive = false;
	this._outputFilters = [];
	
	/* construct */
	this._build();

	/* insert initial text */
	this.setContent(this._options.content);
}

JAK.Editor2.prototype.$destructor = function() {
	while (this._controls.length) { this._controls.shift().$destructor(); }
	JAK.Events.removeListeners(this._ec);
}

/**
 * @param {string} width CSS sirka
 * @param {height} width CSS vyska
 */
JAK.Editor2.prototype.setSize = function(width, height) {
	this._dom.container.style.width = width;
	this._dom.container.style.height = height;
}

JAK.Editor2.prototype.getOptions = function() {
	return this._options;
}

/**
 * Vrati samotny prvek editoru
 */
JAK.Editor2.prototype.getContainer = function() {
	return this._dom.container;
}

/**
 * Vrati prvek s ovladacimi prvky
 */
JAK.Editor2.prototype.getControls = function() {
	return this._dom.controls;
}

/**
 * Nastavi obsah
 */
JAK.Editor2.prototype.setContent = function(content) {
	if (this._placeholderActive && !content) { return; }

	if (this._contentProvider) { 
		this._contentProvider.setContent(content);
	} else {
		var data = content || "<br/>";
		this._dom.container.innerHTML = data;
	}
	this._syncPlaceholder();
	this.refresh();
}

JAK.Editor2.prototype.getContent = function() {
	if (!this._contentProvider && this._placeholderActive) { return ""; } /* je tam jen zastupny text */
	
	var txt = (this._contentProvider ? this._contentProvider.getContent() : this._dom.container.innerHTML);

	for (var i=0;i<this._outputFilters.length;i++) {
		txt = this._outputFilters[i](txt);
	}
	return txt;
}

/**
 * Nastaveni alternativniho poskytovatele obsahu
 */
JAK.Editor2.prototype.setContentProvider = function(contentProvider) {
	this._contentProvider = contentProvider;
}

JAK.Editor2.prototype.commandQueryState = function(command) {
	if (!this._appended) { return false; }
	return document.queryCommandState(command);
}

JAK.Editor2.prototype.commandQueryValue = function(command) {
	if (!this._appended) { return false; }
	return document.queryCommandValue(command);
}

JAK.Editor2.prototype.commandQuerySupported = function(command) {
	if (!this._appended) { return false; }
	return this._commandQuerySupported(command);
}

JAK.Editor2.prototype.commandExec = function(command, args) {
	if (!this._appended || !this._focused) { return; }

	if (JAK.Browser.client == "gecko" && command == "hilitecolor") { /* gecko pro barvu pozadi musi zapnout CSS stylovani */
		this._commandExec("stylewithcss", true);
		this._commandExec(command, args);
		this._commandExec("stylewithcss", false);
	} else {
		this._commandExec(command, args);
	}

	this.refresh();
}

JAK.Editor2.prototype._commandExec = function(command, args) {
	var bodyHack = (JAK.Browser.client == "gecko" && command.match(/justify/i)); /* justify prikazy v gecku vyzaduji docasne zapnout contentEditable na body! */
	if (bodyHack) { document.body.contentEditable = true; }
	var result = document.execCommand(command, false, args);
	if (bodyHack) { document.body.contentEditable = false; }
	return result;
}

JAK.Editor2.prototype._commandQuerySupported = function(command) {
	return (JAK.Browser.client == "gecko" ? document.queryCommandEnabled(command) : document.queryCommandSupported(command));
}

JAK.Editor2.prototype._build = function() {
	this._dom.container.contentEditable = true;

	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "mouseup", this, "refresh"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "keyup", this, "refresh"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "focus", this, "_focus"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "blur", this, "_blur"));
	
	/* FIXME vyrobit ovladaci prvky, chce zrevidovat */
	for (var i=0;i<this._options.controls.length;i++) { 
		var c = this._options.controls[i];
		if (!(c.type in JAK.Editor2.Controls)) { continue; }
		var obj = JAK.Editor2.Controls[c.type];
		
		var opts = {};
		for (var p in obj) { if (p != "object") { opts[p] = obj[p]; } }
		for (var p in c) { if (c != "type") { opts[p] = c[p]; } }
		
		var inst = new obj.object(this, opts);
		this._controls.push(inst);
		this._dom.controls.appendChild(inst.getContainer());
		if (obj.label) { inst.getContainer().title = obj.label; }
	}

	this.lock(this._dom.controls); 
}

/**
 * Jakakoliv zmena v editoru; nutno vsechny notifikovat.
 * Metoda je verejna, aby ji mohl volat ovladaci prvek.
 */
JAK.Editor2.prototype.refresh = function() {
	var node = this._dom.container;
	while (node.parentNode) { node = node.parentNode; }
	this._appended = (node == document);
	
	for (var i=0;i<this._controls.length;i++) { this._controls[i].refresh(); }
}

JAK.Editor2.prototype.addOutputFilter = function(outputFilter) {
	this._outputFilters.push(outputFilter);
}

/**
 * "Zamkneme" prvek tak, aby jeho aktivace nezpusobovala blur editoru
 */
JAK.Editor2.prototype.lock = function(node) {
	/* normalne staci cancelovat mousedown */
	if (JAK.Browser.client != "ie") {
		this._ec.push(JAK.Events.addListener(node, "mousedown", JAK.Events.cancelDef));
		return;
	}
	
	/* v IE rekurzivne nastavit prvku a jeho potomkum vlastnost "unselectable" */
	if (node.setAttribute && node.contentEditable != true && node.nodeName != 'input' && node.nodeName != 'textarea') {
		node.setAttribute('unselectable','on');
	}
	for (var i=0;i<node.childNodes.length;i++) { this.lock(node.childNodes[i]); }
}

/**
 * Nastavit focus pro editor
 */
JAK.Editor2.prototype.focus = function() {
	if (JAK.Browser.client == "ie") {
		/* ani verze 8 tohle nema opravene... focus() se musi volat se zpozdenim */
		var container = this._dom.container;
		setTimeout(function(){container.focus();},0); 
	} else {
		this._dom.container.focus();
	}
	this._focus();
}

JAK.Editor2.prototype._click = function(e, elm) {
	if (JAK.Browser.client == "safari" || JAK.Browser.client == "chrome") { /* webkit neumi vybrat obrazek kliknutim */
		var tag = e.target.tagName;
		if (tag && tag.toLowerCase() == "img") { this._selectNode(e.target); }
		
	}
	this.refresh();
}

JAK.Editor2.prototype._focus = function(e, elm) {
	this._focused = true;
	if (this._commandQuerySupported("stylewithcss")) { this._commandExec("stylewithcss", false); }
	if (this._commandQuerySupported("usecss")) { this._commandExec("usecss", true); }
	this._syncPlaceholder();
}

JAK.Editor2.prototype._blur = function(e, elm) {
	this._focused = false;
	this._syncPlaceholder();
}

JAK.Editor2.prototype._syncPlaceholder = function() {
	/*
	 * kombinace focus/empty/active:
	 * A: focus + empty + active ZRUSIT PLACEHOLDER
	 * B: focus + empty + not active NIC SE NEDEJE
	 * C: focus + not empty + active NEMUZE NASTAT
	 * D: focus + not empty + not active NIC SE NEDEJE
	 * E: blur + empty + active NIC SE NEDEJE
	 * F: blur + empty + not active AKTIVOVAT PLACEHOLDER
	 * G: blur + not empty + active ZRUSIT PLACEHOLDER
	 * H: blur + not empty + not active NIC SE NEDEJE
	 */
	
	var tmpActive = this._placeholderActive; /* docastne si zapamatuje placeholder a vypneme ho, abychom dostali spravny obsah */
	this._placeholderActive = false;
	var content = this.getContent();
	this._placeholderActive = tmpActive;
	var empty = (!content || content.trim() == "<br>");
	
	if (this._placeholderActive && (this._focused || !empty)) { /* pripad A, C a G - zrusit placeholder */
		this._placeholderActive = false;
		if (this._focused) { this.setContent(""); }
		return;
	}

	if (empty && !this._focused && !this._placeholderActive) { /* pripad F - zapnout placeholder */
		if (this._options.placeholder) { this.setContent(this._options.placeholder); }
		this._placeholderActive = true;
	}

}

/* --- Zalezitosti s range & selection - pouzit JAK.Range? --- */

/**
 * Vybrani celeho obsahu editoru a zvyrazneni
 */
JAK.Editor2.prototype.selectAll = function() {
	if (JAK.Browser.client == "gecko" || JAK.Browser.client == "ie" || JAK.Browser.client == "opera") {
		this._selectNode(this._dom.container);
	} else { /* chrome a safari musi takto, jinak by vybrali nejakou divnou velkou oblast i mimo editor */
		var s = this._getSelection();
		var c = this._dom.container;
		s.setBaseAndExtent(c, 0, c, c.innerText.length - 1);
	}
}

/**
 * Vlozit HTML kod
 */
JAK.Editor2.prototype.insertHTML = function(html) {
	var range = this._getRange();
	if (JAK.Browser.client == "ie") {
		/* test zda vybrany node kam apenduju je uvnitr editoru */
		var selectedNode = this._getSelectedNode();
		while (true) {
			if (selectedNode == this._dom.container) {
				range.pasteHTML(html);
				break;
			}
			if (selectedNode.parentNode) {
				selectedNode = selectedNode.parentNode;
			} else {
				this._dom.container.innerHTML += html;
				break;
			}
		}
	} else {
		var fragment = document.createDocumentFragment();
		var div = JAK.mel("div");
		div.innerHTML = html;
		while (div.firstChild) { fragment.appendChild(div.firstChild); }
		range.deleteContents();
		range.insertNode(fragment);
	}
	this.refresh();
}

JAK.Editor2.prototype.insertNode = function(node) {
	var range = this._getRange();
	if (JAK.Browser.client == "ie") {
		this.insertHTML(node.outerHTML);
	} else {
		range.deleteContents();
		range.insertNode(node);
	}
	this.refresh();
}

/**
 * Ktery uzel je ted vybrany?
 * NAHRADI JAK.RANGE
 * @returns {node || null}
 */
JAK.Editor2.prototype._getSelectedNode = function() {
	var elm = null;
	var r = this._getRange();
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

/**
 * Vybrat zadany uzel 
 * NAHRADI JAK.RANGE
 */
JAK.Editor2.prototype._selectNode = function(node) {
	if (JAK.Browser.client == "ie") {
		var r = document.body.createTextRange();
		r.moveToElementText(node);
		r.select();
	} else {
		var s = this._getSelection();
		var r = document.createRange();
		r.selectNode(node);
		s.removeAllRanges();
		s.addRange(r);
	}
}
/**
 * NAHRADI JAK.RANGE
 */
JAK.Editor2.prototype._getSelection = function() {
	return (window.getSelection ? window.getSelection() : document.selection);
}

/**
 * NAHRADI JAK.RANGE
 */
JAK.Editor2.prototype._getRange = function() {
	var s = this._getSelection();
	if (!s) { return false; }
	if (s.rangeCount > 0) { return s.getRangeAt(0); }
	if (s.createRange) {
		return s.createRange();
	} else {
		var r = document.createRange();
		return r;
	}
}
