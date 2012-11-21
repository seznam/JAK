/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Rozšířená galerie umožňující volbu vnitřních komponent, tím pádem je možno zvolit zda bude vidět
 * náhledový pás, nebo popis obrázku. Veškeré stylování probíhá pomocí CSS
 * @group jak-widgets
 * @signal renderDone
 * @signal windowResize
 * @signal show
 * @signal showed
 * @signal close
 * @signal closed
 * @signal go
 * @signal transitionDone
 * @signal mainImageLoaded
 */
JAK.LightBox = JAK.ClassMaker.makeClass({
	NAME: "JAK.LightBox",
	VERSION: "2.1",
	IMPLEMENT: [JAK.ISignals, JAK.IComponents]
});

/**
 * konstanta udávající směr, kterým uživatel prochází galerií
 * @constant
 */
JAK.LightBox.DIR_PREV = -1;
/**
 * konstanta udávající směr, kterým uživatel prochází galerií
 * @constant
 */
JAK.LightBox.DIR_NEXT = 1;

/**
 * DOM element, do ktereho se LightBoxy pripinaji, lze ho nastavit rucne, pokud neni
 * nastaven a lightBox ho potrebuje, vytvori ho a pripne na zacatek body 
 */ 
JAK.LightBox.container = null;

/**
 * konstruktor galerie
 * @param {array} data
 * @param {object} optObj
 */
JAK.LightBox.prototype.$constructor = function(data, optObj) {
	/**
	 * vlastnosti, ty co jsou jako hodnota jsou pro galerii a jsou obecné, ty co jsou jako objekt se nejlépe používají
	 * pro dalši komponenty
	 */
	this.options = {
		components: {
			anchorage: JAK.LightBox.Anchorage,
			//anchorage: JAK.LightBox.Anchorage.Fixed,
			main: JAK.LightBox.Main,
			strip: JAK.LightBox.Strip,
			description: JAK.LightBox.Description,
			pageShader: JAK.LightBox.PageShader,
			navigation: JAK.LightBox.Navigation,
			transition: JAK.LightBox.Transition,
			others: []
		},
		imagePath: "img/",
		imageFormat: "png",
		parent: false,  /*rodičovský element, pokud je zadán, galerie se vyblinká do něj*/
		zIndex: false,
		useShadow: false,
		usePageShader: true,
		shadowSizes: [16,16,16,16],
		galleryId: false,
		galleryClassName: 'image-browser-content',
		galleryName: false,
		handleDocumentCloseClick: true, /*ve většině případů chceme aby když někdo klikne mimo otevřenou galerii, aby se zavřela, pokud ale galerii zobrazuji přímo*/
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
			id: false,
			className: "image-browser-navigation",
			continuous: true,
			showDisabled: false, /*zobrazuji disablované tlačítko, pokud je continuous:false, když je i zde false, pak tlačítka nejsou zobrazena vůbec pokud nemají smysl*/
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
	 * uchování dom struktury ke které chceme přistupovat
	 */
	this.dom = {};
	/**
	 * zásobník eventů
	 */
	this.ec = [];
	/**
	 * pole objektů, které dočasně potřebujeme
	 */
	this.objCache = [];
	/**
	 * pole komponent určující funkčnost galerie
	 */
	this.components = [];
	/**
	 * zda je galerie zobrazena
	 */
	this.visible = false;
	/**
	 * index zobrazené fotky
	 */
	this.index = 0;
	/**
	 * jakým směrem uživatel prochází galerií
	 */
	this.direction = JAK.LightBox.DIR_NEXT;
	/**
	 * jméno kotvy na kterou skáče slepec přeskakující galerii
	 */
	this.blindLinkName = JAK.idGenerator();
	/**
	 * jméno globální kotvy pro preskočení všech galerii
	 */	 	
	 this.blindLinkGlobalName = 'LightBoxLastBlindAnchor';
	/**
	 * styly pro prvky schované pro slepce
	 */
	this.blindStyle = { position:'absolute', top:'-1000px', left:'-1000px', width:'1px', height:'1px', overflow:'hidden' };
	/**
	 * data obsahují pole dat pro vytvoření galerie
	 */
	this.data = [];
	for (var i=0;i<data.length;i++) {
		var item = data[i];
		var o = {};
		for(var j in item){
			o[j] = item[j];
		}
		if (item.main) { this.index = i;} /*změním výchozí fotku, vhodné jen pokud je galerie otevíraná ihned do elementu*/
		this.data.push(o);
	}


	/*vygenerování domu*/
	this._buildContainer();

	this._renderBlindStart();

	/*vyrenderování obsahu ze základních komponent*/
	this._render();

	/*připojení ostatních komponent*/
	for (var i = 0; i < this.options.components.others.length; i++) {
		this.addNewComponent(this.options.components.others[i]);
	}
	/*pro prolínání flashe musím vždy použít obyčejnou Transition, protože flash vždy vše přebije, použito v JAK.LightBox.Main._switchImages*/
	this.addNewComponent({name: 'dummyTransition', part: JAK.LightBox.Transition});

	this._renderBlindEnd();
};

/**
 * statická metoda umožňující vytvořit galerii přímo nad elementem obsahujícím linky na velké obrázky a v lincích
 * obsahující obrázky malé. Z toho se získají data pro naplňení galerie, nicméně takto nejde udělat galerie z obrázků,
 * které  nejsou v tomto elementu obsaženy
 * @static
 * @param {HTMLElement} elm - rodičovský element pro získání dat a navázání událostí na otevření
 * @param {Object} optObj - konfigurační objekt galerie
 */
JAK.LightBox.create = function(elm, optObj) {
	elm = JAK.gel(elm);
	var data = [];
	var l = [];
	var links = elm.getElementsByTagName('a');
	for (var i = 0; i < links.length; i++) {
		var img = links[i].getElementsByTagName('img')[0];
		if (!img) {
			continue;
		}
		data.push({alt: img.alt, small: {url: img.src}, big: {url: links[i].href} });
		l.push(links[i]);
	}

	var g = new JAK.LightBox(data, optObj);
	for (var i = 0; i < l.length; i++) {
		g.bindElement(l[i], i);
	}
	return g;
}

/**
 * destruktor
 */
JAK.LightBox.prototype.$destructor = function() {
	for (var i = 0; i < this.objCache.length; i++) {
		this.objCache[i].$destructor();
		this.objCache[i] = null;
	}

	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}

	/*zničení všech komponent*/
	this.callChildDestructor();

	for (var p in this) { this[p] = null; }
};

/**
 * metoda přidává komponenty, nicméně nejdřív dělá test zda komponenty dědí ze správných rodičovských tříd
 * @param {string} name
 * @param {Class} part
 * @param {Class} className
 * @private
 */
JAK.LightBox.prototype._addDefaultComponent = function(name, part, className) {
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
 * vytvoření kontejneru, pokud chceme stíny, dělají se pomocí JAK.Window, jinak do divu
 * @see JAK.Window
 * @private
 */
JAK.LightBox.prototype._buildContainer = function() {
	if (JAK.LightBox.container == null) {
		JAK.LightBox.container = JAK.cel('div');
		JAK.LightBox.container.style.position = 'absolute';
		JAK.LightBox.container.style.top = '-100px';
		JAK.LightBox.container.style.left = '-100px';
		JAK.LightBox.container.style.overflow = 'hidden';
		JAK.LightBox.container.style.width = '1px';
		JAK.LightBox.container.style.height = '1px';
		var body = document.getElementsByTagName('body')[0];
		body.insertBefore(JAK.LightBox.container, body.firstChild);
	}

	/*vytvoření dočasného úložiště, kam se ihned galerie připne aby se daly počítat rozměry*/
	this.dom.loadBox = JAK.cel('div');
	this.dom.loadBox.style.position = 'absolute';
	JAK.LightBox.container.appendChild(this.dom.loadBox);

	var div = JAK.cel('div', this.options.galleryClassName, this.options.galleryId);

	if (this.options.useShadow) {
		var winopts = {
			imagePath:this.options.imagePath,
			imageFormat:this.options.imageFormat,
			sizes:this.options.shadowSizes
		}
		this.window = new JAK.Window(winopts);
		this.dom.container = this.window.container;
		/* okno ve výchozím nastavení bude vždy absolutně pozicování, JAK.Window 
		 * totiž nastavuje relativě a to může vést k ovlivňování stránky, když 
		 * je galerie připínaná na začátek DOMu
		 */
		this.dom.container.style.position ='absolute'; 
		this.window.content.appendChild(div);
		this.dom.content = div;
	} else {
		this.dom.container = JAK.mel("div", null, {position:"absolute"});
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
 * volání render nad všemi základními komponentami galerie
 * @private
 */
JAK.LightBox.prototype._render = function() {

	/*zjištění správné funkčnosti*/
	this._addDefaultComponent('anchorage', this.options.components.anchorage, JAK.LightBox.Anchorage);
	this._addDefaultComponent('transition', this.options.components.transition, JAK.LightBox.Transition);

	this._addDefaultComponent('main', this.options.components.main, JAK.LightBox.Main);
	this.dom.content.appendChild(this.main.render());
	if (this.options.usePageShader) {
		this._addDefaultComponent('pageShader', this.options.components.pageShader, JAK.LightBox.PageShader);
	}
	this._addDefaultComponent('strip', this.options.components.strip, JAK.LightBox.Strip);
	this.dom.content.appendChild(this.strip.render());
	this._addDefaultComponent('description', this.options.components.description, JAK.LightBox.Description);
	this.dom.content.appendChild(this.description.render());
	this._addDefaultComponent('navigation', this.options.components.navigation, JAK.LightBox.Navigation);
	this.dom.content.appendChild(this.navigation.render());

	this.makeEvent('renderDone');
};

/**
 * blindfriendly: na začátek obsahu hodím H3 a odskok na konec
 * @private
 */
JAK.LightBox.prototype._renderBlindStart = function() {
	var h3 = JAK.cel('h3');
	h3.innerHTML = 'Fotogalerie' + (this.options.galleryName ? ' '+this.options.galleryName : '');
	JAK.DOM.setStyle(h3, this.blindStyle);
	
	var linkAll = JAK.cel('a');
	linkAll.href='#'+this.blindLinkGlobalName;
	linkAll.innerHTML ='Přeskočit všechny fotogalerie';
	JAK.DOM.setStyle(linkAll, this.blindStyle);	
	
	var link = JAK.cel('a');
	link.href='#'+this.blindLinkName;
	link.innerHTML ='Přeskočit fotogalerii';
	JAK.DOM.setStyle(link, this.blindStyle);
	
	//pokud se galerie buildi do predem pripraveneho mista aby byla hned videt, nedavam moznost preskocit vsechny, protoze je na jinem miste nez ostatni
	if (!this.parent) {   
		this.dom.content.appendChild(linkAll);
	}
	this.dom.content.appendChild(h3);
	this.dom.content.appendChild(link);
};

/**
 * blindfriendly: kotva na úplném konci
 * @private
 */
JAK.LightBox.prototype._renderBlindEnd = function(){
	var link = JAK.cel('a');
	link.id=this.blindLinkName;
	this.dom.content.appendChild(link);
	var elm = JAK.gel(this.blindLinkGlobalName);
	if (elm) {
		elm.parentNode.removeChild(elm);
	}
	var linkAll = JAK.cel('a');
	linkAll.id=this.blindLinkGlobalName;
	
	//pokud se galerie buildi do predem pripraveneho mista aby byla hned videt, nedavam moznost preskocit vsechny, protoze je na jinem miste nez ostatni
	if (!this.parent) { 
		this.dom.content.appendChild(linkAll);
	}	

};

/**
 * přidání základních eventů, které galerie chytá
 * @private
 */
JAK.LightBox.prototype._addEvents = function() {
	if (this.options.handleDocumentCloseClick) {
		/*musí být navěšeno na mousedown, protože ve FF pravý tlačítko nad 
		  galerií nevyvolá click, ale vyvolá ho nad documentem a to vede k 
		  užavření galerie, pro IE musí být close také na mousedown, protože na 
		  click nevíme jaké tlačítko bylo použito*/
		this.ec.push(JAK.Events.addListener(document, 'mousedown', this, '_clickClose'));
		this.ec.push(JAK.Events.addListener(this.dom.container, 'mousedown', window, JAK.Events.stopEvent));/*pokud klikám do galerie, tak není vhodné zavírat okno*/
	}
	this.ec.push(JAK.Events.addListener(window, 'resize', this, '_resize'));
}

/**
 * při schování galerie jsou eventy odstraněny
 * @private
 */
JAK.LightBox.prototype._removeEvents = function() {
	for(var i = 0; i < this.ec.length; i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	this.ec = [];
}

/**
 * pokud potřebují komponenty vyvolat nějakou událost tak aby na ni mohli reagovat. Jinak komponenty
 * pouřívají na to tuto metodu, pak je totiž akce vyvalaná galerií a na tyto události komponenty naslouchají.
 * @param {Object} sender - objekt, který událost vyvolává je předáván jako sender v datech události
 * @param {string} name - název události
 */
JAK.LightBox.prototype.createEvent = function(sender, name) {
	this.makeEvent(name, {sender: sender});
}

/**
 * metoda volaná na resize okna
 * @param e
 * @param elm
 * @private
 */
JAK.LightBox.prototype._resize = function(e, elm) {
	this.makeEvent('windowResize');
}

/**
 * metoda vyvolaná kliknutím na dokumentu, galerii zavírám, pokud bylo kliknuto levým
 * protoze pravý na galerii (obr) probublává až do documentu a pak se galerie zavřela, i když si
 * chtěl člověk uložit obrázek
 * @param e
 * @param elm
 */
JAK.LightBox.prototype._clickClose = function(e, elm) {
	if (e.button == JAK.Browser.mouse.left) {
		this.close();
	}
}

/**
 * schování galerie
 */
JAK.LightBox.prototype.close = function() {
	this.makeEvent('close');

	/*odvěšení události*/
	this._removeEvents();

	this.visible = false;
	if (!this.parent) {
		JAK.DOM.elementsHider(this.dom.container, false, "show");
		this.dom.container.parentNode.removeChild(this.dom.container);
	}

	this.makeEvent('closed');
}

/**
 * zobrazení galerie s urřitým obrázkem dle jeho pořadového čísla
 * @param {int} i
 */
JAK.LightBox.prototype.show = function(i) {
	this.makeEvent('show', {index:i});

	/*navěšení události, chceme je jen když je galérka zobrazena*/
	this._addEvents();

	this.visible = true;
	if (!this.parent) {
		var body = document.getElementsByTagName('body')[0];
		body.insertBefore(this.dom.container, body.firstChild);
		this.anchorage.actualizePosition();
		JAK.DOM.elementsHider(this.dom.container, false, "hide");
	}

	this.go(i);
	this.makeEvent('showed', {index:i});
};

/**
 * pokud je galerie otevřena, je možno jít na jinou fotku pomocí této metody
 * @param {int} index
 */
JAK.LightBox.prototype.go = function(index) {
	/* zjištení směru */
	var dir = index < this.index ? JAK.LightBox.DIR_PREV : JAK.LightBox.DIR_NEXT;

	this._go(index, dir);
};

/**
 * vnitřní výkonná metoda updatující komponenty při změně hlavní fotky, směr se udává pomocí
 * JAK.LightBox.DIR_PREV nebo JAK.LightBox.DIR_NEXT
 * @param {int} i
 * @param {int} direction
 * @private
 */
JAK.LightBox.prototype._go = function(i, direction) {
	this.direction = direction;
	this.makeEvent('go', {index:i});
	this.main.update(i);
	this.strip.update(i);
	this.description.update(i);
	this.navigation.update(i);

	this.index = i;
}

/**
 * umožňuje poskočit na předchozí obrázek, pokud je povoleno cyklování a jsme na prvním, skočí to na poslední
 */
JAK.LightBox.prototype.previous = function() {
	var i = this.index - 1;
	if (i < 0) {
		if (this.options.navigationOpt.continuous) {
			i = this.data.length -1;
		} else {
			return;
		}
	}
	this._go(i, JAK.LightBox.DIR_PREV);
};

/**
 * umožňuje poskočit na následující obrázek, pokud je povoleno cyklování a jsme na posledním, skočí to na první
 */
JAK.LightBox.prototype.next = function() {
	var i = this.index + 1;
	if (i == this.data.length) {
		if (this.options.navigationOpt.continuous) {
			i = 0;
		} else {
			return;
		}
	}
	this._go(i, JAK.LightBox.DIR_NEXT);
};

/**
 * metodou jde nabindovat volání otevřrní galerie na odkazy v daném elementu, první odkaz odkazuje na první obr, atd.
 * @param {HTMLElement} elm
 */
JAK.LightBox.prototype.bindAnchors = function(elm) {
	var links = JAK.DOM.arrayFromCollection(JAK.gel(elm).getElementsByTagName('a'));
	for (var i = 0; i < links.length; i++) {
		this.bindElement(links[i], i);
	}
};

/**
 * metodou jde navázat konkrétní element na otevření galerie na konkretním obrázku, navazuje se click událost
 * @param {HTMLElement} elm
 * @param {int} i  - index obrázku
 */
JAK.LightBox.prototype.bindElement = function(elm, i) {
	this.objCache.push(new JAK.LightBox.ImageLink(this,i,elm));
};

/*-----------------------IMAGE LINK------------------------------------*/
/**
 * @class Něco, co po kliknutí otevře browser s velkým obrázkem
 * @private
 */
JAK.LightBox.ImageLink = JAK.ClassMaker.makeClass({
	NAME: "JAK.LightBox.ImageLink",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 * @param {int} index - pořadové císlo obrázku, který link bude otevírat
 * @param {HTMLElement} elm - element, na který se věší click událost
 */
JAK.LightBox.ImageLink.prototype.$constructor = function(owner, index, elm) {
	this.ec = [];
	this.owner = owner;
	this.index = index;
	this.elm = elm;
	this.ec.push(JAK.Events.addListener(this.elm, "click", this, "_show"));
};

/**
 * Explicitní desktruktor. Odvěsí všechny eventy a smaže všechny vlastnosti.
 */
JAK.LightBox.ImageLink.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
};

/**
 * voláno po kliknuti na externí odkaz na který je navěšena událost, otevírám galerii na obrázku daným indexem
 * @param e
 * @param elm
 * @private
 */
JAK.LightBox.ImageLink.prototype._show = function(e, elm) {
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);/*je třeba stopovat probublávání, protože zavření galerie se odchytává na documentu*/
	this.owner.show(this.index);
};

/*---------------------------ANCHORAGE--------------------------------*/

/**
 * výchozí nastavovač pozice, pozicuje absolutně  na top/left = 0
 * @class
 */
JAK.LightBox.Anchorage = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Anchorage',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Anchorage.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = this.owner.options.anchorageOpt;
	this.container = this.owner.dom.container;
};

/**
 * metoda je volaná defaultně při zobrazení galerie, aby se galerie napozicovala
 */
JAK.LightBox.Anchorage.prototype.actualizePosition = function() {
	this.container.style.top =  '0px';
	this.container.style.left = '0px';
	this.container.style.position = 'absolute';
};

/**
 * pozicovač na střed okna prohlížeče  - využívá position:fixed
 * @class
 * @extends JAK.LightBox.Anchorage
 */
JAK.LightBox.Anchorage.Fixed = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Anchorage.Fixed',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Anchorage
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Anchorage.Fixed.prototype.$constructor = function(owner) {
	this.$super(owner);

	/**
	 * event cache folder
	 */
	this.ec = [];

	/*IE6 a nižší neumí fixed, proto pozicuji galerii přes Absolue a přepočítávám to i na scroll stránky*/
	this.useAbsoluteHack = false;
	if (JAK.Browser.client == 'ie' && JAK.Browser.version <= 6) {
		this.useAbsoluteHack = true;
	}

	/*navěšení událostí*/
	this.attachEvents();
};

JAK.LightBox.Anchorage.Fixed.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
};

/**
 *  navěšení událostí na resize okna, aby se dalo znovu vycentrovat okno, v IE6 nejde position:fixed, proto věším i na
 * scroll a přepočítávám pozici
 */
JAK.LightBox.Anchorage.Fixed.prototype.attachEvents = function() {
	/*potřebujeme navěsit událost na resize a scroll pro vypozicování*/
	this.ec.push(JAK.Events.addListener(window, 'resize', this, 'actualizePosition'));
	if (this.useAbsoluteHack) {
		this.ec.push(JAK.Events.addListener(window, 'scroll', this, 'actualizePosition'));
	}
};

/**
 * nastavení pozice galerie na střed okna
 */
JAK.LightBox.Anchorage.Fixed.prototype.actualizePosition = function() {
	if (this.owner.visible) {
		this._position();
	}
};

/**
 * vlastní pozicování objektu galerie
 * @private
 */
JAK.LightBox.Anchorage.Fixed.prototype._position = function() {
	var portSize = JAK.DOM.getDocSize();
	if (this.useAbsoluteHack) { //ti co neumí position fixed pozicují pres absolute
		var wScroll = JAK.DOM.getScrollPos();
		this.container.style.position = 'absolute';
		this.container.style.top = Math.round(wScroll.y + portSize.height/2 - this.container.offsetHeight/2)+'px';
		this.container.style.left = Math.round(wScroll.x + portSize.width/2 - this.container.offsetWidth/2)+'px';
	} else {
		this.container.style.position = 'fixed';
		this.container.style.top = Math.round(portSize.height/2 - this.container.offsetHeight/2)+'px';
		this.container.style.left = Math.round(portSize.width/2 - this.container.offsetWidth/2)+'px';
	}
};

/**
 * pozicování na X, Y zadané galerií v parametrech: top a left
 * @class
 * @extends JAK.LightBox.Anchorage
 */
JAK.LightBox.Anchorage.TopLeft = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Anchorage.TopLeft',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Anchorage
});

/**
 * napozicování galerie
 */
JAK.LightBox.Anchorage.TopLeft.prototype.actualizePosition = function() {
	this.container.style.top = this.options.top+'px';
	this.container.style.left = this.options.left+'px';
	this.container.style.position = 'absolute';
};

/*--------------------------------MAIN GALLERY WINDOW-------------------------------------*/
/**
 * třida hlavního okna galerie. Umí zobrazit flash a obrázek, který vždy zmenší na velikost boxu (ne v poměru)
 * @class
 */
JAK.LightBox.Main = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Main',
	VERSION: '1.0',
	CLASS: 'class',
	IMPLEMENT: [JAK.ISignals]
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Main.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = this.owner.options.mainOpt;
	this.dom = {};
	this.ec = [];

	/*odkaz na aktuálně zobrazovaný element uschovávám si sem vždy pro animační přechod na nový*/
	this.current = null;

	this.width = 0;
	this.height = 0;

};

JAK.LightBox.Main.prototype.$destructor = function() {
	for (p in this.dom) {
		this.dom[p] = null;
	}

	for(var i = 0; i < this.ec.length; i++) {
		JAK.Events.removeListener(this.ec[i]);
	}

	for (p in this) {
		this[p] = null;
	}
}

/**
 * metoda je volána při renderování galerie, vyrenderuje DIV obal pro budoucí obrázky
 * @return {HTMLElement}
 */
JAK.LightBox.Main.prototype.render = function() {
	this.dom.mainBox = JAK.cel('div', this.options.className, this.options.id);
	this._attachEvents();
	return this.dom.mainBox;
};

/**
 * navěšení události, pokud je povoleno navěsí kolečko myši pro procházení fotkami
 * @private
 */
JAK.LightBox.Main.prototype._attachEvents = function() {
	if (this.options.useMouseWheelScroll) {
		this.ec.push(JAK.Events.addListener(this.dom.mainBox, 'DOMMouseScroll', this, '_scroll'));
		this.ec.push(JAK.Events.addListener(this.dom.mainBox, 'mousewheel', this, '_scroll'));
	}
}

/**
 * při pohybu kolečkem nad fotkou jdeme na předchozí nebo následující
 * @param e
 * @param elm
 * @private
 */
JAK.LightBox.Main.prototype._scroll = function(e, elm) {
	JAK.Events.cancelDef(e);

	var delta = e.wheelDelta || e.detail;

	if (JAK.Browser.client == "gecko") {
		delta = -delta;
	}
	if (delta > 0) {
		this.owner.previous();
	} else {
		this.owner.next();
	}
}

/**
 * metoda, která je volána při potřebě zobrazit velkou fotku
 * @param {Object} imgObj
 */
JAK.LightBox.Main.prototype.update = function(i) {
	//JAK.DOM.clear(this.dom.mainBox);
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
 * vygenerování flash objektu a vložení do stromu
 * @param {Object} img
 * @private
 */
JAK.LightBox.Main.prototype._generateFlashElm = function(img) {
	var em = JAK.cel("embed");
	em.setAttribute("quality","high");
	em.setAttribute("pluginspage","http://www.macromedia.com/go/getflashplayer");
	em.setAttribute("type","application/x-shockwave-flash");
	em.setAttribute("width", img.width ? img.width : this.width);
	em.setAttribute("height",img.height ? img.height : this.height);
	em.setAttribute("allowfullscreen","true");
	em.setAttribute("src",img.big.url);
	em.setAttribute("flashvars",img.flash);
	em.style.visibility = 'hidden';
	/*em.style.position = 'absolute';*/
	this.dom.mainBox.appendChild(em);
	//this.dom.mainBox.innerHTML = this.dom.mainBox.innerHTML; //todo proverit nutnost
	//this._switchImages(this.dom.mainBox.getElementsByTagName('embed')[0]);
	this._switchImages(em);

};

/**
 * vygenerování IMG elementu a vložení do stromu, obrázku se nenastavují žádné
 * rozměry 
 * @param {Object} img
 * @private
 */
JAK.LightBox.Main.prototype._generateImgElm = function(img) {
	var em = JAK.cel('img');
	em.style.visibility = 'hidden';
	/*em.style.position = 'absolute';*/
	em.src = img.big.url;
	this.dom.mainBox.appendChild(em);
	this._switchImages(em);
};

/**
 * záměna mezi starou a novou fotkou
 * @private
 */
JAK.LightBox.Main.prototype._switchImages = function(newImg) {
	var c = this.current;
	this.current = newImg;

	var cName = (c ? c.nodeName.toLowerCase() : false);
	var newImgName = (newImg ? newImg.nodeName.toLowerCase() : false);
	/*pokud jeden z elementů je flash, neprovádím žádnou prolínačku, pouze záměnu, kterou
	 umí základní prolínačka, kterou má LightBox v komponentě dummyTransition*/
	if (cName == 'embed' ||newImgName == 'embed') {
		this.owner.dummyTransition.start(c, newImg);
	} else {
		this.owner.transition.start(c, newImg);
	}
}

/**
 * vylepěený okno galerie, umí resizovat obrázky neproporcionálně na velikost obalujícího divu
 * @class 
 * @extends JAK.LightBox.Main 
 */ 
JAK.LightBox.Main.Scaled = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Main.Scaled',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Main
});

/**
 * vygenerování IMG elementu a vložení do stromu, nastaví se mu rozměry jako rodiče
 * @param {Object} img
 * @private
 */
JAK.LightBox.Main.Scaled.prototype._generateImgElm = function(img) {
	var em = JAK.cel('img');
	em.height = this.height;
	em.width = this.width;
	em.style.visibility = 'hidden';
	em.style.position = 'absolute';
	em.src = img.big.url;
	this.dom.mainBox.appendChild(em);
	this._switchImages(em);
};

/**
 * vylepšený okno galerie, umí centrovat obrázky který vždy zmenší v poměru stran, k tomu využívá ScaledImage
 * @see JAK.LightBox.ScaledImage
 * @class
 * @extends JAK.LightBox.Main
 */
JAK.LightBox.Main.CenteredScaled = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Main.CenteredScaled',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Main
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Main.CenteredScaled.prototype.$constructor = function(owner) {
	this.$super(owner);
	/**
	 * objekt zmenšeného obrázku
	 * @param {ScaledImage}
	 */
	this.scaledImage = null;

};

/**
 * přepsaná metoda, tak aby místo obrázku dělala instanci zmenšovacího obrázku @see JAK.LightBox.ScaledImage
 * který se umí sám vycentrovat v rodiči do kterého se vkláda
 * @see JAK.LightBox.Main#_generateImgElm
 * @param {Object} img
 */
JAK.LightBox.Main.CenteredScaled.prototype._generateImgElm = function(img) {
	var em = new JAK.LightBox.ScaledImage(this,img.big.url,this.width,this.height,this.dom.mainBox);
	em.render();                                                                        
	if (this.scaledImage) {
		this.scaledImage.$destructor();
		this.scaledImage = null;
	}

	this.scaledImage = em;
};

/**
 * pokud flash ma zadané rozměry v konfiguraci dat, pak je potřeba ho vycentrovat, připnutí do stránky
 * zařizuje rodičovská metoda, obávat se přechodu a blikaní není třeba, neboť je vždy použita dummyTransition.
 * Poukd rozměry nemá, není třeba pozicovat, protože flash bude roztažen do okna Main
 * @param {Object} img
 */
JAK.LightBox.Main.CenteredScaled.prototype._generateFlashElm = function(img) {
	this.$super(img);

	if (img.width || img.height) {
		this.current.style.position = 'absolute';

		var w = img.width ? img.width : this.width;
		var h = img.height ? img.height : this.height;
		/*vycentrování v rodiči*/
		var pw = this.current.parentNode.clientWidth;
		var ph = this.current.parentNode.clientHeight;
		this.current.style.top = Math.round((ph - h)/2)+'px';
		this.current.style.left = Math.round((pw - w)/2)+'px';
	}

}

/*---------------------------TRANSITION----------------*/
/**
 * třída, umožnující přechod mezi velkými obrázky, tato jen starý zneviditelní a nový zobrazí
 * @class
 */
JAK.LightBox.Transition = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Transition',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Transition.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = owner.options.transitionOpt;
}

JAK.LightBox.Transition.prototype.$destructor = function() {
}

/**
 * metoda spouštející "animaci" nad dvěmi obrázky, starý zneviditelní, nový zviditelní
 * @see JAK.LightBox.Transition._finish
 * @param {HTMLElement} firstElm - původní obrázek
 * @param {HTMLElement} secondElm - nový obrázek
 */
JAK.LightBox.Transition.prototype.start = function(firstElm, secondElm) {
	this.first = firstElm;
	this.second = secondElm;
	this._finish();
}

/**
 * vyčistění starého elementu a zobrazení nového
 * @private
 */
JAK.LightBox.Transition.prototype._finish = function() {
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
 * @class Fade in/out, přechod mezi obrázky. Je možno nastavit délku trvání přechodu a taky překryv mezi začátky ztmavování
 * a rozsvěcení obrázku. V konfiguraci galerie je k tomu využito pole options.transitionOpt s těmito možnými hodnotami:
 * interval (1000) - v ms udaná délka trvání jednoho přechodu
 * frequency (25) - v ms uvedená doba trvání jednoho kroku
 * overlap: (1) - číslo mezi 0 a 1 udavající posun začnutí roztmívání nového obr, od začátku stmívání starého obr. 1 značí, že roztmívání začne současně se stmíváním
 */
JAK.LightBox.Transition.Fade = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Transition.Fade',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Transition
});

/**
 * konstruktor
 * @param owner
 */
JAK.LightBox.Transition.Fade.prototype.$constructor = function(owner) {
	this.options = {
		interval:400,
		frequency:25,
		overlap:1
	};
	this.owner = owner;
	for (var p in owner.options.transitionOpt) { this.options[p] = owner.options.transitionOpt[p]; }

	this.running1 = false; /* běži první část animace? */
	this.running2 = false; /* běži druhá část animace? */

	this._secondOpacity = 0; /* pro případ rychlého přepínání za běhu */
	this._step1 = this._step1.bind(this);
	this._step2 = this._step2.bind(this);
	this._finish = this._finish.bind(this);

	this.i1 = new JAK.Interpolator(1, 0, this.options.interval, this._step1, {frequency:this.options.frequency});
	this.i2 = new JAK.Interpolator(0, 1, this.options.interval, this._step2, {frequency:this.options.frequency, endCallback:this._finish});
}

/**
 * start fadeování
 * @param {HTMLElement} oldElm
 * @param {HTMLElement} newElm
 */
JAK.LightBox.Transition.Fade.prototype.start = function(oldElm, newElm) {
	if (this.running1 || this.running2) { /* nějaká animace už probíhá - jen prohodime nový obrázek */
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
 * začátek fadeování nového obrázku
 * @private
 */
JAK.LightBox.Transition.Fade.prototype._start2 = function() {
	this.running2 = true;
	this.i2.start();
}

JAK.LightBox.Transition.Fade.prototype._step1 = function(value) {
	if (!this.first) { return; }
	this._setOpacity(this.first, value);
	if (!this.running2 && value <= this.options.overlap) { this._start2(); } /* už je čas nastartovat druhou část animace */
}

JAK.LightBox.Transition.Fade.prototype._step2 = function(value) {
	this._secondOpacity = value;
	this._setOpacity(this.second, value);
}

JAK.LightBox.Transition.Fade.prototype._finish = function() {
	this.running1 = false;
	this.running2 = false;
	this.$super();
}

/**
 * metoda nastavující průhlednost jak pro IE tak ostatní prohlížeče
 * @param {HTMLElement} node
 * @param {float} value hodnota od 0 do 1
 */
JAK.LightBox.Transition.Fade.prototype._setOpacity = function(node, value) {
	node.style.opacity = value;
	node.style.filter = "alpha(opacity="+Math.round(value*100)+")";
}


/*---------------------------SCALED IMAGE------------------------*/
/**
 * @class Zmenšený obrázek v hlavním okně
 * @private
 */
JAK.LightBox.ScaledImage = JAK.ClassMaker.makeClass({
	NAME: "JAK.LightBox.ScaledImage",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * konstruktor
 * @param {JAK.LightBox.Main} owner - rodič
 * @param {String} src - URL s obrázkem
 * @param {Integer} w - maximální šířka
 * @param {Integer} h - maximální výška
 * @param {HTMLElement} rootElm - DOM uzel, do kterého ma být obrázek vložen
 */
JAK.LightBox.ScaledImage.prototype.$constructor = function(owner, src, w, h, rootElm) {
	this.owner = owner;
	this.w = w;
	this.h = h;
	this.src = src;
	this.rootElm = rootElm;
	this.ec = [];
	this.dom = {};

}

/**
 * vyrenderování obrázku do pomocného skrytého boxu, navěšení onload
 */
JAK.LightBox.ScaledImage.prototype.render = function() {
	this.dom.elm = JAK.mel("img");
	this.ec.push(JAK.Events.addListener(this.dom.elm,"load",this,"_loaded",false,true));
	this.dom.elm.src = this.src;
}

/**
 * @method Explicitní destruktor. Odvěsí všechny eventy a smaže všechny vlastnosti.
 */
JAK.LightBox.ScaledImage.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this.dom) { this.dom[p] = null; }

	for (var p in this) { this[p] = null; }
}

/**
 * na onload zjištění velikosti obrázku, zmenšení a vycentrování a připnutí do galerie
 * @param {Event} e
 * @param {HTMLElement} elm
 */
JAK.LightBox.ScaledImage.prototype._loaded = function(e, elm) {
	var w = this.dom.elm.width || this.dom.elm.naturalWidth || 0;
	var h = this.dom.elm.height || this.dom.elm.naturalHeight || 0;

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

	/*vycentrování v rodiči*/
	var pw = this.rootElm.clientWidth;
	var ph = this.rootElm.clientHeight;
	this.dom.elm.style.position = "absolute";
	this.dom.elm.style.visibility = "hidden";
	this.dom.elm.style.top = Math.round((ph - h)/2)+'px';
	this.dom.elm.style.left = Math.round((pw - w)/2)+'px';

	if (this.rootElm) {
		this.rootElm.appendChild(this.dom.elm);
	}
	this.owner.owner.createEvent(this, 'mainImageLoaded');

	this.owner._switchImages(this.dom.elm);
}

/*------------------------PAGE SHADER---------------------------*/
/**
 * volitelná komponenta umožňující vytvožit ztmavnutí stranky pod galerií
 * @class
 */
JAK.LightBox.PageShader = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.PageShader',
	VERSION: '1.0',
	CLASS: 'class',
	IMPLEMENT: [JAK.ISignals]
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.PageShader.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.dom = {};

	this.addListener('showed', '_show', this.owner);
	this.addListener('close', '_hide', this.owner);
	this.addListener('windowResize', '_resize', this.owner);
};

JAK.LightBox.PageShader.prototype.$destructor = function() {
	for (p in this.dom) {
		this.dom[p] = null;
	}

	for (p in this) {
		this[p] = null;
	}
};

/**
 * na událost galerie "showed" je také připnut do stranky shader a to hned za element galerie
 * @private
 */
JAK.LightBox.PageShader.prototype._show = function() {
	this.dom.root = JAK.mel("div", {className:"image-browser-root"}, {position:"absolute",left:"0px",top:"0px"});

	var docSize = JAK.DOM.getDocSize();
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
	JAK.DOM.elementsHider(this.dom.root, false, "hide");
};

/**
 * při schování galerie je vyvolána událost "close", na kterou je volána tato metoda pro schování shaderu
 * @private
 */
JAK.LightBox.PageShader.prototype._hide = function() {
	if (this.dom.root && this.dom.root.parentNode) {
		JAK.DOM.elementsHider(this.dom.root, false, "hide");
		this.dom.root.parentNode.removeChild(this.dom.root);
	}
	this.dom.root = null;
};

/**
 * při změně velikosti okna je nutné shader natáhnout na správnou velikost
 * nyní je to uděláno tak, že se zruší a znovu vytvoří
 * @private
 */
JAK.LightBox.PageShader.prototype._resize = function() {
	this._hide();
	this._show();
};

/*---------------------------THUMBNAILS STRIP--------------------------*/
/**
 * výchozí třída pro filmový pás náhledu, tato neumí nic, jen definuje rozhraní,
 * vhodné ji použít pokud chceme galerii bez náhledu
 * @class
 */
JAK.LightBox.Strip = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Strip',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Strip.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = this.owner.options.stripOpt;
	this.dom = {};
};

JAK.LightBox.Strip.prototype.$destructor = function() {
	for (p in this.dom) {
		this.dom[p] = null;
	}

	for (p in this) {
		this[p] = null;
	}
};

/**
 * vyrenderuje box pro náhledy, v tomto případě generuje prázdný DIV
 */
JAK.LightBox.Strip.prototype.render = function() {
	this.dom.mainBox = JAK.cel('div', this.options.className, this.options.id);
	return this.dom.mainBox;
};

/**
 * metoda volaná pokud je vybrán obrázek k zobrazení, zde nic nedělá
 * @param {int} index
 */
JAK.LightBox.Strip.prototype.update = function(index) {

};


/**
 * náhledový pruh s fotkami může být horizontálně, nebo vertikálně, aktuálně zobrazenou fotku se snaží
 * udržet scrolováním ve středu pasu
 * @class
 * @extends JAK.LightBox.Strip
 */
JAK.LightBox.Strip.Scrollable = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Strip.Scrollable',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Strip
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Strip.Scrollable.prototype.$constructor = function(owner) {
	this.$super(owner);
	/**
	 * pole kam si ukládám instance JAK.LightBox.StripImage
	 */
	this.objCache = [];

	this.ec = [];

	/**
	 * úschovna rozměru rámečku aktivního boxíku
	 */
	this.activeBorder = {};
};

JAK.LightBox.Strip.Scrollable.prototype.$destructor = function() {
	for (var i = 0; i < this.objCache.length; i++) {
		this.objCache[i].$destructor();
		this.objCache[i] = null;
	}

	for (var i = 0; i < this.ec.length; i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	this.ec = [];
	this.$super();
};

/**
 * pro všechny obrázky to vygeneruje jejich zástupce do stripu, zástupci jsou generovány ze třídy
 * vygeneruji take box pro zobrazení aktivního prvku
 * @see JAK.LightBox.StripImage
 */
JAK.LightBox.Strip.Scrollable.prototype.render = function() {
	this.$super();

	this.owner.dom.content.appendChild(this.dom.mainBox);
	this.dom.mainBox.style.position = 'relative';

	this.dom.imageBox = JAK.cel('div');
	this.dom.mainBox.appendChild(this.dom.imageBox);

	this.dom.imageTable = JAK.cel('table');
	this.dom.imageTable.style.borderCollapse = 'collapse';
	//this.dom.imageTable.style.tableLayout = 'fixed';
	var tbody = JAK.cel('tbody');
	this.dom.imageTable.appendChild(tbody);
	this.dom.imageBox.appendChild(this.dom.imageTable);
	/*generování náhledu do tabulky, jednou do jednoho sloupečku podruhé do jednoho řádku*/
	for (var i = 0; i < this.owner.data.length; i++) {
		if (this.options.orientation == 'vertical') {
			var tr = JAK.cel('tr');
			var td = JAK.cel('td');
			tr.appendChild(td);
			td.align = 'center';
			td.vAlign = 'middle';
			tbody.appendChild(tr);
		} else {
			if (i == 0) {
				var tr = JAK.cel('tr');
			}
			var td = JAK.cel('td');
			td.align = 'center';
			td.vAlign = 'middle';
			tr.appendChild(td);
			if (i == this.owner.data.length -1) {
				tbody.appendChild(tr);
			}
		}
		var div = JAK.cel('div', this.options.imageBoxClassName);
		div.style.position = 'relative';
		td.style.padding = '0px';
		td.appendChild(div);

	}

	var elms = JAK.DOM.arrayFromCollection(tbody.getElementsByTagName('div'));
	for (var i = 0; i < this.owner.data.length; i++) {
		var stripImg = new JAK.LightBox.StripImage(this.owner, this.options, this.owner.data[i], i);
		stripImg.render(elms[i]);
		this.objCache.push(stripImg);
	}

	this.dom.active = JAK.cel('div', this.options.activeClassName, this.options.activeId);
	this.dom.active.style.position = 'absolute';

	/*dočasně si aktivku připneme a zjistíme jeho rámečky, abychom je nemuseli pořád zjišťovat*/
	this.dom.mainBox.appendChild(this.dom.active);
	this.activeBorder.top = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderTopWidth'));
	this.activeBorder.bottom = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderBottomWidth'));
	this.activeBorder.left = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderLeftWidth'));
	this.activeBorder.right = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderRightWidth'));
	this.dom.mainBox.removeChild(this.dom.active);


	/*navěšení událostí*/
	this._addEvents();

	return this.dom.mainBox;
};

/**
 * pokud zobrazujeme strip vodorovný, chceme aby se v něm dalo scrolovat kolečkem, navěsíme na scroll událost
 * @private
 */
JAK.LightBox.Strip.Scrollable.prototype._addEvents = function() {
	if (this.options.orientation == 'horizontal') {
		this.ec.push(JAK.Events.addListener(this.dom.mainBox, 'DOMMouseScroll', this, '_scroll'));
		this.ec.push(JAK.Events.addListener(this.dom.mainBox, 'mousewheel', this, '_scroll'));
	}
};

/**
 * zajišťuje vlastní scrolování elementu s fotkama, vyvoláno události mousewheel
 * @param e
 * @param elm
 * @private
 */
JAK.LightBox.Strip.Scrollable.prototype._scroll = function(e, elm) {
	JAK.Events.cancelDef(e);

	var delta = e.wheelDelta || e.detail;

	if (JAK.Browser.client == "gecko") {
		delta = -delta;
	}
	if (delta > 0) {
		this.dom.mainBox.scrollLeft -= 30;
	} else {
		this.dom.mainBox.scrollLeft += 30;
	}

}

/**
 * řeknu konkrétnímu StripImage aby se highlitoval, jelikož je vytvářím ve stejném pořadí
 * jako jsou v this.owner.data, stačí mi index na jeho vybrání
 * @param {int} index
 */
JAK.LightBox.Strip.Scrollable.prototype.update2 = function(index) {
	/*nastavení pozice rámování aktuální fotky*/
	this.dom.active.style.position = 'absolute';
	var pos = JAK.DOM.getBoxPosition(this.objCache[index].dom.img.parentNode, this.dom.imageTable);
	/*nastavení velikosti rámečkového divu*/
	var borderTop = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderTopWidth'));
	var borderBottom = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderBottomWidth'));
	var borderLeft = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderLeftWidth'));
	var borderRight = parseInt(JAK.DOM.getStyle(this.dom.active, 'borderRightWidth'));
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
		var a = JAK.DOM.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(JAK.DOM.getStyle(this.dom.mainBox,  'height')) / 2;
		var c = parseInt(JAK.DOM.getStyle(this.objCache[index].dom.img.parentNode,  'height')) / 2;
		var scroll = a.top - b + c;
		this.dom.mainBox.scrollTop = Math.round(scroll);
	} else {
		var a = JAK.DOM.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(JAK.DOM.getStyle(this.dom.mainBox,  'width')) / 2;
		var c = parseInt(JAK.DOM.getStyle(this.objCache[index].dom.img.parentNode,  'width')) / 2;
		var scroll = a.left - b + c; 
		this.dom.mainBox.scrollLeft = Math.round(scroll);
	} 
};

JAK.LightBox.Strip.Scrollable.prototype.update = function(index) {

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
		var a = JAK.DOM.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(JAK.DOM.getStyle(this.dom.mainBox,  'height')) / 2;
		var c = parseInt(JAK.DOM.getStyle(this.objCache[index].dom.img.parentNode,  'height')) / 2;
		var scroll = a.top - b + c;
		this.dom.mainBox.scrollTop = Math.round(scroll);
	} else {
		var a = JAK.DOM.getBoxPosition(this.objCache[index].dom.img.parentNode ,this.dom.mainBox);
		var b = parseInt(JAK.DOM.getStyle(this.dom.mainBox,  'width')) / 2;
		var c = parseInt(JAK.DOM.getStyle(this.objCache[index].dom.img.parentNode,  'width')) / 2;
		var scroll = a.left - b + c;
		this.dom.mainBox.scrollLeft = Math.round(scroll);
	}
};

/*----------------------------STRIP IMAGE------------------------------*/
/**
 * instance jednoho obrázku ve stripu náhledu
 * @see JAK.LightBox.Strip.Scrollable
 * @class
 */
JAK.LightBox.StripImage = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.StripImage',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {JAK.LightBox} mainOwner - objekt rodiče - galerie
 * @param {Object} data - data o malém obrázku
 * @param {Number} order - pořadí obrázku ve stripu, začíná od 0
 */
JAK.LightBox.StripImage.prototype.$constructor = function(mainOwner, options, data, order) {
	this.mainOwner = mainOwner;
	this.data = data;
	this.options = options;
	this.order = order;
	this.dom = {};
	this.ec = [];
};

JAK.LightBox.StripImage.prototype.$destructor = function() {
	for (var i = 0; i < this.ec.length; i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	this.ec = [];
};

/**
 * je předěna buňka tabulky do které bude obrázek zmenšen, obrázek renderován do pomocného boxu a čeka se na load
 * @param {HTMLElement} elm
 */
JAK.LightBox.StripImage.prototype.render = function(elm) {
	this.dom.parentNode = elm;

	this.dom.img = JAK.cel('img');
	this.ec.push(JAK.Events.addListener(this.dom.img, 'load', this, '_loaded'));
	this.dom.img.src = this.data.small.url;
	this.dom.img.alt = this.data.alt;
	this.ec.push(JAK.Events.addListener(elm, 'click', this, '_click'));
};


/**
 * navěšení click události na obrázek
 * @param e
 * @param elm
 * @private
 */
JAK.LightBox.StripImage.prototype._click = function(e, elm) {
	this.mainOwner.go(this.order);
};

/**
 * po loadu obrázku je zmenšen a zavěšen do buňky
 * @param e
 * @param elm
 * @private
 */
JAK.LightBox.StripImage.prototype._loaded = function(e, elm) {
	/*obrázek načten. Načtu jeho velikost, protože je ve stromu*/
	var w = elm.width;
	var h = elm.height;

	/*obrázek schováme a připneme do správné buňky tabulky, tím získáme rodiče*/
	this.dom.img.style.display = 'none';
	this.dom.parentNode.appendChild(this.dom.img);
	var boxW = parseInt(this.dom.img.parentNode.clientWidth);
	var boxH = parseInt(this.dom.img.parentNode.clientHeight);

	var ratio_w = w / boxW;
	var ratio_h = h / boxH;
	var max = Math.max(ratio_w,ratio_h);
	/* need to scale */
	if (max > 1) {
		w = Math.floor(w / max); /*jelikož boz do ktereho cpu obrázky nemůže být overflow hidden kvuli ACTIVe rámečku, musím obrázky dělat radši menší*/
		h = Math.floor(h / max);
		if (w && h) {
			this.dom.img.width = w;
			this.dom.img.height = h;
		}
	}

	/*vycentrování v rodiči*/
	var ph = this.dom.parentNode.clientHeight;
	this.dom.img.style.marginTop = Math.round((ph - h)/2)+'px';
	this.dom.img.parentNode.textAlign = 'center';


	/*a nakonec zobrazíme obrázek*/
	this.dom.img.style.display = '';

	
};

/*--------------------------DESCRIPTION------------------------------*/
/**
 * zajištění zobrazení popisku aktuálního obrázku, tato třída nicméně nereaguje na události,
 * pokud je třeba zajistit nezobrazování popisku, je vhodné použít ji
 * @class
 */
JAK.LightBox.Description = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Description',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {HTMLEditor} owner
 */
JAK.LightBox.Description.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = owner.options.descriptionOpt;
	this.dom = {};
};

JAK.LightBox.Description.prototype.$destructor = function() {
	for (var p in this.dom) {
		this.dom[p] = null;
	}

	for(var p in this) {
		this[p] = null;
	}
};

/**
 * vytvoření boxu pro popisek obrázku
 * @return {HTMLElement}
 */
JAK.LightBox.Description.prototype.render = function() {
	this.dom.box = JAK.cel('div', this.options.className, this.options.id);
	return this.dom.box;
};

/**
 * zobrazení popisku obrázku s daným indexem
 * @param {int} index
 */
JAK.LightBox.Description.prototype.update = function(index) {

};

/**
 * tato třída zobrazuje zadaný popisek pomocí innerHTML, jde tedy vkládat celé HTML
 * @class
 * @extends JAK.LightBox.Description
 */
JAK.LightBox.Description.Basic = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Description.Basic',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Description
});

/**
 * renderujeme navíc vnitřní div, pro možnost lepšího stylování
 * @return {HTMLElement}
 */
JAK.LightBox.Description.Basic.prototype.render = function() {
	this.$super();

	this.dom.content = JAK.cel('div', this.options.contentClassName, this.options.contentId);
	this.dom.box.appendChild(this.dom.content);
	return this.dom.box;
};

/**
 * pomocí innerHTML vkládáme popisek obrázku daného jeho indexem, používáme atribut description
 * @param {int} index
 */
JAK.LightBox.Description.Basic.prototype.update = function(index) {
	if(this.owner.data[index].description){
		this.dom.content.innerHTML = this.owner.data[index].description;
	} else {
		this.dom.content.innerHTML = '';
	}
};

/*------------------------NAVIGATION----------------------------*/
/**
 * třída obstarávající rozhranní pro navigaci
 * @class
 */
JAK.LightBox.Navigation = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Navigation',
	VERSION: '1.0',
	CLASS: 'class'
});

/**
 * konstruktor
 * @param {JAK.LightBox} owner
 */
JAK.LightBox.Navigation.prototype.$constructor = function(owner) {
	this.owner = owner;
	this.options = owner.options.navigationOpt;
	this.dom = {};
	this.ec = [];
};

JAK.LightBox.Navigation.prototype.$destructor = function() {
	for(var p in this.dom) {
		this.dom[p] = null;
	}
	for (var i = 0; i < this.ec.length; i++) {
		JAK.Events.removeListener(this.ec[i]);
	}

	for (var p in this) {
		this[p] = null;
	}
};

/**
 * metoda je volaná při vytváření galerie, vrací prázdný box
 */
JAK.LightBox.Navigation.prototype.render = function() {
	return JAK.cel('div', this.options.className, this.options.id);
};

/**
 * metoda je volana při změně obrázku
 * @param {int} index
 */
JAK.LightBox.Navigation.prototype.update = function(index) {

}


/**
 * rozšíření o základní tlačítka pro posun vpřed/vzad a vypnutí. navěšuje všechny potřebné události
 * @class
 * @extends JAK.LightBox.Navigation
 */
JAK.LightBox.Navigation.Basic = JAK.ClassMaker.makeClass({
	NAME: 'JAK.LightBox.Navigation.Basic',
	VERSION: '2.0',
	CLASS: 'class',
	EXTEND: JAK.LightBox.Navigation
});

/**
 * vyrenderování tří DIVů pro ovládací prvky <<, >> a X
 * ty jsou nastylovaný CSSkama a navěšeny na ně události
 */
JAK.LightBox.Navigation.Basic.prototype.render = function() {
	this.dom.next = JAK.cel('a', this.options.nextClassName, this.options.nextId);
	this.dom.prev = JAK.cel('a', this.options.prevClassName, this.options.prevId);
	this.dom.nextDisabled = JAK.cel('a', this.options.nextClassName+'-disabled', this.options.nextId ? this.options.nextId+'-disabled' : false);
	this.dom.prevDisabled = JAK.cel('a', this.options.prevClassName+'-disabled', this.options.prevId ? this.options.prevId+'-disabled' : false);
	this.dom.close = JAK.cel('a', this.options.closeClassName, this.options.closeId);
	/*v IE6 jde hover jen nad Ačkem co ma odkaz, proto tam muši být mřížka*/
	this.dom.next.href = '#';
	this.dom.prev.href = '#';
	this.dom.nextDisabled.href = '#';
	this.dom.prevDisabled.href = '#';
	this.dom.close.href='#';
	/*kvůli preloadu mouseoverových obrázků vytvořím divy a ty napozicuji za roh, nicméně jde do nich v CSS umístit :hover obrázky a ty se nakešují */
	this.dom.nextPreload = JAK.mel('div', {
			id: this.options.nextId ? this.options.nextId+'-preload': false, 
			className: this.options.nextClassName+'-preload'
		}, {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'}
	);
	this.dom.nextDisabledPreload = JAK.mel('div', {
			id: this.options.nextId ? this.options.nextId+'-disabled-preload': false,
			className: this.options.nextClassName+'-disabled-preload'
		}, {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'}
	);
	this.dom.prevPreload = JAK.mel('div', {
			id: this.options.prevId ? this.options.prevId+'-preload': false, 
			className: this.options.prevClassName+'-preload'
		}, {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'}
	);
	this.dom.prevDisabledPreload = JAK.mel('div', {
			id: this.options.prevId ? this.options.prevId+'-disabled-preload': false,
			className: this.options.prevClassName+'-disabled-preload'
		}, {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'}
	);
	this.dom.closePreload = JAK.mel('div', {
			id: this.options.closeId ? this.options.closeId+'-preload': false, 
			className: this.options.closeClassName+'-preload'
		}, {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'}
	);

	this._addEvents();

	var div = JAK.cel('div', this.options.className, this.options.id);
	JAK.DOM.append([div, this.dom.next, this.dom.nextDisabled, this.dom.prev, this.dom.prevDisabled, this.dom.close]);
	JAK.DOM.append([div, this.dom.nextPreload, this.dom.nextDisabledPreload, this.dom.prevPreload, this.dom.prevDisabledPreload, this.dom.closePreload]);
	return div;
};

/**
 * navěšení události na tlačítka
 * @private
 */
JAK.LightBox.Navigation.Basic.prototype._addEvents = function() {
	this.ec.push(JAK.Events.addListener(this.dom.next, 'click', this, '_next'));
	this.ec.push(JAK.Events.addListener(this.dom.prev, 'click', this, '_previous'));
	this.ec.push(JAK.Events.addListener(this.dom.close, 'click', this, '_close'));
	this.ec.push(JAK.Events.addListener(document, 'keydown', this, '_keyHandler'));
	/*u disabled tlačítek nechceme proklik na kotvu*/
	this.ec.push(JAK.Events.addListener(this.dom.nextDisabled, 'click', this, '_disabled'));
	this.ec.push(JAK.Events.addListener(this.dom.prevDisabled, 'click', this, '_disabled'));
};

JAK.LightBox.Navigation.Basic.prototype._disabled = function(e, elm) {
	elm.blur();
	JAK.Events.cancelDef(e);
};

JAK.LightBox.Navigation.Basic.prototype._close = function(e, elm) {
	elm.blur();
	JAK.Events.cancelDef(e);
	JAK.Events.stopEvent(e);/*aby neprobublala do body*/
	this.owner.close();
};

JAK.LightBox.Navigation.Basic.prototype._next = function(e, elm) {
	elm.blur();
	JAK.Events.cancelDef(e);
	this.owner.next();
};

JAK.LightBox.Navigation.Basic.prototype._previous = function(e, elm) {
	elm.blur();
	JAK.Events.cancelDef(e);
	this.owner.previous();
};

/**
 * Obsluhuje ovladani LightBoxu pomoci klaves
 *
 * <ul>
 * <li>Esc - zavře galerii</li>
 * <li>Šipka doleva - zobrazí předcházející obrázek</li>
 * <li>Šipka doprava - zobrazí následující obrázek</li>
 * </ul>
 *
 * @param e
 * @param elm
 */
JAK.LightBox.Navigation.Basic.prototype._keyHandler = function(e, elm) {
	// Esc
	if (e.keyCode == 27) {
		this.owner.close();
	}
	// sipka doleva
	if (e.keyCode == 37) {
		this.owner.previous();
	}
	// sipka doprava
	if (e.keyCode == 39) {
		this.owner.next();
	}
};

/**
 * voláno při zobrazení obrázku, aktualizuji zobrazení navigačních << a >> pokud není kontinuální navigace
 * @param {int} index
 */
JAK.LightBox.Navigation.Basic.prototype.update = function(index) {
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
	} else {
		this.dom.prevDisabled.style.display = 'none';
		this.dom.nextDisabled.style.display = 'none';
		this.dom.prev.style.display = '';
		this.dom.next.style.display = '';
	}
};
