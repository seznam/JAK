/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @version 3.0
 * @name JAK.ImageBrowser
 * @author bratr, zara
 * @class
 * @group jak-widgets
 */   
JAK.ImageBrowser = JAK.ClassMaker.makeClass({
	NAME: "JAK.ImageBrowser",
	VERSION: "3.0"
});

/**
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
*		<li><em>captionBoxHeight</em> - volitelny parametr urcujici vysku pole pro popisek, pokud neni zadana pole se nezobrazuje, jinak je mezi velkym obr a pasem nahledu</li>
 *	</ul>
 */
JAK.ImageBrowser.prototype.$constructor = function(container, data, optObj) {
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
	
	this.container = JAK.gel(container);

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
			this.objCache.push(new JAK.ImageBrowser.ImageLink(this,i,link));
		}
	}

	var link = JAK.gel(this.options.mainLinkId);
	if (link) { 
		this.objCache.push(new JAK.ImageBrowser.ImageLink(this,this.defaultIndex,link)); 
	}
	var link = JAK.gel(this.options.zoomLinkId);
	if (link) {
		this.objCache.push(new JAK.ImageBrowser.ImageLink(this,this.defaultIndex,link)); 
	}

	this._buildDom();
	
};

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
JAK.ImageBrowser.prototype.$destructor = function() {
	for (var i=0;i<this.data.length;i++) { /* destroy all thumbs */
		this.data[i].obj.$destructor();
	}
	for (var i=0;i<this.objCache.length;i++) {
		this.objCache[i].$destructor();
	}

	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.ImageBrowser.prototype._buildDom = function() {
	/* common */
	if (this.options.useShadow) {
		var winopts = {
			imagePath:this.options.imagePath,
			imageFormat:this.options.imageFormat,
			sizes:this.options.shadowSizes
		}
		this.window = new JAK.Window(winopts);
		this.dom.container = this.window.container;
		this.dom.content = this.window.content;
	} else {
		this.dom.container = JAK.mel("div", null, {position:"relative"});
		this.dom.content = this.dom.container;
	}

	var tw = this.data.length * this.options.thumbWidth;
	var th = this.options.thumbHeight + 2*this.options.thumbBorder;
	if (tw > this.options.width) { th += 17; }
	JAK.DOM.addClass(this.dom.content,"image-browser-content");
	
	var table = JAK.mel("table", null, {borderCollapse:"collapse"});
	var tb = JAK.mel("tbody");
	var tr = JAK.mel("tr");
	var mainPart = JAK.mel("td", {className:"image-browser-image"}, {width:this.options.width+"px",height:this.options.height+"px",padding:"0px",overflow:"hidden"}); /* parent for main image */
	JAK.DOM.append([this.dom.content,table],[table,tb],[tb,tr],[tr,mainPart]);

	var captionBox = JAK.mel("div", {className:"image-browser-caption"}, {width: this.options.width+"px", overflow: 'hidden', height: (this.options.captionBoxHeight || 0)+'px' });
	var captionContentBox = JAK.cel("div", "image-browser-caption-content");
	JAK.DOM.append([captionBox, captionContentBox]);

	var thumbsPort = JAK.mel("div", {className:"image-browser-port"}, {position:"relative",overflow:"auto",width:this.options.width+"px",height:th+"px"}); /* viewport */

	var thumbs = JAK.mel("table", {className:"image-browser-thumbs"},{borderCollapse:"collapse"});
	var tb = JAK.mel("tbody");
	var tr = JAK.mel("tr");
	
	var dummy = JAK.ctext("...");
	mainPart.appendChild(dummy);
	
	/* navigation */
	var prev = JAK.cel("div", "image-browser-prev");
	var next = JAK.cel("div", "image-browser-next");
	var close = JAK.cel("div", "image-browser-close");
	
	this.dom.prev = prev;
	this.dom.next = next;
	
	prev.title = "Předchozí";
	next.title = "Následující";
	close.title = "Zavřít";
	
	if (this.options.showNavigation) {
		this.ec.push(JAK.Events.addListener(prev, "click", this, "_prev", false, true));
		this.ec.push(JAK.Events.addListener(next, "click", this, "_next", false, true));
		this.ec.push(JAK.Events.addListener(prev, "mousedown", this, "_cancel", false, true));
		this.ec.push(JAK.Events.addListener(next, "mousedown", this, "_cancel", false, true));
	}
	if (!this.options.parent) {
		this.ec.push(JAK.Events.addListener(close, "click", this, "_hide", false, true));
		this.ec.push(JAK.Events.addListener(mainPart,"click",this,"_hide",false,true));
	}

	/* thumbs */
	for (var i=0;i<this.data.length; i++) {
		var data = this.data[i];
		var td = JAK.mel("td", null, {padding:"0px"});
		var div = JAK.mel("div", null, {overflow:"hidden",width:this.options.thumbWidth+"px"});
		var tmp = JAK.ctext("...");
		JAK.DOM.append([td,div],[div,tmp]);
		var img = new JAK.ImageBrowser.ScaledImage(data.small,this.options.thumbWidth,this.options.thumbHeight,tmp);
		this.objCache.push(img);
		img.title = data.alt;
		
		data.div = div;
		data.obj = new JAK.ImageBrowser.ImageLink(this, i, td);
		JAK.DOM.append([tr,td]);
	}
	
	
	/* active image */
	var active = JAK.mel("div", {className:"image-browser-active"}, {position:"absolute"});
	thumbsPort.appendChild(active);
	
	this.dom.mainPart = mainPart;
	this.dom.thumbs = thumbs;
	this.dom.port = thumbsPort;
	this.dom.active = active;
	this.dom.caption = captionContentBox;

	JAK.DOM.append([thumbs,tb],[tb,tr]);
	JAK.DOM.append([this.dom.content, captionBox]);
	JAK.DOM.append([this.dom.content,thumbsPort],[thumbsPort,thumbs]);
	if (this.options.showNavigation && this.data.length > 1) { JAK.DOM.append([this.dom.content,prev,next]); }
	
	if (this.options.parent) { /* inside: immediately show and display first image */
		this.options.parent.appendChild(this.dom.container);
		this._showImage(this.defaultIndex);
	} else { /* outside: create root dimmer and wait for activation; append close button */
		this.dom.root = JAK.mel("div", {className:"image-browser-root"}, {position:"absolute",left:"0px",top:"0px"});
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
			this.ec.push(JAK.Events.addListener(window, "resize", this, "_reposition", false, true));
			this.ec.push(JAK.Events.addListener(window, "scroll", this, "_reposition", false, true));
  		}
	}
}

JAK.ImageBrowser.prototype._showImage = function(index) {
	this._show();
	
	if (this.index != -1) {
		var old = this.data[this.index];
		JAK.DOM.removeClass(old.div,"active");
	}
	this.index = index;
	var data = this.data[this.index];
	JAK.DOM.addClass(data.div,"active");

	/* draw big stuff */
	
	if (data.flash) { /* flash */
		JAK.DOM.clear(this.dom.mainPart);
		var em = JAK.cel("embed");
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
		var img = new JAK.ImageBrowser.ScaledImage(data.big,this.options.width,this.options.height,this.dom.mainPart.firstChild);

		this.objCache.push(img);
		if (!this.options.parent) { img.title = "Klikni pro zavření"; }
	}

	//pridani popisku
	this.dom.caption.innerHTML = data.alt;

	/* scroll thumbs */
	var leftOffset = data.obj.offset;
	var sl = Math.round(leftOffset-(this.options.width/2-this.options.thumbWidth/2));
	this.dom.port.scrollLeft = sl;

	var pos = JAK.DOM.getBoxPosition(data.div.parentNode, this.dom.port);
	
	var act = this.dom.active;
	act.style.left = pos.left+"px";
	act.style.top = pos.top+"px";
	var w1 = parseInt(JAK.DOM.getStyle(data.div,"borderLeftWidth")) || 0;
	w1 -= parseInt(JAK.DOM.getStyle(act,"borderLeftWidth")) || 0;
	
	var w2 = parseInt(JAK.DOM.getStyle(data.div,"borderRightWidth")) || 0;
	w2 -= parseInt(JAK.DOM.getStyle(act,"borderRightWidth")) || 0;
	
	var h1 = parseInt(JAK.DOM.getStyle(data.div,"borderTopWidth")) || 0;
	h1 -= parseInt(JAK.DOM.getStyle(act,"borderTopWidth")) || 0;
	
	var h2 = parseInt(JAK.DOM.getStyle(data.div,"borderBottomWidth")) || 0;
	h2 -= parseInt(JAK.DOM.getStyle(act,"borderBottomWidth")) || 0;
	
	if (document.compatMode == 'BackCompat') {
		w1 = w2 = h1 = h2 = 0;
	}
	
	act.style.width = (this.options.thumbWidth + w1 + w2) + "px";
	this.dom.active.style.height = (this.options.thumbHeight + h1 + h2) + "px";

	/* prev - next visibility on start looking */
	this.dom.prev.style.visibility = (this.index == 0 ? 'hidden' : 'visible');
	this.dom.next.style.visibility = (this.index == this.data.length-1 ? 'hidden' : 'visible');
}

JAK.ImageBrowser.prototype._prev = function() {
	if (this.index == 0) { return; }
	this._showImage(this.index-1);
}

JAK.ImageBrowser.prototype._next = function() {
	if (this.index == this.data.length-1) { return; }
	this._showImage(this.index+1);
}

JAK.ImageBrowser.prototype._hide = function() {
	if (!this.visible) { return; }
	this.visible = false;
	JAK.DOM.elementsHider(this.dom.root, false, "show");
	if (!this.options.parent) {
		this.dom.root.style.display = "none";
	}
	if (this.window) {
		this.window.hide();
	} else {
		this.dom.container.style.display = "none";
	}
}

JAK.ImageBrowser.prototype._show = function() {
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
	JAK.DOM.elementsHider(this.dom.root, false, "hide");
}

JAK.ImageBrowser.prototype._reposition = function() {
	var docSize = JAK.DOM.getDocSize();
	var scrollPos = JAK.DOM.getScrollPos();
	
	var docH = document.compatMode == 'BackCompat' ? document.body.scrollHeight : document.body.offsetHeight;
	var docW = document.compatMode == 'BackCompat' ? document.body.scrollWidth : document.body.offsetWidth;
	
	this.dom.root.style.width = (docSize.width > docW ? docSize.width : docW) + 'px';
	this.dom.root.style.height = (docSize.height > docH ? docSize.height : docH) + 'px';
	/*this.dom.root.style.left = scrollPos.x+"px";
	this.dom.root.style.top = scrollPos.y+"px";*/

	var tableLeft = (docSize.width-this.options.width)/2+scrollPos.x;
	this.dom.container.style.left = Math.round(tableLeft) + 'px';
	var tableTop = (docSize.height-this.options.height - this.options.thumbHeight - (this.options.captionBoxHeight || 0))/2+scrollPos.y;
	this.dom.container.style.top = Math.round(tableTop) + 'px';
}

JAK.ImageBrowser.prototype._cancel = function(e, elm) {
	JAK.Events.cancelDef(e);
}

/**
 * @class Neco, co po kliknuti otevre browser s velkym obrazkem
 * @private
 * @group jak-widgets
 */
JAK.ImageBrowser.ImageLink = JAK.ClassMaker.makeClass({
	NAME: "ImageLink",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * @param {Object} linkData
 */
JAK.ImageBrowser.ImageLink.prototype.$constructor = function(owner, index, elm) {
	this.ec = [];
	this.owner = owner;
	this.index = index;
	this.elm = elm;
	this.offset = index * owner.options.thumbWidth;
	this.ec.push(JAK.Events.addListener(this.elm, "click", this, "_show", false, true));
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
JAK.ImageBrowser.ImageLink.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.ImageBrowser.ImageLink.prototype._show = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.owner._showImage(this.index);
}

/**
 * @class Zmenseny obrazek
 * @group jak-widgets
 * @private
 */
JAK.ImageBrowser.ScaledImage = JAK.ClassMaker.makeClass({
	NAME: "ScaledImage",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * @param {String} src URL s obrazkem
 * @param {Integer} w maximalni sirka
 * @param {Integer} h maximalni vyska
 * @param {Element} ancestor DOM uzel, ktery ma byt po nacteni obrazku timto nahrazen
 */
JAK.ImageBrowser.ScaledImage.prototype.$constructor = function(src, w, h, ancestor) {
	this.w = w;
	this.h = h;
	this.src = src;
	this.ancestor = ancestor;
	this.ec = [];
	this.elm = JAK.cel("img");
	this.container = JAK.mel("div", null, {position:"absolute",left:"-1000px",top:"-1000px",width:"1px",height:"1px",overflow:"hidden"});
	this.ec.push(JAK.Events.addListener(this.elm,"load",this,"_loaded",false,true));
	document.body.insertBefore(this.container,document.body.firstChild);
	this.container.appendChild(this.elm);
	this.elm.src = this.src;
}

/**
 * @method Explicitni destruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
JAK.ImageBrowser.ScaledImage.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.ImageBrowser.ScaledImage.prototype._loaded = function(e, elm) {
	
	
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
