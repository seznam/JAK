/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview kalendar
 * @version 3.0
 * @author zara
 */   

/**
 * @class Kalendar, zpravidla neni treba rucne instantializovat
 * @group jak-widgets
 * @signal datepick
 * @signal calendarShow
 * @signal calendarHide
 */
JAK.Calendar = JAK.ClassMaker.makeClass({
	NAME: "JAK.Calendar",
	VERSION: "3.0",
	IMPLEMENT: JAK.ISignals
});

/**
 * @param {object} optObj asociativni pole parametru
 * @param {string} [optObj.defaultFormat="j.n.Y"] formatovaci retezec pro datum, pokud je zadavacich poli pro datum vice (pro datum a cas zvlast), pak formatovani je nutno take psat jako retezce v poli
 * @param {string} [optObj.today="Dnes"] retezec oznacujici dnesek
 * @param {int} [optObj.rollerDelay=200] cas (msec), po kterem se zobrazi roletky na vyber mesice/roku
 * @param {bool} [optObj.lockWindow=false] ma-li se okno kalendare branit vytazeni mimo okno prohlizece (nahore, vlevo)
 * @param {string[]} [optObj.monthNames] pole nazvu mesicu
 * @param {string[]} [optObj.monthNamesShort] pole zkracenych (tripismennych) nazvu mesicu
 * @param {string[]} [optObj.dayNames] pole nazvu dnu v tydnu
 * @param {object} [optObj.translations] objekt s preklady ostatnich textu v kalendari
 * @param {string} [optObj.translations.holdForMenu] preklad "podrž pro menu"
 * @param {string} [optObj.translations.prevYear] preklad "Předchozí rok"
 * @param {string} [optObj.translations.prevMonth] preklad "Předchozí měsíc"
 * @param {string} [optObj.translations.nextMonth] preklad "Následující měsíc"
 * @param {string} [optObj.translations.nextYear] preklad "Následující rok"
 * @param {string} [optObj.translations.helpBtn] preklad "Nápověda"
 * @param {string} [optObj.translations.help] preklad alertu s napovedou
 * @param {string} [optObj.translations.close] preklad "Zavřít kalendář"
 * @param {string} [optObj.translations.pickDate] preklad "Vyberte datum"
 */
JAK.Calendar.prototype.$constructor = function(optObj) {
	this.options = {
		defaultFormat: ["j.n.Y"],
		today: "Dnes",
		monthNames: Date.prototype._monthNames,
		monthNamesShort: Date.prototype._monthNamesShort,
		dayNames: Date.prototype._dayNamesShort,
		rollerDelay: 200,
		pickTime: false,
		lockWindow: false,
		translations: {
			holdForMenu: "(podrž pro menu)",
			prevYear: "Předchozí rok",
			prevMonth: "Předchozí měsíc",
			nextMonth: "Následující měsíc",
			nextYear: "Následující rok",
			helpBtn: "Nápověda",
			help: "Výběr data:\n - Použijte «, » tlačítka pro vybrání roku\n - Použijte ‹, › tlačítka pro vybrání měsíce\n - Menu pro rychlejší výběr se zobrazí po delším stisku výše uvedených tlačítek\n - Stisknutím mezerníku zvolíte dnešní datum",
			close: "Zavřít kalendář",
			pickDate: "Vyberte datum"
		}
	}
	//prekopirovani zadanych options pres defaultni
	for (var p in optObj) { 
		if (p == 'defaultFormat') {
			if (!(optObj[p] instanceof Array)) {
				optObj[p] = [optObj[p]];
			}
			this.options[p] = optObj[p];
		} else if (p == 'translations') {
			for (var k in optObj[p]) {
				this.options[p][k] = optObj[p][k];
			}
		} else
			this.options[p] = optObj[p];
	}
	this._dom = {};
	this._days = [];
	this._rollers = [];
	this.ec = [];
	this._visible = false;

	this.ec.push(JAK.Events.addListener(document, "keydown", this, "_handleKey"));
	this.ec.push(JAK.Events.addListener(document, "mousedown", this, "_handleDown"));
	this.ec.push(JAK.Events.addListener(window, "unload", this, "$destructor"));
	this.ec.push(JAK.Events.addListener(document, "mouseup", this, "_handleUp"));
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
JAK.Calendar.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

/**
 * Staticka funkce, ktera provaze ovladaci prvek s kalendarem a inputem
 * @static 
 * @param {Object} calendar instance kalendare
 * @param {Object} clickElm dom node, po jehoz kliknuti se kalendar objevi
 * @param {Array} pole targetElm dom node (typicky input[type="text"]), jehoz vlastnost .value kalendar ovlada (vetsinou jen jeden, nicmene muze jich byt 2 nebo 3 pro oddeleni casu)
 */
JAK.Calendar.manage = function(calendar, clickElm, targetElm) { /* setup calendar for two elements */
	var callback = function() {
		clickElm.focus();
		for (var i = 0; i < targetElm.length; i++) {
			JAK.gel(targetElm[i]).value = arguments[i] ? arguments[i] : ''; 
		}
	}
	var click = function(e,elm) { 
		var pos = JAK.DOM.getBoxPosition(clickElm);
		var x = pos.left;
		var y = pos.top + clickElm.offsetHeight + 1;
		clickElm.blur();
		calendar.pick(x,y,JAK.gel(targetElm[0]).value,callback); 
	}
	calendar.ec.push(JAK.Events.addListener(clickElm, "click", window, click));
}

/**
 * Doporucena jedina funkce na tvorbu kalendare;
 * vytvori ovladaci prvek (obrazek | button), ktery po kliknuti zobrazi kalendar, jez ovlada zadany input
 * @param {String} imageUrl URL obrazku, ktery se pouzije. Pokud je false, namisto obrazku vznikne button
 * @param {String} label pokud je vytvaren obrazek, toto je jeho alt text. Pokud je vytvaren button, 
 *   toto je jeho popisek
 * @param {Object} optObj asociativni pole parametru pro kalendar
 * @param {String} id1...idN libovolne mnozstvi idecek pro inputy, na ktere chceme aplikovat kalendar, popr. pole idecek, pokud ma kalendar renderovat datum do vice inputu (datum, hodiny, minuty)
 * @static 
 */
JAK.Calendar.setup = function(imageUrl, label, optObj) { /* setup calendar for a variable amount of text fields */
	var c = new JAK.Calendar(optObj);
	for (var i=3;i<arguments.length;i++) {
		var click = false;
		var input = arguments[i];
		//zpolovani inputu, pokud neni
		if (!(input instanceof Array)) {
			input = [JAK.gel(input)];
		}
		
		click = JAK.Calendar._createButton(imageUrl, label);
		var lastInput = JAK.gel(input[input.length-1]); 
		lastInput.parentNode.insertBefore(click,lastInput.nextSibling);
		JAK.Calendar.manage(c,click,input);
	}
	return c;
}
/**
 * metoda vytvari budto butonek nebo obrazek pokud je zadano url
 * @static
 */ 
JAK.Calendar._createButton = function(imageUrl, label) {
	if (imageUrl) {
		click = JAK.mel("img", {className:"cal-launcher"} ,{cursor:"pointer"});
		click.src = imageUrl;
		click.alt = label;
		click.title = label;
	} else {
		click = JAK.cel("input", "cal-launcher");
		click.type = "button";
		click.value = label;
	}
	return click;
		
}

/**
 * Naplni inputy zformatovanym vybranym datem
 * @param {date} date Vybrane datum
 */
JAK.Calendar.prototype.useDate = function(date) {
	if (this.options.pickTime) {
		date.setHours(this._dom.hour.value);
		date.setMinutes(this._dom.minute.value);
	}

	var results = [];
	for (var i=0;i<this.options.defaultFormat.length;i++) {
		var str = date.format(this.options.defaultFormat[i]);
		results.push(str);
	}
	this.callback.apply(null, results);
}

/**
 * Porovna dva datumy, shoduji-li se v roce && mesici && dnu
 * @param {Date} d1 prvni datum k porovnani
 * @param {Date} d2 druhe datum k porovnani
 * @return true|false
 */
JAK.Calendar.prototype.equalDates = function(d1,d2) { /* are two dates the same (truncated to days) ? */
	return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate();
}

JAK.Calendar.prototype._handleDown = function(e,elm) {
	if (!this._visible) { return; }
	this._hide();
}

JAK.Calendar.prototype._cancelDown = function(e,elm) {
	JAK.Events.stopEvent(e);
}

JAK.Calendar.prototype._handleUp = function(e,elm) {
	if (this.eventMove)	{
		JAK.Events.removeListener(this.eventMove);
		this.eventMove = false;
	}
	
	if (JAK.Calendar.Button._activeElement) {
		JAK.DOM.removeClass(JAK.Calendar.Button._activeElement,"mousedown");
		JAK.Calendar.Button._activeElement = false;
	}
	this._timer = false;
	for (var i=0;i<this._rollers.length;i++) {
		this._rollers[i]._hide();
	}
}

JAK.Calendar.prototype._handleMove = function(e,elm) {
	if (!this._visible) { return; }
	this._removeRanges();

	JAK.Events.cancelDef(e);
	var dx = e.clientX - this._clientX;
	var dy = e.clientY - this._clientY;
	
	var pos = JAK.DOM.getBoxPosition(this._dom.container);
	var newx = pos.left+dx;
	var newy = pos.top+dy;
	if (this.options.lockWindow && (newx < 0 || newy < 0)) { return; }
	
	this._dom.container.style.left = newx+"px";
	this._dom.container.style.top = newy+"px";
	var pos = JAK.DOM.getBoxPosition(this._dom.container);
	this._clientX = e.clientX;
	this._clientY = e.clientY;
}

JAK.Calendar.prototype._removeRanges = function() {
	var selObj = false;
	if (document.getSelection && !JAK.Browser.client != "gecko") { selObj = document.getSelection(); }
	if (window.getSelection) { selObj = window.getSelection(); }
	if (document.selection) { selObj = document.selection; }
	if (selObj) {
		if (selObj.empty) { selObj.empty(); }
		if (selObj.removeAllRanges) { selObj.removeAllRanges(); }
	}
}

JAK.Calendar.prototype._dragDown = function(e,elm) {
	JAK.Events.cancelDef(e);
	this.eventMove = JAK.Events.addListener(document,"mousemove",this,"_handleMove");

	this._clientX = e.clientX;
	this._clientY = e.clientY;
}

/**
 * Otevre kalendar na danych souradnicich a nastavi ho na nejake datum
 * @param {Integer} x x-ova souradnice leveho horniho rohu kalendare
 * @param {Integer} y y-ova souradnice leveho horniho rohu kalendare
 * @param {String} date datum v takrka libovolnem formatu
 * @param {Function} callback funkce, jez bude zavolana po vybrani data 
     (s jedinym parametrem, stringem - vybranym datumem)
 */
JAK.Calendar.prototype.pick = function(x,y,date,callback) { 
	this._draw();
	this._dom.container.style.left = x+"px";
	this._dom.container.style.top = y+"px";
	/* analyze date */
	
	this.selectedDate = new Date();
	if (date) {
		this.selectedDate = JAK.Calendar.parseDate(date instanceof Array ? date[0] : date);
	} /* date parsing */
	this.currentDate = new Date(this.selectedDate);
	this.currentDate.setDate(1);
	this.callback = callback;
	this._switchTo();
}

JAK.Calendar.prototype._draw = function() { /* make calendar appear */
	if (!("container" in this._dom)) {
		this._buildDom();
		document.body.appendChild(this._dom.container);
	}
	this._show();
}

JAK.Calendar.prototype._help = function() {
	alert(this.options.translations.help);
}

JAK.Calendar.prototype._buildDom = function() { /* create dom elements, link them together */
	var translations = this.options.translations,
		dom = this._dom;

	dom.container = JAK.mel("div", null, {position:"absolute"});
	dom.content = JAK.cel("div", "cal-content");
	dom.table = JAK.cel("table");
	dom.thead = JAK.cel("thead");
	dom.tbody = JAK.cel("tbody");
	dom.tfoot = JAK.cel("tfoot");
	dom.table.cellSpacing = 0;
	dom.table.cellPadding = 0;
	
	if (JAK.Browser.client == "ie") {
		dom.iframe = JAK.mel("iframe", null, {position:"absolute",left:"0px",top:"0px",zIndex:1});
		dom.content.style.zIndex = 2;
		dom.content.style.position = 'relative';
		JAK.DOM.append([dom.container,dom.iframe,dom.content],[dom.content,dom.table]);
	} else {
		JAK.DOM.append([dom.container,dom.content],[dom.content,dom.table]);
	} 
	JAK.DOM.append([dom.table,dom.thead,dom.tbody,dom.tfoot]);
	
	/* top part */
	var r1 = JAK.cel("tr");
	var r2 = JAK.cel("tr");
	var r3 = JAK.cel("tr");
	JAK.DOM.append([dom.thead,r1,r2,r3]);
	
	var help = new JAK.Calendar.Nav(this, "?", translations.helpBtn, this._help);
	dom.move = JAK.cel("td", "cal-title");
	var close = new JAK.Calendar.Nav(this,"&times;",translations.close,this._hide);
	dom.move.colSpan = 6;
	JAK.DOM.append([r1,help.td,dom.move,close.td]);

	var x =" " + translations.holdForMenu;
	var buttonLabels = ["&laquo;","&lsaquo;",this.options.today,"&rsaquo;","&raquo;"];
	var buttonStatuses = [translations.prevYear+x,translations.prevMonth+x,this.options.today,translations.nextMonth+x,translations.nextYear+x];
	var buttonMethods = [this._yearB,this._monthB,this._monthC,this._monthF,this._yearF];
	dom.buttons = [];
	for (var i=0;i<buttonLabels.length;i++) {
		var button = new JAK.Calendar.Nav(this,buttonLabels[i],buttonStatuses[i],buttonMethods[i]);
		JAK.DOM.addClass(button.td,"cal-button cal-nav");
		dom.buttons.push(button.td);
		r2.appendChild(button.td);
	}
	dom.buttons[2].colSpan = 4;
	
	var wk = JAK.cel("td", "cal-dayname cal-wn");
	wk.innerHTML = "wk";
	r3.appendChild(wk);
	
	for (var i=0;i<this.options.dayNames.length;i++) {
		var day = JAK.cel("td", "cal-dayname");
		day.innerHTML = this.options.dayNames[i];
		r3.appendChild(day);
		if (i > 4) { JAK.DOM.addClass(day,"cal-weekend"); }
	}
	
	/* middle part */
	dom.rows = [];
	for (var i=0;i<42;i++) { /* magic number of days. */
		var day = new JAK.Calendar.Day(this);
		this._days.push(day);
		if (!(i % 7)) {
			var tr = JAK.cel("tr");
			dom.rows.push(tr);
			dom.tbody.appendChild(tr);
			this.ec.push(JAK.Events.addListener(tr,"mouseover",this,"_overRef"));
			this.ec.push(JAK.Events.addListener(tr,"mouseout",this,"_outRef"));
			var wk = JAK.cel("td", "cal-wn cal-day");
			tr.appendChild(wk);
		}
		JAK.DOM.addClass(day.td,"cal-day");
		tr.appendChild(day.td);
		if (i % 7 > 4) { JAK.DOM.addClass(day.td,"cal-weekend"); }
	}
	
	/* bottom part */
	var tr = JAK.cel("tr");
	dom.status = JAK.cel("td", "cal-status");
	dom.status.colSpan = this.options.pickTime ? 6 : 8;
	JAK.DOM.append([this._dom.tfoot,tr],[tr,dom.status]);
	dom.status.innerHTML = translations.pickDate;
	//generovani casovych inputu
	if (this.options.pickTime) {
		var td = JAK.cel("td", "cal-time");
		td.colSpan = 2;
		
		var inputHour = JAK.cel('input');
		inputHour.type = 'text';
		dom.hour = inputHour;
		
		var sep = JAK.ctext(':');
		
		var inputMinute = JAK.cel('input');
		inputMinute.type = 'text';
		dom.minute = inputMinute;
		
		JAK.DOM.append([td, inputHour], [td, sep], [td, inputMinute],[tr,td]);
		
		this.ec.push(JAK.Events.addListener(dom.hour,"keydown", this,"_keyDown"));
		this.ec.push(JAK.Events.addListener(dom.minute,"keydown", this,"_keyDown"));
	}
	
	
	/* rollers */
	for (var i=0;i<dom.buttons.length;i++) {
		if (i == 2) { continue; }
		var type = (i == 1 || i == 3 ? 0 : (i < 2 ? -1 : 1));
		var roller = new JAK.Calendar.Roller(this,dom.buttons[i],type,i > 2);
		this._rollers.push(roller);
	}
	
	/* misc */
	this.ec.push(JAK.Events.addListener(dom.move,"mousedown",this,"_dragDown"));
	this.ec.push(JAK.Events.addListener(dom.status,"mousedown",this,"_dragDown"));
	this.ec.push(JAK.Events.addListener(dom.container,"mousedown",this,"_cancelDown"));
}
/**
 * zavolano na enter v polich pro cas
 */ 
JAK.Calendar.prototype._keyDown = function(e, elm) {
	if (e.keyCode == 13) {
		if (this.callback) {
			this.useDate(this.selectedDate);
		}
		this.makeEvent("datepick");
		this._hide();
	}
}

JAK.Calendar.prototype._handleKey = function(e,elm) {
	if (!this._visible) { return; }
	if (e.keyCode == 32) { this._monthC(); }
	if (e.keyCode == 27) { this._hide(); }
}

JAK.Calendar.prototype._overRef = function(e,elm) {
	JAK.DOM.addClass(elm,"mouseover");	
}
	
JAK.Calendar.prototype._outRef = function(e,elm) {
	JAK.DOM.removeClass(elm,"mouseover");
}
	
JAK.Calendar.prototype._hide = function() {
	this._dom.container.style.display = "none";
	this._visible = false;
	this.makeEvent('calendarHide');
}

JAK.Calendar.prototype._show = function() {
	this.makeEvent('calendarShow');
	this._dom.container.style.display = "block";
	this._visible = true;
}

JAK.Calendar.prototype._getWeekNumber = function(date) { /* wtf code to get week number */
	var d=new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0);
	var DoW=d.getDay();
	d.setDate(d.getDate()-(DoW+6)%7+3);
	var ms=d.valueOf();
	d.setMonth(0);
	d.setDate(4);
	return Math.round((ms-d.valueOf())/(7*86400000))+1;
}

JAK.Calendar.prototype._switchTo = function() { /* switch to a given date */
	for (var i=0;i<this._dom.rows.length;i++) { /* show all rows */
		this._dom.rows[i].style.display = ""; 
	}
	var tmpDate = new Date(this.currentDate);
	tmpDate.setDate(1);
	/* subtract necessary amount of days */
	var oneDay = 1000*60*60*24;
	var weekIndex = (tmpDate.getDay() + 6) % 7; /* index of day in week */
	if (weekIndex) { tmpDate.setTime(tmpDate.getTime()-weekIndex*oneDay); }
	
	var index = 0;
	var today = new Date();
	var lastVisible = -1;
	for (var row=0;row<6;row++) {
		var wn = this._dom.rows[row].firstChild;
		wn.innerHTML = this._getWeekNumber(tmpDate);
		for (var col=0;col<7;col++) {
			var day = this._days[index];
			day.date = new Date(tmpDate);
			day.redraw(today);
			tmpDate.setTime(tmpDate.getTime()+oneDay);
			if (tmpDate.getMonth() == this.currentDate.getMonth() && lastVisible == -1) { lastVisible = 0; }
			if (tmpDate.getMonth() != this.currentDate.getMonth() && lastVisible == 0) { lastVisible = row+1; }
			index++;
		}
	}
	for (var i=lastVisible;i<6;i++) { this._dom.rows[i].style.display = "none"; }
	
	//pokud resim cas, tak doplnim inputy
	if (this.options.pickTime) {
		this._dom.hour.value = this.selectedDate.getHours().toString().lpad();
		this._dom.minute.value = this.selectedDate.getMinutes().toString().lpad();
	}
	
	this._dom.move.innerHTML = this.options.monthNames[this.currentDate.getMonth()] + " "+this.currentDate.getFullYear();
	if (JAK.Browser.client == "ie") { /* adjust iframe size */
		this._dom.iframe.style.width = this._dom.content.offsetWidth + "px";
		this._dom.iframe.style.height = this._dom.content.offsetHeight + "px";
	}
}

JAK.Calendar.prototype._yearF = function(e,elm) { /* year forward */
	this.currentDate.setFullYear(this.currentDate.getFullYear()+1);
	this._switchTo();
}

JAK.Calendar.prototype._yearB = function(e,elm) { /* year back */
	this.currentDate.setFullYear(this.currentDate.getFullYear()-1);
	this._switchTo();
}

JAK.Calendar.prototype._monthB = function(e,elm) { /* month back */
	this.currentDate.setMonth((this.currentDate.getMonth()+11)%12);
	if (this.currentDate.getMonth() == 11) { this.currentDate.setFullYear(this.currentDate.getFullYear()-1); }
	this._switchTo();
}

JAK.Calendar.prototype._monthF = function(e,elm) { /* month forward */
	this.currentDate.setMonth((this.currentDate.getMonth()+1)%12);
	if (this.currentDate.getMonth() == 0) { this.currentDate.setFullYear(this.currentDate.getFullYear()+1); }
	this._switchTo();
}

JAK.Calendar.prototype._monthC = function(e) { /* year forward */
	this.currentDate = new Date();
	this.currentDate.setDate(1);
	this._switchTo();
}

/**
 * staticka metoda parsujici datumy z predaneho retezce 
 * @static
 * @param {string} date
 * @return Date
 */
JAK.Calendar.parseDate = function(date) {
	var selectedDate = new Date();

	var separators = "[\-/\\\\:.]"
	var chars = "[0-9]"
	var patterns = [
		"^ *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2})",
		"^ *("+chars+"{4}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2})",
		"^ *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{4})"
	];
	var datePattern = "( +"+chars+"{1,2})?("+separators+chars+"{1,2})?("+separators+chars+"{1,2})? *$";
	var r = false;
	var index = 0;
	while (!result && index < patterns.length) {
		var re = new RegExp(patterns[index] + datePattern);
		//console.log(re.toString());
		var result = re.exec(date);
		index++;
	}
	if (result) { /* something found */
		selectedDate = new Date(0);
		var a = Math.round(parseFloat(result[1]));
		var b = Math.round(parseFloat(result[2]));
		var c = Math.round(parseFloat(result[3]));
		var yearIndex = -1;
		if (result[1].length == 4) {
			yearIndex = 0;
		} else if (result[3].length == 4) {
			yearIndex = 2;
		} else {
			if (a > 31) {
				a = a + (a > selectedDate.getFullYear()-2000 ? 1900 : 2000);
				yearIndex = 0;
			} else {
				c = c + (c > selectedDate.getFullYear()-2000 ? 1900 : 2000);
				yearIndex = 2;
			}
		}

		if (yearIndex == 0) { /* year at the beginning */
			selectedDate.setFullYear(a);
			selectedDate.setDate(1);
			var max = Math.max(b,c);
			var min = Math.min(b,c);
			if (max > 13) {
				selectedDate.setMonth(min-1);
				selectedDate.setDate(max);
			} else {
				selectedDate.setMonth(b-1);
				selectedDate.setDate(c);
			}
		} else if (yearIndex == 2) { /* year at the end */
			selectedDate.setFullYear(c);
			var max = Math.max(a,b);
			var min = Math.min(a,b);
			if (max > 13) {
				selectedDate.setMonth(min-1);
				selectedDate.setDate(max);
			} else {
				selectedDate.setMonth(b-1);
				selectedDate.setDate(a);
			}
		} /* year at the end */
		
		/* time */
		if (result[4]) {
			var h = parseInt(result[4].match(/[0-9]+/)[0],10);
			var m = (result[5] ? parseInt(result[5].match(/[0-9]+/)[0],10) : 0);
			var s = (result[6] ? parseInt(result[6].match(/[0-9]+/)[0],10) : 0);
			selectedDate.setHours(h);
			selectedDate.setMinutes(m);
			selectedDate.setSeconds(s);
		}
	} /* found parsable data */

	return selectedDate;
}

/* --------------------- Calendar.Button, obecny buttonek ---------------------- */
/**
 * @class
 * @private
 * @group jak-widgets
 */
JAK.Calendar.Button = JAK.ClassMaker.makeInterface({
	NAME: "JAK.Calendar.Button",
	VERSION: "2.0"
});

JAK.Calendar.Button._activeElement = false;

JAK.Calendar.Button.prototype._over = function(e,elm) {
	/* mouseover pridava tridu jen za predpokladu, ze neni nic zmackleho */
	if (!JAK.Calendar.Button._activeElement) {
		JAK.DOM.addClass(elm, "mouseover");	
	}
}

JAK.Calendar.Button.prototype._out = function(e,elm) {
	JAK.DOM.removeClass(elm, "mouseover");
}

JAK.Calendar.Button.prototype._down = function(e,elm) {
	JAK.Events.cancelDef(e);
	JAK.Calendar.Button._activeElement = elm;
	JAK.DOM.addClass(elm, "mousedown");	
}

JAK.Calendar.Button.prototype._up = function(e,elm) {
}

JAK.Calendar.Button.prototype.addOverEvents = function(elm) {
	this.calendar.ec.push(JAK.Events.addListener(elm,"mouseover",this,"_over"));
	this.calendar.ec.push(JAK.Events.addListener(elm,"mouseout",this,"_out"));
}

JAK.Calendar.Button.prototype.addDownEvents = function(elm) {
	this.calendar.ec.push(JAK.Events.addListener(elm,"mousedown",this,"_down"));
}

/* ---------------------- Calendar.Nav, navigacni buttonek -------------------------- */
/**
 * @class
 * @private
 * @augments JAK.Calendar.Button
 */
JAK.Calendar.Nav = JAK.ClassMaker.makeClass({
	NAME: "JAK.Calendar.Nav",
	VERSION: "2.0",
	IMPLEMENT: JAK.Calendar.Button
});

JAK.Calendar.Nav.prototype.$constructor = function(calendar, label, status, method) {
	this.td = JAK.cel("td", "cal-button");
	this.td.innerHTML = label;
	this.status = status;
	this.calendar = calendar;
	this.method = method;

	this.calendar.ec.push(JAK.Events.addListener(this.td, "mouseover", this, "_changeStatus"));
	this.calendar.ec.push(JAK.Events.addListener(this.td, "mouseout", this, "_changeStatus"));
	this.calendar.ec.push(JAK.Events.addListener(this.td, "mouseup", this, "_up"));
	this.addOverEvents(this.td);
	this.addDownEvents(this.td);
}

JAK.Calendar.Nav.prototype._changeStatus = function() {
	if (this.oldStatus) {
		this.calendar._dom.status.innerHTML = this.oldStatus;
		this.oldStatus = false;
	} else {
		this.oldStatus = this.calendar._dom.status.innerHTML;
		this.calendar._dom.status.innerHTML = this.status;
	}
}

JAK.Calendar.Nav.prototype._up = function(e, elm) {
	if (JAK.Calendar.Button._activeElement) {
		JAK.DOM.removeClass(JAK.Calendar.Button._activeElement, "mousedown");
		if (JAK.Calendar.Button._activeElement == this.td) {
			this.method.call(this.calendar, e, elm);
		}
		JAK.Calendar.Button._activeElement = false;
	}
}

/* ---------------------- Calendar.Day, jedna denni bunka v kalendari ---------------------- */
/**
 * @class
 * @private
 * @augments JAK.Calendar.Button
 */
JAK.Calendar.Day = JAK.ClassMaker.makeClass({
	NAME: "JAK.Calendar.Day",
	VERSION: "2.0",
	IMPLEMENT: JAK.Calendar.Button
});

JAK.Calendar.Day.prototype.$constructor = function(calendar) {
	this.td = JAK.cel("td", "cal-day");
	this.calendar = calendar;
	this.date = false;

	this.calendar.ec.push(JAK.Events.addListener(this.td, "mouseup", this, "_up"));
	this.calendar.ec.push(JAK.Events.addListener(this.td, "mouseover", this, "_changeStatus"));
	this.calendar.ec.push(JAK.Events.addListener(this.td, "mouseout", this, "_changeStatus"));
	this.addOverEvents(this.td);
	this.addDownEvents(this.td);
}

JAK.Calendar.Day.prototype.redraw = function(today) {
	this.td.innerHTML = this.date.getDate();
	JAK.DOM.removeClass(this.td,"cal-today");
	JAK.DOM.removeClass(this.td,"cal-selected");
	JAK.DOM.removeClass(this.td,"cal-obsolete");
	if (this.calendar.equalDates(this.date,today)) { JAK.DOM.addClass(this.td,"cal-today"); }
	if (this.calendar.equalDates(this.date,this.calendar.selectedDate)) { JAK.DOM.addClass(this.td,"cal-selected"); }
	if (this.date.getMonth() != this.calendar.currentDate.getMonth()) { JAK.DOM.addClass(this.td,"cal-obsolete"); } 
}

JAK.Calendar.Day.prototype._up = function() {
	if (JAK.Calendar.Button._activeElement) {
		JAK.DOM.removeClass(JAK.Calendar.Button._activeElement, "mousedown");
		if (JAK.Calendar.Button._activeElement == this.td) {
			if (this.calendar.callback) { this.calendar.useDate(this.date); }
			this.calendar.makeEvent("datepick");
			this.calendar._hide();
		}
		JAK.Calendar.Button._activeElement = false;
	}
}

JAK.Calendar.Day.prototype._changeStatus = function() {
	if (this.oldStatus) {
		this.calendar._dom.status.innerHTML = this.oldStatus;
		this.oldStatus = false;
	} else {
		this.oldStatus = this.calendar._dom.status.innerHTML;
		var str = this.calendar.options.dayNames[(this.date.getDay()+6) % 7]+", ";
		str += this.date.getDate()+". ";
		str += this.calendar.options.monthNames[this.date.getMonth()]+" ";
		str += this.date.getFullYear();
		this.calendar._dom.status.innerHTML = str;
	}
}

/* ------------------ Calendar.Roller, rolovaci mrska --------------------- */
/**
 * @class
 * @private
 * @group jak-widgets
 */
JAK.Calendar.Roller = JAK.ClassMaker.makeClass({
	NAME: "JAK.Calendar.Roller",
	VERSION: "2.0"
});

JAK.Calendar.Roller.prototype.$constructor = function(calendar, parent, type, rightAlign) { /* type: 0 ~ months, -1 ~ minus years, 1 ~ plus years */
	this.calendar = calendar;
	this.parent = parent;
	this.type = type;
	this.rightAlign = rightAlign;
	this.buttons = [];

	this.div = JAK.cel("div", "cal-roller");
	this._hide();
	this.calendar._dom.content.appendChild(this.div);
	for (var i=0;i<12;i++) {
		var btn = new JAK.Calendar.RollerButton(this,this.calendar);
		this.buttons.push(btn);
		this.div.appendChild(btn.div);
	}
	this._show();
	this._show = this._show.bind(this);
	this.calendar.ec.push(JAK.Events.addListener(this.parent,"mousedown",this,"_handleDown"));
}

JAK.Calendar.Roller.prototype._handleDown = function() {
	this.calendar._timer = true;
	setTimeout(this._show,this.calendar.options.rollerDelay);
}

JAK.Calendar.Roller.prototype._show = function() {
	if (!this.calendar._timer) { return; }
	var pos1 = JAK.DOM.getBoxPosition(this.parent);
	var pos2 = JAK.DOM.getBoxPosition(this.calendar._dom.content);
	this.div.style.display = "block";
	var w = this.div.offsetWidth;
	for (var i=0;i<12;i++) { /* refresh rollover labels */
		var btn = this.buttons[i].div;
		if (JAK.Browser.client == "ie") { btn.style.width = w+"px"; }
		switch (this.type) {
			case -1:
			case 1:
				var y = this.calendar.currentDate.getFullYear();
				btn.innerHTML = y + this.type * (i*2+1);
			break;
			
			case 0:
				this.buttons[i].value = i;
				JAK.DOM.removeClass(btn,"selected");
				btn.innerHTML = this.calendar.options.monthNamesShort[i];
				if (i == this.calendar.currentDate.getMonth()) { JAK.DOM.addClass(btn,"selected"); }
			break;
		}
	}

	var l = pos1.left-pos2.left;
	if (this.rightAlign) { l += this.parent.offsetWidth-this.div.offsetWidth  };
	this.div.style.left = l+"px";
	this.div.style.top = (pos1.top-pos2.top+this.parent.offsetHeight)+"px";
}

JAK.Calendar.Roller.prototype._hide = function() {
	this.div.style.display = "none";
}

/* ------------------ Calendar.RollerButton, prvek na rolovacce --------------------- */
/**
 * @class
 * @private
 * @augments JAK.Calendar.Button
 */
JAK.Calendar.RollerButton = JAK.ClassMaker.makeClass({
	NAME: "JAK.Calendar.RollerButton",
	VERSION: "2.0",
	IMPLEMENT: JAK.Calendar.Button
});

JAK.Calendar.RollerButton.prototype.$constructor = function(roller, calendar) {
	this.roller = roller;
	this.calendar = calendar;

	this.div = JAK.cel("div", "label");
	this.addOverEvents(this.div);
	this.calendar.ec.push(JAK.Events.addListener(this.div,"mouseup",this,"_up",false,true));
}

JAK.Calendar.RollerButton.prototype._over = function(e,elm) {
	this.calendar._removeRanges();
	if (!JAK.DOM.hasClass(elm, "selected")) { JAK.DOM.addClass(elm, "mouseover"); }
}

JAK.Calendar.RollerButton.prototype._out = function(e,elm) {
	JAK.DOM.removeClass(elm,"mouseover");
}

JAK.Calendar.RollerButton.prototype._up = function(e,elm) {
	var cal = this.calendar;
	switch (this.roller.type) {
		case -1:
		case 1:
			cal.currentDate.setFullYear(this.div.innerHTML);
			cal._switchTo();
		break;
		
		case 0:
			cal.currentDate.setMonth(this.value);
			cal._switchTo();
		break;
	}
}
