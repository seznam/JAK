/**
 * @overview tabs
 * @version 1.1
 * @author zara
*/   

/**
 * @class Rada tabu ovladajicich obsah jednoho kontejneru
 * @param {String || Element} container kontejner, jehoz obsah se bude menit
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>defaultClass</em> - CSS trida, pridana vsem tabum</li>
 *		<li><em>selectedClass</em> - CSS trida, pridana aktivnimu tabu</li>
 *   <ul>
 * @param {Function} callbackFunction volitelna funkce, volana pri zmene tabu s dvema parametry:
 * starym indexem a novym indexem
 * @constructor
 */
SZN.Tabs = function(container, optObj, callbackFunction) {
	this.options = {
		defaultClass:"tab",
		selectedClass:"tab-selected"
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }

	this.selectedIndex = -1;
	this.container = SZN.gEl(container);
	this.callbackFunction = callbackFunction;
	this.tabs = []; 
	this.ec = [];
	this.Tabs();
}
SZN.Tabs.Name = "Tabs";
SZN.Tabs.version = 1.1;

/**
 * @method Sekundarni konstruktor.
 */
SZN.Tabs.prototype.Tabs = function() {}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.Tabs.prototype.destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

/**
 * Smazani vsech tabu
 */
SZN.Tabs.prototype.clear = function() {
	this.selectedIndex = -1;
	for (var i=0;i<this.tabs.length;i++) {
		this.tabs[i].destructor();
	}
	this.tabs = [];
}

/**
 * Pridani noveho tabu (= dvojice klikac-obsah)
 * @param {String || Element} click to, na co se bude klikat
 * @param {String || Element} content to, co se po kliknuti zobrazi
 */
SZN.Tabs.prototype.addTab = function(click, content) {
	var tab = new SZN.Tab(click, content, this);
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
	
	if (this.callbackFunction) { this.callbackFunction(oldI,this.selectedIndex); }
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

/**
 * @class Tab, vytvareny nadrazenou instanci SZN.Tabs pri pridani noveho tabu
 * @param {String || Element} click na co se ma klikat
 * @param {String || Element} content co se ma zobrazit
 * @param {Object} owner instance SZN.Tabs, do ktere novy tab patri
 * @constructor
 */
SZN.Tab = function(click, content, owner) {
	this.content = SZN.gEl(content);
	this.owner = owner;
	this.click = SZN.gEl(click);
	this.ec = [];
	this.Tab();
}
SZN.Tab.Name = "Tab";
SZN.Tab.version = 1.0;

/**
 * @method Sekundarni konstruktor.
 */
SZN.Tab.prototype.Tab = function() {
	this.ec.push(SZN.Events.addListener(this.click,"click",this,"_go",false,true));
	if (this.owner.options.defaultClass) {
		SZN.Dom.addClass(this.click,this.owner.options.defaultClass);
	}
}

/**
 * @method Explicitni desktruktor. Odvesi vsechny eventy a smaze vsechny vlastnosti.
 */
SZN.Tab.prototype.destructor = function() {
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
