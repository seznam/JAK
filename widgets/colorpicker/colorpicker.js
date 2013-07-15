/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview color picker
 * @version 2.0
 * @author zara
*/   

/**
 * @class widget Color Picker, ktery zpravidla neni treba rucne instantializovat. vyuziva se metoda setup.
 * je mozno v option nastavit moznost vyber barvy "bez barvy", ktera je definovana 100% pruhlednosti. Pri teto moznosti
 * je do inputu vlozen prazdny retezec. Pokud tato volba neni, je prazdny retezec povazovan za cernou.
 *
 * @group jak-widgets
 * @signal colorselect
 */
JAK.ColorPicker = JAK.ClassMaker.makeClass({
	NAME: "JAK.ColorPicker",
	VERSION: "2.0",
	IMPLEMENT: JAK.ISignals,
	DEPEND: [{
		sClass:JAK.Window,
		ver:"2.0"
	}, {
		sClass:JAK.Tabs,
		ver:"2.0"
	}]
});

/**
 * @param {object} [optObj] asociativni pole parametru
 * @param {string} [optObj.imagePath="img/"] cesta k obrazkum s lomitkem na konci
 * @param {object} [optObj.windowOptions] nastaveni pro Window
 * @param {int} [optObj.paletteSize=8] pocet bunek v palete (jedna strana)
 * @param {string[]} [optObj.labels=[]] pole popisku tabu
 * @param {string} [optObj.ok="OK"] popisek tlacitka OK
 * @param {string} [optObj.cancel="Cancel"] popisek tlacitka Cancel
 */
JAK.ColorPicker.prototype.$constructor = function(optObj) {
	this.options = {
		imagePath:"img/",
		windowOptions:{},
		paletteSize:8,
		labels:["Paleta","Duha"],
		ok:"OK",
		cancel:"Cancel",
		transparent: false
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }

	this.ec = [];
	this.dom = {};
	
	this.mode = 0;
	
	this.dim = 179;
	this.width = this.dim + 20 + 20 + 4;
	
	this.moving = 0;

	this.window = null;
	this._build();
	this.tabs.go(0);
	this.color = new JAK.Color();
	this.color.setHSV(0,1,0);
	this._sync();
	this._hide();
	document.body.insertBefore(this.dom.container,document.body.firstChild);
	this.ec.push(JAK.Events.addListener(window,"unload",this,"$destructor"));
	this.ec.push(JAK.Events.addListener(document,"mousedown",this,"_documentClick"));
}

JAK.ColorPicker.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	this.color.$destructor();
	this.tabs.$destructor();
	this.window.$destructor();
	for (var i=0;i<this.cache.length;i++){ 
		var c = this.cache[i][1];
		c.$destructor();
	}
	for (var p in this) { this[p] = null; }
}

/**
 * Staticka funkce, ktera provaze ovladaci prvek s color pickerem a inputem
 * @param {Object} cp instance pickeru
 * @param {Object} clickElm dom node, po jehoz kliknuti se color picker objevi
 * @param {Object} targetElm dom node (typicky input[type="text"]), jehoz vlastnost .value cp ovlada
 */
JAK.ColorPicker.manage = function(cp, clickElm, targetElm) { /* setup picker for two elements */
	var callback = function(color) { targetElm.value = color.a == 1 ? '' : color.x; } //"zadnou barvu" reprezentuje prazdny retezec
	var click = function(e,elm) {
		JAK.Events.cancelDef(e);
		var pos = JAK.DOM.getBoxPosition(clickElm);
		var x = pos.left;
		var y = pos.top + clickElm.offsetHeight + 1;
		cp.pick(x,y,targetElm.value,callback);
	}
	cp.ec.push(JAK.Events.addListener(clickElm,"click",window,click));
}

/**
 * Doporucena jedina funkce na tvorbu color pickeru;
 * vytvori ovladaci prvek (obrazek | button), ktery po kliknuti zobrazi color picker, jez ovlada zadany input
 * @param {String} imageUrl URL obrazku, ktery se pouzije. Pokud je false, namisto obrazku vznikne button
 * @param {String} label pokud je vytvaren obrazek, toto je jeho alt text. Pokud je vytvaren button, 
 *   toto je jeho popisek
 * @param {Object} optObj asociativni pole parametru pro color picker
 * @param {String} id1...idN libovolne mnozstvi idecek pro inputy, na ktere chceme aplikovat color picker
 */
JAK.ColorPicker.setup = function(imageUrl, label, optObj) { /* setup color picker for a variable amount of text fields */
	var cp = new JAK.ColorPicker(optObj);
	for (var i=3;i<arguments.length;i++) {
		var click = false;
		var input = JAK.gel(arguments[i]);
		if (imageUrl) {
			click = JAK.mel("img", {className:"cp-launcher"}, {cursor:"pointer"});
			click.src = imageUrl;
			click.alt = label;
			click.title = label;
		} else {
			click = JAK.cel("input", "cp-launcher");
			click.type = "button";
			click.value = label;
		}
		input.parentNode.insertBefore(click,input.nextSibling);
		JAK.ColorPicker.manage(cp,click,input);
	}
	return cp;
}

/**
 * vrati prave vybranou barvu jako retezec ve tvaru #??????
 */
JAK.ColorPicker.prototype.getColor = function() {
	return this.color.x;
}

JAK.ColorPicker.prototype.setColor = function(c) {
	this.color.parse(c);
	this._sync();
}

JAK.ColorPicker.prototype.pick = function(x,y,color,cb) {
	this.cb = cb;
	this._show();
	this.dom.container.style.left = x+"px";
	this.dom.container.style.top = y+"px";

	/* parse color */
	this.color.parse(color || "");
	if (this.color.v == 0) {
		this.color.setHSV(this.color.h,1,0);
	}

	/* nastaveni barvy na pruhlednou */
	if (!color && this.options.transparent == true) {
		this.color.setAlpha(1);
	}
	this._sync();
}

JAK.ColorPicker.prototype._li = function(label) {
	var li = JAK.mel("li", null, {styleFloat:"left",cssFloat:"left",cursor:"pointer"});
	li.innerHTML = label;
	return li;
}

JAK.ColorPicker.prototype._build = function() {
	this.window = new JAK.Window(this.options.windowOptions);
	this.dom.container = this.window.container;
	this.dom.container.style.position = "absolute";

	this.dom.content = JAK.mel("div", {className:"color-picker"}, {position:"relative"});
	this.window.content.appendChild(this.dom.content);
	this.dom.content.style.width = this.width + "px";
	
	/* Tohle zpusobovalo bug v gecku a webkitu - nebyl videt caret v inputech.
	 * Protoze nevime, k cemu presne to ten debil zara udelal, tak jsme to zakomentovali.
	 */
	// this.ec.push(JAK.Events.addListener(this.dom.container, "mousedown", JAK.Events.cancelDef,false));
	
	this._buildPalette();
	this._buildRainbow();
	this._buildMixer();
	
	this.dom.ul = JAK.mel("ul", null, {listStyleType:"none",margin:"0px",padding:"0px"});
	this.dom.top = JAK.mel("div", null, {position:"relative"});
	
	this.tabs = new JAK.Tabs(this.dom.top,{},this,"_switch");
	var li = this._li(this.options.labels[0]);
	this.dom.ul.appendChild(li);
	this.tabs.addTab(li,this.dom.palette);
	var li = this._li(this.options.labels[1]);
	this.dom.ul.appendChild(li);
	this.tabs.addTab(li,this.dom.rainbow);

	var margin = "25%";
	if (JAK.Browser.client == "safari") { margin = "20%"; }
	
	this.dom.ok = JAK.mel("input", {className:'color-picker-button'}, {marginLeft:margin,cursor:"pointer"});
	this.dom.ok.type = "button";
	this.dom.ok.value = this.options.ok;
	this.dom.cancel = JAK.mel("input", {className:'color-picker-button'}, {marginRight:margin,cursor:"pointer"});
	this.dom.cancel.type = "button";
	this.dom.cancel.value = this.options.cancel;
	
	JAK.DOM.append([this.dom.content,this.dom.ul,this.dom.top,this.dom.mixer,this.dom.ok,this.dom.cancel]);
	
	var clear = JAK.mel("div", null, {clear:"both"});
	this.dom.content.appendChild(clear);
	
	this.ec.push(JAK.Events.addListener(this.dom.ok,"click",this,"_ok"));
	this.ec.push(JAK.Events.addListener(this.dom.cancel,"click",this,"_cancel"));
}

JAK.ColorPicker.prototype._buildPalette = function() {
	this.cache = [];
	var padding = 2;
	var width = Math.floor((this.width - 2*padding) / this.options.paletteSize) - 2*padding - 1;
	var height = Math.floor(width*this.dim/this.width) - 1;
	
	this.dom.palette = JAK.mel("table", null, {borderCollapse:"collapse",height:(this.dim+2)+"px"});
	var tb = JAK.cel("tbody");
	this.dom.palette.appendChild(tb);
	for (var i = 0; i < this.options.paletteSize; i++) {
		var tr = JAK.cel("tr");
		tb.appendChild(tr);
		for (var j = 0; j < this.options.paletteSize; j++) {
			var td = JAK.mel("td", null, {padding:padding+"px"});
			var div = JAK.mel("div", null, {width:width+"px",height:height+"px",cursor:"pointer",border:"1px solid #000"});
			var col = new JAK.Color();
			if (this.options.transparent && i == 0) { //pri moznosti vybrat zadnou barvu prvni policko je specialni pruhledne a sedou radu generuji o jedna kratsi
				if (j == 0) {
					col.setAlpha(1);
					col.setRGB(0,0,0);
					JAK.DOM.setStyle(div,{backgroundColor: 'white', zIndex: '-1'});
					div.appendChild(JAK.mel('div', null, {position: 'absolute', left: '2px', top: '3px', borderLeftColor: 'transparent', borderStyle: 'solid', borderWidth: '0px 0px 16px 22px', borderBottomColor: 'red'}));
					div.appendChild(JAK.mel('div', null, {position: 'absolute', left: '4px', top: '3px', borderLeftColor: 'transparent', borderStyle: 'solid', borderWidth: '0px 0px 16px 21px', borderBottomColor: 'white'}));
				} else {
					col.generatePalette(j-1,i,this.options.paletteSize-1);
					div.style.backgroundColor = col.x;
				}
			} else {
				col.generatePalette(j,i,this.options.paletteSize);
				div.style.backgroundColor = col.x;
			}
			this.cache.push([div,col]);

			JAK.DOM.append([tr,td],[td,div]);
		}
	}
	this.ec.push(JAK.Events.addListener(this.dom.palette,"click",this,"_clickPalette"));
	this.ec.push(JAK.Events.addListener(this.dom.palette,"dblclick",this,"_dblClickPalette"));
}

JAK.ColorPicker.prototype._buildRainbow = function() {
	this.dom.rainbow = JAK.mel("div", null, {position:"relative"});
	this.dom.hv = JAK.mel("div", null, {width:this.dim+"px",height:this.dim+"px",position:"relative",border:"1px solid #000",cursor:"crosshair"});
	this.dom.hv.style.backgroundImage = "url("+this.options.imagePath + "hv.png)";
	this.dom.s = JAK.mel("div", null, {position:"absolute",left:(this.dim+10)+"px",top:"0px",border:"1px solid #000"});
	this.dom.gradient = JAK.cel("img");
	this.dom.gradient.src = this.options.imagePath + "gradient.png";
	if (JAK.Browser.client == "konqueror") {
		this.dom.gradient.style.visibility = "hidden";
	}
	var s = JAK.cel("img");
	var path = this.options.imagePath + "s.png";
	if (JAK.Browser.client == "ie") {
		s.src = this.options.imagePath + "blank.gif";
		s.width = 20;
		s.height = this.dim;
		s.style.filter =  "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+path+"', sizingMethod='scale')";
	} else {
		s.src = path;
	}
	this.dom.s.appendChild(s);
	
	this.dom.circle = JAK.mel("img", null, {position:"absolute"});
	this.dom.circle.src = this.options.imagePath+"circle.gif";
	
	this.dom.slider = JAK.mel("img", null, {position:"absolute",left:"-3px",cursor:"n-resize"});
	this.dom.slider.src = this.options.imagePath+"slider.gif";
	
	JAK.DOM.append([this.dom.rainbow,this.dom.hv,this.dom.s],[this.dom.hv,this.dom.gradient,this.dom.circle],[this.dom.s,this.dom.slider]);
	
	this.ec.push(JAK.Events.addListener(this.dom.hv,"mousedown",this,"_downHV"));
	this.ec.push(JAK.Events.addListener(this.dom.s,"mousedown",this,"_downS"));
	this.ec.push(JAK.Events.addListener(document,"mouseup",this,"_up"));
	this.ec.push(JAK.Events.addListener(document,"mousemove",this,"_move"));
}

JAK.ColorPicker.prototype._buildMixer = function() {
	this.dom.mixer = JAK.mel("div", null, {position:"relative"});
	this.dom.selected = JAK.mel("div", null, {height:"50px",border:"1px solid #000",position:'relative',overflow:'hidden'});
	
	var t = JAK.mel("table", null, {width:"100%"});
	var tb = JAK.cel("tbody");
	t.appendChild(tb);
	this.rows = [];
	for (var i=0;i<3;i++) {
		this.rows[i] = JAK.cel("tr");
		tb.appendChild(this.rows[i]);
	}
	
	this.dom.inputs = {};
	this.dom.inputs.hex = JAK.cel("input", 'color-picker-hex');
	this.dom.inputs.hex.type = "text";
	this.dom.inputs.hex.size = 6;
	this.dom.inputs.hex.maxLength = 7;
	
	var names = [["r","h"],["g","s"],["b","v"]];
	var suffix = [["","°"],["","%"],["","%"]];
	if (JAK.Browser.client == "opera") { suffix[0][1] = ""; }

	var td = JAK.cel("td");
	td.rowSpan = 3;
	this.rows[0].appendChild(td);
	JAK.DOM.append([this.dom.mixer, t],[td,this.dom.selected,JAK.ctext("HEX: "),this.dom.inputs.hex]);
	this.ec.push(JAK.Events.addListener(this.dom.inputs.hex,"keyup",this,"_pressHex"));

	for (var i=0;i<names.length;i++) {
		var tr = this.rows[i];
		var row = names[i];
		for (var j=0;j<row.length;j++) {
			var td = JAK.cel("td", j == 0 ? 'rgb-cell' : 'hsv-cell');
			var name = row[j];
			var inp = JAK.cel("input", 'color-picker-input');
			inp.type = "text";
			inp.size = (JAK.Browser.client == "ie" || JAK.Browser.client == "gecko" ? 1 : 3);
			this.dom.inputs[name] = inp;
			JAK.DOM.append([td,JAK.ctext(name.toUpperCase()+": "),inp,JAK.ctext(suffix[i][j])],[tr,td]);
			var m = (j ? "_pressHSV" : "_pressRGB");
			this.ec.push(JAK.Events.addListener(inp,"keyup",this,m));
		}
	}
}

JAK.ColorPicker.prototype._switch = function(oldI, newI) {
	this.mode = newI;
	switch (this.mode) {
		case 0: /* palette */
			for (var p in this.dom.inputs) {
				var inp = this.dom.inputs[p];
				inp.readOnly = true;
			}
		break;
		case 1: /* rainbow */
			for (var p in this.dom.inputs) {
				var inp = this.dom.inputs[p];
				inp.readOnly = false;
			}
		break;
	}
}

JAK.ColorPicker.prototype._show = function() {
	this.window.show();
}

JAK.ColorPicker.prototype._hide = function() {
	this.window.hide();
}

JAK.ColorPicker.prototype._sync = function(ignoreList) {
	var ignore = ignoreList || {};

	JAK.DOM.clear(this.dom.selected);
	if (this.color.a == 1) {   //"zadna barva" se zobrazuje jinak nez barva
		this.dom.selected.style.backgroundColor = 'white';

		//JAK.DOM.setStyle(div,{backgroundColor: 'white', zIndex: '-1'});
		var width = parseInt(this.dom.selected.offsetWidth);
		this.dom.selected.appendChild(JAK.mel('div', null, {position: 'absolute', left: '0px', top: '0px', borderLeftColor: 'transparent', borderStyle: 'solid', borderWidth: '0px 0px 50px ' + width + 'px', borderBottomColor: 'red'}));
		this.dom.selected.appendChild(JAK.mel('div', null, {position: 'absolute', left: '4px', top: '0px', borderLeftColor: 'transparent', borderStyle: 'solid', borderWidth: '0px 0px 50px ' + (width) +'px', borderBottomColor: 'white'}));


		this.dom.inputs.hex.value = '';
		this.dom.inputs.r.value = '';
		this.dom.inputs.g.value = '';
		this.dom.inputs.b.value = '';
		this.dom.inputs.h.value = '';
		this.dom.inputs.s.value = '';
		this.dom.inputs.v.value = '';
	} else {
		var x = this.color.x;
		this.dom.selected.style.backgroundColor = x;
	
		if (!("hex" in ignore)) {
			this.dom.inputs.hex.value = x;
		}
		if (!("rgb" in ignore)) {
			this.dom.inputs.r.value = this.color.R;
			this.dom.inputs.g.value = this.color.G;
			this.dom.inputs.b.value = this.color.B;
		}

		if (!("hsv" in ignore)) {
			this.dom.inputs.h.value = this.color.H;
			this.dom.inputs.s.value = this.color.S;
			this.dom.inputs.v.value = this.color.V;
		}

		var c = new JAK.Color();
		c.setHSV(this.color.h,1,this.color.v);
		this.dom.s.style.backgroundColor = c.x;
		var h = parseInt(this.color.H) / 359 * (this.dim-1);
		var s = this.color.s;
		var opacity = 1-s;
		var s = parseFloat(s) * (this.dim-1);
		var v = this.dim-parseFloat(this.color.v) * (this.dim-1);
		this.dom.circle.style.left = (h - 7) + "px";
		this.dom.circle.style.top = (v - 8) + "px";
		this.dom.slider.style.top = (s - 2) + "px";
		if (JAK.Browser.client == "ie") {
			var o = Math.round(opacity*100);
			this.dom.gradient.style.filter = "alpha(opacity="+o+")";
		} else {
			this.dom.gradient.style.opacity = opacity;
		}
	}
}

/**
 * schovani CP pri kliku mimo nej
 * @param e
 * @param elm
 */
JAK.ColorPicker.prototype._documentClick = function(e, elm) {
	var trg = JAK.Events.getTarget(e);
	while(trg.parentNode) {
		if (trg.parentNode == this.dom.container) {
			return;
		}
		trg = trg.parentNode;
	}
	this._cancel();
}

JAK.ColorPicker.prototype._cancel = function() {
	this._hide();
}

JAK.ColorPicker.prototype._ok = function() {
	this._hide();
	if (this.cb) { this.cb(this.color); }
	this.makeEvent("colorselect");
}

JAK.ColorPicker.prototype._clickPalette = function(e, elm) {
	var t = JAK.Events.getTarget(e);
	var index = -1;
	for (var i=0;i<this.cache.length;i++) {
		var item = this.cache[i];
		if (item[0] == t || item[0] == t.parentNode) { index = i; }
	}
	if (index == -1) { return; }
	var col = this.cache[index][1];
	this.color.setHSV(col.h,col.s,col.v);
	this.color.setAlpha(col.a);
	this._sync();
}

JAK.ColorPicker.prototype._dblClickPalette = function(e, elm) {
	this._ok();
}

JAK.ColorPicker.prototype._pressHex = function(e, elm) {
	var val = this.dom.inputs.hex.value;
	this.color.setHex(val);
	this._sync({hex:1});
}

JAK.ColorPicker.prototype._pressRGB = function(e, elm) {
	var r = parseInt(this.dom.inputs.r.value,10)/255;
	var g = parseInt(this.dom.inputs.g.value,10)/255;
	var b = parseInt(this.dom.inputs.b.value,10)/255;
	this.color.setRGB(r,g,b);
	this._sync({rgb:1});
}

JAK.ColorPicker.prototype._pressHSV = function(e, elm) {
	var h = parseInt(this.dom.inputs.h.value,10);
	var s = parseInt(this.dom.inputs.s.value,10)/100;
	var v = parseInt(this.dom.inputs.v.value,10)/100;
	this.color.setHSV(h,s,v);
	this._sync({hsv:1});
}

JAK.ColorPicker.prototype._up = function(e, elm) {
	this.moving = 0;
}

JAK.ColorPicker.prototype._move = function(e, elm) {
	if (!this.moving) { return; }
	JAK.Events.cancelDef(e);
	var m = "_update"+this.moving;
	this[m](e);
}

JAK.ColorPicker.prototype._downHV = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.moving = "HV";
	this._updateHV(e);
}

JAK.ColorPicker.prototype._downS = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.moving = "S";
	this._updateS(e);
}

JAK.ColorPicker.prototype._updateHV = function(e) {
	var pos = JAK.DOM.getBoxPosition(this.dom.rainbow);
	var scroll = JAK.DOM.getScrollPos();
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	var x = e.clientX - pos.left;
	var y = e.clientY - pos.top;
	
	if (JAK.Browser.client == "ie") {
		x -= 3;
		y -= 3;
	} else if (JAK.Browser.client == "gecko" || JAK.Browser.client == "safari") {
		x -= 1;
		y -= 1;
	} 
	
	var s = this.color.s;
	if (x < 1) { x = 1; }
	if (x > this.dim) { x = this.dim; }
	if (y < 1) { y = 1; }
	if (y > this.dim) { y = this.dim; }
	
	var h = (x-1) / (this.dim-1) * 359;
	var v = 1 - ((y-1) / (this.dim-1));
	this.color.setHSV(h,s,v);
	this._sync();
}

JAK.ColorPicker.prototype._updateS = function(e) {
	var pos = JAK.DOM.getBoxPosition(this.dom.hv);
	var scroll = JAK.DOM.getScrollPos();
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	var y = e.clientY - pos.top;
	
	if (JAK.Browser.client == "ie") {
		y -= 3;
	} else if (JAK.Browser.client == "gecko" || JAK.Browser.client == "safari") {
		y -= 1;
	} 

	var h = this.color.h;
	var v = this.color.v;
	
	if (y < 1) { y = 1; }
	if (y > this.dim) { y = this.dim; }
	
	var s = (y-1)/(this.dim-1);
	this.color.setHSV(h,s,v);
	this._sync();
}

/* -------------------------------------- */

/**
 * trida reprezentujici barvu
 * @group jak-widgets
 */
JAK.Color = JAK.ClassMaker.makeClass({
	NAME: "JAK.Color",
	VERSION: "2.0"
});

JAK.Color.prototype.$constructor = function() {
	this.h = 0;
	this.s = 1;
	this.v = 0;
	this.a = 0; //0=netransparentni, 1=transparentni, odlisujeme 1, pro plnou transparentnost
}

JAK.Color.prototype.$destructor = function() {
	for (var p in this) { this[p] = null; }
}

JAK.Color.prototype._sync = function() {
	var rgb = this._hsv2rgb(this.h,this.s,this.v);
	this.r = rgb[0];
	this.g = rgb[1];
	this.b = rgb[2];
	this.R = this._1toN(this.r);
	this.G = this._1toN(this.g);
	this.B = this._1toN(this.b);
	this.H = Math.round(this.h);
	this.S = this._1toN(this.s,100);
	this.V = this._1toN(this.v,100);
	this.x = "#"+this._lz(this.R.toString(16))+this._lz(this.G.toString(16))+this._lz(this.B.toString(16));
}

JAK.Color.prototype.setRGB = function(r,g,b) {
	if (isNaN(r) || isNaN(g) || isNaN(b)) { return; }
	var h = 0;
	var s = 0;
	var v = 0;

	var min = 0
	var max = 0;

	if (r >= g && r >= b) {
		max = r;
		min = (g > b) ? b : g;
	} else if (g >= b && g >= r) {
		max = g;
		min = (r > b) ? b : r;
	} else {
		max = b;
		min = (g > r) ? r : g;
	}

	v = max;
	s = (max) ? ((max - min) / max) : 0;

	if (!s) {
		h = 0;
	} else {
		delta = max - min;
		if (r == max) {
			h = (g - b) / delta;
		} else if (g == max) {
			h = 2 + (b - r) / delta;
		} else {
			h = 4 + (r - g) / delta;
		}
		h = Math.round(h * 60);
		if (h < 0) { h += 360; }
	}
	this.setHSV(h,s,v);
}

JAK.Color.prototype.setHSV = function(h,s,v) {
	if (isNaN(h) || isNaN(s) || isNaN(v)) { return; }
	this.h = h;
	this.v = v;
	this.s = s;
	this._sync();
}

JAK.Color.prototype.setHex = function(hex) {
	var regs = hex.match(/ *#(.*)/);
	var c = regs[1];
	if (c.length == 3) {
		var r = parseInt(c.charAt(0),16)*17/255;
		var g = parseInt(c.charAt(1),16)*17/255;
		var b = parseInt(c.charAt(2),16)*17/255;
	} else if (c.length == 6) {
		var r = parseInt(c.slice(0,2),16)/255;
		var g = parseInt(c.slice(2,4),16)/255;
		var b = parseInt(c.slice(4,6),16)/255;
	} else { return; }
	this.setRGB(r,g,b);
}

JAK.Color.prototype.setAlpha = function(a) {
	this.a = a;
}

JAK.Color.prototype.parse = function(str) {
	if (str.indexOf("#") != -1) {
		this.setHex(str);
	} else {
		var regs = str.match(/ *\( *([^,]+) *, *([^,]+) *, *([^\)]+)/);
		if (regs) {
			r = parseInt(regs[1])/255;
			g = parseInt(regs[2])/255;
			b = parseInt(regs[3])/255;
			this.setRGB(r,g,b);
		}
	}
}

JAK.Color.prototype.generatePalette = function(x,y,max) {
	var xx = x/(max-1);
	var yy = y/(max-1);
	
	var h = xx ? (2*(Math.atan(xx/yy) / Math.PI) * 360) : 0;
	if (h > 360) { h = 360; }

	var s = xx+yy;
	if (s > 1) { s = 2-s; }
	
	var v = Math.max(xx,yy);
	
	if (!y) {
		s = 0;
		v = x/(max);
	}
	if (h >= 360) { h = 0; }
	
	this.setHSV(h,s,v);
}

JAK.Color.prototype._hsv2rgb = function(h,s,v) {
	var hi = Math.floor(h/60) % 6;
	var f = h/60 - hi;
	var p = v * (1 - s);
	var q = v * (1 - f*s);
	var t = v * (1 - (1 - f)*s);
	switch (hi) {
		case 0: return [v,t,p]; break;
		case 1: return [q,v,p]; break;
		case 2: return [p,v,t]; break;
		case 3: return [p,q,v]; break;
		case 4: return [t,p,v]; break;
		case 5: return [v,p,q]; break;
	}
}

JAK.Color.prototype._1toN = function(val, n) {
	var max = n || 255;
	return Math.round(val * max);
}

JAK.Color.prototype._lz = function(val) {
	return (val.toString().length > 1 ? val.toString() : "0"+val.toString());
}

