/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview universal tooltip
 * @author Radim Poloch
*/

/**
 * @class Widget Tooltip zobrazuje bublinu u prvku v závislosti definovaných na akcích (hover/click atd).
 *
 * @group jak-widgets
 */
JAK.Tooltip = JAK.ClassMaker.makeClass({
	NAME: "JAK.Tooltip",
	VERSION: "1.1"
});

/**
 * Konstruktor tooltipu.
 * Alespoň jeden z parametrů content/contentElm/contentFromAttribute musí být zadán (jinak jsou všechny parametry volitelné).
 *
 * @param {object} optObj Asociativní pole parametrů nastavujících tooltip
 *
 * @param {string} [optObj.content] Text nebo HTML, které se má zobrazit v tooltipu
 * @param {string/node reference} [optObj.contentElm] Určuje element ve stránce, který se má použít jako obsah tooltipu. Parametr může být string (IDčko elementu), nebo přímo reference na element. Pokud chceme mít ve stránce tento element neviditelný, nastavíme mu display:none a zobrazíme ho až bude v tooltipu (třeba přes selector .jak-tooltip #elmId)
 * @param {string} [optObj.contentFromAttribute] Můžeme obsah tooltipu zobrazovat i z libovolného atributu elementu, který tooltip spouští. Například po najetí myší na obrázek se zobrazí v tooltipu jeho title. Předmětem tohoto parametru je název atributu, ze kterého se má text použít.
 *
 * @param {string} [optObj.cssQuery] CSS 1 selector, který určuje, na které elementy se má tooltip navázat
 * @param {string} [optObj.defaultPosition="bottom"] Kde chceme tooltip defaultně zobrazovat. Povolené hodnoty jsou top, right, bottom a left. Pokud tooltip nemá dost místa na zobrazení (v rámci průhledu stránky), pozice se invertuje (bottom => top, right => left atd.)
 * @param {bool} [optObj.forceDefaultPosition=false] Nastaveno na true zakáže invertování pozice, pokud se na zvolené místo tooltip nevejde (tzn. při nastaveném true se nebude automaticky měnit nastavený defaultPosition)
 * @param {string[]} [optObj.showMethods=['mouseover']] Pole názvů eventů, na jejichž základě se má tooltip spouštět.
 * @param {string[]} [optObj.hideMethods=['mouseout']] Pole názvů eventů, na jejichž základě se má tooltip skrývat.
 * @param {bool} [optObj.noHideOverTooltip=false] Schovat tooltip pokud ze spouštěcího elementu najedeme nad tooltip samotný? (kopírování textu z tooltipu, proklik odkazu v tooltipu apod.)
 * @param {int} [optObj.top=0] Relativní posun tooltipu po y-ové souřadnici (od místa, kde by se jinak zobrazil)
 * @param {int} [optObj.left=0] Relativní posun tooltipu po x-ové souřadnici (od místa, kde by se jinak zobrazil)
 * @param {int} [optObj.showDelay=0] Za jak dlouho se má tooltip po spouštěcí akci (showMethods) zobrazit (v milisekundách)
 * @param {int} [optObj.hideDelay=0] Za jak dlouho se má tooltip po skrývací akci (hideMethods) skrýt (v milisekundách)
 * @param {string} [optObj.tooltipId] Určuje, jaké chceme ID kontejneru tooltipu
 * @param {int/string} [optObj.width=200] Šířka tooltipu včetně borderu. Lze zadat hodnotu 'auto' pro automatickou šířku podle obsahu.
 * @param {int} [optObj.maxWidth=320] Omezení maximální šířky tooltipu při použití width='auto' (včetně borderu).
 * @param {string} [optObj.imagePath] Nastavuje adresu sprite obrázku pro tooltip
 * @param {bool} [optObj.showDirectionalArrow=true] Informace, zdali se má ze spritu použít směrová šipka (nepodstatné, pokud sprite žádné šipky neobsahuje)
 * @param {int/int[]} [optObj.borderWidth=0] Border ve sprite obrázku (tj. na jakých souřadnicích se má sprite "rozříznout" na svých 9 dílů). V typickém případě se bude jednat o (velikost stínu + výšku šipky + poloměr kulatých rožků). Pokud je zadáno číslo, bude se počítat stejný border na všech stranách. Pokud je zadáno pole čísel (4 prvky), použijou se bordery v běžném pořadí, tedy top, right, bottom, left (typicky pro různé velikosti stínů na stranách tooltipu)
 * @param {string} [optObj.backgroundColor] Jaké má mít pozadí obsah tooltipu (pro případ, že jsou vypnuté nebo se nenačtou obrázky). Parametr by měl obsahovat stejnou hodnotu jako příslušná css vlastnost (#fff, white...).
 * @param {string/node reference} [optObj.parentElm] Do jakého kontejneru se má tooltip vložit (string = ID elementu, reference = getnutý element, null = vložit do BODY). Je nutné, aby element byl rodičem prvku, který spouští tooltip. Rodič by měl mít position relative nebo absolute pro správné pozicování tooltipu.
 *
 * @param {object} [optObj.closeBtn] Nastavuje zobrazení zavíracího tlačítka tooltipu
 * @param {string} [optObj.closeBtn.imagePath] Adresa obrázku tlačítka, tlačítko bude umístěné před obsahem a bude zarovnané vpravo. Bez tohoto parametru se tlačítko nezobrazí
 * @param {int} [optObj.closeBtn.top=0] Relativní posun po y-ové souřadnici od místa, kde by se tlačítko normálně zobrazilo
 * @param {int} [optObj.closeBtn.left=0] Relativní posun po x-ové souřadnici od místa, kde by se tlačítko normálně zobrazilo
 * @param {string} [optObj.closeBtn.margin=null] CSS zápis marginu, který bude na tlačítko použit
*/
JAK.Tooltip.prototype.$constructor = function(optObj) {
	// defaultní nastavení
		this.options = {
			content: null,
			contentElm: null,
			contentFromAttribute: null,
			cssQuery: null,
			defaultPosition: 'bottom',
			forceDefaultPosition: false,
			showMethods: ['mouseover'],
			hideMethods: ['mouseout'],
			noHideOverTooltip: false,
			top: 0,
			left: 0,
			showDelay: 0,
			hideDelay: 0,
			tooltipId: '',
			width: 200,
			maxWidth: 320,
			closeBtn: false,
			imagePath: '/img/tooltipSprite.png',
			showDirectionalArrow: true,
			borderWidth: 0,
			backgroundColor: false,
			parentElm: null
		}
		for (var p in optObj) { this.options[p] = optObj[p]; }
	// end

	// pokud se má tooltip házet do nějakého prvku, získám si na něj referenci
	this.options.parentElm = JAK.gel(this.options.parentElm);

	// pokud se má pro obsah tooltipu použít element ve stránce, získám si na něj referenci
	this.options.contentElm = JAK.gel(this.options.contentElm);

	// kontrola povinných parametrů
		if(!this.options.content && !this.options.contentElm && !this.options.contentFromAttribute) {
			throw new Error('[JAK.Tooltip] Není nastaven žádný zdroj, odkud si tooltip může získat svůj obsah. Zadejte některé z nastavení content/contentElm/contentFromAttribute v konstruktoru.');
		}
	// end

	// přeuložím si bordery do pole, pokud je zadáno jedno číslo
	if(typeof this.options.borderWidth == 'number') {
		this.options.borderWidth = [this.options.borderWidth, this.options.borderWidth, this.options.borderWidth, this.options.borderWidth];
	}

	this.ec = [];	// používá se pro evidenci eventů, abych je mohl odvěsit v destructoru
	this.dom = {};	// v tomto objektu budou všechny elementy tooltipu, které jsou nakonec appendnuty do finálního kontejneru this.dom.tooltip

	// navěsím na všechny požadované elementy příslušné spouštěcí a vypínací metody
		if(this.options.cssQuery) {
			var dispatcherElms = JAK.query(this.options.cssQuery);

			for(var i = 0; i < dispatcherElms.length; i++) {
				// spouštěcí eventy
				for(var j = 0; j < this.options.showMethods.length; j++) {
					this.ec.push(JAK.Events.addListener(dispatcherElms[i], this.options.showMethods[j], this, "_showOnDomReady"));
				}

				// vypínací eventy
				for(var j = 0; j < this.options.hideMethods.length; j++) {
					this.ec.push(JAK.Events.addListener(dispatcherElms[i], this.options.hideMethods[j], this, "_hide"));
				}
			}
		}
	// end
}

/**
 * Funkce pro zobrazení tooltipu
 * Pokud ještě není domReady, tooltip se zobrazí až na onDomReady (kvůli správnému výpočtu odscrollování).
 * Pokud už je domReady, tooltip se zobrazí až za showDelay.
 *
 * @param {string/node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Tooltip.prototype.show = function(dispatcherElm) {
	this._showOnDomReady(null, dispatcherElm);
}

/**
 * Funkce rozhoduje, kdy zobrazit tooltip (na onDomReady/za stanovený čas/ihned)
 *
 * @param {string/node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Tooltip.prototype._showOnDomReady = function(e, dispatcherElm) {
	// pokud se čeká na skrytí nebo zobrazení tooltipu, vymažu timeout
	this._clearDelays();

	if(/in/.test(document.readyState)) { // not dom ready
		var showFunc = this._showTooltip.bind(this, e, dispatcherElm);
		JAK.Events.onDomReady(null, showFunc);
	} else { // dom ready
		if(this.options.showDelay) { // zobrazím tooltip až za definovaný čas
			var showFunc = this._showTooltip.bind(this, e, dispatcherElm);
			this.showHideTimeout = setTimeout(showFunc, this.options.showDelay);
		} else { // zobrazím tooltip hned
			this._showTooltip(e, dispatcherElm);
		}
	}
}

/**
 * Funkce zavolá vybuildění tooltipu, jeho napozicování a vloží jej do stránky
 *
 * @param {string/node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Tooltip.prototype._showTooltip = function(e, dispatcherElm) {
	// pokud se čeká na skrytí nebo zobrazení tooltipu, vymažu timeout
	this._clearDelays();

	// pokusím se najít element, který spustil tooltip
		dispatcherElm = JAK.gel(dispatcherElm);
		if(!dispatcherElm) {
			throw new Error('[JAK.Tooltip] Element, který spustil tooltip, není definován nebo jej nelze nalézt. Pravděpodobně je špatně zadán parametr elm ve volání funkce JAK.Tooltip.show(elm).');
		}
	// end

	// pokud již tooltip ve stránce je, odstraním ho
	if(this.dom.tooltip) {
		this._hideTooltip();
	}

	// nechám vybuildit tooltip
	this._buildTooltip(dispatcherElm);

	// jestli není tooltip vytvořen, něco se nepovedlo
	if(!this.dom.tooltip) {
		throw new Error('[JAK.Tooltip] Nepodařilo se vytvořit tooltip.');
	}

	// vložím tooltip do stránky
	if(this.options.parentElm) {
		this.options.parentElm.appendChild(this.dom.tooltip);
	} else {
		document.body.appendChild(this.dom.tooltip);
	}

	// napozicuju tooltip
	this._setTooltipPosition(dispatcherElm);
}

/**
 * Funkce zajistí skrytí tooltipu ihned nebo za stanovený čas
 */
JAK.Tooltip.prototype._hide = function (e, elm) {

	if (this.options.noHideOverTooltip) {
		// nechceme schovávat pokud bylo najeto myší přímo nad tooltip
		if (JAK.DOM.findParent(e.relatedTarget, ".jak-tooltip")) {
			return;
		}
	}

	// pokud se čeká na skrytí nebo zobrazení tooltipu, vymažu timeout
	this._clearDelays();

	if(!this.dom.tooltip) { return; }

	// odstraním tooltip až za zadaný čas nebo ihned (pokud čas nebyl zadán)
	if(this.options.hideDelay) {
		this.showHideTimeout = setTimeout(this._hideTooltip.bind(this), this.options.hideDelay);
	} else {
		this._hideTooltip();
	}
};

/**
 * Skrýt tooltip
 */
JAK.Tooltip.prototype.hide = function() {
	// pokud se čeká na skrytí nebo zobrazení tooltipu, vymažu timeout
	this._clearDelays();
	if(!this.dom.tooltip) { return; }
	this._hideTooltip();
}

/**
 * Funkce odstraní tooltip ze stránky
 */
JAK.Tooltip.prototype._hideTooltip = function(e) {
	if(e) {
		JAK.Events.stopEvent(e);
		JAK.Events.cancelDef(e);
	}

	// pokud se čeká na skrytí nebo zobrazení tooltipu, vymažu timeout
	this._clearDelays();

	// odstraním tooltip ze stránky
	if(this.options.parentElm) {
		this.options.parentElm.removeChild(this.dom.tooltip);
	} else {
		document.body.removeChild(this.dom.tooltip);
	}

	// zruším všechny reference na tooltip
	for (var p in this.dom) { this.dom[p] = null; }
	this.dom = {};
}

/**
 * Funkce vytvoří tooltip
 * Pozicování tooltipu ve stránce zajišťuje funkce _setTooltipPosition
 *
 * @param {node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Tooltip.prototype._buildTooltip = function(dispatcherElm) {
	/*
	Tooltip je rozdělený na 10 divů. Ty jsou dále rozděleny na 3 řádky (header, body a footer).
	Header a footer jsou strukturou stejné, zajišťují kulaté rohy (lt, rt, rb a lb) a vodorovné okraje (t a b).
	Divy l a r zajišťují svislé okraje, content pak nese obsah tooltipu (cíleně je oddělen kvůli snadnějšímu custom stylování v CSSkách - obsah by mohl být i v body-inner, ale ten už obsahuje vlastní styly kvůli okrajům)
	Podle "obrázku" níže jsou analogicky pojmenovávány proměnné a classy.
	---------------------
	| LT |    T    | RT |
	---------------------
	| L  | CONTENT |  R |
	---------------------
	| LB |    B    | RB |
	---------------------
	V téhlé funkci se ještě nestarám o směrové šipky tooltipu. To zajišťuju až při jeho pozicování (_setTooltipPosition).
	*/

	// uložím si obsah tooltipu pokud je zadán nebo se má vytáhnout z atributu (pokud ho tahám jako element, vyřeším to později)
		var content = this.options.content;
		if(this.options.contentFromAttribute && dispatcherElm) {
			content = dispatcherElm.getAttribute(this.options.contentFromAttribute);
		}
	// end


	// přeuložím si nějaké proměnné, ať se mi s nimi lépe pracuje
		var border = {
			'top': this.options.borderWidth[0],
			'right': this.options.borderWidth[1],
			'bottom': this.options.borderWidth[2],
			'left': this.options.borderWidth[3]
		}
		var borderPX = {
			'top': this.options.borderWidth[0] + 'px',
			'right': this.options.borderWidth[1] + 'px',
			'bottom': this.options.borderWidth[2] + 'px',
			'left': this.options.borderWidth[3] + 'px'
		}
		var tooltipWidth = this.options.width;
		var tooltipWidthPX = this.options.width;
		if (this.options.width != 'auto') {
			tooltipWidth = tooltipWidth - border.left - border.right + 'px';
			tooltipWidthPX += 'px';
		}
	// end


	// vytvořím strukturu tooltipu
		// vytvořím kontejner tooltipu
			this.dom.tooltip = JAK.mel("div", {className:"jak-tooltip"}, {width: tooltipWidthPX, display: 'table'});
			if(this.options.tooltipId) {
				this.dom.tooltip.id = this.options.tooltipId;
			}
		// end

		// vytvořím hlavičku tooltipu
			this.dom.header = JAK.mel("div", {className:"jak-tooltip-header"}, {display: 'table-row'});
			this.dom.lt = JAK.mel("div", {className:"jak-tooltip-lt"}, {width: borderPX.left, height: borderPX.top, display: 'table-cell'});
			this.dom.t = JAK.mel("div", {className:"jak-tooltip-t"}, {width: tooltipWidth, height: borderPX.top, display: 'table-cell'});
			this.dom.rt = JAK.mel("div", {className:"jak-tooltip-rt"}, {width: borderPX.right, height: borderPX.top, display: 'table-cell'});
		// end

		// vytvořím tělo tooltpu i s obsahem
			this.dom.body = JAK.mel("div", {className:"jak-tooltip-body"}, {display: 'table-row'});
			this.dom.l = JAK.mel("div", {className:"jak-tooltip-l"}, {width: borderPX.left, display: 'table-cell'});
			this.dom.bodyInner = JAK.mel("div", {className:"jak-tooltip-body-inner"}, {width: tooltipWidth, display: 'table-cell'});
			this.dom.content = JAK.mel("div", {className:"jak-tooltip-content", innerHTML: content});
			this.dom.r = JAK.mel("div", {className:"jak-tooltip-r"}, {width: borderPX.left, display: 'table-cell'});
			if (this.options.width == 'auto') {
				this.dom.bodyInner.style.maxWidth = this.options.maxWidth - border.left - border.right + 'px';
			}
			if(this.options.contentElm) {
				this.dom.content.innerHTML = '';
				this.dom.content.appendChild(this.options.contentElm);
			}
		// end

		// vytvořím patičku tooltipu
			this.dom.footer = JAK.mel("div", {className:"jak-tooltip-footer"}, {display: 'table-row'});
			this.dom.lb = JAK.mel("div", {className:"jak-tooltip-lb"}, {width: borderPX.left, height: borderPX.bottom, display: 'table-cell'});
			this.dom.b = JAK.mel("div", {className:"jak-tooltip-b"}, {width: tooltipWidth, height: borderPX.bottom, display: 'table-cell'});
			this.dom.rb = JAK.mel("div", {className:"jak-tooltip-rb"}, {width: borderPX.right, height: borderPX.bottom, display: 'table-cell'});
		// end

		// vytvořím strukturu, appenduju příslušné prvky do sebe
			JAK.DOM.append([this.dom.tooltip, this.dom.header, this.dom.body, this.dom.footer],
						   [this.dom.header, this.dom.lt, this.dom.t, this.dom.rt],
						   [this.dom.body, this.dom.l, this.dom.bodyInner, this.dom.r],
						   [this.dom.bodyInner, this.dom.content],
						   [this.dom.footer, this.dom.lb, this.dom.b, this.dom.rb]);
		// end

		this._addCloseBtn();
	// end


	// nastavím pozadí a jeho pozice u příslušných prvků (kvůli čitelnosti odděleno od JAK.mel)
		// následujícím prvkům nastavím sprite obrázek tooltipu
		this._setBackground([this.dom.lt, this.dom.t, this.dom.rt, this.dom.l, this.dom.bodyInner, this.dom.r, this.dom.lb, this.dom.b, this.dom.rb]);

		// napozicuju sprite prvkům
		this._setBackgroundPosition(this.dom.lt, 0, 0);
		this._setBackgroundPosition(this.dom.t, -border.left, 0);
		this._setBackgroundPosition(this.dom.rt, 'right', 'top');
		this._setBackgroundPosition(this.dom.l, 0, -border.top);
		this._setBackgroundPosition(this.dom.bodyInner, -border.left, -border.top);
		this._setBackgroundPosition(this.dom.r, 'right', -border.top);
		this._setBackgroundPosition(this.dom.lb, 'left', 'bottom');
		this._setBackgroundPosition(this.dom.b, -border.left, '100%');
		this._setBackgroundPosition(this.dom.rb, 'right', 'bottom');

		// pokud je v nastavení backgroundColor, tak ho nastavím na content
		if(this.options.backgroundColor) {
			this.dom.content.style.backgroundColor = this.options.backgroundColor;
		}
	// end

	// při volbě "noHideOverTooltip" schovávat tooltip při mouseout události
		if (this.options.noHideOverTooltip) {
			JAK.Events.addListener(this.dom.tooltip, "mouseout", this, "_hide");
		}
	// end
}

/**
 * Funkce napozicuje tooltip
 *
 * @param {node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Tooltip.prototype._setTooltipPosition = function(dispatcherElm) {
	// zjistím si rozměry a pozice pro další výpočty
		// rozměry spouštěcího elementu
		var dispatcherDimensions = {
			width: dispatcherElm.offsetWidth,
			height: dispatcherElm.offsetHeight
		}

		// pozice spouštěcího elementu
		var dispatcherPosition = JAK.DOM.getPosition(dispatcherElm, this.options.parentElm);

		// vypočítám si absolutní souřadky středu spouštěcího elementu
		var dispatcherCenter = {
			top: dispatcherPosition.top + dispatcherDimensions.height/2,
			left: dispatcherPosition.left + dispatcherDimensions.width/2
		}

		// rozměry tooltipu
		var tooltipDimensions = {
			width: this.dom.tooltip.offsetWidth,
			height: this.dom.tooltip.offsetHeight
		}

		// aktuální odscrollování
		var scrollOffset = JAK.DOM.getScrollPos();

		// rozměry průhledu okna
		var viewportDimensions = {
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight
		}
	// end


	// zjistím, jestli se tooltip vejde do defaultní pozice. Pokud ne, tak pozici invertuju
		var actualPosition = this.options.defaultPosition;
		var tooltipRelativeLeft = this.options.left;
		var tooltipRelativeTop = this.options.top;

		if(!this.options.forceDefaultPosition) { // invertuju pouze v případě, že nemám pozici "nařízenou" napevno
			if(this.options.defaultPosition == 'bottom') {
				var tooltipBottom = dispatcherCenter.top + dispatcherDimensions.height/2 + tooltipDimensions.height + tooltipRelativeTop;
				var viewportBottom = scrollOffset.y + viewportDimensions.height;

				if(tooltipBottom > viewportBottom) {
					actualPosition = 'top';
					tooltipRelativeTop = -tooltipRelativeTop;
				}
			}

			if(this.options.defaultPosition == 'top') {
				var tooltipTop = dispatcherCenter.top - dispatcherDimensions.height/2 - tooltipDimensions.height + tooltipRelativeTop;
				var viewportTop = scrollOffset.y;

				if(tooltipTop < viewportTop) {
					actualPosition = 'bottom';
					tooltipRelativeTop = -tooltipRelativeTop;
				}
			}

			if(this.options.defaultPosition == 'left') {
				var tooltipLeft = dispatcherCenter.left - dispatcherDimensions.width/2 - tooltipDimensions.width + tooltipRelativeLeft;
				var viewportLeft = scrollOffset.x;

				if(tooltipLeft < viewportLeft) {
					actualPosition = 'right';
					tooltipRelativeLeft = -tooltipRelativeLeft;
				}
			}

			if(this.options.defaultPosition == 'right') {
				var tooltipRight = dispatcherCenter.left + dispatcherDimensions.width/2 + tooltipDimensions.width + tooltipRelativeLeft;
				var viewportRight = scrollOffset.x + viewportDimensions.width;

				if(tooltipRight > viewportRight) {
					actualPosition = 'left';
					tooltipRelativeLeft = -tooltipRelativeLeft;
				}
			}
		}
	// end


	// zjistím souřadnice tooltipu
		var tooltipLeft = 0;
		var tooltipTop = 0;

		if(actualPosition == 'bottom') {
			tooltipLeft = dispatcherCenter.left - tooltipDimensions.width/2;
			tooltipTop = dispatcherCenter.top + dispatcherDimensions.height/2;

			// napozicuju směrovou šipku tooltipu (stačí vycentrovat sprite na správné straně)
			if(this.options.showDirectionalArrow) {
				this.dom.t.style.backgroundPosition = '50% 0';
			}
		}

		if(actualPosition == 'top') {
			tooltipLeft = dispatcherCenter.left - tooltipDimensions.width/2;
			tooltipTop = dispatcherCenter.top - dispatcherDimensions.height/2 - tooltipDimensions.height;

			// napozicuju směrovou šipku tooltipu (stačí vycentrovat sprite na správné straně)
			if(this.options.showDirectionalArrow) {
				this.dom.b.style.backgroundPosition = '50% 100%';
			}
		}

		if(actualPosition == 'left') {
			tooltipLeft = dispatcherCenter.left - dispatcherDimensions.width/2 - tooltipDimensions.width;
			tooltipTop = dispatcherCenter.top - tooltipDimensions.height/2;

			// napozicuju směrovou šipku tooltipu (stačí vycentrovat sprite na správné straně)
			if(this.options.showDirectionalArrow) {
				this.dom.r.style.backgroundPosition = '100% 50%';
			}
		}

		if(actualPosition == 'right') {
			tooltipLeft = dispatcherCenter.left + dispatcherDimensions.width/2;
			tooltipTop = dispatcherCenter.top - tooltipDimensions.height/2;

			// napozicuju směrovou šipku tooltipu (stačí vycentrovat sprite na správné straně)
			if(this.options.showDirectionalArrow) {
				this.dom.l.style.backgroundPosition = '0 50%';
			}
		}
	// end


	// nastavím souřadnice tooltipu
		this.dom.tooltip.style.position = 'absolute';
		this.dom.tooltip.style.left = tooltipLeft + tooltipRelativeLeft + 'px';
		this.dom.tooltip.style.top = tooltipTop + tooltipRelativeTop + 'px';
	// end
}

/**
 * Funkce přidá do před obsah tooltipu zavírací tlačítko
 */
JAK.Tooltip.prototype._addCloseBtn = function() {
	if(!this.options.closeBtn || !this.options.closeBtn.imagePath) {
		return;
	}

	// vytvořím a nastyluju zavírací tlačítko (a>img)
		this.dom.close = JAK.mel("a", {className:"jak-tooltip-close", title:'Zavřít', href: '#'}, {cursor: 'pointer', position: 'relative', cssFloat: 'right', styleFloat: 'right'});
		this.dom.closeImg = JAK.mel("img", {className:"jak-tooltip-close-img", src:this.options.closeBtn.imagePath, title:'Zavřít'});
		this.dom.close.appendChild(this.dom.closeImg);
	// end

	// reflektuju další nastavení tlačítka
		if(this.options.closeBtn.top) {
			this.dom.close.style.top = this.options.closeBtn.top + 'px';
		}
		if(this.options.closeBtn.left) {
			this.dom.close.style.left = this.options.closeBtn.left + 'px';
		}
		if(this.options.closeBtn.margin) {
			this.dom.close.style.margin = this.options.closeBtn.margin;
		}
	// end

	this.ec.push(JAK.Events.addListener(this.dom.close, 'click', this, "_hideTooltip"));

	// vložím tlačítko do obsahu (před něj)
		if(this.dom.content.childNodes[0]) {
			this.dom.content.insertBefore(this.dom.close, this.dom.content.childNodes[0]);
		} else {
			this.dom.content.appendChild(this.dom.close);
		}
	// end
}

/**
 * Funkce nastaví pozadí (sprite obrázek tooltipu z nastavení) zadaným elementům
 *
 * @param {node reference[]} elms Pole elementů, na které se má pozadí nastavit
 */
JAK.Tooltip.prototype._setBackground = function(elms) {
	for(var i = 0; i < elms.length; i++) {
		elms[i].style.background = 'url(' + this.options.imagePath + ') no-repeat';
	}
}

/**
 * Funkce nastaví pozici pozadí zadanému elementu
 *
 * @param {node reference} elm Element, kterému se má pozadí napozicovat
 * @param {int} left X-ová souřadnice pozadí, hodnoty stejné jako u css vlastnosti (0, left, right, 20px, 50%)
 * @param {int} top Y-ová souřadnice pozadí, hodnoty stejné jako u css vlastnosti (0, top, bottom, 20px, 50%)
 */
JAK.Tooltip.prototype._setBackgroundPosition = function(elm, left, top) {
	if(!isNaN(left)) {
		left = left + 'px';
	}
	if(!isNaN(top)) {
		top = top + 'px';
	}
	elm.style.backgroundPosition = left + ' ' + top;
}

/**
 * Destruktor třídy
 */
JAK.Tooltip.prototype.$destructor = function() {
	this.hide();
	JAK.Events.removeListeners(this.ec);
}

/**
 * Funkce vynuluje probíhající timeout pro zobrazení/skrytí tooltipu
 */
JAK.Tooltip.prototype._clearDelays = function() {
	if(this.showHideTimeout) {
		clearTimeout(this.showHideTimeout);
	}
}
