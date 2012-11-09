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
 * @class Editor
 * @group jak-widgets
 */
JAK.Editor2 = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2",
	VERSION: "1.0"
});

JAK.Editor2.isSupported = function() {
	return ("contentEditable" in document.body);
}

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
	wrapper.appendChild(editor.getControlsContainer());
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
 */
JAK.Editor2.prototype.$constructor = function(options) {
	this._options = {
		imagePath: "img/editor2/",
		controls: [],
		content: "",
		placeholder: ""
	}
	for (var p in options) { this._options[p] = options[p]; }
	
	this._dom = {
		container: JAK.mel("div", {className:"editor-content"}),
		controls: JAK.mel("div", {className:"editor-controls"})
	}
	
	this._range = new JAK.Range();
	this._contentProvider = null; /* alternativni poskytovatel obsahu */
	this._ec = [];
	this._ec2 = [];
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
	this.disable();
	JAK.Events.removeListeners(this._ec2);
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
 * Vrati ovladaci prvky
 */
JAK.Editor2.prototype.getControls = function() {
	return this._controls;
}

/**
 * Vrati prvek s ovladacimi prvky
 */
JAK.Editor2.prototype.getControlsContainer = function() {
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
		var div = JAK.mel("div");
		div.innerHTML = data;
		JAK.DOM.clear(this._dom.container);
		while(div.firstChild) { this._dom.container.appendChild(div.firstChild); }
	}
	this._syncPlaceholder();
	this.refresh();
}

/**
 * Vraci obsah editoru vcetne zmen po aplikaci pripadnych vystupnich filtru
 * @return {string} obsah editoru
 */
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

JAK.Editor2.prototype.enable = function() {
	this._dom.container.contentEditable = true;
	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "mouseup", this, "refresh"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "keyup", this, "refresh"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "focus", this, "_focus"));
	this._ec.push(JAK.Events.addListener(this._dom.container, "blur", this, "_blur"));
}

JAK.Editor2.prototype.disable = function() {
	this._dom.container.contentEditable = false;
	JAK.Events.removeListeners(this._ec);
}

JAK.Editor2.prototype.commandQueryState = function(command) {
	if (!this._appended) { return false; }
	try {
		return document.queryCommandState(command);
	} catch(e) {
		return false;
	}
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

JAK.Editor2.prototype.isFocused = function() {
	return this._focused;
}

JAK.Editor2.prototype._commandExec = function(command, args) {
	var result = document.execCommand(command, false, args);
	return result;
}

JAK.Editor2.prototype._commandQuerySupported = function(command) {
	return (JAK.Browser.client == "gecko" ? document.queryCommandEnabled(command) : document.queryCommandSupported(command));
}

JAK.Editor2.prototype._build = function() {
	this.enable();

	/* vyrobit ovladaci prvky */
	for (var i=0;i<this._options.controls.length;i++) { 
		var c = this._options.controls[i];
		if (!(c.type in JAK.Editor2.Controls)) { continue; }
		
		var def = JAK.Editor2.Controls[c.type];
		var options = {};
		for (var p in def.options) { options[p] = def.options[p]; }
		for (var p in c.options) { options[p] = c.options[p]; }
		var inst = new def.object(this, options);
		this._controls.push(inst);
		this._dom.controls.appendChild(inst.getContainer());
	}

	this.lock(this._dom.controls); 
}

/**
 * Jakakoliv zmena v editoru; nutno vsechny notifikovat.
 * Metoda je verejna, aby ji mohl volat ovladaci prvek.
 */
JAK.Editor2.prototype.refresh = function() {
	if (JAK.Browser.client == "ie" && JAK.Browser.version < 8 && !this._focused) {
		/* vypicena IE7 hazi vyjimku u document.selection, kdyz neni focusnuto nic na strance, pojistime se, aby bylo */
		this.focus(); 
	} 
	var node = this._dom.container;
	while (node.parentNode) { node = node.parentNode; }
	this._appended = (node == document);
	
	for (var i=0;i<this._controls.length;i++) { this._controls[i].refresh(); }

}

/**
 * Prida filtr, ktery upravuje vystup z editoru (napr. pred odeslanim)
 * @param {outputFilter} function funkce ktere provede upravu vystupu
 */
JAK.Editor2.prototype.addOutputFilter = function(outputFilter) {
	this._outputFilters.push(outputFilter);
}

/**
 * "Zamkneme" prvek tak, aby jeho aktivace nezpusobovala blur editoru
 */
JAK.Editor2.prototype.lock = function(node) {
	/* normalne staci cancelovat mousedown */
	if (JAK.Browser.client != "ie") {
		this._ec2.push(JAK.Events.addListener(node, "mousedown", JAK.Events.cancelDef));
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
	this._dom.container.focus();
	if (this._range.isInNode(this._dom.container)) {
		this._range.show();
	}
	this._focus();
}

JAK.Editor2.prototype._click = function(e, elm) {
	if (JAK.Browser.client == "safari" || JAK.Browser.client == "chrome") { /* webkit neumi vybrat obrazek kliknutim */
		var tag = e.target.tagName;
		if (tag && tag.toLowerCase() == "img") { this._range.setOnNode(e.target, true); }
		
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

/**
 * Vybrani celeho obsahu editoru a zvyrazneni
 */
JAK.Editor2.prototype.selectAll = function() {
	this._range.setOnNode(this._dom.container, true);
}

/**
 * Vlozit HTML kod
 * @param {html} string cast HTML kodu pro vlozeni do obsahu editoru
 */
JAK.Editor2.prototype.insertHTML = function(html) {
	this._range.setFromSelection();
	if (this._range.isInNode(this._dom.container)) {
		this._range.insertHTML(html);
		this._range.show();
	} else {
		this._dom.container.innerHTML += html;
	}
}

/**
 * Vlozit prvek
 */
JAK.Editor2.prototype.insertNode = function(node) {
	this._range.setFromSelection();
	if (this._range.isInNode(this._dom.container)) {
		this._range.insertNode(node);
		this._range.show();
	} else {
		this._dom.container.appendChild(node);
	}
	this.refresh();
}

/**
 * Obalit vybrany obsah nodem
 */
JAK.Editor2.prototype.surroundContent = function(node) {
	this._range.setFromSelection();
	if (this._range.isInNode(this._dom.container)) {
		var htmlContent = this._range.getContentHTML();
		if (htmlContent) {
			node.innerHTML = htmlContent;
			this._range.insertNode(node);
			this._range.setOnNode(node, true);
		} else {
			node.innerHTML = "&#8203;&#8203;";
			this._range.insertNode(node);
			this._range.setStartEnd(node.firstChild, 1, node.firstChild, 1);
		}
		this._range.show();
		this.refresh();
	}
}

/**
 * Zkolabovat obsah
 * @param {boolean} toStart kolabovat smerem na zacatek nebo nakonec
 */
JAK.Editor2.prototype.collapseRange = function(toStart) {
	this._range.collapse(toStart);
	this._range.show();
}

/**
 * Vraci vybrany uzel respektive rodice uvnitr ktereho je kompletni vyber
 * @return {node} vybrany uzel, resp. rodic vyberu
 */
JAK.Editor2.prototype.getSelectedNode = function() {
	this._range.setFromSelection();
	return this._range.getParentNode();
}

/**
 * Vraci textovy obsah vyberu (bez html)
 * @return {string} text vyberu
 */
JAK.Editor2.prototype.getSelectedText = function() {
	this._range.setFromSelection();
 	return this._range.getContentText();
}

/**
 * Vraci HTML vyberu 
 * @return {string} html vyberu
 */
JAK.Editor2.prototype.getSelectedHTML = function() {
	this._range.setFromSelection();
	return this._range.getContentHTML();
}
