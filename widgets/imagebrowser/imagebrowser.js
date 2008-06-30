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
 * @overview Image browser
 * @version 2.0
 * @name SZN.ImageBrowser
 * @author bratr, zara
 */   
SZN.ImageBrowser = SZN.ClassMaker.makeClass({
	NAME: "ImageBrowser",
	VERSION: "2.0",
	CLASS: "class"
});

/**
 * @class Image browser
 * @constructor
 * @param {String || Element} container prvek se statickymi nahledy
 * @param {Array} data pole s informacemi o obrazcich
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	<ul>
 *      <li><em>fixed</em> - zapnuti(true)/vypnuti(false) scrollovani galerie defaultne zapnuto</li>
 *		<li><em>width</em> - sirka velkeho obrazku</li>
 *		<li><em>height</em> - vyska velkeho obrazku</li>
 *		<li><em>thumbWidth</em> - sirka jednoho nahledu</li>
 *		<li><em>thumbHeight</em> - vyska velkeho obrazku</li>
 *		<li><em>thumbBorder</em> - sirka borderu nahledu</li>
 *		<li><em>zoomLinkId</em> - ID prvku, ktery otevira galerii</li>
 *		<li><em>mainLinkId</em> - ID obrazku, ktery otevira galerii</li>
 *		<li><em>imagePath</em> - cesta k obrazkum se stiny</li>
 *		<li><em>imageFormat</em> - pripona obrazku (png/gif/jpg)</li>
 *		<li><em>showNavigation</em> - true/false, ma-li byt videt navigace (prev/next)</li>
 *		<li><em>useShadow</em> - true/false, ma-li byt okolo galerie stin</li>
 *		<li><em>parent</em> - pokud false, pak je galerie centrovana nad vsim; pokud 
 *        non-false, pak jde o id/prvek, do ktereho se galerie vytvori</li>
 *		<li><em>shadowSizes</em> - velikosti stinu podle smeru hodinovych rucicek</li>
 *		<li><em>zIndex</em> - z-index vyskoceneho image browseru, default false</li>
 *	</ul>
 */
SZN.ImageBrowser.prototype.$constructor = function(container, data, optObj) {
	this.options = {
		fixed: true,
		width: 640,
		height: 480,
		thumbWidth: 100,
		thumbHeight: 75,
		thumbBorder: 0,
		zoomLinkId: "",
		mainLinkId: "",
		imagePath: "img/",
		imageFormat: "png",
		showNavigation: true,
		useShadow: false,
		parent: false,
		zIndex: false,
		shadowSizes: [22,22,22,22]
	}
	
	this.visible = false;
	this.ec = [];
	this.dom = {};
	this.objCache = [];
	this.window = false;
	this.defaultIndex = 0;
	this.index = -1; /* index of displayed big image */
	
	this.container = SZN.gEl(container);

	for (var p in optObj) { this.options[p] = optObj[p]; }

	//alert(this.options.useShadow);

	this.data = [];
	for (var i=0;i<data.length;i++) {
		var item = data[i];
		var o = {};
		o.alt = item.alt;
		o.big = item.big.url;
		o.small = item.small.url;
		o.flash = item.flash;
		if (item.main) { this.defaultIndex = i; }
		this.data.push(o);
	}
	
	if (this.container) {
		var imgLinks = this.container.getElementsByTagName('a');
		for (var i=0;i<imgLinks.length;i++) {
			var link = imgLinks[i];
			this.objCache.push(new SZN.ImageBrowser.ImageLink(this,i,link));
		}
	}

	var link = SZN.gEl(this.options.mainLinkId);
	if (link) { 
		this.objCache.push(new SZN.ImageBrowser.ImageLink(this,this.defaultIndex,link)); 
	}
	var link = SZN.gEl(this.options.zoomLinkId);
	if (link) {
		this.objCache.push(new SZN.ImageBrowser.ImageLink(this,this.defaultIndex,link)); 
	}

	this._buildDom();
	
};

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.ImageBrowser.prototype.$destructor = function() {
	for (var i=0;i<this.data.length;i++) { /* destroy all thumbs */
		this.data[i].obj.$destructor();
	}
	for (var i=0;i<this.objCache.length;i++) {
		this.objCache[i].$destructor();
	}

	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.ImageBrowser.prototype._buildDom = function() {
	/* common */
	if (this.options.useShadow) {
		var winopts = {
			imagePath:this.options.imagePath,
			imageFormat:this.options.imageFormat,
			sizes:this.options.shadowSizes
		}
		this.window = new SZN.Window(winopts);
		this.dom.container = this.window.container;
		this.dom.content = this.window.content;
	} else {
		this.dom.container = SZN.cEl("div",false,false,{position:"relative"});
		this.dom.content = this.dom.container;
	}

	var tw = this.data.length * this.options.thumbWidth;
	var th = this.options.thumbHeight + 2*this.options.thumbBorder;
	if (tw > this.options.width) { th += 17; }
	SZN.Dom.addClass(this.dom.content,"image-browser-content");
	
	var table = SZN.cEl("table",false,false,{borderCollapse:"collapse"});
	var tb = SZN.cEl("tbody");
	var tr = SZN.cEl("tr");
	var mainPart = SZN.cEl("td",false,"image-browser-image",{width:this.options.width+"px",height:this.options.height+"px",padding:"0px",overflow:"hidden"}); /* parent for main image */
	SZN.Dom.append([this.dom.content,table],[table,tb],[tb,tr],[tr,mainPart]);
	
	var thumbsPort = SZN.cEl("div",false,"image-browser-port",{position:"relative",overflow:"auto",width:this.options.width+"px",height:th+"px"}); /* viewport */

	var thumbs = SZN.cEl("table",false,"image-browser-thumbs",{borderCollapse:"collapse"});
	var tb = SZN.cEl("tbody");
	var tr = SZN.cEl("tr");
	
	var dummy = SZN.cTxt("...");
	mainPart.appendChild(dummy);
	
	/* navigation */
	var prev = SZN.cEl("div",false,"image-browser-prev");
	var next = SZN.cEl("div",false,"image-browser-next");
	var close = SZN.cEl("div",false,"image-browser-close");
	
	this.dom.prev = prev;
	this.dom.next = next;
	
	prev.title = "Předchozí";
	next.title = "Následující";
	close.title = "Zavřít";
	
	if (this.options.showNavigation) {
		this.ec.push(SZN.Events.addListener(prev, "click", this, "_prev", false, true));
		this.ec.push(SZN.Events.addListener(next, "click", this, "_next", false, true));
		this.ec.push(SZN.Events.addListener(prev, "mousedown", this, "_cancel", false, true));
		this.ec.push(SZN.Events.addListener(next, "mousedown", this, "_cancel", false, true));
	}
	if (!this.options.parent) {
		this.ec.push(SZN.Events.addListener(close, "click", this, "_hide", false, true));
		this.ec.push(SZN.Events.addListener(mainPart,"click",this,"_hide",false,true));
	}

	/* thumbs */
	for (var i=0;i<this.data.length; i++) {
		var data = this.data[i];
		var td = SZN.cEl("td",false,false,{padding:"0px"});
		var div = SZN.cEl("div",false,false,{overflow:"hidden",width:this.options.thumbWidth+"px"});
		var tmp = SZN.cTxt("...");
		SZN.Dom.append([td,div],[div,tmp]);
		var img = new SZN.ImageBrowser.ScaledImage(data.small,this.options.thumbWidth,this.options.thumbHeight,tmp);
		this.objCache.push(img);
		img.title = data.alt;
		
		data.div = div;
		data.obj = new SZN.ImageBrowser.ImageLink(this, i, td);
		SZN.Dom.append([tr,td]);
	}
	
	
	/* active image */
	var active = SZN.cEl("div",false,"image-browser-active",{position:"absolute"});
	thumbsPort.appendChild(active);
	
	this.dom.mainPart = mainPart;
	this.dom.thumbs = thumbs;
	this.dom.port = thumbsPort;
	this.dom.active = active;

	SZN.Dom.append([thumbs,tb],[tb,tr]);
	SZN.Dom.append([this.dom.content,thumbsPort],[thumbsPort,thumbs]);
	if (this.options.showNavigation && this.data.length > 1) { SZN.Dom.append([this.dom.content,prev,next]); }
	
	if (this.options.parent) { /* inside: immediately show and display first image */
		this.options.parent.appendChild(this.dom.container);
		this._showImage(this.defaultIndex);
	} else { /* outside: create root dimmer and wait for activation; append close button */
		this.dom.root = SZN.cEl("div",false,"image-browser-root",{position:"absolute",left:"0px",top:"0px"});
		this.dom.container.style.position = "absolute";
		this.dom.container.style.left = "0px";
		this.dom.container.style.top = "0px";
		if (this.options.zIndex) {
			this.dom.root.style.zIndex = this.options.zIndex;
			this.dom.container.style.zIndex = this.options.zIndex;
		}
		this.dom.content.appendChild(close);
		this._hide();
		if (this.options.fixed) {
			this.ec.push(SZN.Events.addListener(window, "resize", this, "_reposition", false, true));
			this.ec.push(SZN.Events.addListener(window, "scroll", this, "_reposition", false, true));
  		}
	}
}

SZN.ImageBrowser.prototype._showImage = function(index) {
	this._show();
	
	if (this.index != -1) {
		var old = this.data[this.index];
		SZN.Dom.removeClass(old.div,"active");
	}
	this.index = index;
	var data = this.data[this.index];
	SZN.Dom.addClass(data.div,"active");

	/* draw big stuff */
	
	if (data.flash) { /* flash */
		SZN.Dom.clear(this.dom.mainPart);
		var em = SZN.cEl("embed");
		em.setAttribute("quality","high");
		em.setAttribute("pluginspage","http://www.macromedia.com/go/getflashplayer");
		em.setAttribute("type","application/x-shockwave-flash");
		em.setAttribute("width",this.options.width);
		em.setAttribute("height",this.options.height);
		em.setAttribute("allowfullscreen","true");
		em.setAttribute("src",data.big);
		em.setAttribute("flashvars",data.flash);
		this.dom.mainPart.appendChild(em);
		this.dom.mainPart.innerHTML = this.dom.mainPart.innerHTML;
	} else { /* picture */
		var img = new SZN.ImageBrowser.ScaledImage(data.big,this.options.width,this.options.height,this.dom.mainPart.firstChild);

		this.objCache.push(img);
		if (!this.options.parent) { img.title = "Klikni pro zavření"; }
	}
	
	
	/* scroll thumbs */
	var leftOffset = data.obj.offset;
	var sl = Math.round(leftOffset-(this.options.width/2-this.options.thumbWidth/2));
	this.dom.port.scrollLeft = sl;

	var pos1 = SZN.Dom.getBoxPosition(data.div.parentNode);
	var pos2 = SZN.Dom.getBoxPosition(this.dom.port);
	
	var act = this.dom.active;
	act.style.left = (pos1.left-pos2.left)+"px";
	act.style.top = (pos1.top-pos2.top)+"px";
	var w1 = parseInt(SZN.Dom.getStyle(data.div,"borderLeftWidth")) || 0;
	w1 -= parseInt(SZN.Dom.getStyle(act,"borderLeftWidth")) || 0;
	
	var w2 = parseInt(SZN.Dom.getStyle(data.div,"borderRightWidth")) || 0;
	w2 -= parseInt(SZN.Dom.getStyle(act,"borderRightWidth")) || 0;
	
	var h1 = parseInt(SZN.Dom.getStyle(data.div,"borderTopWidth")) || 0;
	h1 -= parseInt(SZN.Dom.getStyle(act,"borderTopWidth")) || 0;
	
	var h2 = parseInt(SZN.Dom.getStyle(data.div,"borderBottomWidth")) || 0;
	h2 -= parseInt(SZN.Dom.getStyle(act,"borderBottomWidth")) || 0;
	
	if (document.compatMode == 'BackCompat') {
		w1 = w2 = h1 = h2 = 0;
	}
	
	act.style.width = (this.options.thumbWidth + w1 + w2) + "px";
	this.dom.active.style.height = (this.options.thumbHeight + h1 + h2) + "px";

	/* prev - next visibility on start looking */
	this.dom.prev.style.visibility = (this.index == 0 ? 'hidden' : 'visible');
	this.dom.next.style.visibility = (this.index == this.data.length-1 ? 'hidden' : 'visible');
}

SZN.ImageBrowser.prototype._prev = function() {
	if (this.index == 0) { return; }
	this._showImage(this.index-1);
}

SZN.ImageBrowser.prototype._next = function() {
	if (this.index == this.data.length-1) { return; }
	this._showImage(this.index+1);
}

SZN.ImageBrowser.prototype._hide = function() {
	if (!this.visible) { return; }
	this.visible = false;
	SZN.Dom.elementsHider(this.dom.container, false, "show");
	if (!this.options.parent) {
		this.dom.root.style.display = "none";
	}
	if (this.window) {
		this.window.hide();
	} else {
		this.dom.container.style.display = "none";
	}
}

SZN.ImageBrowser.prototype._show = function() {
	if (this.visible) { return; }
	this.visible = true;
	if (!this.options.parent) {
		document.body.appendChild(this.dom.root);
		document.body.appendChild(this.dom.container);
		this.dom.root.style.left = "0px";
		this.dom.root.style.top = "0px";
		this.dom.container.style.left = "0px"
		this.dom.container.style.top = "0px"
		this.dom.root.style.display = "";
		this._reposition();
	}
	if (this.window) {
		this.window.show();
	} else {
		this.dom.container.style.display = "";
	}
	SZN.Dom.elementsHider(this.dom.container, false, "hide");
}

SZN.ImageBrowser.prototype._reposition = function() {
	var docSize = SZN.Dom.getDocSize();
	var scrollPos = SZN.Dom.getScrollPos();

	this.dom.root.style.width = docSize.width + 'px';
	this.dom.root.style.height = docSize.height + 'px';
	this.dom.root.style.left = scrollPos.x+"px";
	this.dom.root.style.top = scrollPos.y+"px";

	var tableLeft = (docSize.width-this.options.width)/2+scrollPos.x;
	this.dom.container.style.left = Math.round(tableLeft) + 'px';
	
	var tableTop = (docSize.height-this.options.height)/2+scrollPos.y;
	this.dom.container.style.top = Math.round(tableTop) + 'px';
}

SZN.ImageBrowser.prototype._cancel = function(e, elm) {
	SZN.Events.cancelDef(e);
}

SZN.ImageBrowser.ImageLink = SZN.ClassMaker.makeClass({
	NAME: "ImageLink",
	VERSION: "1.0",
	CLASS: "class"
});
/**
 * @class Neco, co po kliknuti otevre browser s velkym obrazkem
 * @name SZN.ImageBrowser.ImageLink
 * @constructor
 * @param {Object} linkData
 */
SZN.ImageBrowser.ImageLink.prototype.$constructor = function(owner, index, elm) {
	this.ec = [];
	this.owner = owner;
	this.index = index;
	this.elm = elm;
	this.offset = index * owner.options.thumbWidth;
	this.ec.push(SZN.Events.addListener(this.elm, "click", this, "_show", false, true));
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.ImageBrowser.ImageLink.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.ImageBrowser.ImageLink.prototype._show = function(e, elm) {
	SZN.Events.cancelDef(e);
	this.owner._showImage(this.index);
}

SZN.ImageBrowser.ScaledImage = SZN.ClassMaker.makeClass({
	NAME: "ScaledImage",
	VERSION: "1.0",
	CLASS: "class"
});
/**
 * @class Zmenseny obrazek
 * @constructor
 * @name SZN.ImageBrowser.ScaledImage
 * @param {String} src URL s obrazkem
 * @param {Integer} w maximalni sirka
 * @param {Integer} h maximalni vyska
 * @param {Element} ancestor DOM uzel, ktery ma byt po nacteni obrazku timto nahrazen
 */
SZN.ImageBrowser.ScaledImage.prototype.$constructor = function(src, w, h, ancestor) {
	this.w = w;
	this.h = h;
	this.src = src;
	this.ancestor = ancestor;
	this.ec = [];
	this.elm = SZN.cEl("img");
	this.container = SZN.cEl("div",false,false,{position:"absolute",left:"-1000px",top:"-1000px",width:"1px",height:"1px",overflow:"hidden"});
	this.ec.push(SZN.Events.addListener(this.elm,"load",this,"_loaded",false,true));
	document.body.insertBefore(this.container,document.body.firstChild);
	this.container.appendChild(this.elm);
	this.elm.src = this.src;
}

/**
 * @method Explicitni destruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.ImageBrowser.ScaledImage.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.ImageBrowser.ScaledImage.prototype._loaded = function(e, elm) {
	
	
	var w = this.elm.width;
	var h = this.elm.height;
	
	var ratio_w = w/this.w;
	var ratio_h = h/this.h;
	var max = Math.max(ratio_w,ratio_h);
	if (max > 1) { 
		w = w / max;
		h = h / max;
		if (w && h) {
			this.elm.width = Math.ceil(w);
			this.elm.height = Math.ceil(h);
		}
	} /* need to scale */
	if (this.ancestor && this.ancestor.parentNode) {
		this.ancestor.parentNode.replaceChild(this.elm,this.ancestor);
	}
	if (this.container)	{ 
		this.container.parentNode.removeChild(this.container);
		this.container = false;
	}
	
}
