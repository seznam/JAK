/**
 * @overview color picker
 * @version 1.0
 * @author zara
*/   

/**
 * @class Color Picker, zpravidla neni treba rucne instantializovat
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>imagePath</em> - cesta k obrazkum s lomitkem na konci, default "img/"</li>
 *   	<li><em>windowOptions</em> - pole nastaveni pro Window</li>
 *   	<li><em>paletteSize</em> - pocet bunek v palete (jedna strana)</li>
 *   	<li><em>labels</em> - pole popisku tabu</li>
 *   	<li><em>ok</em> - popisek tlacitka OK</li>
 *   	<li><em>cancel</em> - popisek tlacitka Cancel</li>
 * @constructor
 */
SZN.ColorPicker = SZN.ClassMaker.makeClass({
	NAME:"ColorPicker",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.ColorPicker.prototype.$constructor = function(optObj) {
	this.options = {
		imagePath:"img/",
		windowOptions:{},
		paletteSize:8,
		labels:["Paleta","Duha"],
		ok:"OK",
		cancel:"Cancel"
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }
	
	this.ec = [];
	this.dom = {};
	
	this.mode = 0;
	
	this.dim = 179;
	this.width = this.dim + 20 + 20 + 4;
	
	this.moving = 0;
	
	this._build();
	this.tabs.go(1);
	this.color = new SZN.Color();
	this.color.setHSV(0,1,0);
	this._sync();
	this._hide();
	document.body.insertBefore(this.dom.container,document.body.firstChild);
}

SZN.ColorPicker.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
}

/**
 * Staticka funkce, ktera provaze ovladaci prvek s color pickerem a inputem
 * @param {Object} cp instance pickeru
 * @param {Object} clickElm dom node, po jehoz kliknuti se color picker objevi
 * @param {Object} targetElm dom node (typicky input[type="text"]), jehoz vlastnost .value cp ovlada
 */
SZN.ColorPicker.manage = function(cp, clickElm, targetElm) { /* setup picker for two elements */
	var callback = function(color) { targetElm.value = color.x; }
	var click = function(e,elm) { 
		var pos = SZN.Dom.getBoxPosition(clickElm);
		var x = pos.left;
		var y = pos.top + clickElm.offsetHeight + 1;
		cp.pick(x,y,targetElm.value,callback);
	}
	cp.ec.push(SZN.Events.addListener(clickElm,"click",window,click,false,true));
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
SZN.ColorPicker.setup = function(imageUrl, label, optObj) { /* setup color picker for a variable amount of text fields */
	var cp = new SZN.ColorPicker(optObj);
	for (var i=3;i<arguments.length;i++) {
		var click = false;
		var input = SZN.gEl(arguments[i]);
		if (imageUrl) {
			click = SZN.cEl("img",false,"cp-launcher",{cursor:"pointer"});
			click.src = imageUrl;
			click.alt = label;
			click.title = label;
		} else {
			click = SZN.cEl("input",false,"cp-launcher");
			click.type = "button";
			click.value = label;
		}
		input.parentNode.insertBefore(click,input.nextSibling);
		SZN.ColorPicker.manage(cp,click,input);
	}
}

SZN.ColorPicker.prototype.pick = function(x,y,color,cb) {
	this.cb = cb;
	this._show();
	this.dom.container.style.left = x+"px";
	this.dom.container.style.top = y+"px";
	
	if (!color) { return; }
	/* parse color */
	this.color.parse(color);
	if (this.color.v == 0) {
		this.color.setHSV(this.color.h,1,0);
	}
	this._sync();
}

SZN.ColorPicker.prototype._li = function(label) {
	var li = SZN.cEl("li",false,false,{styleFloat:"left",cssFloat:"left",cursor:"pointer"});
	li.innerHTML = label;
	return li;
}

SZN.ColorPicker.prototype._build = function() {
	this.window = new SZN.Window(this.options.windowOptions);
	this.dom.container = this.window.container;
	this.dom.container.style.position = "absolute";

	this.dom.content = SZN.cEl("div",false,"color-picker",{position:"relative"});
	this.window.content.appendChild(this.dom.content);
	this.dom.content.style.width = this.width + "px";
	
	this._buildPalette();
	this._buildRainbow();
	this._buildMixer();
	
	this.dom.ul = SZN.cEl("ul",false,false,{listStyleType:"none",margin:"0px",padding:"0px"});
	this.dom.top = SZN.cEl("div",false,false,{position:"relative"});
	
	this.tabs = new SZN.Tabs(this.dom.top,{},this,"_switch");
	var li = this._li(this.options.labels[0]);
	this.dom.ul.appendChild(li);
	this.tabs.addTab(li,this.dom.palette);
	var li = this._li(this.options.labels[1]);
	this.dom.ul.appendChild(li);
	this.tabs.addTab(li,this.dom.rainbow);
	
	this.dom.ok = SZN.cEl("input",false,false,{cssFloat:"left",styleFloat:"left",marginLeft:"33%",cursor:"pointer"});
	this.dom.ok.type = "button";
	this.dom.ok.value = this.options.ok;
	this.dom.cancel = SZN.cEl("input",false,false,{cssFloat:"right",styleFloat:"right",marginRight:"33%",cursor:"pointer"});
	this.dom.cancel.type = "button";
	this.dom.cancel.value = this.options.cancel;
	
	SZN.Dom.append([this.dom.content,this.dom.ul,this.dom.top,this.dom.mixer,this.dom.ok,this.dom.cancel]);
	
	var clear = SZN.cEl("div",false,false,{clear:"both"});
	this.dom.content.appendChild(clear);
	
	this.ec.push(SZN.Events.addListener(this.dom.ok,"click",this,"_ok",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.cancel,"click",this,"_cancel",false,true));
}

SZN.ColorPicker.prototype._buildPalette = function() {
	this.cache = [];
	var padding = 2;
	var width = Math.floor((this.width - 2*padding) / this.options.paletteSize) - 2*padding - 1;
	var height = Math.floor(width*this.dim/this.width) - 1;
	
	this.dom.palette = SZN.cEl("table",false,false,{borderCollapse:"collapse",height:(this.dim+2)+"px"});
	var tb = SZN.cEl("tbody");
	this.dom.palette.appendChild(tb);
	for (var i=0;i<this.options.paletteSize;i++) {
		var tr = SZN.cEl("tr");
		tb.appendChild(tr);
		for (var j=0;j<this.options.paletteSize;j++) {
			var td = SZN.cEl("td",false,false,{padding:padding+"px"});
			var div = SZN.cEl("div",false,false,{width:width+"px",height:height+"px",cursor:"pointer",border:"1px solid #000"});
			var col = new SZN.Color();
			col.generatePalette(j,i,this.options.paletteSize);
			this.cache.push([div,col]);
			div.style.backgroundColor = col.x;
			SZN.Dom.append([tr,td],[td,div]);
		}
	}
	this.ec.push(SZN.Events.addListener(this.dom.palette,"click",this,"_clickPalette",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.palette,"dblclick",this,"_dblClickPalette",false,true));
}

SZN.ColorPicker.prototype._buildRainbow = function() {
	this.dom.rainbow = SZN.cEl("div",false,false,{position:"relative"});
	this.dom.hv = SZN.cEl("div",false,false,{width:this.dim+"px",height:this.dim+"px",position:"relative",border:"1px solid #000",cursor:"crosshair"});
	this.dom.hv.style.backgroundImage = "url("+this.options.imagePath + "hv.png)";
	this.dom.s = SZN.cEl("div",false,false,{position:"absolute",left:(this.dim+10)+"px",top:"0px",border:"1px solid #000"});
	this.dom.gradient = SZN.cEl("img");
	this.dom.gradient.src = this.options.imagePath + "gradient.png";
	var s = SZN.cEl("img");
	var path = this.options.imagePath + "s.png";
	if (SZN.Browser.client == "ie") {
		s.src = this.options.imagePath + "blank.gif";
		s.width = 20;
		s.height = this.dim;
		s.style.filter =  "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+path+"', sizingMethod='scale')";
	} else {
		s.src = path;
	}
	this.dom.s.appendChild(s);
	
	this.dom.circle = SZN.cEl("img",false,false,{position:"absolute"});
	this.dom.circle.src = this.options.imagePath+"circle.gif";
	
	this.dom.slider = SZN.cEl("img",false,false,{position:"absolute",left:"-3px",cursor:"n-resize"});
	this.dom.slider.src = this.options.imagePath+"slider.gif"
	
	SZN.Dom.append([this.dom.rainbow,this.dom.hv,this.dom.s],[this.dom.hv,this.dom.gradient,this.dom.circle],[this.dom.s,this.dom.slider]);
	
	this.ec.push(SZN.Events.addListener(this.dom.hv,"mousedown",this,"_downHV",false,true));
	this.ec.push(SZN.Events.addListener(this.dom.s,"mousedown",this,"_downS",false,true));
	this.ec.push(SZN.Events.addListener(document,"mouseup",this,"_up",false,true));
	this.ec.push(SZN.Events.addListener(document,"mousemove",this,"_move",false,true));
}

SZN.ColorPicker.prototype._buildMixer = function() {
	this.dom.mixer = SZN.cEl("div",false,false,{position:"relative"});
	this.dom.selected = SZN.cEl("div",false,false,{height:"50px",border:"1px solid #000"});
	
	var t = SZN.cEl("table",false,false,{width:"100%"});
	var tb = SZN.cEl("tbody");
	t.appendChild(tb);
	this.rows = [];
	for (var i=0;i<3;i++) {
		this.rows[i] = SZN.cEl("tr");
		tb.appendChild(this.rows[i]);
	}
	
	this.dom.inputs = {};
	this.dom.inputs.hex = SZN.cEl("input");
	this.dom.inputs.hex.type = "text";
	this.dom.inputs.hex.size = 6;
	this.dom.inputs.hex.maxLength = 7;
	
	var names = [["r","h"],["g","s"],["b","v"]];
	var suffix = [["","°"],["","%"],["","%"]];

	var td = SZN.cEl("td");
	td.rowSpan = 3;
	this.rows[0].appendChild(td);
	SZN.Dom.append([this.dom.mixer, t],[td,this.dom.selected,SZN.cTxt("HEX: "),this.dom.inputs.hex]);
	this.ec.push(SZN.Events.addListener(this.dom.inputs.hex,"keyup",this,"_pressHex",false,true));

	for (var i=0;i<names.length;i++) {
		var tr = this.rows[i];
		var row = names[i];
		for (var j=0;j<row.length;j++) {
			var td = SZN.cEl("td");
			var name = row[j];
			var inp = SZN.cEl("input");
			inp.type = "text";
			inp.size = (SZN.Browser.client == "ie" || SZN.Browser.client == "gecko" ? 1 : 3);
			this.dom.inputs[name] = inp;
			SZN.Dom.append([td,SZN.cTxt(name.toUpperCase()+": "),inp,SZN.cTxt(suffix[i][j])],[tr,td]);
			var m = (j ? "_pressHSV" : "_pressRGB");
			this.ec.push(SZN.Events.addListener(inp,"keyup",this,m,false,true));
		}
	}
}

SZN.ColorPicker.prototype._switch = function(oldI, newI) {
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

SZN.ColorPicker.prototype._show = function() {
	this.window.show();
}

SZN.ColorPicker.prototype._hide = function() {
	this.window.hide();
}

SZN.ColorPicker.prototype._sync = function(ignoreList) {
	var ignore = ignoreList || {};
	
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
	
	var c = new SZN.Color();
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
	if (SZN.Browser.client == "ie") {
		var o = Math.round(opacity*100);
		this.dom.gradient.style.filter = "alpha(opacity="+o+")";
	} else {
		this.dom.gradient.style.opacity = opacity;
	}
}

SZN.ColorPicker.prototype._cancel = function() {
	this._hide();
}

SZN.ColorPicker.prototype._ok = function() {
	this._hide();
	if (this.cb) { this.cb(this.color); }
}

SZN.ColorPicker.prototype._clickPalette = function(e, elm) {
	var t = SZN.Events.getTarget(e);
	var index = -1;
	for (var i=0;i<this.cache.length;i++) {
		var item = this.cache[i];
		if (item[0] == t) { index = i; }
	}
	if (index == -1) { return; }
	var col = this.cache[index][1];
	this.color = col;
	this._sync();
}

SZN.ColorPicker.prototype._dblClickPalette = function(e, elm) {
	this._ok();
}

SZN.ColorPicker.prototype._pressHex = function(e, elm) {
	var val = this.dom.inputs.hex.value;
	this.color.setHex(val);
	this._sync({hex:1});
}

SZN.ColorPicker.prototype._pressRGB = function(e, elm) {
	var r = parseInt(this.dom.inputs.r.value,10)/255;
	var g = parseInt(this.dom.inputs.g.value,10)/255;
	var b = parseInt(this.dom.inputs.b.value,10)/255;
	this.color.setRGB(r,g,b);
	this._sync({rgb:1});
}

SZN.ColorPicker.prototype._pressHSV = function(e, elm) {
	var h = parseInt(this.dom.inputs.h.value,10);
	var s = parseInt(this.dom.inputs.s.value,10)/100;
	var v = parseInt(this.dom.inputs.v.value,10)/100;
	this.color.setHSV(h,s,v);
	this._sync({hsv:1});
}

SZN.ColorPicker.prototype._up = function(e, elm) {
	this.moving = 0;
}

SZN.ColorPicker.prototype._move = function(e, elm) {
	if (!this.moving) { return; }
	SZN.Events.cancelDef(e);
	var m = "_update"+this.moving;
	this[m](e);
}

SZN.ColorPicker.prototype._downHV = function(e, elm) {
	SZN.Events.cancelDef(e);
	this.moving = "HV";
	this._updateHV(e);
}

SZN.ColorPicker.prototype._downS = function(e, elm) {
	SZN.Events.cancelDef(e);
	this.moving = "S";
	this._updateS(e);
}

SZN.ColorPicker.prototype._updateHV = function(e) {
	var pos = SZN.Dom.getBoxPosition(this.dom.rainbow);
	var x = e.clientX - pos.left;
	var y = e.clientY - pos.top;
	
	if (SZN.Browser.client == "ie") {
		x -= 3;
		y -= 3;
	} else if (SZN.Browser.client == "gecko" || SZN.Browser.client == "safari") {
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

SZN.ColorPicker.prototype._updateS = function(e) {
	var pos = SZN.Dom.getBoxPosition(this.dom.hv);
	var y = e.clientY - pos.top;
	
	if (SZN.Browser.client == "ie") {
		y -= 3;
	} else if (SZN.Browser.client == "gecko" || SZN.Browser.client == "safari") {
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

SZN.Color = SZN.ClassMaker.makeClass({
	NAME:"Color",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Color.prototype.$constructor = function() {
	this.h = 0;
	this.s = 1;
	this.v = 0;
}

SZN.Color.prototype._sync = function() {
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

SZN.Color.prototype.setRGB = function(r,g,b) {
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

SZN.Color.prototype.setHSV = function(h,s,v) {
	if (isNaN(h) || isNaN(s) || isNaN(v)) { return; }
	this.h = h;
	this.v = v;
	this.s = s;
	this._sync();
}

SZN.Color.prototype.setHex = function(hex) {
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

SZN.Color.prototype.parse = function(str) {
	if (str.indexOf("#") != -1) {
		this.setHex(str);
	} else {
		var regs = color.match(/ *\( *([^,]+) *, *([^,]+) *, *([^\)]+)/);
		r = parseInt(regs[1])/255;
		g = parseInt(regs[2])/255;
		b = parseInt(regs[3])/255;
		this.setRGB(r,g,b);
	}
}

SZN.Color.prototype.generatePalette = function(x,y,max) {
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

SZN.Color.prototype._hsv2rgb = function(h,s,v) {
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

SZN.Color.prototype._1toN = function(val, n) {
	var max = n || 255;
	return Math.round(val * max);
}

SZN.Color.prototype._lz = function(val) {
	return (val.toString().length > 1 ? val.toString() : "0"+val.toString());
}

