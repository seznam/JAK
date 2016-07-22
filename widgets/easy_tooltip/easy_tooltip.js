/**
 * @overview Universal tooltip
*/

/**
 * @class Widget Tooltip zobrazuje bublinu u prvku v závislosti definovaných na akcích (hover/click atd).
 * @group jak-widgets
 */
JAK.Easy_Tooltip = JAK.ClassMaker.makeClass({
	NAME: "JAK.Easy_Tooltip",
	VERSION: "1.0"
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
 * @param {bool} [optObj.showDirectionalArrow=true] Informace, zdali se má ze spritu použít směrová šipka (nepodstatné, pokud sprite žádné šipky neobsahuje)
 * @param {string/node reference} [optObj.parentElm] Do jakého kontejneru se má tooltip vložit (string = ID elementu, reference, null = vložit do BODY). Je nutné, aby element byl rodičem prvku, který spouští tooltip. Rodič by měl mít position relative nebo absolute pro správné pozicování tooltipu.
*/
JAK.Easy_Tooltip.prototype.$constructor = function(optObj) {
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
		showDirectionalArrow: true,
		parentElm: null,
		userPosFunction: null,
		arrowSize: null,
		offset: 2, // [px]
		css: '/js/widgets/easy_tooltip/easy_tooltip.css'
	};

	// aplikace nastavení
	for (var p in optObj) { this.options[p] = optObj[p]; }

	// místo pro uložení vypočtených hodnot
	this._saved = {
		'arrow': null
	}

	// pokud se má tooltip házet do nějakého prvku, získám si na něj referenci
	this.options.parentElm = JAK.gel(this.options.parentElm);

	// pokud se má pro obsah tooltipu použít element ve stránce, získám si na něj referenci
	this.options.contentElm = JAK.gel(this.options.contentElm);

	// kontrola povinných parametrů
		if(!this.options.content && !this.options.contentElm && !this.options.contentFromAttribute) {
			throw new Error('[JAK.Tooltip] Není nastaven žádný zdroj, odkud si tooltip může získat svůj obsah. Zadejte některé z nastavení content/contentElm/contentFromAttribute v konstruktoru.');
		}
	// end

	// přidám styly
	if (this.options.css) {
		var place2put = (typeof document.head === "object") ? document.head : document.body; // hack for IE 8
		var alreadyAdded = place2put.querySelector("[name='jak_tooltip']");

		if (!alreadyAdded) {
			var elmStyle = document.createElement("link");
			elmStyle.href = this.options.css;
			elmStyle.name = 'jak_tooltip';
			elmStyle.setAttribute('rel', 'stylesheet');

			if (place2put === document.body) {
				place2put.insertBefore(elmStyle, place2put.children[0]);
			} else {
				place2put.appendChild(elmStyle);
			}
		}
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
};

/**
 * Funkce pro zobrazení tooltipu
 * Pokud ještě není domReady, tooltip se zobrazí až na onDomReady (kvůli správnému výpočtu odscrollování).
 * Pokud už je domReady, tooltip se zobrazí až za showDelay.
 *
 * @param {string/node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Easy_Tooltip.prototype.show = function(dispatcherElm) {
	this._showOnDomReady(null, dispatcherElm);
};

/**
 * Funkce rozhoduje, kdy zobrazit tooltip (na onDomReady/za stanovený čas/ihned)
 *
 * @param {string/node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Easy_Tooltip.prototype._showOnDomReady = function(e, dispatcherElm) {
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
};

/**
 * Funkce zavolá vybuildění tooltipu, jeho napozicování a vloží jej do stránky
 *
 * @param {string/node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Easy_Tooltip.prototype._showTooltip = function(e, dispatcherElm) {
	var that = this;
	// pokud se čeká na skrytí nebo zobrazení tooltipu, vymažu timeout
	this._clearDelays();

	// pokusím se najít element, který spustil tooltip
		dispatcherElm = JAK.gel(dispatcherElm);
		if(!dispatcherElm) {
			throw new Error('[JAK.Tooltip] Element, který spustil tooltip, není definován nebo jej nelze nalézt. Pravděpodobně je špatně zadán parametr elm ve volání funkce JAK.Tooltip.show(elm).');
		}

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

	// --- navěsím událost pro window resize
	var changePosition = function() {
		that._setTooltipPosition(dispatcherElm);
	}

	var resized = function() {
		setTimeout(changePosition, 200);
	}

	JAK.Events.addListener(window, 'resize', window, resized);
};

/**
 * Funkce zajistí skrytí tooltipu ihned nebo za stanovený čas
 */
JAK.Easy_Tooltip.prototype._hide = function (e, elm) {

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
JAK.Easy_Tooltip.prototype.hide = function() {
	// pokud se čeká na skrytí nebo zobrazení tooltipu, vymažu timeout
	this._clearDelays();
	if (this.dom.tooltip) {
		this._hideTooltip();
	}
};

/**
 * Funkce odstraní tooltip ze stránky
 */
JAK.Easy_Tooltip.prototype._hideTooltip = function(e) {
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
};

/**
 * Funkce vytvoří nový tooltip (much more easier way)
 *
 * @param {string} content - Obsah tooltipu (např. "5 litrů je dost")
 */
JAK.Easy_Tooltip.prototype._buildNewTooltip = function(content) {
	var arrow_size = (typeof this.options.arrowSize === "number") ? this.options.arrowSize : 10;

	this._saved.arrow = arrow_size;
	this.dom.tooltip = document.createElement("div");
	this.dom.tooltip.innerHTML = content;
	this.dom.tooltip.className = 'jak_tooltip';

	if (this.options.width === "auto") {
		this.dom.tooltip.style.whiteSpace = "nowrap";
	}

	if (this.options.tooltipId) {
		this.dom.tooltip.id = this.options.tooltipId;
	}

	var width = this.options.width;
	var type = typeof width;

	if (type === "number") {
		this.dom.tooltip.style.width = width + 'px';
	} else if (type === "string" && width !== 'auto') {
		this.dom.tooltip.style.width = width;
	}

	document.body.appendChild(this.dom.tooltip);
};

/**
 * Vytvoří tooltip
 *
 * @param {node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Easy_Tooltip.prototype._buildTooltip = function(dispatcherElm) {

	// uložím si obsah tooltipu pokud je zadán nebo se má vytáhnout z atributu (pokud ho tahám jako element, vyřeším to později)
	var content = this.options.content;
	if (this.options.contentFromAttribute && dispatcherElm) {
		content = dispatcherElm.getAttribute(this.options.contentFromAttribute);
	}

	this._buildNewTooltip(content);

	// při volbě "noHideOverTooltip" schovávat tooltip při mouseout události
	if (this.options.noHideOverTooltip) {
		JAK.Events.addListener(this.dom.tooltip, "mouseout", this, "_hide");
	}
};

/**
 * Zjistí rozměry a pozice elementů
 *
 * @param {node reference} dispatcherElm - Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Easy_Tooltip.prototype._getPositions = function(dispatcherElm) {
	// pozice spouštěcího elementu
	var pos = dispatcherElm.getBoundingClientRect();
	var parent_pos = this.options.parentElm.getBoundingClientRect();
	var _dispatcherPosition = JAK.DOM.getPosition(dispatcherElm, this.options.parentElm);

	var elm_height = dispatcherElm.offsetHeight;

	var dispatcherDimensions = {
		'width': dispatcherElm.offsetWidth,
		'height': elm_height,
		'top': _dispatcherPosition.top,
		'left': _dispatcherPosition.left,
		'bottom': _dispatcherPosition.top + elm_height
	};

	// vypočítám si absolutní souřadky středu spouštěcího elementu
	var dispatcherCenter = {
		'top': _dispatcherPosition.top + dispatcherDimensions.height/2,
		'left': _dispatcherPosition.left + dispatcherDimensions.width/2
	};

	var tooltipDimensions = {
		'width': this.dom.tooltip.offsetWidth,
		'height': this.dom.tooltip.offsetHeight
	};

	var viewportDimensions = {
		'width': document.documentElement.clientWidth,
		'height': document.documentElement.clientHeight
	};

	var dispatcherViewport = {
		'top': pos.top,
		'left': pos.left,
		'bottom': pos.top + elm_height,
		'right': pos.left + dispatcherDimensions.width
	};

	var parentViewport = {
		'top': parent_pos.top,
		'left': parent_pos.left
	};

	return {
		'dispatcher': dispatcherDimensions,
		'dispatcherCenter': dispatcherCenter,
		'tooltipDimensions': tooltipDimensions,
		'viewportDimensions': viewportDimensions,
		'dispatcherViewport': dispatcherViewport,
		'parentViewport': parentViewport
	};
};

/**
 * Vypočítá pozice elementu pro absolutní pozicování vůči parent elm.
 *
 * @param {dict} calc - dictionary s rozměry a pozicemi
 * @param {string} position - požadované umístění ('top' / 'right' / 'bottom' / 'left')
 */
JAK.Easy_Tooltip.prototype._calcTooltipPos = function(calc, position) {

	var dispatcherDimensions = calc.dispatcher;
	var dispatcherCenter = calc.dispatcherCenter;
	var tooltipDimensions = calc.tooltipDimensions;

	var tooltipRelativeLeft = this.options.left;
	var tooltipRelativeTop = this.options.top;
	var offset = this.options.offset;

	var tooltipLeft = 0;
	var tooltipRight = 0;
	var tooltipTop = 0;
	var tooltipBottom = 0;

	if (position === 'bottom') {
		tooltipTop = dispatcherDimensions.bottom + tooltipRelativeTop + this._saved.arrow + offset;
		tooltipBottom = tooltipTop + tooltipDimensions.height;

	} else if (position === 'top') {
		tooltipTop = dispatcherDimensions.top - tooltipDimensions.height + tooltipRelativeTop - this._saved.arrow - offset;
		tooltipBottom = tooltipTop + tooltipDimensions.height;

	} else if (position === 'left') {
		tooltipLeft = dispatcherCenter.left - dispatcherDimensions.width/2 - tooltipDimensions.width + tooltipRelativeLeft - this._saved.arrow - offset;

	} else if (position === 'right') {
		tooltipLeft = dispatcherDimensions.left + dispatcherDimensions.width + this._saved.arrow + offset + tooltipRelativeLeft;
		tooltipRight = tooltipLeft + tooltipDimensions.width;
	}

	return {
		'left': tooltipLeft,
		'right': tooltipRight,
		'top': tooltipTop,
		'bottom': tooltipBottom
	};
};

/**
 * Provede korekci pozice tak, aby šel tooltip vykreslit
 *
 * @param {dict} calc - dictionary s rozměry a pozicemi
 */
JAK.Easy_Tooltip.prototype._corrections = function(calc, dispatcherElm) {

	var dispatcherCenter = calc.dispatcherCenter;
	var tooltipDimensions = calc.tooltipDimensions;
	var viewport = calc.viewportDimensions;
	var real_dispatcher = calc.dispatcherViewport;
	var real_parent = calc.parentViewport;

	// aktuální odscrollování
	var scrollOffset = JAK.DOM.getScrollPos();

	// zjistím, jestli se tooltip vejde do defaultní pozice. Pokud ne, tak pozici invertuju
	var defaultPosition = this.options.defaultPosition;
	var actualPosition = defaultPosition;
	var tooltipRelativeLeft = this.options.left;
	var tooltipRelativeTop = this.options.top;

	if ( !this.options.forceDefaultPosition ) { // invertuju pouze v případě, že nemám pozici "nařízenou" napevno
		var calc_pos = this._calcTooltipPos(calc, defaultPosition);

		if (defaultPosition === 'bottom') {
			var tooltip_bottom = real_parent.top + calc_pos.bottom;

			if (tooltip_bottom > viewport.height) {
				actualPosition = 'top';
				tooltipRelativeTop = (tooltipRelativeTop === 0) ? 0 : -tooltipRelativeTop;
			}

		} else if (defaultPosition === 'top') {
			var tooltip_top = real_parent.top + calc_pos.top;

			if (tooltip_top < 0) {
				actualPosition = 'bottom';
				tooltipRelativeTop = (tooltipRelativeTop === 0) ? 0 : -tooltipRelativeTop;
			}

		} else if (defaultPosition === 'left') {
			var left_pos = real_parent.left + calc_pos.left;

			if (left_pos < 0) {
				actualPosition = 'right';
				tooltipRelativeLeft = (tooltipRelativeLeft === 0) ? 0 : -tooltipRelativeLeft;
			}

		} else if (defaultPosition === 'right') {
			var right_pos = real_parent.left + calc_pos.right;

			if (right_pos > viewport.width) {
				actualPosition = 'left';
				tooltipRelativeLeft = (tooltipRelativeLeft === 0) ? 0 : -tooltipRelativeLeft;
			}
		}
	}

	var tooltipLeft = 0;
	var tooltipTop = 0;

	// Is here enough space?
	if (actualPosition == 'bottom' || actualPosition == 'top') {
		tooltipLeft = dispatcherCenter.left - tooltipDimensions.width/2;
		var delta = viewport.width - (tooltipLeft + tooltipRelativeLeft + tooltipDimensions.width);

		if (delta < 0) {
			tooltipLeft += delta;
		}
	} else {
		tooltipTop = dispatcherCenter.top - tooltipDimensions.height/2;
	}

	return {
		'actual_position': actualPosition,
		'relative_top': tooltipRelativeTop,
		'relative_left': tooltipRelativeLeft,
		'left': tooltipLeft,
		'top': tooltipTop
	};
};

/**
 * Napozicuje tooltip
 *
 * @param {node reference} dispatcherElm Povinný parametr. Element, který spustil zobrazení tooltipu (k němu bude tooltip pozicován)
 */
JAK.Easy_Tooltip.prototype._setTooltipPosition = function(dispatcherElm) {
	// zjistím si rozměry a pozice pro další výpočty
	var calc = this._getPositions(dispatcherElm);

	// provede korekci pozic, aby se vešel celý
	var correction = this._corrections(calc, dispatcherElm);
	var calc_pos = this._calcTooltipPos(calc, correction.actual_position);

	if (typeof this.options.userPosFunction === "function") {
		var obj = this.options.userPosFunction(calc, correction);
		for (var p in optObj) {
			if (p in correction) {
				correction[p] = obj[p];
			}
		}
	}

	// provede korekci pozic, aby se vešel celý
	var actualPosition = correction.actual_position;

	// zjistím souřadnice tooltipu
	var tooltipLeft = correction.left;
	var tooltipTop = correction.top;

	this.dom.tooltip.className = this.dom.tooltip.classList[0];
	this.dom.tooltip.classList.add('_' + actualPosition);

	if (actualPosition == 'bottom') {
		tooltipTop = calc_pos.top;

	} else if (actualPosition == 'top') {
		tooltipTop = calc_pos.top;

	} else if (actualPosition == 'left') {
		tooltipLeft = calc_pos.left;

	} else if (actualPosition == 'right') {
		tooltipLeft = calc_pos.left;
	}

	// nastavím souřadnice tooltipu
	this.dom.tooltip.style.left = tooltipLeft + correction.relative_left + 'px';
	this.dom.tooltip.style.top = tooltipTop + correction.relative_top + 'px';
};

/**
 * Destruktor třídy
 */
JAK.Easy_Tooltip.prototype.$destructor = function() {
	this.hide();
	JAK.Events.removeListeners(this.ec);
};

/**
 * Vynuluje probíhající timeout pro zobrazení/skrytí tooltipu
 */
JAK.Easy_Tooltip.prototype._clearDelays = function() {
	if (this.showHideTimeout) {
		clearTimeout(this.showHideTimeout);
	}
};
