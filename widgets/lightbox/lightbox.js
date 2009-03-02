/**
 * Rozsirena galerie umoznujici volbu vnitrnich komponent, tim padem je mozno zvolit zda bude videt
 * nahledovy pas nebo popis obrazku. Veskere stylovani probiha pomoci CSS
 * @class
 */
SZN.LightBox = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox',
	VERSION: '1.0',
	CLASS: "class",
	IMPLEMENT: [SZN.SigInterface, SZN.Components]
});

/**
 * konstanty udavajici smer ktery uzivatel prochazi galerii
 */
SZN.LightBox.DIR_PREW = -1;
SZN.LightBox.DIR_NEXT = 1;

/**
 * konstruktor galerie
 * @param optObj
 */
SZN.LightBox.prototype.$constructor = function(data, optObj) {
	/**
	 * vlastnosti, ty co jsou jako hodnota jsou pro galerii a jsou obecne, ty co jsou jako objekt se nejlepe pouzivaji
	 * pro dalsi komponenty
	 */
	this.options = {
		components: {
			anchorage: SZN.LightBox.Anchorage,
			//anchorage: SZN.LightBox.Anchorage.Fixed,
			main: SZN.LightBox.Main,
			strip: SZN.LightBox.Strip,
			description: SZN.LightBox.Description,
			pageShader: SZN.LightBox.PageShader,
			navigation: SZN.LightBox.Navigation,
			transition: SZN.LightBox.Transition,
			others: []
		},
		imagePath: "img/",
		imageFormat: "png",
		parent: false,  /*rodicovsky element, pokud je zadan, galerie se vyblinka do nej*/
		zIndex: false,
		useShadow: false,
		usePageShader: true,
		shadowSizes: [16,16,16,16],
		galleryId: false,
		handleDocumentCloseClick: true, /*ve vetsine pripadu chceme aby kdyz nekdo klikne mimo otevrenou galerii aby se zavreal, pokud ale galerii zobrazuji primo*/
		mainOpt: {
			id: false,
			className: 'image-browser-image',
			useMouseWheelScroll: true
		},
		stripOpt: {
			id: false,
			className: 'image-browser-thumbs',
			orientation: 'vertical', /*vertical|horizontal*/
			activeBorder: 'inner',  /*inner|outer*/
			activeId: false,
			activeClassName: 'image-browser-active',
			imageBoxClassName: 'image-browser-thumb-box'
		},
		descriptionOpt: {
			id: false,
			className: 'image-browser-caption',
			contentId: false,
			contentClassName: 'image-browser-caption-content'
		},
		navigationOpt: {
			continuous: true,
			showDisabled: false, /*zobrazuji disablovane tlacitko, pokud je continuous:false, kdyz je i zde false, pak tlacitka nejsou zobrazena vubec pokud nemaji smysl*/
			nextClassName: 'image-browser-next',
			prevClassName: 'image-browser-prev',
			closeClassName: 'image-browser-close'
		},
		transitionOpt: {
			
		},
		anchorageOpt: {
			
		}
	};
	for (var p in optObj) {
		if (optObj[p] instanceof Object && !optObj[p].CLASS) {
			for (var o in optObj[p]) {this.options[p][o] = optObj[p][o];}
		} else {
			this.options[p] = optObj[p];
		}
	}
	/**
	 * uchovavani dom struktury ke ktere chceme pristupovat
	 */
	this.dom = {};
	/**
	 * zasobnik eventu
	 */
	this.ec = [];
	/**
	 * pole objektu ktere docasne potrebujeme
	 */
	this.objCache = [];
	/**
	 * pole komponent urcujici funkcnost galerie
	 */
	this.components = [];
	/**
	 * zda je galerie zobrazena
	 */
	this.visible = false;
	/**
	 * index zobrazene fotky
	 */
	this.index = 0;
	/**
	 * jakym smerem uzivatel prochazi galerii
	 */
	this.direction = SZN.LightBox.DIR_NEXT;
	/**
	 * data obsahuji pole dat pro vytvoreni galerie
	 */
	this.data = [];
	for (var i=0;i<data.length;i++) {
		var item = data[i];
		var o = {};
		for(var j in item){
			o[j] = item[j];
		}
		if (item.main) { this.index = i;} /*zmenim vychozi fotku, vhodne jen pokud je galerie otevirana ihned do elementu*/
		this.data.push(o);
	}


	/*vygenerovani domu*/
	this._buildContainer();

	/*vyrenderovani obsahu ze zakladnich komponent*/
	this._render();

	/*pripojeni ostatnich komponent*/
	for (var i = 0; i < this.options.components.others.length; i++) {
		this.addNewComponent(this.options.components.others[i]);
	}
};



/**
 * destruktor
 */
SZN.LightBox.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }

	/*@todo dodelat destrukci vsech objektu*/
};

/**
 * metoda pridava komponenty, nicmene nejdriv dela test zda komponenty dedi ze spravnych rodicovskych trid
 * @param {string} name
 * @param {Class} part
 * @param {Class} className
 * @private
 */
SZN.LightBox.prototype._addDefaultComponent = function(name, part, className) {
	var node = part;
	var ok = false;
	while (node) {
		if (node == className) { ok = true; break;}
		node = node.EXTEND;
	}
	if (ok) {
		//pridani
		this.addNewComponent({part: part, name: name});
	} else {
		alert('Bad '+name+' functionality');
	}
}

/**
 * vytvoreni kontejneru, pokud chceme stiny, delaji se pomoci SZN.Window, jinak do divu
 * @see SZN.Window
 * @private
 */
SZN.LightBox.prototype._buildContainer = function() {
	/*vytvoreni docasneho uloziste, kam se ihned galerie pripne aby se daly pocitat rozmery*/
	this.dom.loadBox = SZN.cEl('div');
	this.dom.loadBox.style.position = 'absolute';
	this.dom.loadBox.style.top = '-100px';
	this.dom.loadBox.style.left = '-100px';
	this.dom.loadBox.style.overflow = 'hidden';
	this.dom.loadBox.style.width = '1px';
	this.dom.loadBox.style.height = '1px';
	var body = document.getElementsByTagName('body')[0];
	body.insertBefore(this.dom.loadBox, body.firstChild);



	var div = SZN.cEl('div', this.options.galleryId, 'image-browser-content');

	if (this.options.useShadow) {
		var winopts = {
			imagePath:this.options.imagePath,
			imageFormat:this.options.imageFormat,
			sizes:this.options.shadowSizes
		}
		this.window = new SZN.Window(winopts);
		this.dom.container = this.window.container;
		/* okno ve vychozim nastaveni bude vzdy absolutne pozicovani, SZN.Window 
		 * totiz nastavuje relative a to muze vest k ovlivnovani stranky, kdyz 
		 * je galerie pripinana na zacatek domu
		 */
		this.dom.container.style.position ='absolute'; 
		this.window.content.appendChild(div);
		this.dom.content = div;
	} else {
		this.dom.container = SZN.cEl("div",false,false,{position:"absolute"});
		this.dom.container.appendChild(div);
		this.dom.content = div;
	}

	if (this.options.zIndex){
		this.dom.container.style.zIndex = this.options.zIndex;
	}

	if (!this.parent) {
		var parent = this.dom.loadBox;
	} else {
		var parent = this.parent;
	}
	parent.insertBefore(this.dom.container, parent.firstChild);
};

/**
 * volani render nad vsemi zakladnimi komponentami galerie
 * @private
 */
SZN.LightBox.prototype._render = function() {

	/*zjisteni spravne funkcnosti*/
	this._addDefaultComponent('anchorage', this.options.components.anchorage, SZN.LightBox.Anchorage);
	this._addDefaultComponent('transition', this.options.components.transition, SZN.LightBox.Transition);

	this._addDefaultComponent('main', this.options.components.main, SZN.LightBox.Main);
	this.dom.content.appendChild(this.main.render());
	if (this.options.usePageShader) {
		this._addDefaultComponent('pageShader', this.options.components.pageShader, SZN.LightBox.PageShader);
	}
	this._addDefaultComponent('strip', this.options.components.strip, SZN.LightBox.Strip);
	this.dom.content.appendChild(this.strip.render());
	this._addDefaultComponent('description', this.options.components.description, SZN.LightBox.Description);
	this.dom.content.appendChild(this.description.render());
	this._addDefaultComponent('navigation', this.options.components.navigation, SZN.LightBox.Navigation);
	this.dom.content.appendChild(this.navigation.render());

	this.makeEvent('renderDone', 'public');
};

/**
 * pridani zakladni eventu, ktere galerie chyta
 * @private
 */
SZN.LightBox.prototype._addEvents = function() {
	if (this.options.handleDocumentCloseClick) {
		this.ec.push(SZN.Events.addListener(document, 'click', this, 'close'));
		this.ec.push(SZN.Events.addListener(this.dom.container, 'click', SZN.Events.stopEvent));/*pokud klikam do galerie, tak neni vhodne zavirat okno*/
	}
	this.ec.push(SZN.Events.addListener(window, 'resize', this, '_resize'));
}

/**
 * pri schovani galerie jsou eventy odstraneny
 * @private
 */
SZN.LightBox.prototype._removeEvents = function() {
	for(var i = 0; i < this.ec.length; i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
}

/**
 * pokud potrebuji komponenty vyvolat nejakou udalost tak aby na ni mohli reagovat jinek komponenty
 * pouzivaji na to tuto metodu, pak je totiz akce vyvalana galerii a na tyto udalosti komponenty naslouchaji
 * @param {Object} sender - objekt, ktery udalost vyvolava je predavan jako sender v datech udalosti
 * @param {string} name - nazev udalosti
 */
SZN.LightBox.prototype.createEvent = function(sender, name) {
	this.makeEvent(name, 'public', {sender: sender});
}

/**
 * metoda volana na resize okna
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.prototype._resize = function(e, elm) {
	this.makeEvent('windowResize', 'protected');
}

/**
 * schovani galerie
 */
SZN.LightBox.prototype.close = function() {
	this.makeEvent('close', 'public');

	/*odveseni udalosti*/
	this._removeEvents();

	this.visible = false;
	if (!this.parent) {
		SZN.Dom.elementsHider(this.dom.container, false, "show");
		this.dom.container.parentNode.removeChild(this.dom.container);
	}

	this.makeEvent('closed', 'public');
}

/**
 * zobrazeni galerie s urcitym obrazkem dle jeho poradoveho cisla
 * @param {int} i
 */
SZN.LightBox.prototype.show = function(i) {
	this.makeEvent('show','public', {index:i});

	/*naveseni udalosti, chceme je jen kdyz je galerka zobrazena*/
	this._addEvents();

	this.visible = true;
	if (!this.parent) {
		var body = document.getElementsByTagName('body')[0];
		body.insertBefore(this.dom.container, body.firstChild);
		this.anchorage.actualizePosition();
		SZN.Dom.elementsHider(this.dom.container, false, "hide");
	}

	this.go(i);
	this.makeEvent('showed','public', {index:i});
};

/**
 * pokud je galerie otevrena, je mozno jit na jinou fotku pomoci teto metody
 * @param {int} index
 */
SZN.LightBox.prototype.go = function(index) {
	/* zjisteni smeru */
	var dir = index < this.index ? SZN.LightBox.DIR_PREW : SZN.LightBox.DIR_NEXT;

	this._go(index, dir);
};

/**
 * vnitrni vykonna metoda updatujici komponenty pri zmene hlavni fotky, smer se udava pomoci
 * SZN.LightBox.DIR_PREW nebo SZN.LightBox.DIR_NEXT
 * @param {int} i
 * @param {int} direction
 * @private
 */
SZN.LightBox.prototype._go = function(i, direction) {
	this.direction = direction;
	this.makeEvent('go','public', {index:i});
	this.main.update(i);
	this.strip.update(i);
	this.description.update(i);
	this.navigation.update(i);

	this.index = i;
}

/**
 * umoznuje poskocit na predchozi obrazek, pokud je povoleno cyklovani a jsme na prvnim, skoci to na posledni
 */
SZN.LightBox.prototype.previous = function() {
	var i = this.index - 1;
	if (i < 0) {
		if (this.options.navigationOpt.continuous) {
			i = this.data.length -1;
		} else {
			return;
		}
	}
	this._go(i, SZN.LightBox.DIR_PREW);
};

/**
 * umoznuje poskocit na nasledujici obrazek, pokud je povoleno cyklovani a jsme na poslednim, skoci to na prvni
 */
SZN.LightBox.prototype.next = function() {
	var i = this.index + 1;
	if (i == this.data.length) {
		if (this.options.navigationOpt.continuous) {
			i = 0;
		} else {
			return;
		}
	}
	this._go(i, SZN.LightBox.DIR_NEXT);
};

/**
 * metodou jde nabindovat volani otevreni galerie na odkazy v danem elementu, prvni odkaz odkazuje na prvni obr, atd.
 * @param {HTMLElement} elm
 */
SZN.LightBox.prototype.bindAnchors = function(elm) {
	var links = SZN.Dom.arrayFromCollection(SZN.gEl(elm).getElementsByTagName('a'));
	for (var i = 0; i < links.length; i++) {
		this.bindElement(links[i], i);
	}
};

/**
 * metodou jde navazat konkretni element na otevreni galerie na konkretnim obrazku, navazuje se click udalost
 * @param {HTMLElement} elm
 * @param {int] i  - index obrazku
 */
SZN.LightBox.prototype.bindElement = function(elm, i) {
	this.objCache.push(new SZN.LightBox.ImageLink(this,i,elm));
};

/*-----------------------IMAGE LINK------------------------------------*/
/**
 * @class Neco, co po kliknuti otevre browser s velkym obrazkem
 * @private
 */
SZN.LightBox.ImageLink = SZN.ClassMaker.makeClass({
	NAME: "SZN.LightBox.ImageLink",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 * @param {int} index - poradove cislo obrazku ktery link bude otevirat
 * @param {HTMLElement} elm - element, na ktery se vesi click udalost
 */
SZN.LightBox.ImageLink.prototype.$constructor = function(owner, index, elm) {
	this.ec = [];
	this.owner = owner;
	this.index = index;
	this.elm = elm;
	this.ec.push(SZN.Events.addListener(this.elm, "click", this, "_show"));
};

/**
 * Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.LightBox.ImageLink.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
};

/**
 * volano po kliknuti na externi odkaz na ktery je navesena udalost, oteviram galerii na obazku danym indexem
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.ImageLink.prototype._show = function(e, elm) {
	SZN.Events.cancelDef(e);
	SZN.Events.stopEvent(e);/*je treba stopovat probublavani, protoze zavreni galerie se odchytava na documentu*/
	this.owner.show(this.index);
};

/*---------------------------ANCHORAGE--------------------------------*/

/**
 * vychozi nastavovac pozice, pozicuje absolutne  na top/left = 0
 * @class
 */
SZN.LightBox.Anchorage = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Anchorage',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Anchorage.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = this.owner.options.anchorageOpt;
	this.container = this.owner.dom.container;
};

/**
 * metoda je volana defaultne pri zobrazeni galerie aby se galerie napozicovala
 */
SZN.LightBox.Anchorage.prototype.actualizePosition = function() {
	this.container.style.top =  '0px';
	this.container.style.left = '0px';
	this.container.style.position = 'absolute';
};

/**
 * pozicovac na stred okna prohlizece  - vyuziva position:fixed
 * @class
 * @extends SZN.LightBox.Anchorage
 */
SZN.LightBox.Anchorage.Fixed = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Anchorage.Fixed',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Anchorage
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Anchorage.Fixed.prototype.$constructor = function(owner) {
	this.callSuper('$constructor', arguments.callee)(owner);

	/**
	 * event cache folder
	 */
	this.ec = [];

	/*IE6 a nizsi neumi fixed, proto pozicuji galerii pres Absolue a prepocitavam to i na scroll stranky*/
	this.useAbsoluteHack = false;
	if (SZN.Browser.client == 'ie' && SZN.Browser.version <= 6) {
		this.useAbsoluteHack = true;
	}

	/*naveseni udalosti*/
	this.attachEvents();
};

SZN.LightBox.Anchorage.Fixed.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
};

/**
 *  naveseni udalosti na resize okna aby se dalo znovu vycentrovat okno, v IE6 nejde position:fixed, proto vesim i na
 * scroll a prepocitavam pozici
 */
SZN.LightBox.Anchorage.Fixed.prototype.attachEvents = function() {
	/*potrebujeme navesit udalost na resize a scroll pro vypozicovavani*/
	this.ec.push(SZN.Events.addListener(window, 'resize', this, 'actualizePosition'));
	if (this.useAbsoluteHack) {
		this.ec.push(SZN.Events.addListener(window, 'scroll', this, 'actualizePosition'));
	}
};

/**
 * nastaveni pozice galerie na stred okna
 */
SZN.LightBox.Anchorage.Fixed.prototype.actualizePosition = function() {
	var hasParent = true;
	if (this.container.parentNode == null) {
		this.container.style.position = 'absolute';
		this.container.style.top = '-1000px';
		this.container.style.left = '-1000px';
		this.container.style.visibility = 'hidden';
		hasParent = false;
	}

	var body = document.getElementsByTagName('body')[0];
	body.insertBefore(this.container, body.firstChild);

	var portSize = SZN.Dom.getDocSize();
	if (this.useAbsoluteHack) { //ti co neumi position fixed pozicuji pres absolute
		var wScroll = SZN.Dom.getScrollPos();
		this.container.style.position = 'absolute';
		this.container.style.top = Math.round(wScroll.y + portSize.height/2 - this.container.offsetHeight/2)+'px';
		this.container.style.left = Math.round(wScroll.x + portSize.width/2 - this.container.offsetWidth/2)+'px';
	} else {
		this.container.style.position = 'fixed';
		this.container.style.top = Math.round(portSize.height/2 - this.container.offsetHeight/2)+'px';
		this.container.style.left = Math.round(portSize.width/2 - this.container.offsetWidth/2)+'px';
	}

	if (!hasParent) {
		this.container.parentNode.removeChild(this.container);
		this.container.style.visibility = 'visible';
	}
};

/**
 * pozicovani na X, Y zadane galerii v parametrech: top a left
 * @class
 * @extends SZN.LightBox.Anchorage
 */
SZN.LightBox.Anchorage.TopLeft = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Anchorage.TopLeft',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Anchorage
});

/**
 * napozicovani galerie
 */
SZN.LightBox.Anchorage.TopLeft.prototype.actualizePosition = function() {
	this.container.style.top = this.options.top+'px';
	this.container.style.left = this.options.left+'px';
	this.container.style.position = 'absolute';
};

/*--------------------------------MAIN GALLERY WINDOW-------------------------------------*/
/**
 * trida hlavniho okna galerie. Umi zobrazit flash a obrazek ktery vzdy zmensi na velikost boxu (ne v pomeru)
 * @class
 */
SZN.LightBox.Main = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Main',
	VERSION: '1.0',
	CLASS: 'class',
	IMPLEMENT: [SZN.SigInterface]
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Main.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = this.owner.options.mainOpt;
	this.dom = {};
	this.ec = [];

	this.width = 0;
	this.height = 0;

};

SZN.LightBox.Main.prototype.$destructor = function() {
	for (p in this.dom) {
		this.dom[p] = null;
	}

	for(var i = 0; i < this.ec.length; i++) {
		SZN.Events.removeListener(this.ec[i]);
	}

	for (p in this) {
		this[p] = null;
	}
}

/**
 * metoda je volana pri renderovani galerie, vyrenderuje DIV obal pro budouci obrazky
 * @return {HTMLElement}
 */
SZN.LightBox.Main.prototype.render = function() {
	this.dom.mainBox = SZN.cEl('div', this.options.id,  this.options.className);
	this._attachEvents();
	return this.dom.mainBox;
};

/**
 * naveseni udalosti, pokud je povoleno navesti kolecko mysi pro prochazeni fotkami, navesime
 * @private
 */
SZN.LightBox.Main.prototype._attachEvents = function() {
	if (this.options.useMouseWheelScroll) {
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'DOMMouseScroll', this, '_scroll'));
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'mousewheel', this, '_scroll'));
	}
}

/**
 * pri pohybu kolecem nad fotkou jdeme na predchozi nebo nasledujici
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.Main.prototype._scroll = function(e, elm) {
	SZN.Events.cancelDef(e);

	var delta = e.wheelDelta || e.detail;

	if (SZN.Browser.client == "gecko") {
		delta = -delta;
	}
	if (delta > 0) {
		this.owner.previous();
	} else {
		this.owner.next();
	}
}

/**
 * metoda, ktera je volana pri potrebe zobrazit velkou fotku
 * @param {Object} imgObj
 */
SZN.LightBox.Main.prototype.update = function(i) {
	//SZN.Dom.clear(this.dom.mainBox);
	this.width = parseInt(this.dom.mainBox.clientWidth);
	this.height = parseInt(this.dom.mainBox.clientHeight);

	var imgObj = this.owner.data[i];
	if (imgObj.flash) { /* flash */
		this._generateFlashElm(imgObj);
	} else { /* picture */
		this._generateImgElm(imgObj);
	}
};

/**
 * vygenerovani flash objektu a vlozeni do stromu
 * @param {Object} img
 * @private
 */
SZN.LightBox.Main.prototype._generateFlashElm = function(img) {
	var em = SZN.cEl("embed");
	em.setAttribute("quality","high");
	em.setAttribute("pluginspage","http://www.macromedia.com/go/getflashplayer");
	em.setAttribute("type","application/x-shockwave-flash");
	em.setAttribute("width",this.width);
	em.setAttribute("height",this.height);
	em.setAttribute("allowfullscreen","true");
	em.setAttribute("src",img.big.url);
	em.setAttribute("flashvars",img.flash);
	em.style.visibility = 'hidden';
	em.style.position = 'absolute';
	this.dom.mainBox.appendChild(em);
	//this.dom.mainBox.innerHTML = this.dom.mainBox.innerHTML; //todo proverit nutnost
	this._switchImages(this.dom.mainBox.getElementsByTagName('embed')[0]);


};

/**
 * vygenerovani IMG elementu a vlozeni do stromu, obrazku se nenastavuji zadne
 * rozmery 
 * @param {Object} img
 * @private
 */
SZN.LightBox.Main.prototype._generateImgElm = function(img) {
	var em = SZN.cEl('img');
	em.style.visibility = 'hidden';
	em.style.position = 'absolute';
	em.src = img.big.url;
	this.dom.mainBox.appendChild(em);
	this._switchImages(em);
};

/**
 * zamena mezi starou a novou fotkou
 * @private
 */
SZN.LightBox.Main.prototype._switchImages = function (newImg) {
	var c = this.current;
	this.current = newImg;
	this.owner.transition.start(c, newImg);
}

/**
 * vylepseny okno galerie, umi resizovat obrazky neproporcionalne na velikost obalujiciho divu
 * @class 
 * @extends SZN.LightBox.Main 
 */ 
SZN.LightBox.Main.Scaled = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Main.Scaled',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Main
});

/**
 * vygenerovani IMG elementu a vlozeni do stromu, nastavi se mu rozmery jako rodice
 * @param {Object} img
 * @private
 */
SZN.LightBox.Main.Scaled.prototype._generateImgElm = function(img) {
	var em = SZN.cEl('img');
	em.height = this.height;
	em.width = this.width;
	em.style.visibility = 'hidden';
	em.style.position = 'absolute';
	em.src = img.big.url;
	this.dom.mainBox.appendChild(em);
	this._switchImages(em);
};

/**
 * vylepseny okno galerie, umi centrovat obrazky ktery vzdy zmensi v pomeru stran, k tomu vyuziva ScaledImage
 * @see SZN.LightBox.ScaledImage
 * @class
 * @extends SZN.LightBox.Main
 */
SZN.LightBox.Main.CenteredScaled = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Main.CenteredScaled',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Main
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Main.CenteredScaled.prototype.$constructor = function(owner) {
	this.callSuper('$constructor', arguments.callee)(owner);
	/**
	 * objekt zmenseneho obrazku
	 * @param {ScaledImage}
	 */
	this.scaledImage = null;

};

/**
 * prepsana metoda, tak aby misto obrazku delala instanci zmensovaciho obrazku @see SZN.LightBox.ScaledImage
 * ktery se umi sam vycentrovat v rocidi do ktereho se vklada
 * @see SZN.LightBox.Main#_generateImgElm
 * @param {Object} img
 */
SZN.LightBox.Main.CenteredScaled.prototype._generateImgElm = function(img) {
	var em = new SZN.LightBox.ScaledImage(this,img.big.url,this.width,this.height,this.dom.mainBox);
	em.render();                                                                        
	if (this.scaledImage) {
		this.scaledImage.$destructor();
		this.scaledImage = null;
	}

	this.scaledImage = em;
};
/*---------------------------TRANSITION----------------*/
/**
 * trida, umoznujici prechod mezi velkymi obrazky, tato jen stary zneviditelni a novy zobrazi
 * @class
 */
SZN.LightBox.Transition = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Transition',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Transition.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = owner.options.transitionOpt;
}

SZN.LightBox.Transition.prototype.$destructor = function() {
}

/**
 * metoda spoustejici "animaci" nad dvemi obrazky, stary zneviditelni, novy zviditelni
 * @see SZN.LightBox.Transition._finish
 * @param {HTMLElement} firstElm - puvodni obrazek
 * @param {HTMLElement} secondElm - novy obrazek
 */
SZN.LightBox.Transition.prototype.start = function(firstElm, secondElm) {
	this.first = firstElm;
	this.second = secondElm;
	this._finish();
}

/**
 * vycisteni stareho elementu a zobrazeni noveho
 * @private
 */
SZN.LightBox.Transition.prototype._finish = function() {
	this.second.style.visibility = "visible";
	if (this.first) {
		this.first.parentNode.removeChild(this.first);
	}
	this.first = null;
	this.second = null;
	this.owner.createEvent(this, 'transitionDone');
}

/*---------------------------FADE TRANSITION---------------------*/
/**
 * @class Fade in/out, prechod mezi obrazky. Je mozno nastavit delku trvani prechodu a taky prekryv mezi zacatky ztmavovani
 * a rozsveceni obrazku. V konfiguraci galerie je k tomu vyuzito pole options.transitionOpt s temito moznymi hodnotami:
 * interval (1000) - v ms udana delka trvani jednoho prechodu
 * frequency (25) - v ms uvedena doba trvani jednoho kroku
 * overlap: (1) - cislo mezi 0 a 1 udavajici posun zacnuti roztmivani noveho obr, od zacatku stmivani stareho obr. 1 znaci, ze roztmivani zacne soucasne se stmivanim
 */
SZN.LightBox.Transition.Fade = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Transition.Fade',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Transition
});

/**
 * konstruktor
 * @param owner
 */
SZN.LightBox.Transition.Fade.prototype.$constructor = function(owner) {
	this.options = {
		interval:400,
		frequency:25,
		overlap:1
	};
	this.owner = owner;
	for (var p in owner.options.transitionOpt) { this.options[p] = owner.options.transitionOpt[p]; }

	this.running1 = false; /* bezi prvni cast animace? */
	this.running2 = false; /* bezi druha cast animace? */

	this._secondOpacity = 0; /* pro pripad rychleho prepinani za behu */
	this._step1 = SZN.bind(this, this._step1);
	this._step2 = SZN.bind(this, this._step2);
	this._finish = SZN.bind(this, this._finish);

	this.i1 = new SZN.Interpolator(1, 0, this.options.interval, this._step1, {frequency:this.options.frequency});
	this.i2 = new SZN.Interpolator(0, 1, this.options.interval, this._step2, {frequency:this.options.frequency, endCallback:this._finish});
}

/**
 * start fadeovani
 * @param {HTMLElement} oldElm
 * @param {HTMLElement} newElm
 */
SZN.LightBox.Transition.Fade.prototype.start = function(oldElm, newElm) {
	if (this.running1 || this.running2) { /* nejaka animace uz probiha - jen prohodime novy obrazek */
		this.second.parentNode.removeChild(this.second);
		this.second = newElm;
		this._setOpacity(this.second, this._secondOpacity);
		this.second.style.visibility = "visible";
	} else { /* start animace */
		this.first = oldElm;
		this.second = newElm;
		this._secondOpacity = 0;

		this._setOpacity(this.second, 0);
		this.second.style.visibility = "visible";

		if (this.first) {
			this.running1 = true;
			this.i1.start();
		} else {
			this._start2();
		}
	}
}

/**
 * zacatek fadeovani noveho obrazku
 * @private
 */
SZN.LightBox.Transition.Fade.prototype._start2 = function() {
	this.running2 = true;
	this.i2.start();
}

SZN.LightBox.Transition.Fade.prototype._step1 = function(value) {
	if (!this.first) { return; }
	this._setOpacity(this.first, value);
	if (!this.running2 && value <= this.options.overlap) { this._start2(); } /* uz je cas nastartovat druhou cast animace */
}

SZN.LightBox.Transition.Fade.prototype._step2 = function(value) {
	this._secondOpacity = value;
	this._setOpacity(this.second, value);
}

SZN.LightBox.Transition.Fade.prototype._finish = function() {
	this.running1 = false;
	this.running2 = false;
	this.callSuper("_finish", arguments.callee)();
}

/**
 * metoda nastavujici pruhlednost jak pro IE tak ostatni prohlizece
 * @param {HTMLElement} node
 * @param {float} value hodnota od 0 do 1
 */
SZN.LightBox.Transition.Fade.prototype._setOpacity = function(node, value) {
	node.style.opacity = value;
	node.style.filter = "alpha(opacity="+Math.round(value*100)+")";
}


/*---------------------------SCALED IMAGE------------------------*/
/**
 * @class Zmenseny obrazek v hlavnim okne
 * @private
 */
SZN.LightBox.ScaledImage = SZN.ClassMaker.makeClass({
	NAME: "SZN.LightBox.ScaledImage",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * konstruktor
 * @param {SZN.LightBox.Main} owner - rodic
 * @param {String} src - URL s obrazkem
 * @param {Integer} w - maximalni sirka
 * @param {Integer} h - maximalni vyska
 * @param {HTMLElement} rootElm - DOM uzel, do ktereho ma byt obrazek vlozen, nutny pro zjisteni jeho rozmeru 
 */
SZN.LightBox.ScaledImage.prototype.$constructor = function(owner,src, w, h, rootElm) {
	this.owner = owner;
	this.w = w;
	this.h = h;
	this.src = src;
	this.rootElm = rootElm;
	this.ec = [];
	this.dom = {};

}

/**
 * vyrenderovani obrazku do pomocneho skryteho boxu, naveseni onload
 */
SZN.LightBox.ScaledImage.prototype.render = function() {
	this.dom.elm = SZN.cEl("img");
	//this.dom.elm.style.visibility = 'hidden';
	this.dom.container = SZN.cEl("div",false,false,{position:"absolute",left:"-1000px",top:"-1000px",width:"1px",height:"1px",overflow:"hidden"});
	this.ec.push(SZN.Events.addListener(this.dom.elm,"load",this,"_loaded",false,true));
	document.body.insertBefore(this.dom.container,document.body.firstChild);
	this.dom.container.appendChild(this.dom.elm);
	this.dom.elm.src = this.src;
}

/**
 * @method Explicitni destruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.LightBox.ScaledImage.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this.dom) { this.dom[p] = null; }

	for (var p in this) { this[p] = null; }
}

/**
 * na onload zjisteni velikosti obrazku, zmenseni a vycentrovani a prepnuti do galerie
 * @param {Event} e
 * @param {HTMLElement} elm
 */
SZN.LightBox.ScaledImage.prototype._loaded = function(e, elm) {      // alert('scaledImage(loaded)');


	var w = this.dom.elm.width;
	var h = this.dom.elm.height;

	var ratio_w = w/this.w;
	var ratio_h = h/this.h;
	var max = Math.max(ratio_w,ratio_h);
	/* need to scale */
	if (max > 1) {
		w = w / max;
		h = h / max;
		if (w && h) {
			this.dom.elm.width = Math.ceil(w);
			this.dom.elm.height = Math.ceil(h);
		}
	}

	/*vycentrovani v rodici*/
	var pw = this.rootElm.clientWidth;
	var ph = this.rootElm.clientHeight;
	this.dom.elm.style.position = 'absolute';
	this.dom.elm.style.visibility = 'hidden';
	this.dom.elm.style.top = Math.round((ph - h)/2)+'px';
	this.dom.elm.style.left = Math.round((pw - w)/2)+'px';

	if (this.rootElm) {
		this.rootElm.appendChild(this.dom.elm);
	}
	if (this.dom.container)	{
		this.dom.container.parentNode.removeChild(this.dom.container);
		this.dom.container = false;
	}
	this.owner.owner.createEvent(this, 'mainImageLoaded');


	this.owner._switchImages(this.dom.elm);
}

/*------------------------PAGE SHADER---------------------------*/
/**
 * volitelna komponenta umoznujici vytvorit ztmavnuti stranky pod galerii
 * @class
 */
SZN.LightBox.PageShader = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.PageShader',
	VERSION: '1.0',
	CLASS: 'class',
	IMPLEMENT: [SZN.SigInterface]
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.PageShader.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.dom = {};

	this.addListener('showed', '_show', this.owner);
	this.addListener('close', '_hide', this.owner);
	this.addListener('windowResize', '_resize', this.owner);
};

SZN.LightBox.PageShader.prototype.$destructor = function() {
	for (p in this.dom) {
		this.dom[p] = null;
	}

	for (p in this) {
		this[p] = null;
	}
};

/**
 * na udalost galerie "showed" je take pripnut do stranky shader a to hned za element galerie
 * @private
 */
SZN.LightBox.PageShader.prototype._show = function() {
	this.dom.root = SZN.cEl("div",false,"image-browser-root",{position:"absolute",left:"0px",top:"0px"});

	var docSize = SZN.Dom.getDocSize();
	var docH = document.compatMode == 'BackCompat' ? document.body.scrollHeight : document.body.offsetHeight;
	var docW = document.compatMode == 'BackCompat' ? document.body.scrollWidth : document.body.offsetWidth;
	this.dom.root.style.width = (docSize.width > docW ? docSize.width : docW) + 'px';
	this.dom.root.style.height = (docSize.height > docH ? docSize.height : docH) + 'px'; 

	if (this.owner.options.zIndex) {
		this.dom.root.style.zIndex = this.owner.options.zIndex -1;
	}

	var parent = this.owner.dom.container.parentNode;
	var nextSibling = this.owner.dom.container.nextSibling;
	parent.insertBefore(this.dom.root, nextSibling);
	SZN.Dom.elementsHider(this.dom.root, false, "hide");
};

/**
 * pri schovani galerie je vyvolana udalost "close", na kterou je volana tato metoda pro schovani shaderu
 * @private
 */
SZN.LightBox.PageShader.prototype._hide = function() {
	if (this.dom.root && this.dom.root.parentNode) {
		SZN.Dom.elementsHider(this.dom.root, false, "hide");
		this.dom.root.parentNode.removeChild(this.dom.root);
	}
	this.dom.root = null;
};

/**
 * pri zmene velikosti okna je nutne shader natahout na spravnou velikost
 * nyni je to udelano tak, ze se zrusi a novu vytvori
 * @private
 */
SZN.LightBox.PageShader.prototype._resize = function() {
	this._hide();
	this._show();
};

/*---------------------------THUMBNAILS STRIP--------------------------*/
/**
 * vychozi trida pro filmovy pas nahledu, tato neumi nic, jen definuje rozhrani,
 * vhodne ji pouzit pokud chceme galerii bez nahledu
 * @class
 */
SZN.LightBox.Strip = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Strip',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Strip.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = this.owner.options.stripOpt;
	this.dom = {};
};

SZN.LightBox.Strip.prototype.$destructor = function() {
	for (p in this.dom) {
		this.dom[p] = null;
	}

	for (p in this) {
		this[p] = null;
	}
};

/**
 * vyrenderuje box pro nahledy, v tomto pripade generuje prazdny div
 */
SZN.LightBox.Strip.prototype.render = function() {
	this.dom.mainBox = SZN.cEl('div', this.options.id,  this.options.className);
	return this.dom.mainBox;
};

/**
 * metoda volana pokud je vybran obrazek k zobrazeni, zde nic nedela
 * @param {int} index
 */
SZN.LightBox.Strip.prototype.update = function(index) {

};


/**
 * nahledovy pruh s fotkami muze byt horizontalne nebo vertikalne, aktualne zobrazenou fotku se snazi
 * udrzet scrolovanim ve stredu pasu
 * @class
 * @extends SZN.LightBox.Strip
 */
SZN.LightBox.Strip.Scrollable = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Strip.Scrollable',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Strip
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Strip.Scrollable.prototype.$constructor = function(owner) {
	this.callSuper('$constructor', arguments.callee)(owner);
	/**
	 * pole kam si ukladam instance SZN.LightBox.StripImage
	 */
	this.objCache = [];

	this.ec = [];

	/**
	 * uschovna rozmeru ramecku aktivniho boxiku
	 */
	this.activeBorder = {};
};

SZN.LightBox.Strip.Scrollable.prototype.$destructor = function() {
	for (var i = 0; i < this.objCache.length; i++) {
		this.objCache[i].$destructor();
		this.objCache[i] = null;
	}

	for (var i = 0; i < this.ec.length; i++) {
		SZN.Events.removeListener(this.ec[i]);
	}

	this.callSuper('$destructor', arguments.callee)();
};

/**
 * pro vsechny obrazky to vygeneruje jejich zastupce do stripu, zastupci jsou generovany ze tridy
 * vygeneruji take box pro xobrazeni aktivniho prvku
 * @see SZN.LightBox.StripImage
 */
SZN.LightBox.Strip.Scrollable.prototype.render = function() {
	this.callSuper('render', arguments.callee)();

	this.owner.dom.content.appendChild(this.dom.mainBox);
	this.dom.mainBox.style.position = 'relative';

	this.dom.imageBox = SZN.cEl('div');
	this.dom.mainBox.appendChild(this.dom.imageBox);

	this.dom.imageTable = SZN.cEl('table');
	this.dom.imageTable.style.borderCollapse = 'collapse';
	//this.dom.imageTable.style.tableLayout = 'fixed';
	var tbody = SZN.cEl('tbody');
	this.dom.imageTable.appendChild(tbody);
	this.dom.imageBox.appendChild(this.dom.imageTable);
	/*generovani nahledu do tabulky, jednou do jednoho sloupecku podruhe do jednoho radku*/
	for (var i = 0; i < this.owner.data.length; i++) {
		if (this.options.orientation == 'vertical') {
			var tr = SZN.cEl('tr');
			var td = SZN.cEl('td');
			tr.appendChild(td);
			td.align = 'center';
			td.vAlign = 'center';
			tbody.appendChild(tr);
		} else {
			if (i == 0) {
				var tr = SZN.cEl('tr');
			}
			var td = SZN.cEl('td');
			td.align = 'center';
			td.vAlign = 'center';
			tr.appendChild(td);
			if (i == this.owner.data.length -1) {
				tbody.appendChild(tr);
			}
		}
		var div = SZN.cEl('div', false, this.options.imageBoxClassName);
		div.style.position = 'relative';
		td.style.padding = '0px';
		td.appendChild(div);

	}

	var elms = SZN.Dom.arrayFromCollection(tbody.getElementsByTagName('div'));
	for (var i = 0; i < this.owner.data.length; i++) {
		var stripImg = new SZN.LightBox.StripImage(this.owner, this.options, this.owner.data[i], i);
		stripImg.render(elms[i]);
		this.objCache.push(stripImg);
	}

	this.dom.active = SZN.cEl('div', this.options.activeId, this.options.activeClassName);
	this.dom.active.style.position = 'absolute';

	/*docasne si aktivku pripneme a zjistime jeho ramecky, abychom je nemuseli porad zjistovat*/
	this.dom.mainBox.appendChild(this.dom.active);
	this.activeBorder.top = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderTopWidth'));
	this.activeBorder.bottom = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderBottomWidth'));
	this.activeBorder.left = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderLeftWidth'));
	this.activeBorder.right = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderRightWidth'));
	this.dom.mainBox.removeChild(this.dom.active);


	/*naveseni udalosti*/
	this._addEvents();

	return this.dom.mainBox;
};

/**
 * pokud zobrazujeme strip vodorovny, chceme aby se v nem dalo scrolovat koleckem, navesime na scroll udalost
 * @private
 */
SZN.LightBox.Strip.Scrollable.prototype._addEvents = function() {
	if (this.options.orientation == 'horizontal') {
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'DOMMouseScroll', this, '_scroll'));
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'mousewheel', this, '_scroll'));
	}
};

/**
 * zajistuje vlastni scrolovani elementu s fotkama, vyvolano udalosti mousewheel
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.Strip.Scrollable.prototype._scroll = function(e, elm) {
	SZN.Events.cancelDef(e);

	var delta = e.wheelDelta || e.detail;

	if (SZN.Browser.client == "gecko") {
		delta = -delta;
	}
	if (delta > 0) {
		this.dom.mainBox.scrollLeft -= 30;
	} else {
		this.dom.mainBox.scrollLeft += 30;
	}

}

/**
 * reknu konretnimu StripImage aby se highlitoval, jelikoz je vytvarim ve stejnem poradi
 * jako jsou v this.owner.data, staci mi index na jeho vybrani
 * @param {int} index
 */
SZN.LightBox.Strip.Scrollable.prototype.update2 = function(index) {
	/*nastaveni pozice ramovani aktualni fotky*/
	this.dom.active.style.position = 'absolute';
	var pos = SZN.Dom.getBoxPosition(this.objCache[index].dom.img.parentNode, this.dom.imageTable);
	/*nastaveni velikosti rameckoveho divu*/
	var borderTop = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderTopWidth'));
	var borderBottom = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderBottomWidth'));
	var borderLeft = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderLeftWidth'));
	var borderRight = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderRightWidth'));
	if (this.options.activeBorder == 'inner') {
		this.dom.active.style.top = pos.top+'px';
		this.dom.active.style.left = pos.left+'px';
		this.dom.active.style.width = (this.objCache[index].dom.img.parentNode.offsetWidth - (!isNaN(borderLeft) ? borderLeft : 0) - (!isNaN(borderRight) ? borderRight : 0))+'px';
		this.dom.active.style.height = (this.objCache[index].dom.img.parentNode.offsetHeight - (!isNaN(borderTop) ? borderTop : 0) - (!isNaN(borderBottom) ? borderBottom : 0))+'px';
	} else {
		this.dom.active.style.top = (pos.top - (!isNaN(borderLeft) ? borderLeft : 0))+'px';
		this.dom.active.style.left = (pos.left - (!isNaN(borderTop) ? borderTop : 0))+'px';
		this.dom.active.style.width = (this.objCache[index].dom.img.parentNode.offsetWidth )+'px';
		this.dom.active.style.height = (this.objCache[index].dom.img.parentNode.offsetHeight )+'px';
	}

	if (this.options.orientation == 'vertical') {
		var a = SZN.Dom.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(SZN.Dom.getStyle(this.dom.mainBox,  'height')) / 2;
		var c = parseInt(SZN.Dom.getStyle(this.objCache[index].dom.img.parentNode,  'height')) / 2;
		var scroll = a.top - b + c;
		this.dom.mainBox.scrollTop = Math.round(scroll);
	} else {
		var a = SZN.Dom.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(SZN.Dom.getStyle(this.dom.mainBox,  'width')) / 2;
		var c = parseInt(SZN.Dom.getStyle(this.objCache[index].dom.img.parentNode,  'width')) / 2;
		var scroll = a.left - b + c; 
		this.dom.mainBox.scrollLeft = Math.round(scroll);
	} 
};

SZN.LightBox.Strip.Scrollable.prototype.update = function(index) {

	if (this.options.activeBorder == 'inner') {
		this.dom.active.style.left =  '0px';
		this.dom.active.style.top =  '0px';
		this.dom.active.style.width = (this.objCache[index].dom.img.parentNode.offsetWidth - (!isNaN(this.activeBorder.left) ? this.activeBorder.left : 0) - (!isNaN(this.activeBorder.right) ? this.activeBorder.right : 0))+'px';
		this.dom.active.style.height = (this.objCache[index].dom.img.parentNode.offsetHeight - (!isNaN(this.activeBorder.top) ? this.activeBorder.top : 0) - (!isNaN(this.activeBorder.bottom) ? this.activeBorder.bottom : 0))+'px';
	} else {
		this.dom.active.style.left =  - (!isNaN(this.activeBorder.left) ? this.activeBorder.left : 0)+'px';
		this.dom.active.style.top =  - (!isNaN(this.activeBorder.top) ? this.activeBorder.top : 0)+'px';
		this.dom.active.style.width = (this.objCache[index].dom.img.parentNode.clientWidth )+'px';
		this.dom.active.style.height = (this.objCache[index].dom.img.parentNode.clientHeight )+'px';
		//this.dom.active.style.zIndex = 1000;
	}
	this.objCache[index].dom.img.parentNode.appendChild(this.dom.active);


	if (this.options.orientation == 'vertical') {
		var a = SZN.Dom.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(SZN.Dom.getStyle(this.dom.mainBox,  'height')) / 2;
		var c = parseInt(SZN.Dom.getStyle(this.objCache[index].dom.img.parentNode,  'height')) / 2;
		var scroll = a.top - b + c;
		this.dom.mainBox.scrollTop = Math.round(scroll);
	} else {
		var a = SZN.Dom.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(SZN.Dom.getStyle(this.dom.mainBox,  'width')) / 2;
		var c = parseInt(SZN.Dom.getStyle(this.objCache[index].dom.img.parentNode,  'width')) / 2;
		var scroll = a.left - b + c;
		this.dom.mainBox.scrollLeft = Math.round(scroll);
	}
};

/*----------------------------STRIP IMAGE------------------------------*/
/**
 * instance jednoho obrazku ve stripu nahledu
 * @see SZN.LightBox.Strip.Scrollable
 * @class
 */
SZN.LightBox.StripImage = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.StripImage',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {SZN.LightBox} mainOwner - objekt rodice - galerie
 * @param {Object} data - data o malem obrazku
 * @param {Number} order - poradi obrazku ve stripu, zacina od 0
 */
SZN.LightBox.StripImage.prototype.$constructor = function(mainOwner, options, data, order) {
	this.mainOwner = mainOwner;
	this.data = data;
	this.options = options;
	this.order = order;
	this.dom = {};
	this.ec = [];
};

SZN.LightBox.StripImage.prototype.$destructor = function() {
	for (var i = 0; i < this.ec.length; i++) {
		SZN.Events.removeListener(this.ec[i]);
	}

};

/**
 * je predana bunka tabulky do ktere bude obrazek zmensen, obrazek renderovan do pomocneho boxu a ceka se na load
 * @param {HTMLElement} elm
 */
SZN.LightBox.StripImage.prototype.render = function(elm) {
	this.dom.parentNode = elm;
	/*vytvoreni pomocneho elementu, do ktereho nandam obrazek v loaded zjistim jeho velikost a prenu ho do predaneho elementu*/
	this.dom.tmpBox = SZN.cEl('div', false, false, {position: 'absolute', top: '-100px', left: '-100px', width: '1px', height: '1px', overflow: 'hidden'});
	var body = document.getElementsByTagName('body')[0];
	body.insertBefore(this.dom.tmpBox, body.firstChild);

	this.dom.img = SZN.cEl('img');
	this.dom.tmpBox.appendChild(this.dom.img);
	this.ec.push(SZN.Events.addListener(this.dom.img, 'load', this, '_loaded'));
	this.dom.img.src = this.data.small.url;
	this.dom.img.alt = this.data.alt;
	this.ec.push(SZN.Events.addListener(elm, 'click', this, '_click'));
};


/**
 * naveseni click udalosti na obrazek
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.StripImage.prototype._click = function(e, elm) {
	this.mainOwner.go(this.order);
};

/**
 * po loadu obrazku je zmensen a zavesen do bunky
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.StripImage.prototype._loaded = function(e, elm) {
	/*obrazek nacten nactu jeho velikost, protoze je ve stromu*/
	var w = elm.width;
	var h = elm.height;

	/*obrazek schovame a pripneme do spravne bunky tabulky, tim ziskame rodice*/
	this.dom.img.style.display = 'none';
	this.dom.parentNode.appendChild(this.dom.img);
	this.dom.tmpBox.parentNode.removeChild(this.dom.tmpBox);
	this.dom.tmpBox = null;
	/*rodice se zeptame na velikost, kdyby obrazek nebyl schovany, tak by tu bunku roztahnul a dostali bychom spatne velikosti*/
	var boxW = parseInt(this.dom.img.parentNode.clientWidth);    // console.log(this.dom.imgBox.currentStyle['width'])
	var boxH = parseInt(this.dom.img.parentNode.clientHeight);

	var ratio_w = w / boxW;
	var ratio_h = h / boxH;
	var max = Math.max(ratio_w,ratio_h);
	/* need to scale */
	if (max > 1) {
		w = Math.floor(w / max); /*jelikoz boz do ktereho cpu obrazky nemuze byt overflow hidden kvuli ACTIVe ramecku, musim obrazky delat radsi mensi*/
		h = Math.floor(h / max);
		if (w && h) {
			this.dom.img.width = w;
			this.dom.img.height = h;
		}
	}

	/*vycentrovani v rodici*/
	var ph = this.dom.parentNode.clientHeight;
	this.dom.img.style.marginTop = Math.round((ph - h)/2)+'px';
	this.dom.img.parentNode.textAlign = 'center';


	/*a nakonec zobrazime obrazek*/
	this.dom.img.style.display = '';

	
};

/*--------------------------DESCRIPTION------------------------------*/
/**
 * zajisteni zobrazeni popisku aktualniho obrazku, tato trida nicmene nereaguje na udalosti,
 * pokud je treba zajistit nezobrazovani popisku, je vhodne pouzit ji
 * @class
 */
SZN.LightBox.Description = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Description',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {HTMLEditor} owner
 */
SZN.LightBox.Description.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = owner.options.descriptionOpt;
	this.dom = {};
};

SZN.LightBox.Description.prototype.$destructor = function() {
	for (var p in this.dom) {
		this.dom[p] = null;
	}

	for(var p in this) {
		this[p] = null;
	}
};

/**
 * vytvoreni boxu pro popisek obrazku
 * @return {HTMLElement}
 */
SZN.LightBox.Description.prototype.render = function() {
	this.dom.box = SZN.cEl('div', this.options.id, this.options.className);
	return this.dom.box;
};

/**
 * zobrazeni popisku obrazku s danym indexem
 * @param {int} index
 */
SZN.LightBox.Description.prototype.update = function(index) {

};

/**
 * tato trida zobrazuje zadany popisek pomoci innerHTML, jde tedy vkladat cele HTML
 * @class
 * @extends SZN.LightBox.Description
 */
SZN.LightBox.Description.Basic = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Description.Basic',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Description
});

/**
 * renderujeme navic vnitrni div, pro moznost lepsiho stylovani
 * @return {HTMLElement}
 */
SZN.LightBox.Description.Basic.prototype.render = function() {
	this.callSuper('render', arguments.callee)();

	this.dom.content = SZN.cEl('div', this.options.contentId, this.options.contentClassName);
	this.dom.box.appendChild(this.dom.content);
	return this.dom.box;
};

/**
 * pomoci innerHTML vkladame popisek obrazku daneho indexem
 * @param {int} index
 */
SZN.LightBox.Description.Basic.prototype.update = function(index) {
	if(this.owner.data[index].description){
		this.dom.content.innerHTML = this.owner.data[index].description;
	}
};

/*------------------------NAVIGATION----------------------------*/
/**
 * trida obstaravajici rozhranni pro navigaci
 * @class
 */
SZN.LightBox.Navigation = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Navigation',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {SZN.LightBox} owner
 */
SZN.LightBox.Navigation.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = owner.options.navigationOpt;
	this.dom = {};
	this.ec = [];
};

SZN.LightBox.Navigation.prototype.$destructor = function() {
	for(var p in this.dom) {
		this.dom[p] = null;
	}
	for (var i = 0; i < this.ec.length; i++) {
		SZN.Events.removeListener(this.ec[i]);
	}

	for (var p in this) {
		this[p] = null;
	}
};

/**
 * metoda je volana pri vytvareni galerie, vraci prazdny box
 */
SZN.LightBox.Navigation.prototype.render = function() {
	return SZN.cEl('div');
};

/**
 * metoda je volana pri zmene obrazku
 * @param {int} index
 */
SZN.LightBox.Navigation.prototype.update = function(index) {

}


/**
 * rozsireni o zakladni tlacitka pro posun vpred/vzad a vypnuti. navesuje vsechny potrebne udalosti
 * @class
 * @extends SZN.Lightbox.Navitagion
 */
SZN.LightBox.Navigation.Basic = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Navigation.Basic',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Navigation
});

/**
 * vyrenderovani tri divu pro ovladaci prvky <<, >> a X
 * ty jsou nastylovani CSSkama a naveseny na ne udalosti
 */
SZN.LightBox.Navigation.Basic.prototype.render = function() {
	this.dom.next = SZN.cEl('a', this.options.nextId, this.options.nextClassName);
	this.dom.prev = SZN.cEl('a', this.options.prevId, this.options.prevClassName);
	this.dom.nextDisabled = SZN.cEl('a', this.options.nextId ? this.options.nextId+'-disabled' : false, this.options.nextClassName+'-disabled');
	this.dom.prevDisabled = SZN.cEl('a', this.options.prevId ? this.options.prevId+'-disabled' : false, this.options.prevClassName+'-disabled');
	this.dom.close = SZN.cEl('a', this.options.closeId, this.options.closeClassName);
	/*v IE6 jde hover jen nad Ackem co ma odkaz, proto tam musi byt mrizka*/
	this.dom.next.href = '#';
	this.dom.prev.href = '#';
	this.dom.nextDisabled.href = '#';
	this.dom.prevDisabled.href = '#';
	this.dom.close.href='#';

	this._addEvents();

	var div = SZN.cEl('div');
	SZN.Dom.append([div, this.dom.next, this.dom.nextDisabled, this.dom.prev, this.dom.prevDisabled, this.dom.close]);
	return div;
};

/**
 * naveseni udalosti na tlacitka
 * @private
 */
SZN.LightBox.Navigation.Basic.prototype._addEvents = function() {
	this.ec.push(SZN.Events.addListener(this.dom.next, 'click', this, '_next'));
	this.ec.push(SZN.Events.addListener(this.dom.prev, 'click', this, '_previous'));
	this.ec.push(SZN.Events.addListener(this.dom.close, 'click', this, '_close'));
	this.ec.push(SZN.Events.addListener(document, 'keydown', this, '_closeKey'));
	/*u disabled tlacitek nechceme proklik na kotvu*/
	this.ec.push(SZN.Events.addListener(this.dom.nextDisabled, 'click', this, '_disabled'));
	this.ec.push(SZN.Events.addListener(this.dom.prevDisabled, 'click', this, '_disabled'));
};

SZN.LightBox.Navigation.Basic.prototype._disabled = function(e, elm) {
	elm.blur();
	SZN.Events.cancelDef(e);
};

SZN.LightBox.Navigation.Basic.prototype._close = function(e, elm) {
	elm.blur();
	SZN.Events.cancelDef(e);
	this.owner.close();
};

SZN.LightBox.Navigation.Basic.prototype._next = function(e, elm) {
	elm.blur();
	SZN.Events.cancelDef(e);
	this.owner.next();
};

SZN.LightBox.Navigation.Basic.prototype._previous = function(e, elm) {
	elm.blur();
	SZN.Events.cancelDef(e);
	this.owner.previous();
};

/**
 * pokud je zmacknut Esc tak galerii zavirame
 * @param e
 * @param elm
 */
SZN.LightBox.Navigation.Basic.prototype._closeKey = function(e, elm) {
	if (e.keyCode == 27) {
		this.owner.close();
	}
};

/**
 * volano pri zobrazeni obrazku, aktualizuji zobrazeni navigacnich << a >> pokud neni kontinualni navigace
 * @param {int} index
 */
SZN.LightBox.Navigation.Basic.prototype.update = function(index) {
	if (!this.options.continuous) {
		this.dom.prev.style.display = '';
		this.dom.next.style.display = '';
		this.dom.prevDisabled.style.display = 'none';
		this.dom.nextDisabled.style.display = 'none';
		if (index == 0) {
			this.dom.prev.style.display = 'none';
			if (this.options.showDisabled) {
				this.dom.prevDisabled.style.display ='';
			}
		}
		if (index == this.owner.data.length -1) {
			this.dom.next.style.display = 'none';
			if (this.options.showDisabled) {
				this.dom.nextDisabled.style.display = '';
			}
		}
	}
};
