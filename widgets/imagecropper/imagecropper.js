/*
Licencováno pod MIT Licencí

© 2008 Seznam.cz, a.s.

Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.

Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené 
soubory (dále jen „software“) je oprávněn k nakládání se softwarem bez 
jakýchkoli omezení, včetně bez omezení práva software užívat, pořizovat si 
z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě 
(podlicence) či prodávat jeho kopie, za následujících podmínek:

- výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo 
podstatných součástech Softwaru.

- software je poskytován tak jak stojí a leží, tzn. autor neodpovídá 
za jeho vady, jakož i možné následky, ledaže věc nemá vlastnost, o níž autor 
prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.



Licenced under the MIT License

Copyright (c) 2008 Seznam.cz, a.s.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


/**
 * @overview image cropper
 * @version 1.0
 * @author zara
*/   

/**
 * @class Image Cropper
 * @group jak-widgets
 */
SZN.ImageCropper = SZN.ClassMaker.makeClass({
	NAME:"ImageCropper",
	VERSION:"1.0",
	CLASS:"class"
});

/**
 * @param {Node} image obrazek, ze ktereho budeme vyrezavat
 * @param {Node} form formular, do ktereho se uklada informace o vyrezech, muze byt false
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>imagePath</em> - cesta k obrazkum s lomitkem na konci, default "img/"</li>
 *   	<li><em>dimensions</em> - bool, maji-li se ukazovat u kazdeho vyrezu rozmery</li>
 *   	<li><em>zIndex</em> - zakladni z-index pro vyrezy, default 100</li>
 *   </ul>
 */
SZN.ImageCropper.prototype.$constructor = function(image, form, optObj) {
	this.options = {
		imagePath:"img/",
		dimensions:true,
		zIndex:100
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }
	
	this.ec = [];
	this.active = false; /* active view */
	this.image = SZN.gEl(image);
	this.form = (form ? SZN.gEl(form) : false);
	
	this.container = SZN.cEl("div",false,false,{backgroundColor:"#000",position:"relative"});
	this.image.parentNode.replaceChild(this.container,this.image);
	this.container.appendChild(this.image);
	
	this.views = [];
	this.viewIndex = 0;
	
	this.iw = this.image.width || 0;
	this.ih = this.image.height || 0;
	this.image.style.opacity = 0.3;
	this.image.style.KHTMLOpacity = 0.3;
	this.image.style.filter = "alpha(opacity=30)";
	
	this.ec.push(SZN.Events.addListener(document,"mouseup",this,"_mouseup",false,true));
	this.ec.push(SZN.Events.addListener(document,"mousemove",this,"_mousemove",false,true));
	
	this.ec.push(SZN.Events.addListener(this.image,"load",this,"_load",false,true));
	this.container.style.width = this.iw+"px";
	this.container.style.height = this.ih+"px";
	
	if (SZN.Browser.client == "ie" && SZN.Browser.version == 6) { document.execCommand("BackgroundImageCache", false, true); };
}

SZN.ImageCropper.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	while (this.views.length) {
		this.deleteView(this.views[0]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.ImageCropper.prototype._load = function() {
	this.iw = this.image.width;
	this.ih = this.image.height;
	this.container.style.width = this.iw+"px";
	this.container.style.height = this.ih+"px";
}

SZN.ImageCropper.prototype._findView = function(view) {
	var index = -1;
	for (var i=0;i<this.views.length;i++) {
		if (view == this.views[i]) { index = i; }
	}
	return index;
}

/**
 * Prida k obrazku vyrez a vrati referenci na nej. Vyrez bude zapnuty, ale ne viditelny.
 * @param {String} name nazev vyrezu - tento bude odeslan na server
 * @param {Object} dimensions popis rozmeru vyrezu, obsahuje tyto polozky:
 * <ul> 
 *   <li><em>x</em> - interval povolene sirky, polouzavreny lze specifikovat jako "100-"</li>
 *   <li><em>y</em> - interval povolene vysky, polouzavreny lze specifikovat jako "100-"</li>
 *   <li><em>defaultX</em> - vychozi sirka vyrezu</li>
 *   <li><em>defaultY</em> - vychozi vyska vyrezu</li>
 * </ul> 
 * @param {Bool} fixedAspect ma-li mit vyrez pevny pomer stran
 * @param {String} color barva vyrezu
 */
SZN.ImageCropper.prototype.createView = function(name, dimensions, fixedAspect, color) {
	this.viewIndex++;
	var view = new SZN.ImageCropper.View(this, this.viewIndex, name, dimensions, fixedAspect, color);
	this.views.push(view);
	return view;
}

/**
 * Odstrani trvale vyrez
 * @param {Object} reference na vyrez, ktery ma byt odstranen
 */
SZN.ImageCropper.prototype.deleteView = function(view) {
	var index = this._findView(view);
	if (index == -1) { return; }
	this.views[index].$destructor();
	this.views.splice(index,1);
}

/**
 * Zobrazi vyrez
 * @param {Object} reference na vyrez, ktery ma byt zobrazen
 * @param {Bool} hideOthers maji-li se schovat ostatni viditelne vyrezy
 */
SZN.ImageCropper.prototype.showView = function(view, hideOthers) {
	var index = this._findView(view);
	if (index == -1) { return; }
	if (hideOthers) {
		for (var i=0;i<this.views.length;i++) {
			this.hideView(this.views[i]);
		}
	}
	this.views[index]._show();
}

/**
 * Schova viditelny vyrez
 * @param {Object} reference na vyrez, ktery ma byt schovan
 */
SZN.ImageCropper.prototype.hideView = function(view) {
	var index = this._findView(view);
	if (index == -1) { return; }
	this.views[index]._hide();
}

/**
 * Zapne vyrez tak, ze se jeho souradnice budou posilat ve formulari
 * @param {Object} reference na vyrez, ktery ma byt zapnut
 */
SZN.ImageCropper.prototype.enableView = function(view) {
	var index = this._findView(view);
	if (index == -1) { return; }
	this.views[index]._enable();
}

/**
 * Vypne vyrez tak, ze se jeho souradnice nebudou posilat ve formulari
 * @param {Object} reference na vyrez, ktery ma byt vypnut
 */
SZN.ImageCropper.prototype.disableView = function(view) {
	var index = this._findView(view);
	if (index == -1) { return; }
	this.views[index]._disable();
}

/**
 * Zmeni rozmery daneho vyrezu
 * @param {Object} reference na vyrez, kteremu se meni rozmery
 * @param {Number} w nova sirka
 * @param {Number} h nova vyska
 */
SZN.ImageCropper.prototype.resizeView = function(view, w, h) {
	var index = this._findView(view);
	if (index == -1) { return; }
	this.views[index]._resize(w,h);
}

/**
 * Zmeni pozici daneho vyrezu
 * @param {Object} reference na vyrez, kteremu se meni pozice
 * @param {Number} x nova leva souradnice leveho horniho rohu
 * @param {Number} y nova horni souradnice leveho horniho rohu
 */
SZN.ImageCropper.prototype.moveView = function(view, x, y) {
	var index = this._findView(view);
	if (index == -1) { return; }
	this.views[index]._move(x,y);
}

SZN.ImageCropper.prototype._mouseup = function(e, elm) {
	if (!this.active) { return; }
	this.active._mouseup(e, elm);
	this.active = false;
}

SZN.ImageCropper.prototype._mousemove = function(e, elm) {
	if (!this.active) { return; }
	SZN.Events.cancelDef(e);
	this.active._mousemove(e, elm);
}

/* ---------------------------------------------------------- */

/**
 * @private
 * @augments SZN.SigInterface
 * @group jak-widgets
 */
SZN.ImageCropper.View = SZN.ClassMaker.makeClass({
	NAME:"View",
	VERSION:"1.0",
	CLASS:"class",
	IMPLEMENT:SZN.SigInterface
});

SZN.ImageCropper.View.prototype.$constructor = function(owner, index, name, dimensions, fixedAspect, color) {
	this.owner = owner;
	this.index = index;
	this.name = name;
	this.ec = [];
	this.enabled = false;
	this.visible = false;
	this.action = false;
	this.color = color || "#fff";
	
	var x = dimensions.x;
	var y = dimensions.y;
	if (typeof(x) == "string" && x.indexOf("-") != -1) {
		var r = x.match(/([^-]*)-([^-]*)/);
		this.minX = parseInt(r[1]) || 0;
		this.maxX = parseInt(r[2]) || 0;
	} else {
		this.minX = x;
		this.maxX = x;
	}
	
	if (typeof(y) == "string" && y.indexOf("-") != -1) {
		var r = y.match(/([^-]*)-([^-]*)/);
		this.minY = parseInt(r[1]) || 0;
		this.maxY = parseInt(r[2]) || 0;
	} else {
		this.minY = y;
		this.maxY = y;
	}
	
	this.x = 0;
	this.y = 0;
	this.w = this.minX || this.maxX;
	this.h = this.minY || this.maxY;
	this.aspect = fixedAspect ? (this.w / this.h): 0;

	if (dimensions.defaultX) { this.w = dimensions.defaultX; }
	if (dimensions.defaultY) { this.h = dimensions.defaultY; }
	
	if (this.aspect) {
		var alpha = Math.atan(1/this.aspect);
		this.cos = Math.cos(alpha);
		this.sin = Math.sin(alpha);
	}

	if (SZN.Browser.client == "ie") {
		this.input = SZN.cEl("<input name='"+this.name+"' />");
	} else {
		this.input = SZN.cEl("input");
		this.input.name = this.name;
	}
	this.input.type = "hidden";
	
	this.mx = 0; /* mouse coords*/
	this.my = 0;
	
	this._build();
	this._enable();
}

SZN.ImageCropper.View.prototype.$destructor = function() {
	this._hide();
	this._disable();
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	if (this.owner.form) {
		for (var p in this.inputs) {
			this.inputs[p].parentNode.removeChild(this.inputs[p]);
		}
	}
	if (this.active) { 
		this.container.parentNode.removeChild(this.container);
	}
}

SZN.ImageCropper.View.prototype._build = function() {
	this.container = SZN.cEl("div",false,false,{position:"absolute",borderStyle:"solid",borderWidth:"1px",borderColor:this.color,cursor:"move"});
	this.container.style.zIndex = this.owner.options.zIndex+this.index;
	this.container.style.backgroundImage = "url("+this.owner.image.src+")";
	this.container.style.backgroundRepeat = "no-repeat";

	var s = {
		position:"absolute",
		width:"9px",
		height:"9px",
		overflow:"hidden"
	}
	
	if (this.minX != this.maxX) { /* resize w */
		this.resizeE = SZN.cEl("div",false,false,{right:"-9px",top:"50%",cursor:"e-resize"});
		for (var p in s) { this.resizeE.style[p] = s[p]; }
		this.container.appendChild(this.resizeE);
		this.resizeE.style.backgroundImage = "url("+this.owner.options.imagePath+"cropper-e.gif)";
		this.ec.push(SZN.Events.addListener(this.resizeE,"mousedown",this,"_startResize",false,true));
	}
	if (this.minY != this.maxY) { /* resize h */ 
		this.resizeS = SZN.cEl("div",false,false,{left:"50%",bottom:"-9px",cursor:"s-resize"});
		for (var p in s) { this.resizeS.style[p] = s[p]; }
		this.container.appendChild(this.resizeS);
		this.resizeS.style.backgroundImage = "url("+this.owner.options.imagePath+"cropper-s.gif)";
		this.ec.push(SZN.Events.addListener(this.resizeS,"mousedown",this,"_startResize",false,true));
	}
	if (this.minX != this.maxX && this.minY != this.maxY) { /* resize wh */
		this.resize = SZN.cEl("div",false,false,{right:"-9px",bottom:"-9px",cursor:"se-resize"});
		for (var p in s) { this.resize.style[p] = s[p]; }
		this.container.appendChild(this.resize);
		this.resize.style.backgroundImage = "url("+this.owner.options.imagePath+"cropper-se.gif)";
		this.ec.push(SZN.Events.addListener(this.resize,"mousedown",this,"_startResize",false,true));
	}
	
	/* dimensions */
	this.dims = SZN.cEl("div",false,false,{position:"absolute",left:"-1px",top:"-16px",height:"14px",borderStyle:"solid",borderWidth:"1px",borderColor:this.color,color:this.color,overflow:"visible",fontSize:"11px",fontFamily:"arial",padding:"0px 1px"});
	
	if (this.owner.options.dimensions) { this.container.appendChild(this.dims); }
	
	/* move */
	this.ec.push(SZN.Events.addListener(this.container,"mousedown",this,"_startMove",false,true));
	
	this._updateDOM(this.x,this.y,this.w,this.h);
	this._updateForm();
}

SZN.ImageCropper.View.prototype._enable = function() {
	if (this.enabled) { return; }
	this.enabled = true;
	if (this.owner.form) { this.owner.form.appendChild(this.input); }
}

SZN.ImageCropper.View.prototype._disable = function() {
	if (!this.enabled) { return; }
	this.enabled = false;
	if (this.owner.form) { this.input.parentNode.removeChild(this.input); }
}

SZN.ImageCropper.View.prototype._show = function() {
	if (this.visible) { return; }
	this.visible = true;
	this.owner.container.appendChild(this.container);
}

SZN.ImageCropper.View.prototype._hide = function() {
	if (!this.visible) { return; }
	this.visible = false;
	this.container.parentNode.removeChild(this.container);
}

SZN.ImageCropper.View.prototype._resize = function(w,h) {
	this.w = parseInt(w,10);
	this.h = parseInt(h,10);
	this._updateDOM(this.x,this.y,w,h);
	this._updateForm();
}

SZN.ImageCropper.View.prototype._move = function(x,y) {
	this.x = parseInt(x,10);
	this.y = parseInt(y,10);
	this._updateDOM(x,y,this.w,this.h);
	this._updateForm();
}

SZN.ImageCropper.View.prototype._updateDOM = function(l,t,w,h) {
	this.container.style.left = Math.round(l) + "px";
	this.container.style.top = Math.round(t) + "px";
	this.container.style.width = Math.round(w-2) + "px";
	this.container.style.height = Math.round(h-2) + "px";
	this.container.style.backgroundPosition = Math.round(-l-1) + "px " + Math.round(-t-1) + "px";
	if (this.owner.options.dimensions) {
		this.dims.innerHTML = Math.round(w) + "&times;" + Math.round(h);
	}
}

SZN.ImageCropper.View.prototype._updateForm = function() {
	this.makeEvent("cropperchange");
	var str = this.getCoordinates();
	this.input.value = str;
}

/**
 * vrati prave vybranou oblast jako retezec ve tvaru x1,y1,x2,y2
 */
SZN.ImageCropper.View.prototype.getCoordinates = function() {
	return Math.round(this.x)+","+Math.round(this.y)+","+Math.round(this.x+this.w-1)+","+Math.round(this.y+this.h-1);
}

SZN.ImageCropper.View.prototype._adjust = function(dx,dy,dw,dh) {
	var iw = this.owner.iw;
	var ih = this.owner.ih;
	if (dx) { 
		if (this.x + dx < 0) { dx = -this.x; }
		if (this.x + this.w - 1 + dx > iw) { dx = iw - this.x - this.w; }
		this.nx = this.x+dx;
	}
	if (dy) { 
		if (this.y + dy < 0) { dy = -this.y; }
		if (this.y + this.h - 1 + dy > ih) { dy = ih - this.y - this.h; }
		this.ny = this.y+dy;
	}

	if (this.aspect && (dw || dh)) {
		var dist = Math.sqrt(dw*dw + dh*dh);
		var sign = (dw <= 0 && dh <=0 ? -1 : 1);
		dw = this.cos * dist * sign;
		dh = this.sin * dist * sign;
	}

	var nw = this.w+dw;
	var nh = this.h+dh;
	var fx = (this.minX && nw < this.minX) || (this.maxX && nw > this.maxX) || (nw < 1);
	var fy = (this.minY && nh < this.minY) || (this.maxY && nh > this.maxY) || (nh < 1);
	
	if (this.aspect) {
		if (fx || fy) { 
		} else {
			this.nw = nw;
			this.nh = nh;
		}
	} else {
		if (dw && !fx) { this.nw = nw; }
		if (dh && !fy) { this.nh = nh; }
	}
	this._updateDOM(this.nx,this.ny,this.nw,this.nh);
}

SZN.ImageCropper.View.prototype._mouseup = function(e, elm) {
	this.x = this.nx;
	this.y = this.ny;
	this.w = this.nw;
	this.h = this.nh;
	this._deactivate();
	this.container.style.borderStyle = "solid";
	this.dims.style.borderStyle = "solid";
	this._updateForm();
}

SZN.ImageCropper.View.prototype._mousemove = function(e, elm) {
	var dx = e.clientX - this.mx;
	var dy = e.clientY - this.my;
	switch (this.action) {
		case "move": this._adjust(dx,dy,0,0); break;
		case "resize-e": this._adjust(0,0,dx,0); break;
		case "resize-s": this._adjust(0,0,0,dy); break;
		case "resize": this._adjust(0,0,dx,dy); break;
	}
}

SZN.ImageCropper.View.prototype._startMove = function(e, elm) {
	this._activate(e, "move");
}

SZN.ImageCropper.View.prototype._startResize = function(e, elm) {
	SZN.Events.stopEvent(e);
	if (elm == this.resizeE) {
		this._activate(e, "resize-e");
	} else if (elm == this.resizeS) {
		this._activate(e, "resize-s");
	} else {
		this._activate(e, "resize");
	}
}

SZN.ImageCropper.View.prototype._activate = function(e, action) {
	SZN.Events.cancelDef(e);
	SZN.Events.stopEvent(e);
	this.mx = e.clientX;
	this.my = e.clientY;
	this.owner.active = this;
	this.action = action;
	this.container.style.borderStyle = "dashed";
	this.dims.style.borderStyle = "dashed";
	
	this.nx = this.x;
	this.ny = this.y;
	this.nw = this.w;
	this.nh = this.h;

	/* raise */
	var max = 0;
	for (var i=0;i<this.owner.views.length;i++) {
		var v = this.owner.views[i];
		var zi = parseInt(v.container.style.zIndex);
		if (zi > max) { max = zi; }
	}
	for (var i=0;i<this.owner.views.length;i++) {
		var v = this.owner.views[i];
		var zi = parseInt(v.container.style.zIndex);
		if (zi > this.container.style.zIndex) { v.container.style.zIndex = zi-1; }
	}
	this.container.style.zIndex = max;
}

SZN.ImageCropper.View.prototype._deactivate = function() {
	this.action = false;
	this.container.style.borderStyle = "solid";
}
