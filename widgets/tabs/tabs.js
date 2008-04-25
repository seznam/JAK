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
 * @overview tabs
 * @version 1.1
 * @author zara
*/   

SZN.Tabs = SZN.ClassMaker.makeClass({
	NAME: "Tabs",
	VERSION: "1.1",
	IMPLEMENT : [SZN.SigInterface],
	CLASS: "class"
});
/**
 * @class Rada tabu ovladajicich obsah jednoho kontejneru
 * @name SZN.Tabs
 * @param {String || Element} container kontejner, jehoz obsah se bude menit
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>defaultClass</em> - CSS trida, pridana vsem tabum</li>
 *		<li><em>selectedClass</em> - CSS trida, pridana aktivnimu tabu</li>
 *		<li><em>hoverClass</em> - CSS trida, pridana pri hoveru nad tabem</li> 
 *		<li><em>hover</em> - boolean hodnata zdali maji mit taby hover efekt</li>  
 *   <ul>
 * @param {Object} callbackObject volitelny objekt, jehoz metoda bude volana pri zmene tabu s dvema parametry:
 * @param {String} callbackMethod volitelna funkce, volana pri zmene tabu s dvema parametry:
 * starym indexem a novym indexem
 * @constructor
 */
SZN.Tabs.prototype.$constructor = function(container, optObj, callbackObject, callbackMethod) {
	this.options = {
		defaultClass:"tab",
		selectedClass:"tab-selected",
		hoverClass:"tab-hover",
		hover:false
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }

	this.selectedIndex = -1;
	this.container = SZN.gEl(container);
	this.callbackObject = callbackObject;
	this.callbackMethod = callbackMethod;
	this.tabs = []; 
	this.ec = [];
}
SZN.Tabs.Name = "Tabs";
SZN.Tabs.version = 1.1;

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.Tabs.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var i=0;i<this.tabs.length;i++) {
		this.tabs[i].$destructor();
	}
	for (var p in this) { this[p] = null; }
}

/**
 * Smazani vsech tabu
 */
SZN.Tabs.prototype.clear = function() {
	this.selectedIndex = -1;
	for (var i=0;i<this.tabs.length;i++) {
		this.tabs[i].$destructor();
	}
	this.tabs = [];
}

/**
 * Vraci prave zobrazeny tab, pokud zadny neni, vraci null
 * @return {SZN.Tab}
 */
SZN.Tabs.prototype.getActiveTab = function() {
	if (this.tabs[this.selectedIndex]) {
		return this.tabs[this.selectedIndex];
	} else {
		return null;
	}
}

/**
 * Pridani noveho tabu.
 * Tab muze byt definovan klikaci casti (LI) a obsahem (P, DIV..) - dva parametry
 * nebo muze byt definovan jednim parametrem, kterym je objekt, ktery je instanci Tab
 * @param {String || Element} click to, na co se bude klikat
 * @param {String || Element} content to, co se po kliknuti zobrazi 
 */
SZN.Tabs.prototype.addTab = function(click, content) {
	if (arguments.length == 1) {
		this._addTab(click);
	} else {
		this._crateNewTab(click, content);
	}
}

/**
 * vnitrni metoda, ktera vytvori tab z predanych objektu
 */ 
SZN.Tabs.prototype._crateNewTab = function(click, content) {
	var tab = new SZN.Tab(click, content, this, this.options.hover, this.options.hoverClass);
	this._addTab(tab);
}

/**
 * vnitrni metoda, ktera prida vytvoreny tab
 */ 
SZN.Tabs.prototype._addTab = function(tab) {
	this.tabs.push(tab);
	tab._deactivate();
}



/**
 * Manualni prepnuti na zadany tab
 * @param {Integer} index index tabu, na ktery se ma prejit
 */
SZN.Tabs.prototype.go = function(index) {
	if (index == this.selectedIndex) { return; } /* already at that index */
	var oldI = this.selectedIndex;
	
	if (this.selectedIndex != -1) { this.tabs[this.selectedIndex]._deactivate(); } /* hide old */
	this.selectedIndex = index;
	this.tabs[this.selectedIndex]._activate(); /* show new */
	this.makeEvent('tabchange');
	if (this.callbackObject) { this.callbackObject[this.callbackMethod](oldI,this.selectedIndex); }
}

/**
 * Prida radu novych tabu z HTML struktury
 * @param {String || Element} clickList prvek, obsahujici taby
 * @param {String || Element} contentList prvek, obsahujici contenty
 * @param {Integer} defaultIndex index tabu, ktery ma zustat zapnuty; -1 == zadny
 */
SZN.Tabs.prototype.addManyTabs = function(clickList, contentList, defaultIndex) {
	var clicks = SZN.gEl(clickList);
	var contents = SZN.gEl(contentList);
	var clicks_ = [];
	var contents_ = [];
	for (var i=0;i<clicks.childNodes.length;i++) {
		var item = clicks.childNodes[i];
		if (item.nodeType == 1) { clicks_.push(item); }
	}
	
	
	for (var i=0;i<contents.childNodes.length;i++) {
		var item = contents.childNodes[i];
		if (item.nodeType == 1) { contents_.push(item); }
	}
	var cnt = Math.min(clicks_.length, contents_.length);
	for (var i=0;i<cnt;i++) { this.addTab(clicks_[i],contents_[i]); }
	
	if (defaultIndex != -1) { this.go(defaultIndex); }
}

SZN.Tab = SZN.ClassMaker.makeClass({
	NAME: "Tab",
	VERSION: "1.0",
	CLASS: "class"
});
/**
 * @class Tab, vytvareny nadrazenou instanci SZN.Tabs pri pridani noveho tabu
 * @name SZN.Tab
 * @param {String || Element} click na co se ma klikat
 * @param {String || Element} content co se ma zobrazit
 * @param {Object} owner instance SZN.Tabs, do ktere novy tab patri
 * @param {boolean} hover urcuje zdali bude nad tabem hover efekt(vklada tridu hoverTab)   
 * @constructor
 */
SZN.Tab.prototype.$constructor = function(click, content, owner, hover, hoverClass) {
	this.content = SZN.gEl(content);
	this.owner = owner;
	this.click = SZN.gEl(click);
	this.hoverClass = hoverClass;
	this.ec = [];
	this.ec.push(SZN.Events.addListener(this.click,"click",this,"_go",false,true));
	
	if(hover){
		this.ec.push(SZN.Events.addListener(this.click,"mouseover",this,"_hover"));
		this.ec.push(SZN.Events.addListener(this.click,"mouseout",this,"_hoverOut"));
	}
	
	if (this.owner.options.defaultClass) {
		SZN.Dom.addClass(this.click,this.owner.options.defaultClass);
	}
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.Tab.prototype.$destructor = function() {
	if (this.content.parentNode) { this.content.parentNode.removeChild(this.content); }
	if (this.click.parentNode) { this.click.parentNode.removeChild(this.click); }
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.Tab.prototype._go = function(e, elm) {
	var index = -1;
	for (var i=0;i<this.owner.tabs.length;i++) {
		if (this.owner.tabs[i] == this) { index = i; }
	}
	if (index == -1) { return; }
	this.owner.go(index);
}

SZN.Tab.prototype._activate = function() {
	if (!this.content.parentNode || this.content.parentNode != this.owner.container) { 
		this.owner.container.appendChild(this.content);
	}
	this.content.style.display = "";
	if (this.owner.options.selectedClass) {
		SZN.Dom.addClass(this.click,this.owner.options.selectedClass);
	} 
}

SZN.Tab.prototype._deactivate = function() {
	var c = this.content.style.display = "none";
	if (this.owner.options.selectedClass) {
		SZN.Dom.removeClass(this.click,this.owner.options.selectedClass);
	} 
}
SZN.Tab.prototype._hover = function (e,elm){
		SZN.Dom.addClass(elm,this.hoverClass);
	}

SZN.Tab.prototype._hoverOut = function (e,elm){
		SZN.Dom.removeClass(elm,this.hoverClass);
	}
