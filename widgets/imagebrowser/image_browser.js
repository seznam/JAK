/**
 * @overview Image browser
 * @version 2.0
 * @author bratr, zara
 */   

/**
 * @class Image browser
 * @constructor
 * @param {String || Element} container prvek se statickymi nahledy
 * @param {Array} data pole s informacemi o obrazcich
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	<ul>
 *		<li><em>width</em> - sirka velkeho obrazku</li>
 *		<li><em>height</em> - vyska velkeho obrazku</li>
 *		<li><em>thumbWidth</em> - sirka jednoho nahledu</li>
 *		<li><em>thumbHeight</em> - vyska velkeho obrazku</li>
 *		<li><em>zoomLinkId</em> - ID prvku, ktery otevira galerii</li>
 *		<li><em>mainLinkId</em> - ID obrazku, ktery otevira galerii</li>
 *		<li><em>imagePath</em> - cesta k obrazkum se stiny</li>
 *		<li><em>imageFormat</em> - pripona obrazku (png/gif/jpg)</li>
 *		<li><em>showNavigation</em> - true/false, ma-li byt videt navigace (prev/next)</li>
 *		<li><em>useShadow</em> - true/false, ma-li byt okolo galerie stin</li>
 *		<li><em>parent</em> - pokud false, pak je galerie centrovana nad vsim; pokud 
 *        non-false, pak jde o id/prvek, do ktereho se galerie vytvori</li>
 *		<li><em>shadowSizes</em> - velikosti stinu podle smeru hodinovych rucicek</li>
 *	</ul>
 */
SZN.ImageBrowser = function(container, data, optObj) {
	this.options = {
		width: 640,
		height: 480,
		thumbWidth: 100,
		thumbHeight: 75,
		zoomLinkId: "",
		mainLinkId: "",
		imagePath: "img/",
		imageFormat: "png",
		showNavigation: true,
		useShadow: false,
		parent: false,
		shadowSizes: [22,22,22,22]
	}
	
	this.ec = [];
	this.dom = {};
	this.window = false;
	this.defaultIndex = 0;
	this.index = -1; /* index of displayed big image */
	
	this.container = SZN.gEl(container);
	

	for (var p in optObj) { this.options[p] = optObj[p]; }
	
	this.ImageBrowser(data);
};
SZN.ImageBrowser.Name = "ImageBrowser";
SZN.ImageBrowser.version = 2.0;

/**
 * @method Sekundarni konstruktor
 */
SZN.ImageBrowser.prototype.ImageBrowser = function(data) {
	this.data = [];
	
	for (var i=0;i<data.length;i++) {
		var item = data[i];
		var o = {};
		o.alt = item.alt;
		o.big = item.big.url;
		o.small = item.small.url;
		if (item.main) { this.defaultIndex = i; }
		this.data.push(o);
	}
	
	if (this.container) {
		var imgLinks = this.container.getElementsByTagName('a');
		for (var i=0;i<imgLinks.length;i++) {
			var link = imgLinks[i];
			new SZN.ImageBrowser.ImageLink(this,i,link);
		}
	}

	var link = SZN.gEl(this.options.mainLinkId);
	if (link) { new SZN.ImageBrowser.ImageLink(this,this.defaultIndex,link); }
	var link = SZN.gEl(this.options.zoomLinkId);
	if (link) { new SZN.ImageBrowser.ImageLink(this,this.defaultIndex,link); }

	this._buildDom();
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.ImageBrowser.prototype.destructor = function() {
	for (var i=0;i<this.data.length;i++) { /* destroy all thumbs */
		this.data[i].obj.destructor();
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
	var th = this.options.thumbHeight;
	if (tw > this.options.width) { th += 17; }
	SZN.Dom.addClass(this.dom.content,"image-browser-content");
	
	var table = SZN.cEl("table",false,false,{borderCollapse:"collapse"});
	var tb = SZN.cEl("tbody");
	var tr = SZN.cEl("tr");
	var mainPart = SZN.cEl("td",false,"image-browser-image",{width:this.options.width+"px",height:this.options.height+"px",padding:"0px",overflow:"hidden"}); /* parent for main image */
	SZN.Dom.append([this.dom.container,table],[table,tb],[tb,tr],[tr,mainPart]);
	
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
		var td = SZN.cEl("td",false,false,{overflow:"hidden",width:this.options.thumbWidth+"px",height:this.options.thumbHeight+"px",padding:"0px"});
		var tmp = SZN.cTxt("...");
		td.appendChild(tmp);
		var img = new SZN.ImageBrowser.ScaledImage(data.small,this.options.thumbWidth,this.options.thumbHeight,tmp);
		img.title = data.alt;
		
		data.td = td;
		data.img = img;
		data.obj = new SZN.ImageBrowser.ImageLink(this, i, img);
		SZN.Dom.append([tr,td]);
	}
	
	
	/* active image */
	var w = this.options.thumbWidth-4;
	var h = this.options.thumbHeight-4;
	var active = SZN.cEl("div",false,"image-browser-active",{width:w+"px",height:h+"px",position:"absolute",top:"0px"});
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
		var b = document.body;
		SZN.Dom.append([b,this.dom.root,this.dom.container],[this.dom.content,close]); 
		this._hide();
		SZN.Events.addListener(window, "resize", this, "_reposition", false, true);
		SZN.Events.addListener(window, "scroll", this, "_reposition", false, true);
	}
}

SZN.ImageBrowser.prototype._showImage = function(index) {
	this._show();
	
	if (this.index != -1) {
		var old = this.data[this.index];
		SZN.Dom.removeClass(old.td,"active");
	}
	this.index = index;
	var data = this.data[this.index];
	
	var img = new SZN.ImageBrowser.ScaledImage(data.big,this.options.width,this.options.height,this.dom.mainPart.firstChild);
	img.title = "Klikni pro zavření";
	
	SZN.Dom.addClass(data.td,"active");
	
	var leftOffset = data.obj.offset;
	var sl = Math.round(leftOffset-(this.options.width/2-this.options.thumbWidth/2));
	this.dom.port.scrollLeft = sl;
	
	this.dom.active.style.left = data.obj.offset+"px";
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
	SZN.Dom.elementsHider(this.dom.container, false, "show");
	if (this.options.parent) {
		if (this.window) {
			this.window.hide();
		} else {
			this.dom.container.style.display = "none";
		}
	} else { /* hide root */
		this.dom.root.style.display = "none";
		this.dom.container.style.display = "none";
	}
}

SZN.ImageBrowser.prototype._show = function() {
	if (this.options.parent) {
		if (this.window) { 
			this.window.show(); 
		} else {
			this.dom.container.style.display = "";
		}
	} else { /* show root */
		this.dom.root.style.display = "";
		this.dom.container.style.display = "";
		this._reposition();
	}
	SZN.Dom.elementsHider(this.dom.container, false, "hide");
}

SZN.ImageBrowser.prototype._reposition = function() {
	var docSize = SZN.Dom.getDocSize();
	var scrollPos = SZN.Dom.getScrollPos();

	this.dom.root.style.width = docSize.width + 'px';
	this.dom.root.style.height = docSize.height + 'px';

	var tableLeft = (docSize.width-this.dom.container.offsetWidth)/2+scrollPos.x;
	this.dom.container.style.left = tableLeft + 'px';
	
	var tableTop = (docSize.height-this.dom.container.offsetHeight)/2+scrollPos.y;
	this.dom.container.style.top = tableTop + 'px';
}

SZN.ImageBrowser.prototype._cancel = function(e, elm) {
	SZN.Events.cancelDef(e);
}

/**
 * @class Neco, co po kliknuti otevre browser s velkym obrazkem
 * @constructor
 * @param {Object} linkData
 */
SZN.ImageBrowser.ImageLink = function(owner, index, elm) {
	this.ec = [];
	this.owner = owner;
	this.index = index;
	this.elm = elm;
	this.offset = index * owner.options.thumbWidth;
	this.ImageLink();
}
SZN.ImageBrowser.ImageLink.Name = "ImageLink";
SZN.ImageBrowser.ImageLink.version = 1.0;

/**
 * @method Sekundarni konstruktor
 */
SZN.ImageBrowser.ImageLink.prototype.ImageLink = function() {
	this.ec.push(SZN.Events.addListener(this.elm, "click", this, "_show", false, true));
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.ImageBrowser.ImageLink.prototype.destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.ImageBrowser.ImageLink.prototype._show = function(e, elm) {
	SZN.Events.cancelDef(e);
	this.owner._showImage(this.index);
}

/**
 * @class Zmenseny obrazek
 * @constructor
 * @param {String} src URL s obrazkem
 * @param {Integer} w maximalni sirka
 * @param {Integer} h maximalni vyska
 * @param {Element} ancestor DOM uzel, ktery ma byt po nacteni obrazku timto nahrazen
 */
SZN.ImageBrowser.ScaledImage = function(src, w, h, ancestor) {
	this.w = w;
	this.h = h;
	this.src = src;
	this.ancestor = ancestor;
	this.ec = [];
	this.elm = SZN.cEl("img");
	this.container = SZN.cEl("div",false,false,{position:"absolute",left:"-1000px",top:"-1000px",width:"1px",height:"1px",overflow:"hidden"});
	this.ScaledImage();
	return this.elm;
}
SZN.ImageBrowser.ScaledImage.Name = "ScaledImage";
SZN.ImageBrowser.ScaledImage.version = 1.0;

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.ImageBrowser.ScaledImage.prototype.destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

/**
 * @method Sekundarni konstruktor
 */
SZN.ImageBrowser.ScaledImage.prototype.ScaledImage = function() {
	this.ec.push(SZN.Events.addListener(this.elm,"load",this,"_loaded",false,true));
	document.body.appendChild(this.container);
	this.container.appendChild(this.elm);
	this.elm.src = this.src;
}

SZN.ImageBrowser.ScaledImage.prototype._loaded = function(e, elm) {
	var w = this.elm.width;
	var h = this.elm.height;
	
	var ratio_w = w/this.w;
	var ratio_h = h/this.h;
	var max = Math.max(ratio_w,ratio_h);
	if (max < 1) { 
		this._ready();
		return; 
	} /* no need to scale */
	w = w / max;
	h = h / max;
	if (w && h) {
		this.elm.width = w;
		this.elm.height = h;
	}
	if (this.ancestor && this.ancestor.parentNode) {
		this.ancestor.parentNode.replaceChild(this.elm,this.ancestor);
	}
	this.container.parentNode.removeChild(this.container);
	this.container = false;
}
