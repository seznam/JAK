/**
 * @overview Modalni okno
 * @author jana
 */ 
 
/**
 * @class Modalni okno.
 * @group jak-widgets
 * @signal mw-close okno se zavrelo
 * @signal mw-open okno se otevrelo
 * @signal mw-built html okna se vybuildilo (= 1. otevreni)
 */
JAK.ModalWindow = JAK.ClassMaker.makeClass({
	NAME: 'JAK.ModalWindow',
	VERSION: '1.5',
	IMPLEMENT: [JAK.ISignals]
});

/** 
 * reference na prave otevrene okno
 * @static 
 */
JAK.ModalWindow.openedWindow = null;

/**
 * @param {string | HTMLElement} [content] obsah okna
 * @param {object} [userConf] konfigurace okna
 * 
 * @param {string} [userConf.winId] ID okna
 * @param {string | array} [userConf.winClass] trida/tridy okna<br /> Napr: "myClass", "myClass1 myClass2", ["myClass1", "myClass2"]
 * @param {string | array} [userConf.overlayClass] trida/tridy pro overlay, uziti stejne jako u predchoziho
 * @param {string | element} [userConf.closeContent] obsah zaviraciho prvku
 * @param {bool} [userConf.winFixed=true] <i>true</i> - fixni pozicovani okna<br /> <i>false</i> - absolutni pozicovani okna
 * @param {bool} [userConf.closeActions=true] pridat obvykle zaviraci akce (escape, klik na overlay, klik na zaviraci prvek)
 * @param {string} [userConf.bordersImgSupport="never"] vytvorit podporu (html) pro okraje vytvorene pomoci obrazku:<br /> <i>never</i> - nikdy nepridavat<br /> <i>always</i> - vzdy pridavat<br /> <i>dumb</i> - jen u prohlizecu, ktere neumi CSS box-shadow a border-radius
 * @param {string} [userConf.bordersImg] sprite obrazek, ktery se vyuzije u obrazkovych okraju
 * @param {number | array} [userConf.bordersWidth] sirka okraju tvorenych sprite obrazkem [horni, pravy, dolni, levy okraj]. Pri zadani jedineho cisla "x" plati: x = [x, x, x, x].
 */
JAK.ModalWindow.prototype.$constructor = function(content, userConf) {
	if (typeof(content) != 'string' && !content.nodeType) {
		content = '';
	}
	this._content = content;	
	this._conf = this._normalizeConf(userConf);
	
	this._dom = {
		window:			null,
		content:		null,
		contentScrolls:	null,
		overlay:		null
	};
	this._events = {};
	this._imgload_ec = [];
	
	this._escEnabled = true;

	//starsi androidy maji casto potize s fixed pozicovanim - okno i overlay v nich budeme pozicovat absolutne
	this._overlayFixed = true;
	if ( !this._fixedPosSupport() ) {
		this._overlayFixed = false;
		this._conf.winFixed = false;		
	}
}

/**
 * Destruktor, likviduje html okna a odvesuje defaultni udalosti okna.
 */
JAK.ModalWindow.prototype.$destructor = function() {
	this.close();
	
	if (this._dom.window) {
		JAK.DOM.clear(this._dom.window);
		this._dom.window.parentNode.removeChild(this._dom.window);
	}
	
	if (this._dom.overlay) {
		this._dom.overlay.parentNode.removeChild(this._dom.overlay);
	}	
	
	for (var p in this._events) {
		JAK.Events.removeListener(this._events[p]);
	}
	
	JAK.Events.removeListeners(this._imgload_ec);
	
	for (var p in this) {
		this[p] = null;
	}
}


/*
 * defaultni konfigurace, superblbuvzdorne osetreni uzivatelske konfigurace, 
 * spojeni techto konfiguraci do jedne 
 */
JAK.ModalWindow.prototype._normalizeConf = function(userConf) {
	function _normalizeClassConf(p) {
		if (typeof(p) == 'string') {
			p = p.split(' ');
		} else if (!(p instanceof Array)) {
			p = [];
		}
		for (var i = p.length; i > 0; i--) {
			if ( !p[i-1] || typeof(p[i-1]) != 'string' ) {
				p.splice(i-1, 1);	
			}
		}		
		return p;
	}	
	
	//default conf - vsechny parametry:
	var conf = {
		winId: '',					//string - id okna
		winClass: [],				//string || array - trida okna
		overlayClass: [],			//string || array - trida overlay
		closeContent: '',			//string || element - obsah zaviraciho prvku
		winFixed: true,				//bool - fixed nebo absolute pozicovani okna
		closeActions: true,			//bool - pridat defaultni zaviraci akce (ESC, klik overlay, klik zaviraci prvek)
		bordersImgSupport: 'never',	//string - 'never', 'always', 'dumb' - pridat podporu pro obrazkove okraje?
		bordersImg: '',				//string - sprite obrazek, vyuzije se pouze pri pouziti obrazkovych okraju		
		bordersWidth: [0,0,0,0]		//number || array - sirka okraju tvorenych sprite obrazkem [horni,pravy,dolni,levy okraj]
	};
	if (userConf) {
		for (var p in userConf) { 
			conf[p] = userConf[p]; 
		}
	}

	
	//winId
	if (typeof(conf.winId) != 'string') { 
		conf.winId = ''; 
	}	
	//winClass
	conf.winClass = _normalizeClassConf(conf.winClass);	
	//overlayClass
	conf.overlayClass = _normalizeClassConf(conf.overlayClass);	
	//closeContent
	if (typeof(conf.closeContent) != 'string' && !conf.closeContent.nodeType) {
		conf.closeContent = '';
	}
	//bordersImg
	if (typeof(conf.bordersImg) != 'string') {
		conf.bordersImg = '';
	}
	//bordersWidth		
	if (!(conf.bordersWidth instanceof Array)) {
		conf.bordersWidth = [conf.bordersWidth, conf.bordersWidth, conf.bordersWidth, conf.bordersWidth];	
	}
	for (var i = 0; i < 4; i++) {
		if (!conf.bordersWidth[i]) {
			conf.bordersWidth[i] = 0;
		} else {
			conf.bordersWidth[i] = parseInt(conf.bordersWidth[i]) || 0;
		}
	}
	
	
	return conf;
}

/*
 * vyhodnoti, zda prohlizec neni prilis hloupy pro pouziti CSS fixed pozicovani
 */
JAK.ModalWindow.prototype._fixedPosSupport = function() {
	if (JAK.Browser.platform == 'and') {
		var matches = window.navigator.userAgent.match(/Android\s+([\d]+)/);
		var version = matches? parseInt(matches[1]) : 0;
		if (version < 4) {
			return false;
		}
	}
	return true;
}


/**
 * Otevre okno, pokud uz neni otevreno nejake jine. Pokud je to prvni otevreni 
 * tohoto modal window, vybuildi se html okna a vyrobi se signal <strong>mw-built</strong>.
 * Na zaver se vyrobi signal <strong>mw-open</strong>.
 */
JAK.ModalWindow.prototype.open = function() {	
	if (JAK.ModalWindow.openedWindow) { //je uz otevreno nejake modalWindow (tohle nebo jine)
		return;
	}
	
	JAK.ModalWindow.openedWindow = this;
	
	if (!this._dom.overlay) {
		this._buildOverlay();
	}
	if (!this._dom.window) {
		this._buildWindow();
	}

	this._dom.overlay.style.display = 'block';
	this._dom.window.style.display = 'block';
	this._updatePosition();
	
	//+ posluchac klavesy
	if (this._conf.closeActions && this._escEnabled && !this._events.esc) {
		this._events.esc = JAK.Events.addListener(document, 'keydown', this, '_ev_keyEsc');
	}
	//+ posluchac window resize
	if (!this._events.winResize) {
		this._events.winResize = JAK.Events.addListener(window, 'resize', this, '_ev_winResize');
	}
	//+ posluchac window scroll
	if (!this._events.winScroll) {
		this._events.winScroll = JAK.Events.addListener(window, 'scroll', this, '_ev_winScroll');
	}
	
	this.makeEvent('mw-open');
}

/**
 * Pokud je okno otevreno, zavre jej a vyrobi signal <strong>mw-close</strong>.
 */
JAK.ModalWindow.prototype.close = function() {
	if ( !this.isOpened() ) { //neni co zavirat
		return;
	}
	
	//skryt okno a overlay
	this._dom.overlay.style.display = 'none';
	this._dom.window.style.display = 'none';

	//- posluchac klavesa esc zavreni
	if (this._events.esc) {
		JAK.Events.removeListener(this._events.esc);
		delete this._events.esc;
	}
	//- posluchac window resize
	if (this._events.winResize) {
		JAK.Events.removeListener(this._events.winResize);
		delete this._events.winResize;
	}
	//- posluchac window scroll
	if (this._events.winScroll) {
		JAK.Events.removeListener(this._events.winScroll);
		delete this._events.winScroll;
	}	
	
	JAK.ModalWindow.openedWindow = null;
	this.makeEvent('mw-close');
}

/**
 * Zadane elementy budou na kliknuti otevirat toto okno, jsou u nich zruseny defaultni akce.
 * @param {HTMLElement | string | array} elms elementy, mohou byt zadany jako ID elementu nebo primo element, jednotlive nebo v poli.
 */
JAK.ModalWindow.prototype.addOpenElements = function(elms) {
	if ( !(elms instanceof Array) ) {
		elms = [elms];
	}
	
	for (var i = 0; i < elms.length; i++) {
		var elm = JAK.gel(elms[i]);
		if (elm && elm.nodeType) {
			JAK.Events.addListener(elm, 'click', this, '_ev_open');
		}
	}
}

/**
 * Nastavi novy obsah okna
 * @param {HTMLElement | string} content novy obsah okna
 */
JAK.ModalWindow.prototype.setContent = function(content) {
	if (typeof(content) != 'string' && !content.nodeType) {
		content = '';
	}	
	this._content = content;
	
	if (this._dom.window) {
		this._buildContent();
		if (this.isOpened()) {
			this._updatePositionWindow();
		}
	}
}

/**
 * Vraci nejsvrchnejsi obal okna.
 * @returns {HTMLElement} ...to je on
 */
JAK.ModalWindow.prototype.getContainer = function() {
	return this._dom.window;
}

/**
 * Vraci overlay.
 * @returns {HTMLElement} ...to je on
 */
JAK.ModalWindow.prototype.getOverlay = function() {
	return this._dom.overlay;
}

/**
 * Je prave okno otevreno?
 * @returns {bool}
 */
JAK.ModalWindow.prototype.isOpened = function() {
	return (JAK.ModalWindow.openedWindow == this);
}

/**
 * Zrusi zavirani okna pomoci escape 
 */
JAK.ModalWindow.prototype.disableEsc = function() {
	if (this._events.esc) {
		JAK.Events.removeListener(this._events.esc);
		delete this._events.esc;
	}
	this._escEnabled = false;
}

/**
 * Nastavi zavirani okna pomoci escape (respektuje nastaveni zaviracich akci v konfiguraci)
 */
JAK.ModalWindow.prototype.enableEsc = function() {
	if (this._conf.closeActions && !this._events.esc) {
		this._events.esc = JAK.Events.addListener(document, 'keydown', this, '_ev_keyEsc');
	}
	this._escEnabled = true;
}


//vybuildi prekryti, pokud neexistuje
JAK.ModalWindow.prototype._buildOverlay = function() {
	if (!this._dom.overlay) {
		this._dom.overlay = JAK.mel('div', {className: 'mw-overlay'}, {display: 'none', position: (this._overlayFixed? 'fixed' : 'absolute')});
		for (var i = 0; i < this._conf.overlayClass.length; i++) {
			JAK.DOM.addClass(this._dom.overlay, this._conf.overlayClass[i]);
		}			
		document.body.appendChild( this._dom.overlay );
	
		//+ posluchac click zavreni
		if (this._conf.closeActions) {
			this._events.overlayClick = JAK.Events.addListener(this._dom.overlay, 'click', this, '_ev_close');
		}	
	}
}

//vybuildi komplet okno (okno+okraje+obsah), signal mw-built
JAK.ModalWindow.prototype._buildWindow = function() {
	//vytvorit root element okna
	this._dom.window = JAK.mel('div', {className: 'mw-window'}, {display: 'none', position: (this._conf.winFixed? 'fixed' : 'absolute')});
	if (this._conf.winId) {
		this._dom.window.id = this._conf.winId;
	}

	for (var i = 0; i < this._conf.winClass.length; i++) {
		JAK.DOM.addClass(this._dom.window, this._conf.winClass[i]);
	}

	var contentParent = this._dom.window;
	
	//pokud je zadano, vytvorime obalujici tabulku, pomoci ktere se daji udelat stiny a kulate rohy okna pres obrazky
	if ( this._bordersImgSupport() ) {
		contentParent = this._buildBorders();
		JAK.DOM.addClass(this._dom.window, 'mw-imgBorders');
	} else {
		contentParent = JAK.mel('div', {className: 'mw-contentWrap'});
		this._dom.window.appendChild(contentParent);
	}	

	//zaviraci prvek
	//mw-action-close: vsechny prvky v okne s touto tridou pri kliknuti zaviraji okno
	var close = JAK.mel('div', {className: 'mw-close mw-action-close'});
	if (this._conf.closeContent) {
		if (typeof(this._conf.closeContent) == 'string') {	
			close.innerHTML = this._conf.closeContent;	
		} else {
			close.appendChild(this._conf.closeContent);
		}		
	}
	this._dom.window.appendChild(close);	
	
	//prvek, ve kterem bude obsah okna
	this._dom.contentScrolls = JAK.mel('div', {className: 'mw-contentScrollbars'}, {overflow: (this._conf.winFixed? 'auto' : '')});
	this._dom.content = JAK.mel('div', {className: 'mw-content'});
	this._dom.contentScrolls.appendChild(this._dom.content);
	contentParent.appendChild(this._dom.contentScrolls);		
	this._buildContent();
	
	//vlozit okno do DOMu stranky (1. element v body)
	if (document.body.firstChild) {
		document.body.insertBefore(this._dom.window, document.body.firstChild);
	} else {
		document.body.appendChild(this._dom.window);
	}

	//+ posluchac kliknuti na okno (zaviraci prvky)
	this._events.mwClick = JAK.Events.addListener(this._dom.window, 'click', this, '_ev_winClick');

	this.makeEvent('mw-built');
}

//vybuildi obsah okna
JAK.ModalWindow.prototype._buildContent = function() {
	if (typeof(this._content) == 'string') {	
		this._dom.content.innerHTML = this._content;	
	} else {
		JAK.DOM.clear(this._dom.content);
		this._dom.content.appendChild(this._content);
	}
	
	//load udalost obrazku - update pozice okna (mohly se zmenit rozmery)
	var imgs = this._dom.content.querySelectorAll('img');
	for (var i = 0; i < imgs.length; i++) {
		this._imgload_ec.push(
			JAK.Events.addListener(imgs[i], 'load', this, '_updatePositionWindow')
		);
	}
}

//vybuildi a nastyluje tabulkove okraje - podpora pro obrazkove okraje v blbych prohlizecich
JAK.ModalWindow.prototype._buildBorders = function() {
	//vytvorit elementy
	var table = JAK.mel('table', {className: 'mw-contentWrap'});
	var tbody = JAK.mel('tbody'); //IE7
	
	var toprow = JAK.mel('tr', {className: 'rowTop'});
	var topleftcorner = JAK.mel('td', {className: 'col1'});
	var topleftcornerIn = JAK.mel('div', {className: 'in'}); //drzi sirku okraju zleva pri hodne malem docSize
	var topline = JAK.mel('td', {className: 'col2'});
	var toprightcorner = JAK.mel('td', {className: 'col3'});
	var toprightcornerIn = JAK.mel('div', {className: 'in'}); //drzi sirku okraju zprava pri hodne malem docSize

	var middlerow = JAK.mel('tr', {className: 'rowMiddle'});
	var leftline = JAK.mel('td', {className: 'col1'});
	var center = JAK.mel('td', {className: 'col2'});
	var rightline = JAK.mel('td', {className: 'col3'});		
	
	var bottomrow = JAK.mel('tr', {className: 'rowBottom'});
	var bottomleftcorner = JAK.mel('td', {className: 'col1'});
	var bottomline = JAK.mel('td', {className: 'col2'});
	var bottomrightcorner = JAK.mel('td', {className: 'col3'});		
	
	//nastylovat - pokud mame sprite obrazek a sirku alespon 1 okraje
	if (this._conf.bordersImg && (this._conf.bordersWidth[0] || this._conf.bordersWidth[1] || this._conf.bordersWidth[2] || this._conf.bordersWidth[4])) {
		var bgImg = 'url(' + this._conf.bordersImg + ')';

		//horni rada
		JAK.DOM.setStyle(topleftcorner, { 
			backgroundImage: bgImg,
			height: this._conf.bordersWidth[0] + 'px',
			width: this._conf.bordersWidth[3] + 'px',
			backgroundPosition: '0 0'
		});
		JAK.DOM.setStyle(topleftcornerIn, { 
			height: this._conf.bordersWidth[0] + 'px',
			width: this._conf.bordersWidth[3] + 'px'
		});
		JAK.DOM.setStyle(topline, { 
			backgroundImage: bgImg,
			height: this._conf.bordersWidth[0] + 'px',
			backgroundPosition: '-' + this._conf.bordersWidth[3] + 'px 0'
		});	
		JAK.DOM.setStyle(toprightcorner, { 
			backgroundImage: bgImg,
			height: this._conf.bordersWidth[0] + 'px',
			width: this._conf.bordersWidth[1] + 'px',
			backgroundPosition: '100% 0'
		});
		JAK.DOM.setStyle(toprightcornerIn, { 
			height: this._conf.bordersWidth[0] + 'px',
			width: this._conf.bordersWidth[1] + 'px'
		});
		
		//stredni rada
		JAK.DOM.setStyle(leftline, { 
			backgroundImage: bgImg,
			width: this._conf.bordersWidth[3] + 'px',
			backgroundPosition: '0 -' + this._conf.bordersWidth[0] + 'px'
		});
		JAK.DOM.setStyle(rightline, { 
			backgroundImage: bgImg,
			width: this._conf.bordersWidth[1] + 'px',
			backgroundPosition: '100% -' + this._conf.bordersWidth[0] + 'px'
		});
		
		//dolni rada
		JAK.DOM.setStyle(bottomleftcorner, { 
			backgroundImage: bgImg,
			height: this._conf.bordersWidth[2] + 'px',
			width: this._conf.bordersWidth[3] + 'px',
			backgroundPosition: '0 100%'
		});
		JAK.DOM.setStyle(bottomline, { 
			backgroundImage: bgImg,
			height: this._conf.bordersWidth[2] + 'px',
			backgroundPosition: '-' + this._conf.bordersWidth[3] + 'px 100%'
		});	
		JAK.DOM.setStyle(bottomrightcorner, { 
			backgroundImage: bgImg,
			height: this._conf.bordersWidth[2] + 'px',
			width: this._conf.bordersWidth[1] + 'px',
			backgroundPosition: '100% 100%'
		});
	}
	
	//pripnout do DOMu
	JAK.DOM.append(
		[topleftcorner, topleftcornerIn],
		[toprightcorner, toprightcornerIn],
		[toprow, topleftcorner, topline, toprightcorner],
		[middlerow, leftline, center, rightline],
		[bottomrow, bottomleftcorner, bottomline, bottomrightcorner],
		[tbody, toprow, middlerow, bottomrow],
		[table, tbody],
		[this._dom.window, table]
	);	
	
	return center; //vracime prvek, do ktereho se pripne content
}

//vyhodnoti, zda budeme pridavat podporu pro obrazkove okraje
JAK.ModalWindow.prototype._bordersImgSupport = function() {
	//detekuje, zda prohlizec umi CSS featuru - casem by mohlo byt primo v JAKu
	function cssDetect(prop) {
		if (!prop) { return false; }
		
		var prefixes = ['Moz', 'WebKit', 'O', 'ms', 'Khtml'];
		var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1);
		var prefixedProps = (prop + ',' + (prefixes.join(ucProp+',')) + ucProp).split(',');
		var testElm = JAK.mel('div');
		
		for (var i = 0; i < prefixedProps.length; i++) {
			if ( testElm.style[prefixedProps[i]] === '' ) {
				return true;
				break;
			}
		}
		
		return false;
	}	
	
	if (this._conf.bordersImgSupport == 'dumb') {
		return (!cssDetect('boxShadow') || !cssDetect('borderRadius')); //pokud prohlizec neumi css3 border-radius nebo box-shadow, pak je hloupy a potrebuje podporu
		
	} else if (this._conf.bordersImgSupport == 'always') {
		return true;
		
	} else {
		return false;
	}
}

//aktualizace pozice okna a prekryti
JAK.ModalWindow.prototype._updatePosition = function() {	
	this._updatePositionWindow();
	this._updatePositionOverlay();
}

//aktualizace pozice okna a rozmeru obsahu okna (pri fixed pozicovani)
JAK.ModalWindow.prototype._updatePositionWindow = function() {
	if (!this._dom.window) {
		return;
	}

	//fixne pozicovane okno - pokud se nevejde na stranku, zmensujeme jeho content, ktery lze pak prohlizet pomoci scrollbaru kolem contentu
	if (this._conf.winFixed) {
		var docSize = JAK.DOM.getDocSize();	
		
		//zapamatujeme si rozdil rozmeru mezi obsahem a obalem okna a puvodni sirku okna
		if (typeof(this._diffX) == 'undefined') {
			var paddingTB = (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'paddingTop')) || 0) + (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'paddingBottom')) || 0);
			var borderTB =  (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'borderTopWidth')) || 0) + (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'borderBottomWidth')) || 0);
			var paddingRL = (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'paddingRight')) || 0) + (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'paddingLeft')) || 0);
			var borderRL =  (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'borderRightWidth')) || 0) + (parseInt(JAK.DOM.getStyle(this._dom.contentScrolls, 'borderLeftWidth')) || 0);

			this._origWinWidth = this._dom.window.offsetWidth;	

			this._diffX = this._dom.window.offsetWidth - (this._dom.contentScrolls.offsetWidth - paddingRL - borderRL); //sirka okna - sirka obsahu
			this._diffY = this._dom.window.offsetHeight - (this._dom.contentScrolls.offsetHeight - paddingTB - borderTB); //vyska okna - vyska obsahu
		}
		
		//nutne!! pred vypocty s sirkou se musi nastavit defaultni vyska; pak se prepocita vyska
		this._dom.contentScrolls.style.height = ''; 	
		
		//upraveni sirky contentu
		if (docSize.width >= this._origWinWidth) { //okno se vejde na sirku do stranky -> zrusime mu rozmery nastavene pomoci teto metody
			this._dom.contentScrolls.style.width = '';		
		} else { //okno se na sirku nevejde -> zmensime jeho content tak, at se vejde (vcetne ruznych margin+padding+border)
			this._dom.contentScrolls.style.width = Math.max(docSize.width - this._diffX, 1) + 'px';		
		}
		
		//upraveni vysky contentu
		if (docSize.height < this._dom.window.offsetHeight) {	 //okno se na vysku nevejde -> zmensime content tak, at se vejde (vcetne ruznych margin+padding+border)	
			this._dom.contentScrolls.style.height = Math.max(docSize.height - this._diffY, 1) + 'px';
		}

		this._setPositionWindow(
			docSize, 
			{x: 0, y: 0}, //fixne pozicovane okno, scroll nema vyznam
			{width: this._dom.window.offsetWidth, height: this._dom.window.offsetHeight}
		);	
	} 
	//absolutne pozicovane okno - rozmery se nemeni, pokud se nevejde cele do stranky, pomuzou scrollbary stranky
	else {
		this._setPositionWindow(
			JAK.DOM.getDocSize(), 
			JAK.DOM.getScrollPos(), 
			{width: this._dom.window.offsetWidth, height: this._dom.window.offsetHeight}
		);
	}
}

//aktualizace pozice a rozmeru prekryti
JAK.ModalWindow.prototype._updatePositionOverlay = function() {
	if (!this._dom.overlay) {
		return;
	}
	
	var docSize = JAK.DOM.getDocSize();	

	if (this._overlayFixed) {
		this._dom.overlay.style.height = docSize.height + 'px';	
	} else {
		var docScroll = JAK.DOM.getScrollPos();	
		
		this._dom.overlay.style.height = docSize.height + 'px';
		this._dom.overlay.style.top = docScroll.y + 'px';
		this._dom.overlay.style.left = docScroll.x + 'px';		
	}
}

//vypocet pro napozicovani okna - da se snadno podedit a prepsat ...
JAK.ModalWindow.prototype._setPositionWindow = function(docSize, docScroll, winSize) {
	//vertikalni smer
	var top = docScroll.y + Math.max((docSize.height / 2.5 - winSize.height / 2), 0); //stred okna je mirne nad stredem dokumentu
	//var top = docScroll.y + Math.max((docSize.height / 2 - winSize.height / 2), 0); //stred okna = stred dokumentu
	this._dom.window.style.top = top + 'px';
			
	//horizontalni smer
	var left = docScroll.x + Math.max(docSize.width / 2 - winSize.width / 2, 0) + 'px'; //vycentrovano
	this._dom.window.style.left = left;		
}

//udalost - zrusit def. akce udalosti a otevrit okno
JAK.ModalWindow.prototype._ev_open = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.open();
}

//udalost - zrusit def. akce udalosti a zavrit okno
JAK.ModalWindow.prototype._ev_close = function(e, elm) {
	JAK.Events.cancelDef(e);
	this.close();
}

//udalost - klavesa ESC zavira okno
JAK.ModalWindow.prototype._ev_keyEsc = function(e, elm) {
	if (e.keyCode == 27) { //esc
		this.close();	
	}	
}

//udalost - klik nekam na okno - pokud target ma tridu "mw-action-close", zavre se okno
JAK.ModalWindow.prototype._ev_winClick = function(e, elm) {
	var target = JAK.Events.getTarget(e);
	
	if ( this._conf.closeActions && JAK.DOM.hasClass(target, 'mw-action-close') ) {
		JAK.Events.cancelDef(e);
		this.close();
	}
}

//window resize -> je treba aktualizovat pozici a pripadne rozmery prekryti a okna
JAK.ModalWindow.prototype._ev_winResize = function(e, elm) {
	this._updatePosition();
}

//window scroll -> je potreba aktualizovat pozici overlay, pokud neni fixed
JAK.ModalWindow.prototype._ev_winScroll = function(e, elm) {
	if (!this._overlayFixed) {
		this._updatePositionOverlay();
	}
}
