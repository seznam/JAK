/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @version 2.0
 * @author zara
 * @augments JAK.ISignals
 * @group jak-widgets
 * @class Rada tabu ovladajicich obsah jednoho kontejneru
 * @signal tabchange
 */   
JAK.Tabs = JAK.ClassMaker.makeClass({
	NAME: "Tabs",
	VERSION: "2.0",
	IMPLEMENT : JAK.ISignals
});

/**
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
 */
JAK.Tabs.prototype.$constructor = function(container, optObj, callbackObject, callbackMethod) {
	this.options = {
		defaultClass:"tab",
		selectedClass:"tab-selected",
		hoverClass:"tab-hover",
		hover:false
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }

	this.selectedIndex = -1;
	this.container = JAK.gel(container);
	this.callbackObject = callbackObject;
	this.callbackMethod = callbackMethod;
	this.tabs = []; 
	this.ec = [];
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
JAK.Tabs.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var i=0;i<this.tabs.length;i++) {
		this.tabs[i].$destructor();
	}
	for (var p in this) { this[p] = null; }
}

/**
 * Smazani vsech tabu
 */
JAK.Tabs.prototype.clear = function() {
	this.selectedIndex = -1;
	for (var i=0;i<this.tabs.length;i++) {
		this.tabs[i].$destructor();
	}
	this.tabs = [];
}

/**
 * Vraci prave zobrazeny tab, pokud zadny neni, vraci null
 * @return {JAK.Tab}
 */
JAK.Tabs.prototype.getActiveTab = function() {
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
JAK.Tabs.prototype.addTab = function(click, content) {
	if (arguments.length == 1) {
		this._addTab(click);
	} else {
		this._crateNewTab(click, content);
	}
}

/**
 * vnitrni metoda, ktera vytvori tab z predanych objektu
 */ 
JAK.Tabs.prototype._crateNewTab = function(click, content) {
	var tab = new JAK.Tab(click, content, this, this.options.hover, this.options.hoverClass);
	this._addTab(tab);
}

/**
 * vnitrni metoda, ktera prida vytvoreny tab
 */ 
JAK.Tabs.prototype._addTab = function(tab) {
	this.tabs.push(tab);
	tab._deactivate();
}



/**
 * Manualni prepnuti na zadany tab
 * @param {Integer} index index tabu, na ktery se ma prejit
 */
JAK.Tabs.prototype.go = function(index) {
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
JAK.Tabs.prototype.addManyTabs = function(clickList, contentList, defaultIndex) {
	var clicks = JAK.gel(clickList);
	var contents = JAK.gel(contentList);
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

/**
 * @class Tab, vytvareny nadrazenou instanci JAK.Tabs pri pridani noveho tabu
 * @group jak-widgets
 * @private
 */
JAK.Tab = JAK.ClassMaker.makeClass({
	NAME: "Tab",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * @param {String || Element} click na co se ma klikat
 * @param {String || Element} content co se ma zobrazit
 * @param {Object} owner instance JAK.Tabs, do ktere novy tab patri
 * @param {boolean} hover urcuje zdali bude nad tabem hover efekt(vklada tridu hoverTab)   
 */
JAK.Tab.prototype.$constructor = function(click, content, owner, hover, hoverClass) {
	this.content = JAK.gel(content);
	this.owner = owner;
	this.click = JAK.gel(click);
	this.hoverClass = hoverClass;
	this.ec = [];
	this.ec.push(JAK.Events.addListener(this.click,"click",this,"_go",false,true));
	
	if(hover){
		this.ec.push(JAK.Events.addListener(this.click,"mouseover",this,"_hover"));
		this.ec.push(JAK.Events.addListener(this.click,"mouseout",this,"_hoverOut"));
	}
	
	if (this.owner.options.defaultClass) {
		JAK.DOM.addClass(this.click,this.owner.options.defaultClass);
	}
}

/**
 * @method Explicitni destruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
JAK.Tab.prototype.$destructor = function() {
	if (this.content.parentNode) { this.content.parentNode.removeChild(this.content); }
	if (this.click.parentNode) { this.click.parentNode.removeChild(this.click); }
	for (var i=0;i<this.ec.length;i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

JAK.Tab.prototype._go = function(e, elm) {
	JAK.Events.cancelDef(e);
	var index = -1;
	for (var i=0;i<this.owner.tabs.length;i++) {
		if (this.owner.tabs[i] == this) { index = i; }
	}
	if (index == -1) { return; }
	this.owner.go(index);
}

JAK.Tab.prototype._activate = function() {
	if (!this.content.parentNode || this.content.parentNode != this.owner.container) { 
		this.owner.container.appendChild(this.content);
	}
	this.content.style.display = "";
	if (this.owner.options.selectedClass) {
		JAK.DOM.addClass(this.click,this.owner.options.selectedClass);
	} 
}

JAK.Tab.prototype._deactivate = function() {
	var c = this.content.style.display = "none";
	if (this.owner.options.selectedClass) {
		JAK.DOM.removeClass(this.click,this.owner.options.selectedClass);
	} 
}
JAK.Tab.prototype._hover = function(e,elm){
		JAK.DOM.addClass(elm,this.hoverClass);
	}

JAK.Tab.prototype._hoverOut = function(e,elm){
		JAK.DOM.removeClass(elm,this.hoverClass);
	}
