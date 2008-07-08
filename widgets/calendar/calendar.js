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
 * @overview kalendar
 * @version 2.0
 * @author zara
*/   

/**
 * @class Kalendar, zpravidla neni treba rucne instantializovat
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 * 	<ul>
 *		<li><em>defaultFormat</em> - formatovaci retezec pro datum, default "j.n.Y"</li>
 * 		<li><em>today</em> - retezec oznacujici dnesek, default "Dnes"</li>
 * 		<li><em>rollerDelay</em> - cas (msec), po kterem se zobrazi roletky na vyber mesice/roku, default 200</li>
 * 		<li><em>lockWindow</em> - ma-li se okno kalendare branit vytazeni mimo okno prohlizece (nahore, vlevo), default false</li>
 * 		<li><em>monthNames</em> - pole nazvu mesicu</li>
 * 		<li><em>monthNamesShort</em> - pole zkracenych (tripismennych) nazvu mesicu</li>
 * 		<li><em>dayNames</em> - pole nazvu dnu v tydnu</li>
 * 	</ul>
 * @constructor
 */
SZN.Calendar = SZN.ClassMaker.makeClass({
	NAME: "Calendar",
	VERSION: "2.1",
	CLASS: "class",
	IMPLEMENT: SZN.SigInterface
});
SZN.Calendar.prototype.$constructor = function(optObj) {
	this.options = {
		defaultFormat:"j.n.Y",
		today:"Dnes",
		monthNames:["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"],
		monthNamesShort:["Led","Ún","Bře","Dub","Kvě","Čer","Črc","Srp","Zář","Říj","Lis","Pros"],
		dayNames:["Po","Út","St","Čt","Pá","So","Ne"],
		rollerDelay:200,
		lockWindow:false
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }
	this._dom = {};
	this._days = [];
	this._rollers = [];
	this.ec = [];
	this._visible = false;

	this.ec.push(SZN.Events.addListener(document,"keydown",this,"_handleKey",false,true));
	this.ec.push(SZN.Events.addListener(document,"mousedown",this,"_handleDown",false,true));
	this.ec.push(SZN.Events.addListener(window,"unload",this,"$destructor",false,true));
	this.ec.push(SZN.Events.addListener(document,"mouseup",this,"_handleUp",false,true));
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.Calendar.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

/**
 * Staticka funkce, ktera provaze ovladaci prvek s kalendarem a inputem
 * @param {Object} calendar instance kalendare
 * @param {Object} clickElm dom node, po jehoz kliknuti se kalendar objevi
 * @param {Object} targetElm dom node (typicky input[type="text"]), jehoz vlastnost .value kalendar ovlada
 */
SZN.Calendar.manage = function(calendar, clickElm, targetElm) { /* setup calendar for two elements */
	var callback = function(str) { targetElm.value = str; }
	var click = function(e,elm) { 
		var pos = SZN.Dom.getBoxPosition(clickElm);
		var x = pos.left;
		var y = pos.top + clickElm.offsetHeight + 1;
		calendar.pick(x,y,targetElm.value,callback);
	}
	calendar.ec.push(SZN.Events.addListener(clickElm,"click",window,click,false,true));
}

/**
 * Doporucena jedina funkce na tvorbu kalendare;
 * vytvori ovladaci prvek (obrazek | button), ktery po kliknuti zobrazi kalendar, jez ovlada zadany input
 * @param {String} imageUrl URL obrazku, ktery se pouzije. Pokud je false, namisto obrazku vznikne button
 * @param {String} label pokud je vytvaren obrazek, toto je jeho alt text. Pokud je vytvaren button, 
 *   toto je jeho popisek
 * @param {Object} optObj asociativni pole parametru pro kalendar
 * @param {String} id1...idN libovolne mnozstvi idecek pro inputy, na ktere chceme aplikovat kalendar
 */
SZN.Calendar.setup = function(imageUrl, label, optObj) { /* setup calendar for a variable amount of text fields */
	var c = new SZN.Calendar(optObj);
	for (var i=3;i<arguments.length;i++) {
		var click = false;
		var input = SZN.gEl(arguments[i]);
		if (imageUrl) {
			click = SZN.cEl("img",false,"cal-launcher",{cursor:"pointer"});
			click.src = imageUrl;
			click.alt = label;
			click.title = label;
		} else {
			click = SZN.cEl("input",false,"cal-launcher");
			click.type = "button";
			click.value = label;
		}
		input.parentNode.insertBefore(click,input.nextSibling);
		SZN.Calendar.manage(c,click,input);
	}
	return c;
}

/**
 * Porovna dva datumy, shoduji-li se v roce && mesici && dnu
 * @param {Date} d1 prvni datum k porovnani
 * @param {Date} d2 druhe datum k porovnani
 * @return true|false
 */
SZN.Calendar.prototype.equalDates = function(d1,d2) { /* are two dates the same (truncated to days) ? */
	return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate();
}

SZN.Calendar.prototype._handleDown = function(e,elm) {
	if (!this._visible) { return; }
	this._hide();
}

SZN.Calendar.prototype._cancelDown = function(e,elm) {
	SZN.Events.stopEvent(e);
}

SZN.Calendar.prototype._handleUp = function(e,elm) {
	if (this.eventMove)	{
		SZN.Events.removeListener(this.eventMove);
		this.eventMove = false;
	}
	
	if (SZN.Calendar.Button._activeElement) {
		SZN.Dom.removeClass(SZN.Calendar.Button._activeElement,"mousedown");
		SZN.Calendar.Button._activeElement = false;
	}
	this._timer = false;
	for (var i=0;i<this._rollers.length;i++) {
		this._rollers[i]._hide();
	}
}

SZN.Calendar.prototype._handleMove = function(e,elm) {
	if (!this._visible) { return; }
	var selObj = false;
	if (document.getSelection && !SZN.Browser.klient != "gecko") { selObj = document.getSelection(); }
	if (window.getSelection) { selObj = window.getSelection(); }
	if (document.selection) { selObj = document.selection; }
	if (selObj) {
		if (selObj.empty) { selObj.empty(); }
		if (selObj.removeAllRanges) { selObj.removeAllRanges(); }
	}

	SZN.Events.cancelDef(e);
	var dx = e.clientX - this._clientX;
	var dy = e.clientY - this._clientY;
	
	var pos = SZN.Dom.getBoxPosition(this._dom.container);
	var newx = pos.left+dx;
	var newy = pos.top+dy;
	if (this.options.lockWindow && (newx < 0 || newy < 0)) { return; }
	
	this._dom.container.style.left = newx+"px";
	this._dom.container.style.top = newy+"px";
	this._clientX = e.clientX;
	this._clientY = e.clientY;
}

SZN.Calendar.prototype._dragDown = function(e,elm) {
	SZN.Events.cancelDef(e);
	this.eventMove = SZN.Events.addListener(document,"mousemove",this,"_handleMove",false,true);
	
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
SZN.Calendar.prototype.pick = function(x,y,date,callback) { 
	this._draw();
	this._dom.container.style.left = x+"px";
	this._dom.container.style.top = y+"px";
	/* analyze date */
	
	this.selectedDate = new Date();
	if (date) {
		this.selectedDate = SZN.Calendar.parseDate(date);
	} /* date parsing */
	this.currentDate = new Date(this.selectedDate);
	this.currentDate.setDate(1);
	this.callback = callback;
	this._switchTo();
}

/**
 * Zformatuje datum dle formatovaciho retezce, zadaneho jako parametr kalendare. Formatovaci retezec odpovida 
   php funkci date(), implementovane hodnoty jsou "dgGhHijmnsUwYx".
 * @param {Date} date datum, jez ma byt zformatovano
 */
SZN.Calendar.prototype.format = function(date) { 
	function lz(str,length) {
		var s = str.toString();
		var l = (length ? length : 2);
		while (s.length < l) { s = "0"+s; }
		return s;	
	}

	var result = this.options.defaultFormat;
	result = result.replace(/d/g,lz(date.getDate(),2));
	result = result.replace(/g/g,parseInt(date.getHours()) % 12);
	result = result.replace(/G/g,date.getHours());
	result = result.replace(/h/g,lz(parseInt(date.getHours()) % 12,2));
	result = result.replace(/H/g,lz(date.getHours(),2));
	result = result.replace(/i/g,lz(date.getMinutes(),2));
	result = result.replace(/j/g,date.getDate());
	result = result.replace(/m/g,lz(date.getMonth()+1,2));
	result = result.replace(/n/g,date.getMonth()+1);
	result = result.replace(/s/g,lz(date.getSeconds(),2));
	result = result.replace(/U/g,date.getTime());
	result = result.replace(/w/g,date.getDay());
	result = result.replace(/Y/g,date.getFullYear());
	result = result.replace(/x/g,lz(date.getMilliseconds(),3));
	return result;
}

SZN.Calendar.prototype._draw = function() { /* make calendar appear */
	if (!("container" in this._dom)) {
		this._buildDom();
		document.body.appendChild(this._dom.container);
	}
	this._show();
}

SZN.Calendar.prototype._help = function() {
	alert("Výběr data:\n - Použijte «, » tlačítka pro vybrání roku\n - Použijte ‹, › tlačítka pro vybrání měsíce\n - Menu pro rychlejší výběr se zobrazí po delším stisku výše uvedených tlačítek\n - Stisknutím mezerníku zvolíte dnešní datum");
}

SZN.Calendar.prototype._buildDom = function() { /* create dom elements, link them together */
	this._dom.container = SZN.cEl("div",false,false,{position:"absolute"});
	this._dom.content = SZN.cEl("div",false,"cal-content");
	this._dom.table = SZN.cEl("table");
	this._dom.thead = SZN.cEl("thead");
	this._dom.tbody = SZN.cEl("tbody");
	this._dom.tfoot = SZN.cEl("tfoot");
	this._dom.table.cellSpacing = 0;
	this._dom.table.cellPadding = 0;
	
	if (SZN.Browser.klient == "ie") {
		this._dom.iframe = SZN.cEl("iframe",false,false,{position:"absolute",left:"0px",top:"0px",zIndex:1});
		this._dom.content.style.zIndex = 2;
		SZN.Dom.append([this._dom.container,this._dom.iframe,this._dom.content],[this._dom.content,this._dom.table]);
	} else {
		SZN.Dom.append([this._dom.container,this._dom.content],[this._dom.content,this._dom.table]);
	} 
	SZN.Dom.append([this._dom.table,this._dom.thead,this._dom.tbody,this._dom.tfoot]);
	
	/* top part */
	var r1 = SZN.cEl("tr");
	var r2 = SZN.cEl("tr",false);
	var r3 = SZN.cEl("tr",false);
	SZN.Dom.append([this._dom.thead,r1,r2,r3]);
	
	var help = new SZN.Calendar.Nav(this,"?","Nápověda",this._help);
	this._dom.move = SZN.cEl("td",false,"cal-title");
	var close = new SZN.Calendar.Nav(this,"&times;","Zavřít kalendář",this._hide);
	this._dom.move.colSpan = 6;
	SZN.Dom.append([r1,help.td,this._dom.move,close.td]);
	
	var x = " (podrž pro menu)";
	var buttonLabels = ["&laquo;","&lsaquo;",this.options.today,"&rsaquo;","&raquo;"];
	var buttonStatuses = ["Předchozí rok"+x,"Předchozí měsíc"+x,this.options.today,"Následující měsíc"+x,"Následující rok"+x];
	var buttonMethods = [this._yearB,this._monthB,this._monthC,this._monthF,this._yearF];
	this._dom.buttons = [];
	for (var i=0;i<buttonLabels.length;i++) {
		var button = new SZN.Calendar.Nav(this,buttonLabels[i],buttonStatuses[i],buttonMethods[i]);
		SZN.Dom.addClass(button.td,"cal-button cal-nav");
		this._dom.buttons.push(button.td);
		r2.appendChild(button.td);
	}
	this._dom.buttons[2].colSpan = 4;
	
	var wk = SZN.cEl("td",false,"cal-dayname cal-wn");
	wk.innerHTML = "wk";
	r3.appendChild(wk);
	
	for (var i=0;i<this.options.dayNames.length;i++) {
		var day = SZN.cEl("td",false,"cal-dayname");
		day.innerHTML = this.options.dayNames[i];
		r3.appendChild(day);
		if (i > 4) { SZN.Dom.addClass(day,"cal-weekend"); }
	}
	
	/* middle part */
	this._dom.rows = [];
	for (var i=0;i<42;i++) { /* magic number of days. */
		var day = new SZN.Calendar.Day(this);
		this._days.push(day);
		if (!(i % 7)) {
			var tr = SZN.cEl("tr");
			this._dom.rows.push(tr);
			this._dom.tbody.appendChild(tr);
			this.ec.push(SZN.Events.addListener(tr,"mouseover",this,"_overRef",false,true));
			this.ec.push(SZN.Events.addListener(tr,"mouseout",this,"_outRef",false,true));
			var wk = SZN.cEl("td",false,"cal-wn cal-day");
			tr.appendChild(wk);
		}
		SZN.Dom.addClass(day.td,"cal-day");
		tr.appendChild(day.td);
		if (i % 7 > 4) { SZN.Dom.addClass(day.td,"cal-weekend"); }
	}
	
	/* bottom part */
	var tr = SZN.cEl("tr");
	this._dom.status = SZN.cEl("td",false,"cal-status");
	this._dom.status.colSpan = 8;
	SZN.Dom.append([this._dom.tfoot,tr],[tr,this._dom.status]);
	this._dom.status.innerHTML = "Vyberte datum";
	
	/* rollers */
	for (var i=0;i<this._dom.buttons.length;i++) {
		if (i == 2) { continue; }
		var type = (i == 1 || i == 3 ? 0 : (i < 2 ? -1 : 1));
		var roller = new SZN.Calendar.Roller(this,this._dom.buttons[i],type,i > 2);
		this._rollers.push(roller);
	}
	
	/* misc */
	this.ec.push(SZN.Events.addListener(this._dom.move,"mousedown",this,"_dragDown",false,true));
	this.ec.push(SZN.Events.addListener(this._dom.status,"mousedown",this,"_dragDown",false,true));
	this.ec.push(SZN.Events.addListener(this._dom.container,"mousedown",this,"_cancelDown",false,true));
}

SZN.Calendar.prototype._handleKey = function(e,elm) {
	if (!this._visible) { return; }
	if (e.keyCode == 32) { this._monthC(); }
	if (e.keyCode == 27) { this._hide(); }
}

SZN.Calendar.prototype._overRef = function(e,elm) {
	SZN.Dom.addClass(elm,"mouseover");	
}
	
SZN.Calendar.prototype._outRef = function(e,elm) {
	SZN.Dom.removeClass(elm,"mouseover");
}
	
SZN.Calendar.prototype._hide = function() {
	this._dom.container.style.display = "none";
	this._visible = false;
}

SZN.Calendar.prototype._show = function() {
	this._dom.container.style.display = "block";
	this._visible = true;
}

SZN.Calendar.prototype._getWeekNumber = function(date) { /* wtf code to get week number */
	var d=new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0);
	var DoW=d.getDay();
	d.setDate(d.getDate()-(DoW+6)%7+3);
	var ms=d.valueOf();
	d.setMonth(0);
	d.setDate(4);
	return Math.round((ms-d.valueOf())/(7*86400000))+1;
}

SZN.Calendar.prototype._switchTo = function() { /* switch to a given date */
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
	
	this._dom.move.innerHTML = this.options.monthNames[this.currentDate.getMonth()] + " "+this.currentDate.getFullYear();
	if (SZN.Browser.klient == "ie") { /* adjust iframe size */
		this._dom.iframe.style.width = this._dom.content.offsetWidth + "px";
		this._dom.iframe.style.height = this._dom.content.offsetHeight + "px";
	}
}

SZN.Calendar.prototype._yearF = function(e,elm) { /* year forward */
	this.currentDate.setFullYear(this.currentDate.getFullYear()+1);
	this._switchTo();
}

SZN.Calendar.prototype._yearB = function(e,elm) { /* year back */
	this.currentDate.setFullYear(this.currentDate.getFullYear()-1);
	this._switchTo();
}

SZN.Calendar.prototype._monthB = function(e,elm) { /* month back */
	this.currentDate.setMonth((this.currentDate.getMonth()+11)%12);
	if (this.currentDate.getMonth() == 11) { this.currentDate.setFullYear(this.currentDate.getFullYear()-1); }
	this._switchTo();
}

SZN.Calendar.prototype._monthF = function(e,elm) { /* month forward */
	this.currentDate.setMonth((this.currentDate.getMonth()+1)%12);
	if (this.currentDate.getMonth() == 0) { this.currentDate.setFullYear(this.currentDate.getFullYear()+1); }
	this._switchTo();
}

SZN.Calendar.prototype._monthC = function(e) { /* year forward */
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
SZN.Calendar.parseDate = function(date) {
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
 * @name SZN.Calendar.Button
 * @constructor
 */
SZN.Calendar.Button = SZN.ClassMaker.makeClass({
	NAME: "Calendar.Button",
	VERSION: "1.0",
	CLASS: "class"
});
SZN.Calendar.Button._activeElement = false;

SZN.Calendar.Button.prototype._over = function(e,elm) {
	if (!SZN.Calendar.Button._activeElement) {
		SZN.Dom.addClass(elm,"mouseover");	
	}
}

SZN.Calendar.Button.prototype._out = function(e,elm) {
	SZN.Dom.removeClass(elm,"mouseover");
}

SZN.Calendar.Button.prototype._overIgnore = function(e,elm) {
	if (!SZN.Dom.hasClass(elm,"selected")) { SZN.Dom.addClass(elm,"mouseover"); }
}

SZN.Calendar.Button.prototype._outIgnore = function(e,elm) {
	SZN.Dom.removeClass(elm,"mouseover");
}

SZN.Calendar.Button.prototype._down = function(e,elm) {
	SZN.Events.cancelDef(e);
	SZN.Calendar.Button._activeElement = elm;
	SZN.Dom.addClass(elm,"mousedown");	
}

SZN.Calendar.Button.prototype._up = function(e,elm) {
	SZN.Calendar.Button._activeElement = false;
	SZN.Dom.removeClass(elm,"mousedown");
}

SZN.Calendar.Button.prototype.addOverEvents = function(elm,ignoreOthers) {
	if (ignoreOthers) {
		this.calendar.ec.push(SZN.Events.addListener(elm,"mouseover",this,"_overIgnore",false,true));
		this.calendar.ec.push(SZN.Events.addListener(elm,"mouseout",this,"_outIgnore",false,true));
	} else {
		this.calendar.ec.push(SZN.Events.addListener(elm,"mouseover",this,"_over",false,true));
		this.calendar.ec.push(SZN.Events.addListener(elm,"mouseout",this,"_out",false,true));
	}
}

SZN.Calendar.Button.prototype.addDownEvents = function(elm) {
	this.calendar.ec.push(SZN.Events.addListener(elm,"mousedown",this,"_down",false,true));
	this.calendar.ec.push(SZN.Events.addListener(elm,"mouseup",this,"_up",false,true));
}

/* ---------------------- Calendar.Nav, navigacni buttonek -------------------------- */
/**
 * @name SZN.Calendar.Nav
 * @constructor
 */
SZN.Calendar.Nav = SZN.ClassMaker.makeClass({
	NAME: "Calendar.Nav",
	VERSION: "1.0",
	EXTEND: SZN.Calendar.Button,
	CLASS: "class"
});

SZN.Calendar.Nav.prototype.$constructor = function(calendar, label, status, method) {
	this.td = SZN.cEl("td",false,"cal-button");
	this.td.innerHTML = label;
	this.status = status;
	this.calendar = calendar;
	this.method = method;

	this.addOverEvents(this.td);
	this.addDownEvents(this.td);
	this.calendar.ec.push(SZN.Events.addListener(this.td,"mouseover",this,"_changeStatus",false,true));
	this.calendar.ec.push(SZN.Events.addListener(this.td,"mouseout",this,"_changeStatus",false,true));
	this.calendar.ec.push(SZN.Events.addListener(this.td,"click",this.calendar,this.method,false,true));
}

SZN.Calendar.Nav.prototype._changeStatus = function() {
	if (this.oldStatus) {
		this.calendar._dom.status.innerHTML = this.oldStatus;
		this.oldStatus = false;
	} else {
		this.oldStatus = this.calendar._dom.status.innerHTML;
		this.calendar._dom.status.innerHTML = this.status;
	}
}

/* ---------------------- Calendar.Day, jedna denni bunka v kalendari ---------------------- */
/**
 * @name SZN.Calendar.Day
 * @constructor
 */
SZN.Calendar.Day = SZN.ClassMaker.makeClass({
	NAME: "Calendar.Day",
	VERSION: "1.0",
	EXTEND: SZN.Calendar.Button,
	CLASS: "class"
});

SZN.Calendar.Day.prototype.$constructor = function(calendar) {
	this.td = SZN.cEl("td",false,"cal-day");
	this.calendar = calendar;
	this.date = false;

	this.addOverEvents(this.td);
	this.addDownEvents(this.td);
	this.calendar.ec.push(SZN.Events.addListener(this.td,"click",this,"_click",false,true));
	this.calendar.ec.push(SZN.Events.addListener(this.td,"mouseover",this,"_changeStatus",false,true));
	this.calendar.ec.push(SZN.Events.addListener(this.td,"mouseout",this,"_changeStatus",false,true));
}

SZN.Calendar.Day.prototype.redraw = function(today) {
	this.td.innerHTML = this.date.getDate();
	SZN.Dom.removeClass(this.td,"cal-today");
	SZN.Dom.removeClass(this.td,"cal-selected");
	SZN.Dom.removeClass(this.td,"cal-obsolete");
	if (this.calendar.equalDates(this.date,today)) { SZN.Dom.addClass(this.td,"cal-today"); }
	if (this.calendar.equalDates(this.date,this.calendar.selectedDate)) { SZN.Dom.addClass(this.td,"cal-selected"); }
	if (this.date.getMonth() != this.calendar.currentDate.getMonth()) { SZN.Dom.addClass(this.td,"cal-obsolete"); } 
}

SZN.Calendar.Day.prototype._click = function() {
	if (this.calendar.callback) {
		this.calendar.callback(this.calendar.format(this.date));
	}
	this.calendar.makeEvent("datepick");
	this.calendar._hide();
}

SZN.Calendar.Day.prototype._changeStatus = function() {
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
 * @name SZN.Calendar.Roller
 * @constructor
 */
SZN.Calendar.Roller = SZN.ClassMaker.makeClass({
	NAME: "Calendar.Roller",
	VERSION: "1.0",
	CLASS: "class"
});
SZN.Calendar.Roller.prototype.$constructor = function(calendar, parent, type, rightAlign) { /* type: 0 ~ months, -1 ~ minus years, 1 ~ plus years */
	this.calendar = calendar;
	this.parent = parent;
	this.type = type;
	this.rightAlign = rightAlign;
	this.buttons = [];

	this.div = SZN.cEl("div",false,"cal-roller");
	this._hide();
	this.calendar._dom.content.appendChild(this.div);
	for (var i=0;i<12;i++) {
		var btn = new SZN.Calendar.RollerButton(this,this.calendar);
		this.buttons.push(btn);
		this.div.appendChild(btn.div);
	}
	this._show();
	SZN.Events.addTimeFunction(this, '_showTimeout', this._show);
	this.calendar.ec.push(SZN.Events.addListener(this.parent,"mousedown",this,"_handleDown",false,true));
}

SZN.Calendar.Roller.prototype._handleDown = function() {
	this.calendar._timer = true;
	setTimeout(this._showTimeout,this.calendar.options.rollerDelay);
}

SZN.Calendar.Roller.prototype._show = function() {
	if (!this.calendar._timer) { return; }
	var pos1 = SZN.Dom.getBoxPosition(this.parent);
	var pos2 = SZN.Dom.getBoxPosition(this.calendar._dom.content);
	this.div.style.display = "block";
	var w = this.div.offsetWidth;
	for (var i=0;i<12;i++) { /* refresh rollover labels */
		var btn = this.buttons[i].div;
		if (SZN.Browser.klient == "ie") { btn.style.width = w+"px"; }
		switch (this.type) {
			case -1:
			case 1:
				var y = this.calendar.currentDate.getFullYear();
				btn.innerHTML = y + this.type * (i*2+1);
			break;
			
			case 0:
				this.buttons[i].value = i;
				SZN.Dom.removeClass(btn,"selected");
				btn.innerHTML = this.calendar.options.monthNamesShort[i];
				if (i == this.calendar.currentDate.getMonth()) { SZN.Dom.addClass(btn,"selected"); }
			break;
		}
	}

	var l = pos1.left-pos2.left;
	if (this.rightAlign) { l += this.parent.offsetWidth-this.div.offsetWidth  };
	this.div.style.left = l+"px";
	this.div.style.top = (pos1.top-pos2.top+this.parent.offsetHeight)+"px";
}

SZN.Calendar.Roller.prototype._hide = function() {
	this.div.style.display = "none";
}

/* ------------------ Calendar.RollerButton, prvek na rolovacce --------------------- */
/**
 * @name SZN.Calendar.RollerButton
 * @constructor
 */
SZN.Calendar.RollerButton = SZN.ClassMaker.makeClass({
	NAME: "Calendar.RollerButton",
	VERSION: "1.0",
	EXTEND: SZN.Calendar.Button,
	CLASS: "class"
});
SZN.Calendar.RollerButton.prototype.$constructor = function(roller, calendar) {
	this.roller = roller;
	this.calendar = calendar;

	this.div = SZN.cEl("div",false,"label");
	this.addOverEvents(this.div,true);
	this.calendar.ec.push(SZN.Events.addListener(this.div,"mouseup",this,"_up",false,true));
}

SZN.Calendar.RollerButton.prototype._up = function(e,elm) {
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
