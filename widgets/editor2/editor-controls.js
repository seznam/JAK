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
 * @class Rozhrani pro ovladaci prvky s popup vyberem, dohlizi na to
 * aby bylo otevrene vzdy pouze jedno popup okno/menu
 */
JAK.Editor2.Controls.IPopupControl = JAK.ClassMaker.makeInterface({
	NAME: "JAK.Editor2.Controls.IPopupControl",
	VERSION: "1.0"
});

/* aktualne otevrene popup menu*/
JAK.Editor2.Controls.IPopupControl.current = null;

/* zavre aktualne otevrene popup menu pokud je nastavene */
JAK.Editor2.Controls.IPopupControl.prototype._closeCurrent = function(){
	if(JAK.Editor2.Controls.IPopupControl.current) {
		JAK.Editor2.Controls.IPopupControl.current.close();
	}
	JAK.Editor2.Controls.IPopupControl.current = this;
}

/* zapomene aktualne otevrene popupmenu */
JAK.Editor2.Controls.IPopupControl.prototype._unsetCurrent = function(){
	if(JAK.Editor2.Controls.IPopupControl.current == this) {
		JAK.Editor2.Controls.IPopupControl.current = null;
	}
}


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

/**
 * @param {object} editor instance editoru, ke ktere se ovladaci prvek vztahuje
 * @param {object} [options] asociativni pole parametru
 * @param {string} [options.title] hodnota atributu title ovladaciho prvku
 * @param {string} [options.image] nazev obrazku, ze ktereho se vytvori ikona tlacitka
 * @param {string} [options.command] nazev commandQuery, ktere se ma v editoru pouzit
 */
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

/**
 * Vrati DOM kontejner ovladaciho prvku
 * @return {node} DOM kontejner ovladaciho prvku
 */
JAK.Editor2.Control.prototype.getContainer = function() {
	return this._dom.container;
}

/**
 * obnovi stav ovladaciho prvku podle jeho moznosti 
 */
JAK.Editor2.Control.prototype.refresh = function() {
	/* Podle povolenosti prikazu enable/disable */
	if (!this._options.command) { return; }
	var state = this._editor.commandQuerySupported(this._options.command);
	if (state == this._enabled) { return; }
	if (state) { this.enable(); } else { this.disable(); }
}

/**
 * Aktivuje ovladaci prvek
 */
JAK.Editor2.Control.prototype.enable = function() { 
	if (this._enabled) { return; }
	this._enabled = true; 
	JAK.DOM.removeClass(this._dom.container, "disabled");
}

/**
 * Deaktivuje ovladaci prvek
 */
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
	EXTEND: JAK.Editor2.Control,
	IMPLEMENT:[JAK.Editor2.Controls.IPopupControl]
});

/**
 * @see JAK.Editor2.Control#$constructor
 * @param {object} editor instance editoru, ke ktere se ovladaci prvek vztahuje
 * @param {object} [options] asociativni pole parametru (zakladni jsou stejne jako u predka [title,image])
 * @param {object} options.colors pole definic barev, ktere ma ovladaci prvek nabizet
 */
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

	this._dom.popup = JAK.mel("div", {className:"editor-control-popup"}, {position:"absolute", zIndex:999, width:"125px", padding:"10px"});
	this._dom.colors = [];
	for (var i=0;i<this._options.colors.length;i++) {
		var c = JAK.mel("span", {className:"editor-control-color-box"});
		var d = JAK.mel("span", {className:"editor-control-color"});
		c.appendChild(d)
		d.style.backgroundColor = this._options.colors[i];
		this._dom.popup.appendChild(c);
		this._dom.colors.push(d);
	}
	this._dom.color = JAK.mel("div", {className:"editor-control-color"});
	this._dom.container.appendChild(this._dom.color);
	
	var pulldown = JAK.mel("img", {src:this._editor.getOptions().imagePath + "pulldown.png", className:"pulldown"});
	this._dom.container.appendChild(pulldown);
}

JAK.Editor2.Control.Color.prototype._clickAction = function(e, elm) {
	if (this._state) {
		this.close();
	} else {
		this._state = true;
		this._closeCurrent();
		JAK.DOM.addClass(this._dom.container, "pressed");
		document.body.appendChild(this._dom.popup);
		var pos = JAK.DOM.getBoxPosition(this._dom.container);
		this._dom.popup.style.top = (pos.top + this._dom.container.offsetHeight) + "px";
		this._dom.popup.style.left = pos.left + "px";
		this._ec2.push(JAK.Events.addListener(document, "mousedown", this, "_documentDown"));
		
		for (var i=0;i<this._dom.colors.length;i++) {
			var node = this._dom.colors[i];
			JAK.DOM.removeClass(node.parentNode, "active");
			if (i == this._index) { JAK.DOM.addClass(node.parentNode, "active"); }
		}
	}
}

JAK.Editor2.Control.Color.prototype.close = function() {
	this._state = false;
	JAK.DOM.removeClass(this._dom.container, "pressed");
	this._dom.popup.parentNode.removeChild(this._dom.popup);
	this._unsetCurrent();
	JAK.Events.removeListeners(this._ec2);
}

JAK.Editor2.Control.Color.prototype._documentDown = function(e, elm) {
	this.close(true);
}

JAK.Editor2.Control.Color.prototype._popupDown = function(e, elm) {
	JAK.Events.cancelDef(e); /* at neprijdeme o focus editoru */
	JAK.Events.stopEvent(e); /* aby smirovadlo nemerilo mousedown na necem, co tam neni */
	var node = JAK.Events.getTarget(e);
	var index = this._dom.colors.indexOf(node);
	if (index == -1) { return; }
	this._editor.commandExec(this._options.command, this._options.colors[index]); 
	this.close();
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
 * @class Výběr (tlacitko s rozbalovaci nabidkou)
 * @augments JAK.Editor2.Controls
 */
JAK.Editor2.Control.Select = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.Select",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control,
	IMPLEMENT:[JAK.Editor2.Controls.IPopupControl]
});

JAK.Editor2.Control.Select.current = null;

/**
 * @param {object} editor instance editoru, ke ktere se ovladaci prvek vztahuje 
 * @param {object} [options] asociativni pole parametru (zakladni jsou stejne jako u predka [title,image])
 * @param {object} [conf] konfigurace rozbalovaciho menu a jeho funkcionality (typicky innerHTML pro text polozky menu, a value pro hodnotu vybrane polozky)
 */
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

JAK.Editor2.Control.Select.prototype._buildArrow = function() {
	return JAK.mel("span",{className:"control-select-arrow"});
}

JAK.Editor2.Control.Select.prototype._build = function() {
	this._dom.container = JAK.mel("span", {title:this._options.title});
	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));

	this._dom.popup = JAK.mel("div", {className:"editor-control-popup hovered-items"}, {position:"absolute", zIndex:999});
	this._dom.items = [];
	for (var i=0;i<this._options.conf.length;i++) {
		var conf = this._options.conf[i];
		var c = JAK.mel("div", {className:"editor-control-popup-item", innerHTML:conf.innerHTML});
		this._dom.popup.appendChild(c);
		this._dom.items.push(c);
	}

	var img = this._buildImage();
	this._dom.container.appendChild(img);
	
	var pulldown = JAK.mel("img", {src:this._editor.getOptions().imagePath + "pulldown.png", className:"pulldown"});
	this._dom.container.appendChild(pulldown);
}

JAK.Editor2.Control.Select.prototype._clickAction = function(e, elm) {
	if (this._state) {
		this.close();
	} else {
		this._state = true;
		JAK.DOM.addClass(this._dom.container, "pressed");
		document.body.appendChild(this._dom.popup);
		var pos = JAK.DOM.getBoxPosition(this._dom.container);
		var left = (pos.left + this._dom.container.offsetWidth - this._dom.popup.offsetWidth);
		var top =  (pos.top + this._dom.container.offsetHeight)
		this._dom.popup.style.top = top + "px";
		this._dom.popup.style.left = left + "px";
		var drift = JAK.DOM.shiftBox(this._dom.popup);
		this._dom.popup.style.left = (left + drift[0]) + "px";
		this._dom.popup.style.top = (top + drift[1]) + "px";		
		this._ec2.push(JAK.Events.addListener(document, "mousedown", this, "_documentDown"));
		this._closeCurrent();
	}
}

JAK.Editor2.Control.Select.prototype.close = function() {
	this._unsetCurrent();
	this._state = false;
	JAK.DOM.removeClass(this._dom.container, "pressed");
	this._dom.popup.parentNode.removeChild(this._dom.popup);
	JAK.Events.removeListeners(this._ec2);
}

JAK.Editor2.Control.Select.prototype._documentDown = function(e, elm) {
	this.close();
}

JAK.Editor2.Control.Select.prototype._popupDown = function(e, elm) {
	JAK.Events.cancelDef(e); /* at neprijdeme o focus editoru */
	JAK.Events.stopEvent(e); /* aby smirovadlo nemerilo mousedown na necem, co tam neni */
	var node = JAK.Events.getTarget(e);
	while (node && !JAK.DOM.hasClass(node, "editor-control-popup-item")) { node = node.parentNode; }
	
	var index = this._dom.items.indexOf(node);
	if (index == -1) { return; }

	this._exec(index);
	this.close();
}

JAK.Editor2.Control.Select.prototype._exec = function(index) {
	this._editor.commandExec(this._options.command, this._options.conf[index].value); 
}

/**
 * @class Vybiratko na velikost pisma
 * do argumentu options dostava konstruktor pole velikosti, pole nazvu velikosti (polozek rozbalovaci nabidky)
 * @augments JAK.Editor2.Control.Select
 */
JAK.Editor2.Control.Size = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.Size",
	VERSION: "1.0",
	EXTEND: JAK.Editor2.Control.Select
})

JAK.Editor2.Control.Size.prototype._defaultOptions = function() {
	this.$super();
	this._options.sizes = [];
}

JAK.Editor2.Control.Size.prototype._build = function() {
	this._options.conf = [];
	for (var i=0;i<this._options.sizes.length;i++) {
		var size = this._options.sizes[i];
		var item = {
			value: size,
			innerHTML: "<span style='font-size:"+size+"px;'>" + this._options.labels[i] + "</span>"
		}
		this._options.conf.push(item);
	}
	
	this._dom.arrow = this._buildArrow();
	this.$super();
}

JAK.Editor2.Control.Size.prototype._exec = function(index) {
	var size = this._options.sizes[index];
	var text = this._editor.getSelectedText();
	var node = this._editor.getSelectedNode();
	var nodeText = node.textContent || node.innerText || "";

	if (text == nodeText && node != this._editor.getContainer()) { /* je vybrany presne uzel, jen mu nastavime styl */
		node.style.fontSize = size + "px";
	} else { /* obalime spanem */
		var docFrag = document.createDocumentFragment();
		var node = JAK.mel("span", {}, {fontSize:size+"px"});
		docFrag.appendChild(node);
		this._editor.surroundContent(node);
	}

	/* detem zrusime velikost */
	var children = node.getElementsByTagName("*");
	for (var i=0;i<children.length;i++) { children[i].style.fontSize = ""; }
}

JAK.Editor2.Control.Size.prototype.refresh = function() {
	var node = this._editor.getSelectedNode();

	if(node == document) {
		return;
	}
	var fontSize = NaN;
	while(node && node != this._editor.getContainer()){
		if(node && node.style && node.style.fontSize) {
			fontSize = parseInt(node.style.fontSize);
			break;
		} else {
			node = node.parentNode;
		}
	}
	
	var items = this._options.conf;
	var index = NaN;
	for(var i = 0; i < items.length; i++) {
		if((items[i].value) == fontSize) {
			index = i;
			break
		}
	}
	this._setActive(index);
}

JAK.Editor2.Control.Size.prototype._setActive = function(index) {
	if(isNaN(index)) {
		if(this._dom.arrow.parentNode){
			this._dom.arrow.parentNode.removeChild(this._dom.arrow);
		}
		return;
	}
	this._dom.items[index].insertBefore(this._dom.arrow,this._dom.items[index].firstChild);
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
	EXTEND: JAK.Editor2.Control.TwoStateButton,
	IMPLEMENT:[JAK.Editor2.Controls.IPopupControl]
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
	this._dom.popup = JAK.mel("div", {className:"editor-control-popup link-popup"}, {position:"absolute", zIndex:999});
	this._dom.popupBox = JAK.mel("div",{className:"popup-innerBox"});
	this._dom.link = JAK.mel("input",{type:"text"});
	var line = JAK.mel("div",{className:"popup-formLine"})
	line.appendChild(this._dom.link);
	//var accept = JAK.mel("button",{className:"wm-button accept", innerHTML:this._options.labels.accept});FIXME
	var accept = JAK.mel("button",{innerHTML:"Vložit"})
	line.appendChild(accept);
	this._dom.popupBox.appendChild(line);
	this._dom.popup.appendChild(this._dom.popupBox);
	
	this._ec.push(JAK.Events.addListener(this._dom.popup,"mousedown",JAK.Events.stopEvent));
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
	this.close(true);
}

JAK.Editor2.Control.Link.prototype._accept = function() {
	this._editor.focus();
	if(this._editMode == this.MODE_LINK){ /* odkaz z oznaceneho textu */
		this._editor.commandExec(this._options.command, this._dom.link.value);
	} else {
		/* nejdrive jen zmenime href odkazu */
		this._node.href = this._dom.link.value;
		if(this._editMode == this.MODE_NODE) { /* vyrobime novy odkaz */
			
			var nodeText = this._node.innerHTML.trim();
			if(!nodeText || nodeText == "http://") {
				JAK.DOM.clear(this._node);
				this._node.appendChild(JAK.ctext(this._node.href));
			}
						
			this._editor.insertNode(this._node);
			this._node = null;
		} 
	}
	this._node = null;
	this.close(false);
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
		if (this._editor.getSelectedText() || this._editor.getSelectedHTML()) { /* pouzijeme execCommand z options (vyrabime link z oznaceneho textu)*/
			this._editMode = this.MODE_LINK;
			this._node = null;
			this._openDialog(this._editor.getSelectedText(),this._editor.getSelectedText());
		} else { /* pouzijeme insertNode editoru - vyrabime novy odkaz */
			this._editMode = this.MODE_NODE;
			this._node = JAK.mel("a");
			this._openDialog(null,this._editor.getSelectedText());
		}
	}
	this._closeCurrent();
	this._ec2.push(JAK.Events.addListener(document, "mousedown", this, "_documentDown"));
}

JAK.Editor2.Control.Link.prototype._documentDown = function(e, elm) {
	this.close(true);
}

JAK.Editor2.Control.Link.prototype._openDialog = function(link,text) {
	document.body.appendChild(this._dom.popup);
	var pos = JAK.DOM.getBoxPosition(this._dom.container);
	this._dom.popup.style.top = (pos.top + this._dom.container.offsetHeight) + "px";
	this._dom.popup.style.left = (pos.left ) + "px";
	
	var url = link ? link : "http://";
	var test = url.match(/^[a-z]+(.)/i);
	if(test && test[1] != ":") {
		url = "http://" + url;
	} else {
		url = "http://";
	}
	
	this._dom.link.value = url;
}

JAK.Editor2.Control.Link.prototype.close = function(makeFocus) {
	this._unsetCurrent();
	if(makeFocus) {
		this._editor.focus();
	}
	this._dom.link.value = "";
	JAK.Events.removeListeners(this._ec2);
	this._dom.popup.parentNode.removeChild(this._dom.popup);
}

JAK.Editor2.Control.Link.prototype._defaultOptions = function() {
	this.$super();
	this._options.prompt = "";
}


/**
 * Vyber fontu v rozbalovaci nabidce
 * @augments JAK.Editor2.Control.Select
 */
JAK.Editor2.Control.FontName = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.FontName",
	VERSION: "1.0",
	EXTEND: JAK.Editor2.Control.Select
});

JAK.Editor2.Control.FontName.prototype._build = function() {
	this.$super();
	this._dom.arrow = this._buildArrow();
	JAK.DOM.addClass(this._dom.popup,"fontname-popup");
}

JAK.Editor2.Control.FontName.prototype.refresh = function() {
	var value = this._editor.commandQueryValue(this._options.command) || "";
	var items = this._options.conf;
	var index = NaN;
	for(var i = 0; i < items.length; i++) {
		var val = value.toLowerCase();
		if(val.indexOf(items[i].value.toLowerCase()) != -1) {
			index = i;
			break
		}
	}
	this._setActive(index);
}

JAK.Editor2.Control.FontName.prototype._setActive = function(index) {
	if(isNaN(index)) {
		if(this._dom.arrow.parentNode) {
			this._dom.arrow.parentNode.removeChild(this._dom.arrow);
		}
		return;
	}
	this._dom.items[index].insertBefore(this._dom.arrow,this._dom.items[index].firstChild);
}

/**
 * @class Výběr smajlíka
 * @augments JAK.Editor2.Controls
 */
JAK.Editor2.Control.Emoticon = JAK.ClassMaker.makeClass({
	NAME: "JAK.Editor2.Control.Emoticons",
	VERSION: "2.0",
	EXTEND: JAK.Editor2.Control,
	IMPLEMENT:[JAK.Editor2.Controls.IPopupControl]
});

/**
 * @see JAK.Editor2.Control#$constructor
 * @param {object} editor instance editoru, ke ktere se ovladaci prvek vztahuje 
 * @param {object} [options] asociativni pole parametru (zakladni jsou stejne jako u predka [title,image])
 */
JAK.Editor2.Control.Emoticon.prototype.$constructor = function(editor, options) {
	this.$super(editor, options);
	this._state = false;
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", JAK.Events.stopEvent)); /* aby se nezavrelo */
	this._ec.push(JAK.Events.addListener(this._dom.container, "mousedown", JAK.Events.cancelDef)); /* aby se nedeselectlo */
	this._ec.push(JAK.Events.addListener(this._dom.popup, "mousedown", this, "_popupDown"));
	this._ec2 = [];
}

JAK.Editor2.Control.Emoticon.prototype._defaultOptions = function() {
	this._options = {
		emoticons: [],
		title: ""
	}
}

JAK.Editor2.Control.Emoticon.prototype._build = function() {
	this._dom.container = JAK.mel("span", {title:this._options.title});
	this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));

	this._dom.popup = JAK.mel("div", {className:"editor-control-popup"}, {position:"absolute", zIndex:999,width:"95px", padding:"10px 10px 6px 10px"});
	this._dom.emoticons = [];
	var emoticons = this._options.emoticons;
	var path = this._editor
	for (var i=0;i<emoticons.src.length;i++) {
		var src = this._editor.getOptions().imagePath + emoticons.src[i];
		var sm = emoticons.sm[i];
		var img = JAK.mel("img", {src:src, alt:sm, className:"editor-control-emoticon"});
		this._dom.popup.appendChild(img);
		this._dom.emoticons.push(img);
	}
	this._dom.emoticon = this._buildImage();
	this._dom.container.appendChild(this._dom.emoticon);
	
	var pulldown = JAK.mel("img", {src:this._editor.getOptions().imagePath + "pulldown.png", className:"pulldown"});
	this._dom.container.appendChild(pulldown);
}

JAK.Editor2.Control.Emoticon.prototype._clickAction = function(e, elm) {
	if (this._state) {
		this.close();
	} else {
		this._state = true;
		this._closeCurrent();
		JAK.DOM.addClass(this._dom.container, "pressed");
		document.body.appendChild(this._dom.popup);
		var pos = JAK.DOM.getBoxPosition(this._dom.container);
		this._dom.popup.style.top = (pos.top + this._dom.container.offsetHeight) + "px";
		this._dom.popup.style.left = pos.left + "px";
		this._ec2.push(JAK.Events.addListener(document, "mousedown", this, "_documentDown"));
	}
}

JAK.Editor2.Control.Emoticon.prototype.close = function() {
	this._state = false;
	this._unsetCurrent();
	JAK.DOM.removeClass(this._dom.container, "pressed");
	this._dom.popup.parentNode.removeChild(this._dom.popup);
	JAK.Events.removeListeners(this._ec2);
}

JAK.Editor2.Control.Emoticon.prototype._documentDown = function(e, elm) {
	this.close();
}

JAK.Editor2.Control.Emoticon.prototype._popupDown = function(e, elm) {
	JAK.Events.cancelDef(e); /* at neprijdeme o focus editoru */
	JAK.Events.stopEvent(e); /* aby smirovadlo nemerilo mousedown na necem, co tam neni */
	var node = JAK.Events.getTarget(e);
	var index = this._dom.emoticons.indexOf(node);
	if (index == -1) { return; }
	
	var img = node.cloneNode(true);
	JAK.DOM.removeClass(img, "editor-control-emoticon"); /* pred smajlika vlozeni do editoru odebereme classu */
	
	this._editor.focus();
	this._editor.insertNode(img);
	this.close();
}

/* ---------------------------------------------------------------- */

JAK.Editor2.Controls["bold"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"bold", image:"bold.gif"}};
JAK.Editor2.Controls["italic"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"italic", image:"italic.gif"}};
JAK.Editor2.Controls["underline"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"underline", image:"underline.gif"}};
JAK.Editor2.Controls["color"] = {object:JAK.Editor2.Control.Color, options: {command:"forecolor", image:"color.png"}};
JAK.Editor2.Controls["justifycenter"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifycenter", image:"justifycenter.gif"}};
JAK.Editor2.Controls["justifyleft"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifyleft", image:"justifyleft.gif"}};
JAK.Editor2.Controls["justifyright"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifyright", image:"justifyright.gif"}};
JAK.Editor2.Controls["justifyfull"] = {object:JAK.Editor2.Control.TwoStateButton, options: {command:"justifyfull", image:"justifyfull.gif"}};
JAK.Editor2.Controls["link"] = {object:JAK.Editor2.Control.Link, options: {command:"createlink", image:"link.png"}};


JAK.Editor2.Controls["size"] = {object:JAK.Editor2.Control.Size, options: {sizes:[9, 12, 15, 20, 28], labels:["tiny", "small", "normal", "large", "huge"], image:"size.png"}};

JAK.Editor2.Controls["orderedlist"] = {object: JAK.Editor2.Control.TwoStateButton, options:{command:"insertorderedlist", image:"orderedlist.gif"}};
JAK.Editor2.Controls["unorderedlist"] = {object: JAK.Editor2.Control.TwoStateButton, options:{command:"insertunorderedlist", image:"unorderedlist.gif"}};
JAK.Editor2.Controls["emoticon"] = {object:JAK.Editor2.Control.Emoticon, options: {image:"img.png"}}


JAK.Editor2.Controls.Emoticons = {
	sm:[
		":-)",
		":-D",
		"8-)",
		":-((",
		":-(",
		":-o",
		";-)",
		":-O",
		":-P",
		"B-)"
	],
	src: [
		"s01.png",
		"s02.png",
		"s03.png",
		"s08.png",
		"s04.png",
		"s05.png",
		"s06.png",
		"s07.png",
		"s09.png",
		"s10.png"
	]
}



conf = [
	{innerHTML:"<font face='arial'>Arial</font>", value:"arial"},
	{innerHTML:"<font face='comic sans ms'>Comic Sans</font>", value:"comic sans ms"},
	{innerHTML:"<font face='courier new'>Courier New</font>", value:"courier new"},
	{innerHTML:"<font face='georgia'>Georgia</font>", value:"georgia"},
	{innerHTML:"<font face='impact'>Impact</font>", value:"impact"},
	{innerHTML:"<font face='times new roman'>Times New</font>", value:"times new roman"},
	{innerHTML:"<font face='trebuchet'>Tahoma</font>", value:"tahoma"},
	{innerHTML:"<font face='verdana'>Verdana</font>", value:"verdana"}
];
JAK.Editor2.Controls["fontname"] =  {object:JAK.Editor2.Control.FontName, options: {command:"fontname", conf:conf, image:"size.png"}};


