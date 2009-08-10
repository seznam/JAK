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
SZN.LightBox = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox',
	VERSION: '1.0',
	CLASS: "class",
	IMPLEMENT: [SZN.SigInterface, SZN.Components]
});

/**
 * konstanta udávající směr, kterým uživatel prochází galerií
 * @constant
 */
SZN.LightBox.DIR_PREV = -1;
/**
 * konstanta udávající směr, kterým uživatel prochází galerií
 * @constant
 */
SZN.LightBox.DIR_NEXT = 1;

/**
 * konstruktor galerie
 * @param {array} data
 * @param {object} optObj
 */
SZN.LightBox.prototype.$constructor = function(data, optObj) {
	/**
	 * vlastnosti, ty co jsou jako hodnota jsou pro galerii a jsou obecné, ty co jsou jako objekt se nejlépe používají
	 * pro dalši komponenty
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
		parent: false,  /*rodičovský element, pokud je zadán, galerie se vyblinká do něj*/
		zIndex: false,
		useShadow: false,
		usePageShader: true,
		shadowSizes: [16,16,16,16],
		galleryId: false,
		galleryClassName: 'image-browser-content',
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
	this.direction = SZN.LightBox.DIR_NEXT;
	/**
	 * jméno kotvy na kterou skáče slepec přeskakující galerii
	 */
	this.blindLinkName = SZN.idGenerator();
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
	/*pro prolínání flashe musím vždy použít obyčejnou Transition, protože flash vždy vše přebije, použito v SZN.LightBox.Main._switchImages*/
	this.addNewComponent({name: 'dummyTransition', part: SZN.LightBox.Transition});

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
SZN.LightBox.create = function(elm, optObj) {
	elm = SZN.gEl(elm);
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

	var g = new SZN.LightBox(data, optObj);
	for (var i = 0; i < l.length; i++) {
		g.bindElement(l[i], i);
	}
	return g;
}

/**
 * destruktor
 */
SZN.LightBox.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
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
 * vytvoření kontejneru, pokud chceme stíny, dělají se pomocí SZN.Window, jinak do divu
 * @see SZN.Window
 * @private
 */
SZN.LightBox.prototype._buildContainer = function() {
	/*vytvoření dočasného úložiště, kam se ihned galerie připne aby se daly počítat rozměry*/
	this.dom.loadBox = SZN.cEl('div');
	this.dom.loadBox.style.position = 'absolute';
	this.dom.loadBox.style.top = '-100px';
	this.dom.loadBox.style.left = '-100px';
	this.dom.loadBox.style.overflow = 'hidden';
	this.dom.loadBox.style.width = '1px';
	this.dom.loadBox.style.height = '1px';
	var body = document.getElementsByTagName('body')[0];
	body.insertBefore(this.dom.loadBox, body.firstChild);

	var div = SZN.cEl('div', this.options.galleryId, this.options.galleryClassName);

	if (this.options.useShadow) {
		var winopts = {
			imagePath:this.options.imagePath,
			imageFormat:this.options.imageFormat,
			sizes:this.options.shadowSizes
		}
		this.window = new SZN.Window(winopts);
		this.dom.container = this.window.container;
		/* okno ve výchozím nastavení bude vždy absolutně pozicování, SZN.Window 
		 * totiž nastavuje relativě a to může vést k ovlivňování stránky, když 
		 * je galerie připínaná na začátek DOMu
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
 * volání render nad všemi základními komponentami galerie
 * @private
 */
SZN.LightBox.prototype._render = function() {

	/*zjištění správné funkčnosti*/
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
 * blindfriendly: na začátek obsahu hodím H3 a odskok na konec
 * @private
 */
SZN.LightBox.prototype._renderBlindStart = function() {
	var h3 = SZN.cEl('h3');
	h3.innerHTML = 'Fotogalerie';
	SZN.Dom.setStyle(h3, this.blindStyle);
	var link = SZN.cEl('a');
	link.href='#'+this.blindLinkName;
	link.innerHTML ='Přeskočit fotogalerii'
	SZN.Dom.setStyle(link, this.blindStyle);
	this.dom.content.appendChild(h3);
	this.dom.content.appendChild(link);
};

/**
 * blindfriendly: kotva na úplném konci
 * @private
 */
SZN.LightBox.prototype._renderBlindEnd = function(){
	var link = SZN.cEl('a');
	link.id=this.blindLinkName;
	this.dom.content.appendChild(link);
};

/**
 * přidání základních eventů, které galerie chytá
 * @private
 */
SZN.LightBox.prototype._addEvents = function() {
	if (this.options.handleDocumentCloseClick) {
		/*musí být navěšeno na mousedown, protože ve FF pravý tlačítko nad 
		  galerií nevyvolá click, ale vyvolá ho nad documentem a to vede k 
		  užavření galerie, pro IE musí být close také na mousedown, protože na 
		  click nevíme jaké tlačítko bylo použito*/
		this.ec.push(SZN.Events.addListener(document, 'mousedown', this, '_clickClose'));
		this.ec.push(SZN.Events.addListener(this.dom.container, 'mousedown', window, SZN.Events.stopEvent));/*pokud klikám do galerie, tak není vhodné zavírat okno*/
	}
	this.ec.push(SZN.Events.addListener(window, 'resize', this, '_resize'));
}

/**
 * při schování galerie jsou eventy odstraněny
 * @private
 */
SZN.LightBox.prototype._removeEvents = function() {
	for(var i = 0; i < this.ec.length; i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
}

/**
 * pokud potřebují komponenty vyvolat nějakou událost tak aby na ni mohli reagovat. Jinak komponenty
 * pouřívají na to tuto metodu, pak je totiž akce vyvalaná galerií a na tyto události komponenty naslouchají.
 * @param {Object} sender - objekt, který událost vyvolává je předáván jako sender v datech události
 * @param {string} name - název události
 */
SZN.LightBox.prototype.createEvent = function(sender, name) {
	this.makeEvent(name, 'public', {sender: sender});
}

/**
 * metoda volaná na resize okna
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.prototype._resize = function(e, elm) {
	this.makeEvent('windowResize', 'protected');
}

/**
 * metoda vyvolaná kliknutím na dokumentu, galerii zavírám, pokud bylo kliknuto levým
 * protoze pravý na galerii (obr) probublává až do documentu a pak se galerie zavřela, i když si
 * chtěl člověk uložit obrázek
 * @param e
 * @param elm
 */
SZN.LightBox.prototype._clickClose = function(e, elm) {
	if (e.button == SZN.Browser.mouse.left) {
		this.close();
	}
}

/**
 * schování galerie
 */
SZN.LightBox.prototype.close = function() {
	this.makeEvent('close', 'public');

	/*odvěšení události*/
	this._removeEvents();

	this.visible = false;
	if (!this.parent) {
		SZN.Dom.elementsHider(this.dom.container, false, "show");
		this.dom.container.parentNode.removeChild(this.dom.container);
	}

	this.makeEvent('closed', 'public');
}

/**
 * zobrazení galerie s urřitým obrázkem dle jeho pořadového čísla
 * @param {int} i
 */
SZN.LightBox.prototype.show = function(i) {
	this.makeEvent('show','public', {index:i});

	/*navěšení události, chceme je jen když je galérka zobrazena*/
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
 * pokud je galerie otevřena, je možno jít na jinou fotku pomocí této metody
 * @param {int} index
 */
SZN.LightBox.prototype.go = function(index) {
	/* zjištení směru */
	var dir = index < this.index ? SZN.LightBox.DIR_PREV : SZN.LightBox.DIR_NEXT;

	this._go(index, dir);
};

/**
 * vnitřní výkonná metoda updatující komponenty při změně hlavní fotky, směr se udává pomocí
 * SZN.LightBox.DIR_PREV nebo SZN.LightBox.DIR_NEXT
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
 * umožňuje poskočit na předchozí obrázek, pokud je povoleno cyklování a jsme na prvním, skočí to na poslední
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
	this._go(i, SZN.LightBox.DIR_PREV);
};

/**
 * umožňuje poskočit na následující obrázek, pokud je povoleno cyklování a jsme na posledním, skočí to na první
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
 * metodou jde nabindovat volání otevřrní galerie na odkazy v daném elementu, první odkaz odkazuje na první obr, atd.
 * @param {HTMLElement} elm
 */
SZN.LightBox.prototype.bindAnchors = function(elm) {
	var links = SZN.Dom.arrayFromCollection(SZN.gEl(elm).getElementsByTagName('a'));
	for (var i = 0; i < links.length; i++) {
		this.bindElement(links[i], i);
	}
};

/**
 * metodou jde navázat konkrétní element na otevření galerie na konkretním obrázku, navazuje se click událost
 * @param {HTMLElement} elm
 * @param {int} i  - index obrázku
 */
SZN.LightBox.prototype.bindElement = function(elm, i) {
	this.objCache.push(new SZN.LightBox.ImageLink(this,i,elm));
};

/*-----------------------IMAGE LINK------------------------------------*/
/**
 * @class Něco, co po kliknutí otevře browser s velkým obrázkem
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
 * @param {int} index - pořadové císlo obrázku, který link bude otevírat
 * @param {HTMLElement} elm - element, na který se věší click událost
 */
SZN.LightBox.ImageLink.prototype.$constructor = function(owner, index, elm) {
	this.ec = [];
	this.owner = owner;
	this.index = index;
	this.elm = elm;
	this.ec.push(SZN.Events.addListener(this.elm, "click", this, "_show"));
};

/**
 * Explicitní desktruktor. Odvěsí všechny eventy a smaže všechny vlastnosti.
 */
SZN.LightBox.ImageLink.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
};

/**
 * voláno po kliknuti na externí odkaz na který je navěšena událost, otevírám galerii na obrázku daným indexem
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.ImageLink.prototype._show = function(e, elm) {
	SZN.Events.cancelDef(e);
	SZN.Events.stopEvent(e);/*je třeba stopovat probublávání, protože zavření galerie se odchytává na documentu*/
	this.owner.show(this.index);
};

/*---------------------------ANCHORAGE--------------------------------*/

/**
 * výchozí nastavovač pozice, pozicuje absolutně  na top/left = 0
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
 * metoda je volaná defaultně při zobrazení galerie, aby se galerie napozicovala
 */
SZN.LightBox.Anchorage.prototype.actualizePosition = function() {
	this.container.style.top =  '0px';
	this.container.style.left = '0px';
	this.container.style.position = 'absolute';
};

/**
 * pozicovač na střed okna prohlížeče  - využívá position:fixed
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

	/*IE6 a nižší neumí fixed, proto pozicuji galerii přes Absolue a přepočítávám to i na scroll stránky*/
	this.useAbsoluteHack = false;
	if (SZN.Browser.client == 'ie' && SZN.Browser.version <= 6) {
		this.useAbsoluteHack = true;
	}

	/*navěšení událostí*/
	this.attachEvents();
};

SZN.LightBox.Anchorage.Fixed.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
};

/**
 *  navěšení událostí na resize okna, aby se dalo znovu vycentrovat okno, v IE6 nejde position:fixed, proto věším i na
 * scroll a přepočítávám pozici
 */
SZN.LightBox.Anchorage.Fixed.prototype.attachEvents = function() {
	/*potřebujeme navěsit událost na resize a scroll pro vypozicování*/
	this.ec.push(SZN.Events.addListener(window, 'resize', this, 'actualizePosition'));
	if (this.useAbsoluteHack) {
		this.ec.push(SZN.Events.addListener(window, 'scroll', this, 'actualizePosition'));
	}
};

/**
 * nastavení pozice galerie na střed okna
 */
SZN.LightBox.Anchorage.Fixed.prototype.actualizePosition = function() {
	var hasParent = true;
	if (!this.owner.visible) {
		this.container.style.position = 'absolute';
		this.container.style.top = '-1000px';
		this.container.style.left = '-1000px';
		this.container.style.visibility = 'hidden';
		hasParent = false;
	}

	var body = document.getElementsByTagName('body')[0];
	body.insertBefore(this.container, body.firstChild);

	this._position();

	if (!hasParent) {
		this.container.parentNode.removeChild(this.container);
		this.container.style.visibility = 'visible';
	}
};

/**
 * vlastní pozicování objektu galerie
 * @private
 */
SZN.LightBox.Anchorage.Fixed.prototype._position = function() {
	var portSize = SZN.Dom.getDocSize();
	if (this.useAbsoluteHack) { //ti co neumí position fixed pozicují pres absolute
		var wScroll = SZN.Dom.getScrollPos();
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
 * @extends SZN.LightBox.Anchorage
 */
SZN.LightBox.Anchorage.TopLeft = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Anchorage.TopLeft',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Anchorage
});

/**
 * napozicování galerie
 */
SZN.LightBox.Anchorage.TopLeft.prototype.actualizePosition = function() {
	this.container.style.top = this.options.top+'px';
	this.container.style.left = this.options.left+'px';
	this.container.style.position = 'absolute';
};

/*--------------------------------MAIN GALLERY WINDOW-------------------------------------*/
/**
 * třida hlavního okna galerie. Umí zobrazit flash a obrázek, který vždy zmenší na velikost boxu (ne v poměru)
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

	/*odkaz na aktuálně zobrazovaný element uschovávám si sem vždy pro animační přechod na nový*/
	this.current = null;

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
 * metoda je volána při renderování galerie, vyrenderuje DIV obal pro budoucí obrázky
 * @return {HTMLElement}
 */
SZN.LightBox.Main.prototype.render = function() {
	this.dom.mainBox = SZN.cEl('div', this.options.id,  this.options.className);
	this._attachEvents();
	return this.dom.mainBox;
};

/**
 * navěšení události, pokud je povoleno navěsí kolečko myši pro procházení fotkami
 * @private
 */
SZN.LightBox.Main.prototype._attachEvents = function() {
	if (this.options.useMouseWheelScroll) {
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'DOMMouseScroll', this, '_scroll'));
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'mousewheel', this, '_scroll'));
	}
}

/**
 * při pohybu kolečkem nad fotkou jdeme na předchozí nebo následující
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
 * metoda, která je volána při potřebě zobrazit velkou fotku
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
 * vygenerování flash objektu a vložení do stromu
 * @param {Object} img
 * @private
 */
SZN.LightBox.Main.prototype._generateFlashElm = function(img) {
	var em = SZN.cEl("embed");
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
SZN.LightBox.Main.prototype._generateImgElm = function(img) {
	var em = SZN.cEl('img');
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
SZN.LightBox.Main.prototype._switchImages = function (newImg) {
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
 * @extends SZN.LightBox.Main 
 */ 
SZN.LightBox.Main.Scaled = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Main.Scaled',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Main
});

/**
 * vygenerování IMG elementu a vložení do stromu, nastaví se mu rozměry jako rodiče
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
 * vylepšený okno galerie, umí centrovat obrázky který vždy zmenší v poměru stran, k tomu využívá ScaledImage
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
	 * objekt zmenšeného obrázku
	 * @param {ScaledImage}
	 */
	this.scaledImage = null;

};

/**
 * přepsaná metoda, tak aby místo obrázku dělala instanci zmenšovacího obrázku @see SZN.LightBox.ScaledImage
 * který se umí sám vycentrovat v rodiči do kterého se vkláda
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

/**
 * pokud flash ma zadané rozměry v konfiguraci dat, pak je potřeba ho vycentrovat, připnutí do stránky
 * zařizuje rodičovská metoda, obávat se přechodu a blikaní není třeba, neboť je vždy použita dummyTransition.
 * Poukd rozměry nemá, není třeba pozicovat, protože flash bude roztažen do okna Main
 * @param {Object} img
 */
SZN.LightBox.Main.CenteredScaled.prototype._generateFlashElm = function(img) {
	this.callSuper('_generateFlashElm', arguments.callee)(img);

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
 * metoda spouštející "animaci" nad dvěmi obrázky, starý zneviditelní, nový zviditelní
 * @see SZN.LightBox.Transition._finish
 * @param {HTMLElement} firstElm - původní obrázek
 * @param {HTMLElement} secondElm - nový obrázek
 */
SZN.LightBox.Transition.prototype.start = function(firstElm, secondElm) {
	this.first = firstElm;
	this.second = secondElm;
	this._finish();
}

/**
 * vyčistění starého elementu a zobrazení nového
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
 * @class Fade in/out, přechod mezi obrázky. Je možno nastavit délku trvání přechodu a taky překryv mezi začátky ztmavování
 * a rozsvěcení obrázku. V konfiguraci galerie je k tomu využito pole options.transitionOpt s těmito možnými hodnotami:
 * interval (1000) - v ms udaná délka trvání jednoho přechodu
 * frequency (25) - v ms uvedená doba trvání jednoho kroku
 * overlap: (1) - číslo mezi 0 a 1 udavající posun začnutí roztmívání nového obr, od začátku stmívání starého obr. 1 značí, že roztmívání začne současně se stmíváním
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

	this.running1 = false; /* běži první část animace? */
	this.running2 = false; /* běži druhá část animace? */

	this._secondOpacity = 0; /* pro případ rychlého přepínání za běhu */
	this._step1 = SZN.bind(this, this._step1);
	this._step2 = SZN.bind(this, this._step2);
	this._finish = SZN.bind(this, this._finish);

	this.i1 = new SZN.Interpolator(1, 0, this.options.interval, this._step1, {frequency:this.options.frequency});
	this.i2 = new SZN.Interpolator(0, 1, this.options.interval, this._step2, {frequency:this.options.frequency, endCallback:this._finish});
}

/**
 * start fadeování
 * @param {HTMLElement} oldElm
 * @param {HTMLElement} newElm
 */
SZN.LightBox.Transition.Fade.prototype.start = function(oldElm, newElm) {
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
SZN.LightBox.Transition.Fade.prototype._start2 = function() {
	this.running2 = true;
	this.i2.start();
}

SZN.LightBox.Transition.Fade.prototype._step1 = function(value) {
	if (!this.first) { return; }
	this._setOpacity(this.first, value);
	if (!this.running2 && value <= this.options.overlap) { this._start2(); } /* už je čas nastartovat druhou část animace */
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
 * metoda nastavující průhlednost jak pro IE tak ostatní prohlížeče
 * @param {HTMLElement} node
 * @param {float} value hodnota od 0 do 1
 */
SZN.LightBox.Transition.Fade.prototype._setOpacity = function(node, value) {
	node.style.opacity = value;
	node.style.filter = "alpha(opacity="+Math.round(value*100)+")";
}


/*---------------------------SCALED IMAGE------------------------*/
/**
 * @class Zmenšený obrázek v hlavním okně
 * @private
 */
SZN.LightBox.ScaledImage = SZN.ClassMaker.makeClass({
	NAME: "SZN.LightBox.ScaledImage",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * konstruktor
 * @param {SZN.LightBox.Main} owner - rodič
 * @param {String} src - URL s obrázkem
 * @param {Integer} w - maximální šířka
 * @param {Integer} h - maximální výška
 * @param {HTMLElement} rootElm - DOM uzel, do kterého ma být obrázek vložen, nutný pro zjištění jeho rozměru 
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
 * vyrenderování obrázku do pomocného skrytého boxu, navěšení onload
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
 * @method Explicitní destruktor. Odvěsí všechny eventy a smaže všechny vlastnosti.
 */
SZN.LightBox.ScaledImage.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this.dom) { this.dom[p] = null; }

	for (var p in this) { this[p] = null; }
}

/**
 * na onload zjištění velikosti obrázku, zmenšení a vycentrování a připnutí do galerie
 * @param {Event} e
 * @param {HTMLElement} elm
 */
SZN.LightBox.ScaledImage.prototype._loaded = function(e, elm) {


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

	/*vycentrování v rodiči*/
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
 * volitelná komponenta umožňující vytvožit ztmavnutí stranky pod galerií
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
 * na událost galerie "showed" je také připnut do stranky shader a to hned za element galerie
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
 * při schování galerie je vyvolána událost "close", na kterou je volána tato metoda pro schování shaderu
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
 * při změně velikosti okna je nutné shader natáhnout na správnou velikost
 * nyní je to uděláno tak, že se zruší a znovu vytvoří
 * @private
 */
SZN.LightBox.PageShader.prototype._resize = function() {
	this._hide();
	this._show();
};

/*---------------------------THUMBNAILS STRIP--------------------------*/
/**
 * výchozí třída pro filmový pás náhledu, tato neumí nic, jen definuje rozhraní,
 * vhodné ji použít pokud chceme galerii bez náhledu
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
 * vyrenderuje box pro náhledy, v tomto případě generuje prázdný DIV
 */
SZN.LightBox.Strip.prototype.render = function() {
	this.dom.mainBox = SZN.cEl('div', this.options.id,  this.options.className);
	return this.dom.mainBox;
};

/**
 * metoda volaná pokud je vybrán obrázek k zobrazení, zde nic nedělá
 * @param {int} index
 */
SZN.LightBox.Strip.prototype.update = function(index) {

};


/**
 * náhledový pruh s fotkami může být horizontálně, nebo vertikálně, aktuálně zobrazenou fotku se snaží
 * udržet scrolováním ve středu pasu
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
	 * pole kam si ukládám instance SZN.LightBox.StripImage
	 */
	this.objCache = [];

	this.ec = [];

	/**
	 * úschovna rozměru rámečku aktivního boxíku
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
 * pro všechny obrázky to vygeneruje jejich zástupce do stripu, zástupci jsou generovány ze třídy
 * vygeneruji take box pro zobrazení aktivního prvku
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
	/*generování náhledu do tabulky, jednou do jednoho sloupečku podruhé do jednoho řádku*/
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

	/*dočasně si aktivku připneme a zjistíme jeho rámečky, abychom je nemuseli pořád zjišťovat*/
	this.dom.mainBox.appendChild(this.dom.active);
	this.activeBorder.top = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderTopWidth'));
	this.activeBorder.bottom = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderBottomWidth'));
	this.activeBorder.left = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderLeftWidth'));
	this.activeBorder.right = parseInt(SZN.Dom.getStyle(this.dom.active, 'borderRightWidth'));
	this.dom.mainBox.removeChild(this.dom.active);


	/*navěšení událostí*/
	this._addEvents();

	return this.dom.mainBox;
};

/**
 * pokud zobrazujeme strip vodorovný, chceme aby se v něm dalo scrolovat kolečkem, navěsíme na scroll událost
 * @private
 */
SZN.LightBox.Strip.Scrollable.prototype._addEvents = function() {
	if (this.options.orientation == 'horizontal') {
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'DOMMouseScroll', this, '_scroll'));
		this.ec.push(SZN.Events.addListener(this.dom.mainBox, 'mousewheel', this, '_scroll'));
	}
};

/**
 * zajišťuje vlastní scrolování elementu s fotkama, vyvoláno události mousewheel
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
 * řeknu konkrétnímu StripImage aby se highlitoval, jelikož je vytvářím ve stejném pořadí
 * jako jsou v this.owner.data, stačí mi index na jeho vybrání
 * @param {int} index
 */
SZN.LightBox.Strip.Scrollable.prototype.update2 = function(index) {
	/*nastavení pozice rámování aktuální fotky*/
	this.dom.active.style.position = 'absolute';
	var pos = SZN.Dom.getBoxPosition(this.objCache[index].dom.img.parentNode, this.dom.imageTable);
	/*nastavení velikosti rámečkového divu*/
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
 * instance jednoho obrázku ve stripu náhledu
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
 * @param {SZN.LightBox} mainOwner - objekt rodiče - galerie
 * @param {Object} data - data o malém obrázku
 * @param {Number} order - pořadí obrázku ve stripu, začíná od 0
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
 * je předěna buňka tabulky do které bude obrázek zmenšen, obrázek renderován do pomocného boxu a čeka se na load
 * @param {HTMLElement} elm
 */
SZN.LightBox.StripImage.prototype.render = function(elm) {
	this.dom.parentNode = elm;
	/*vytvoření pomocného elementu, do kterého nandám obrázek v loaded zjistím jeho velikost a prenesu ho do předaného elementu*/
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
 * navěšení click události na obrázek
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.StripImage.prototype._click = function(e, elm) {
	this.mainOwner.go(this.order);
};

/**
 * po loadu obrázku je zmenšen a zavěšen do buňky
 * @param e
 * @param elm
 * @private
 */
SZN.LightBox.StripImage.prototype._loaded = function(e, elm) {
	/*obrázek načten. Načtu jeho velikost, protože je ve stromu*/
	var w = elm.width;
	var h = elm.height;

	/*obrázek schováme a připneme do správné buňky tabulky, tím získáme rodiče*/
	this.dom.img.style.display = 'none';
	this.dom.parentNode.appendChild(this.dom.img);
	this.dom.tmpBox.parentNode.removeChild(this.dom.tmpBox);
	this.dom.tmpBox = null;
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
 * vytvoření boxu pro popisek obrázku
 * @return {HTMLElement}
 */
SZN.LightBox.Description.prototype.render = function() {
	this.dom.box = SZN.cEl('div', this.options.id, this.options.className);
	return this.dom.box;
};

/**
 * zobrazení popisku obrázku s daným indexem
 * @param {int} index
 */
SZN.LightBox.Description.prototype.update = function(index) {

};

/**
 * tato třída zobrazuje zadaný popisek pomocí innerHTML, jde tedy vkládat celé HTML
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
 * renderujeme navíc vnitřní div, pro možnost lepšího stylování
 * @return {HTMLElement}
 */
SZN.LightBox.Description.Basic.prototype.render = function() {
	this.callSuper('render', arguments.callee)();

	this.dom.content = SZN.cEl('div', this.options.contentId, this.options.contentClassName);
	this.dom.box.appendChild(this.dom.content);
	return this.dom.box;
};

/**
 * pomocí innerHTML vkládáme popisek obrázku daného jeho indexem, používáme atribut description
 * @param {int} index
 */
SZN.LightBox.Description.Basic.prototype.update = function(index) {
	if(this.owner.data[index].description){
		this.dom.content.innerHTML = this.owner.data[index].description;
	}
};

/*------------------------NAVIGATION----------------------------*/
/**
 * třída obstarávající rozhranní pro navigaci
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
 * metoda je volaná při vytváření galerie, vrací prázdný box
 */
SZN.LightBox.Navigation.prototype.render = function() {
	return SZN.cEl('div',this.options.id,this.options.className);
};

/**
 * metoda je volana při změně obrázku
 * @param {int} index
 */
SZN.LightBox.Navigation.prototype.update = function(index) {

}


/**
 * rozšíření o základní tlačítka pro posun vpřed/vzad a vypnutí. navěšuje všechny potřebné události
 * @class
 * @extends SZN.LightBox.Navigation
 */
SZN.LightBox.Navigation.Basic = SZN.ClassMaker.makeClass({
	NAME: 'SZN.LightBox.Navigation.Basic',
	VERSION: '1.0',
	CLASS: 'class',
	EXTEND: SZN.LightBox.Navigation
});

/**
 * vyrenderování tří DIVů pro ovládací prvky <<, >> a X
 * ty jsou nastylovaný CSSkama a navěšeny na ně události
 */
SZN.LightBox.Navigation.Basic.prototype.render = function() {
	this.dom.next = SZN.cEl('a', this.options.nextId, this.options.nextClassName);
	this.dom.prev = SZN.cEl('a', this.options.prevId, this.options.prevClassName);
	this.dom.nextDisabled = SZN.cEl('a', this.options.nextId ? this.options.nextId+'-disabled' : false, this.options.nextClassName+'-disabled');
	this.dom.prevDisabled = SZN.cEl('a', this.options.prevId ? this.options.prevId+'-disabled' : false, this.options.prevClassName+'-disabled');
	this.dom.close = SZN.cEl('a', this.options.closeId, this.options.closeClassName);
	/*v IE6 jde hover jen nad Ačkem co ma odkaz, proto tam muši být mřížka*/
	this.dom.next.href = '#';
	this.dom.prev.href = '#';
	this.dom.nextDisabled.href = '#';
	this.dom.prevDisabled.href = '#';
	this.dom.close.href='#';
	/*kvůli preloadu mouseoverových obrázků vytvořím divy a ty napozicuji za roh, nicméně jde do nich v CSS umístit :hover obrázky a ty se nakešují */
	this.dom.nextPreload = SZN.cEl('div', this.options.nextId ? this.options.nextId+'-preload': false, this.options.nextClassName+'-preload', {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'});
	this.dom.nextDisabledPreload = SZN.cEl('div', this.options.nextId ? this.options.nextId+'-disabled-preload': false, this.options.nextClassName+'-disabled-preload', {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'});
	this.dom.prevPreload = SZN.cEl('div', this.options.prevId ? this.options.prevId+'-preload': false, this.options.prevClassName+'-preload', {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'});
	this.dom.prevDisabledPreload = SZN.cEl('div', this.options.prevId ? this.options.prevId+'-disabled-preload': false, this.options.prevClassName+'-disabled-preload', {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'});
	this.dom.closePreload = SZN.cEl('div', this.options.closeId ? this.options.closeId+'-preload': false, this.options.closeClassName+'-preload', {position: 'absolute', visibility: 'hidden', height: '1px', width: '1px'});

	this._addEvents();

	var div = SZN.cEl('div',this.options.id,this.options.className);
	SZN.Dom.append([div, this.dom.next, this.dom.nextDisabled, this.dom.prev, this.dom.prevDisabled, this.dom.close]);
	SZN.Dom.append([div, this.dom.nextPreload, this.dom.nextDisabledPreload, this.dom.prevPreload, this.dom.prevDisabledPreload, this.dom.closePreload]);
	return div;
};

/**
 * navěšení události na tlačítka
 * @private
 */
SZN.LightBox.Navigation.Basic.prototype._addEvents = function() {
	this.ec.push(SZN.Events.addListener(this.dom.next, 'click', this, '_next'));
	this.ec.push(SZN.Events.addListener(this.dom.prev, 'click', this, '_previous'));
	this.ec.push(SZN.Events.addListener(this.dom.close, 'click', this, '_close'));
	this.ec.push(SZN.Events.addListener(document, 'keydown', this, '_closeKey'));
	/*u disabled tlačítek nechceme proklik na kotvu*/
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
	SZN.Events.stopEvent(e);/*aby neprobublala do body*/
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
 * pokud je zmáčknut Esc tak galerii zavíráme
 * @param e
 * @param elm
 */
SZN.LightBox.Navigation.Basic.prototype._closeKey = function(e, elm) {
	if (e.keyCode == 27) {
		this.owner.close();
	}
};

/**
 * voláno při zobrazení obrázku, aktualizuji zobrazení navigačních << a >> pokud není kontinuální navigace
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
	} else {
		this.dom.prevDisabled.style.display = 'none';
		this.dom.nextDisabled.style.display = 'none';
		this.dom.prev.style.display = '';
		this.dom.next.style.display = '';
	}
};
