/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @namespace Namespace pro všechny třídy stromu.
 * @group jak-widgets
 */
JAK.Tree = JAK.ClassMaker.makeStatic({
 	NAME: "JAK.Tree",
	VERSION: "1.0"
});

JAK.Tree.ALERT_ERRORS = false;

/**
 * @class Třída pro vytváření a manipuaci s rozbalovacím stromem.
 * @name JAK.Tree.Node
 * @group jak-widgets
 * @signal treenode-expand
 * @signal treenode-collapse
 * @signal treenode-select
 * @signal treenode-unselect
 * @example
 * //Příklad inicializace stromku:
 * var data = {
 *		title: "root",
 *		id: 'test',
 * 		className: 'uzel',
 * 		visualizer: 'Lines'
 * }
 * var tree = new JAK.Tree.Node(root,data);
 * var container = JAK.gel("container");
 */
JAK.Tree.Node = JAK.ClassMaker.makeClass({
 	NAME: "JAK.Tree.Node",
	VERSION: "1.0",
	CLASS: "class",
	IMPLEMENT: [JAK.ISignals, JAK.IDecorable]
});


/**
 * @param {JAK.Tree.Node} parent Odkaz na instanci rodiče. Pokud není považuje se uzel za ROOT.
 * @param {object} data Vstupní data uzlu.
 */
JAK.Tree.Node.prototype.$constructor = function(parent, data){
	this._parentNode = parent || null;

	//urcuje zda node je rozbalen
	this._expanded = false;

	//ve stromu muze byt jeden uzel selected, pak se treba muze jinak renderovat, ovladano pres metodu select
	this._selected = false;

	//urcuje zda byl node jiz vizualizovan
	this._visualised = false;


	//z parametru data rozumime temto vlastnostem:

	//id elementu
	this._id = data.id || JAK.idGenerator();

	//visualizer se bud preda jako instance, nebo se vytvori pomoci staticke metody a pak je predavan string s nazvem, pokud neni nalezen, vytvori se JAK.Tree.Visualizer.Lines
	this._visualizer = data.visualizer instanceof Object ? data.visualizer : JAK.Tree.Visualizer.getInstance(data.visualizer);

	//data si ulozim, protoze nemusim rozumet vsemu
	this._data = data;

	//pole deti {JAK.Tree.Node}
	this._childNodes = [];

	//uloziste pro data, ktere node nezna, ale napr. vizualizator je potrebuje ulozit
	this._unknownData = {};
}

/**
 * destruktor
 */
JAK.Tree.Node.prototype.$destructor = function(){
	if (this.visualizer()) {
		this.visualizer().destroy(this);
	}

	for (var p in this) {
		this[p] = null;
	}
}

/**
 * Interní chybové hlášení. K textu chyby přidává ID instance TreeNode.
 * @param {String} text Text chybového hlášení.
 * @param {Object} [e] Objekt vyjímky (např. zachycené pomocí catch).
 * @method
 * @private
 */
JAK.Tree.Node.prototype._error = function(text,e){
	var type = "Branch";
	if (this instanceof JAK.Tree.Leaf) { type = "Leaf"; }
	if(e){
		e = "\nOriginalni chyba: "+e.message;
	} else {
		e = "";
	}
	var txt = "JAK.Tree."+type+": <"+this._id+"> "+text+e;
	if(JAK.Tree.ALERT_ERRORS){alert(txt);} else {throw new Error(txt)}
}

/**
 * Odstraní uzel i s jeho případnými potomky.
 * @method
 */
JAK.Tree.Node.prototype.remove = function(){
	this.getRootNode().ids_array.pop(this._id);
	if(this._parentNode){
		this._parentNode.removeChild(this.childIndex);
	} else {
		this.$destructor();
	}
	this._parentNode._visualize();
}

/**
 * Získá kořenový uzel stromu.
 * @returns {JAK.Tree.Node} Kořenový uzel stromu.
 * @method
 */
JAK.Tree.Node.prototype.getRootNode = function(){
	var node = this;
	while(node.parentNode()){
		node = node.parentNode();
	}
	return node;
}

JAK.Tree.Node.prototype.visualize = function(visualizer) {
	if (visualizer) {
		this.visualizer(visualizer);
	}

	// reknu uzlu aby se vizualizoval a vratim vysledek
	return this.visualizer().build(this);
}


/**
 * "Přepočítání" vzhledu elementu.
 */
JAK.Tree.Node.prototype._visualize = function(){
	if (this.visualized()) {
		this.visualizer().update(this);
	}
}


/**
 * přidá dítě do stromu
 * @param {JAK.Tree.Node} node - uzel stromu
 * @method
 */
JAK.Tree.Node.prototype.appendChild = function(node){
	this._childNodes.push(node);
	//node.parentNode(this);
}

/**
 * Vyhledá potomka podle ID. Pokud má toto ID sam uzel vrátí sám sebe.
 * @param {String} id Id hledaného potomka.
 * @returns {JAK.Tree.Node} Odkaz na nalezený uzel. Pokud nic nenajde vrátí false.
 * @method
 */
JAK.Tree.Node.prototype.getNode = function(id){
	if (this.id() == id) { return this; }

	if (!(this instanceof JAK.Tree.Leaf)) {
		var childNodes = this.childNodes();
		for (var i = 0; i < childNodes.length; i++) {
			var n = childNodes[i].getNode(id);
			if (n) { return n; }
		}
	}
	return false;
}

/**
 * Zjistí úroveň zanoření uzlu od kořene nebo zadaného uzlu.
 * @param {JAK.Tree.Node} [node] Uzel u od nejž je hodnota zanoření počítána (kořen). Pokud není definován nebo je false bere se kořen celého stromu.
 * @returns {Number} Úroveň zanoření (0=kořen). Pokud je hodnota zaporná, je aktuální uzel výše než zadaný.
 * @method
 */
JAK.Tree.Node.prototype.getLevel = function(node){
	var getlev = function(node){
		var level = 0;
		while(node.parentNode()){
			level++;
			node = node.parentNode();
			}
		return level;
	}
	var level_root = 0;
	if(node) level_root = getlev(node);
	var level_node = getlev(this);
	return level_node-level_root;
}


/**
 * Rozbalí/sbalí rodiče uzlu.
 * @param {Number} [depth] Hloubka do jaké se rodiče rozbalí (-1 až k rootu)
 * @method
 */
JAK.Tree.Node.prototype.expandParents = function(depth){
	var p = this.parentNode();
	while(p!=null&&depth!=0){
		p.expand();
		p = p.parentNode();
		depth--;
	}
}

/**
 * Sbalí rodiče uzlu.
 * @param {Number} [depth] Hloubka do jaké se rodiče sbalí (-1 až k rootu)
 * @method
 */
JAK.Tree.Node.prototype.collapseParents = function(depth){
	var p = this.parentNode();
	while(p!=null&&depth!=0){
	    p.collapse();
	    p = p.parentNode();
	    depth--;
	}
}

/**
 * Odstraní rodiči dítě se zadaným indexem. Pokud index v poli není, vyhodí chybu.
 * @param {Number} index Pořadí dítěte v poli childNodes.
 * @method
 */
JAK.Tree.Node.prototype.removeChild = function(index){
	if(index in this.childNodes){
		this.childNodes[index].$destructor();
		this.childNodes.pop(this.childNodes[index]);
	} else {
		this._error("rodič neobsahuje dite s indexem "+index+".");
	}
}

/**
 * Rekurzivně projde potomky a zavolá na nich zadanou metodu.
 * @param {String} method Nazev metody, ktera se vola.
 * @param {Number} depth Hloubka (1=přímí potomci, 0=nic) rekurze. (-1 prochází potomky dokud nějací jsou)
 * @param {any} args Zbyle parametry teto metody jsou argumenty, ktere budou predany volane metode.
 */
JAK.Tree.Node.prototype.recurse = function(method, depth) {
	/* vyrobit pole argumentu pro zadanou funkci */
	var a = [];
	for (var i=2;i<arguments.length;i++) { a.push(arguments[i]); }

	/* zavolat na tomto prvku */
	this[method].apply(this, a);


	/* mame jit jeste hloubeji? */
	var d = depth || 0;
	if (d > 0) { d--; }
	if (d) {

		/* pridat do pole parametru hloubku a nazev metody */
		a.unshift(d);
		a.unshift(method);

		/* zavolat na potomcich */
		var childNodes = this.childNodes();
		for (var i = 0; i < childNodes.length; i++) {
			var child = childNodes[i];
			child.recurse.apply(child, a);
		}
	}

}

/**
 * Rekurzivně projde rodiče a zavolá na nich zadanou metodu.
 * @param {String} method Nazev metody, ktera se vola.
 * @param {Number} depth Hloubka (1=přímí potomci, 0=nic) rekurze. (-1 prochází rodiče dokud nějací jsou)
 * @param {any} args Zbyle parametry teto metody jsou argumenty, ktere budou predany volane metode.
 */
JAK.Tree.Node.prototype.recurseUp = function(method, depth) {
	/* vyrobit pole argumentu pro zadanou funkci */
	var a = [];
	for (var i=2;i<arguments.length;i++) { a.push(arguments[i]); }

	/* zavolat na tomto prvku */
	this[method].apply(this, a);

	/* mame jit jeste vyse? */
	var d = depth || 0;
	if (d > 0) { d--; }
	if (d && this.parentNode()) {

		/* pridat do pole parametru hloubku a nazev metody */
		a.unshift(d);
		a.unshift(method);

		/* zavolat na rodici */
		var parent = this.parentNode();
		parent.recurseUp.apply(parent, a);
	}
}

/**
 * Rozbalí uzel.
 * @method
 * @param {Boolean} dontMakeEvent
 */
JAK.Tree.Node.prototype.expand = function(dontMakeEvent){
	this._expanded = true;
	this._visualize();

	if (!dontMakeEvent) { this.makeEvent('treenode-expand'); };
}

/**
 * Sbalí uzel.
 * @method
 * @param {Boolean} dontMakeEvent
 */
JAK.Tree.Node.prototype.collapse = function(dontMakeEvent){
	this._expanded = false;
	this._visualize();

	if (!dontMakeEvent) { this.makeEvent('treenode-collapse'); };
}

JAK.Tree.Node.prototype.nextSibling = function() {
	if (this.parentNode() && this.parentNode().childNodes()) {
		var childNodes = this.parentNode().childNodes();
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i] == this && childNodes[i+1]) {
				return  childNodes[i+1];
			}
		}
	}
	return null;
}

JAK.Tree.Node.prototype.previousSibling = function() {
	if (this.parentNode() && this.parentNode().childNodes()) {
		var childNodes = this.parentNode().childNodes();
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i] == this && childNodes[i-1]) {
				return  childNodes[i-1];
			}
		}
	}
	return null;
}


JAK.Tree.Node.prototype.parentNode = function(node) {
	if (node) {
		this._parentNode = node;
	}
	return this._parentNode;
}


JAK.Tree.Node.prototype.childNodes = function(nodes) {
	if (nodes) {
		this._childNodes = nodes;
	}
	return this._childNodes;
}

JAK.Tree.Node.prototype.getUnknownData = function() {
	return this._unknownData;
}

JAK.Tree.Node.prototype.data = function(data) {
	if (data) {
		this._data=data;
	}
	return this._data;
}

JAK.Tree.Node.prototype.visualizer = function(visualizer) {
	if (visualizer) {
		this._visualizer = visualizer;
	}
	return this._visualizer;
}

JAK.Tree.Node.prototype.visualized = function(v) {
	if (v) {
		this._visualised = v;
	}
	return this._visualised;
}


JAK.Tree.Node.prototype.id = function(id) {
	if (id) {
		this._id = id;
	}
	return this._id;
}

JAK.Tree.Node.prototype.expanded = function() {
	return this._expanded;
}

/**
 * getter na vlastnost zda je tento node vybrany
 * @public
 */
JAK.Tree.Node.prototype.selected = function() {
	return this._selected;
}

/**
 * metoda zaridi, aby byl node oznacen jaky vybrany
 * @public
 * @param {Boolean} dontMakeEvent
 */
JAK.Tree.Node.prototype.select = function(dontMakeEvent) {
	var root = this.getRootNode();
	root.recurse("unselect", -1);

	this._selected = true;
	this._visualize();

	if (!dontMakeEvent) { this.makeEvent('treenode-selected'); };
}

/**
 * odznaci node jako vybrany
 * @public
 * @param {Boolean} dontMakeEvent
 */
JAK.Tree.Node.prototype.unselect = function(dontMakeEvent) {
	if (this._selected) {
		this._selected = false;
		this._visualize();

		if (!dontMakeEvent) { this.makeEvent('treenode-unselected'); };
	}
}

/**
 * @class List stromu.
 * @extends JAK.Tree.Node
 * @name JAK.Tree.Leaf
 */
JAK.Tree.Leaf = JAK.ClassMaker.makeClass({
 	NAME: "JAK.Tree.Leaf",
	VERSION: "1.0",
	EXTEND: JAK.Tree.Node
});

JAK.Tree.Leaf.prototype.$constructor = function(data,parent) {
	this.$super(data,parent);
}

JAK.Tree.Leaf.prototype.expand = function() {
	return false;
}

JAK.Tree.Leaf.prototype.getNode = function(id){
	if(this._id == id) return this;
	return false;
}

JAK.Tree.Leaf.prototype.appendChild = function(){
	this._error("Uzlu typu JAK.Tree.Leaf nelze pridavat potomky.");
	return false;
}

JAK.Tree.Leaf.prototype.childNodes = function() {
	return false;
}

/**
 * @class Abstraktní dekorátor pro uzly a listy stromu
 * @group jak-widgets
 * @param node
 * @param params
 */
JAK.Tree.Node.Feature = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.Tree.Node.Feature',
	VERSION: '1.0',
	EXTEND: JAK.AutoDecorator
});


/**
 * @class Ukázkový callback. Načtení dat pro poduzly AJAXem
 * @name JAK.Tree.Node.Feature.AjaxExpand
 * @extends JAK.Tree.Node.Feature
 */
JAK.Tree.Node.Feature.AjaxExpand = JAK.ClassMaker.makeSingleton({
 	NAME: "JAK.Tree.Node.Feature.AjaxExpand",
	VERSION: "1.0",
	CLASS: "class",
	EXTEND: JAK.Tree.Node.Feature
});

JAK.Tree.Node.Feature.AjaxExpand.prototype.decorate = function(node,params){
	this.$super(node, params);

	node._ajaxExpandParams = params;
	// identifikator zda se request uz provedl
	node.active = false;
}

/**
 * metoda volana pri kliku na expand tlacitko, prepisuje puvodni, na poprve nacte data, jinak vola sveho predka
 * @param e
 * @param elm
 */
JAK.Tree.Node.Feature.AjaxExpand.prototype._expandCollapseClick = function(e, elm){

	if(this.active) {
		this.$super(e, elm);
		return false;//zamezí opakovanému volání
	}
	this.active = true;

	this._loadData();
}

/**
 * expandovani jde vyvolat i skriptem, prvni expand musi nacist data, jinak volam predka
 */
JAK.Tree.Node.Feature.AjaxExpand.prototype.expand = function() {
	if(this.active) {
		this.$super();
		return false;//zamezí opakovanému volání
	}
	this.active = true;

	this._loadData();
}

JAK.Tree.Node.Feature.AjaxExpand.prototype._loadData = function() {
	// osetreni cache v MSIE
	var tstamp = (new Date()).getTime();
	var url = this._ajaxExpandParams.url;
	if(url.indexOf("?") != -1){
		var url = url+"&_"+tstamp;
	} else {
		var url = url+"?_"+tstamp;
	}

	var request = new JAK.Request(JAK.Request.TEXT);
	request.setCallback(this, "_requestHandler");
	request.send(url);
}

JAK.Tree.Node.Feature.AjaxExpand.prototype._requestHandler = function(data){
	// zpracovani JSONu pomoci zdedene metody
	var dat = this._JSON(data);
	// pridame uzlu vytouzene potomky
	if(dat) {
		//vybuildeni deti do stromove struktury
		var treeBuilder = new JAK.Tree.Builder(false);
		treeBuilder.buildChildren(this, dat.childNodes);
		//aktualizace uzlu a vyrenderovani deti a pripnuti jejich obsahu do rodice
		this._visualize();

		// uzel uz ma potomky tak ho muzeme rozbalit
		this.expand(true);
	}
}

JAK.Tree.Node.Feature.AjaxExpand.prototype._JSON = function(data){
	var dat = {};
	try{
		eval('dat.childNodes = '+data);
	}catch(e){
		// pokud je v datech chyba zahlasime to pomoci metody uzlu _error
		this._error("requestHandler - Data nemohla byt zpracovana, protoze obsahuji chyby.",e);
		return false;
	}
	return dat;
}

/**
 * @class uklada do localStorage jak je strom rozklikany a vybranou polozku
 * @name JAK.Tree.Persist
 * @example
 *
 *   var treeBuilder = new JAK.Tree.Builder(treedata);
 *   this._treeRootNode = treeBuilder.build();
 *   var treePersist = new JAK.Tree.Persist(this._treeRootNode, "tree");
 *
 */
JAK.Tree.Persist = JAK.ClassMaker.makeClass({
 	NAME: "JAK.Tree.Persist",
	VERSION: "1.0"
});

/**
 * @param  {JAK.Tree.Node} 		node ... rootNode
 * @param  {String} 			localStorageKey ... pod timto klicem budeme ukladat v localStorage
 */
JAK.Tree.Persist.prototype.$constructor = function(node, localStorageKey) {
	this._localStorageKey = localStorageKey;
	this._node = node;

	JAK.signals.addListener(this, "treenode-expand", this._save.bind(this));
	JAK.signals.addListener(this, "treenode-collapse", this._save.bind(this));
	JAK.signals.addListener(this, "treenode-selected", this._save.bind(this));

	this._load();
}

JAK.Tree.Persist.prototype.erase = function() {
	localStorage.removeItem(this._localStorageKey);
}

/**
 * @returns {{}}
 */
JAK.Tree.Persist.prototype._getBaseObject = function() {
	return JSON.parse(localStorage.getItem(this._localStorageKey)) || {selected: null, opened: []};
}

/**
 * @param {{}} 				obj
 * @param {{}}				[obj.data]
 * @param {JAK.Tree.Node} 	[obj.target]
 * @param {Number} 			[obj.timeStamp]
 * @param {String} 			[obj.type]
 */
JAK.Tree.Persist.prototype._save = function(obj) {
	var ls = this._getBaseObject();

	switch (obj.type) {
		case "treenode-selected":
			ls.selected = obj.target.id();
			break;
		case "treenode-collapse":
			var nodeId = obj.target.id();
			var index = ls.opened.indexOf(nodeId);

			if (index != -1) { ls.opened.splice(index, 1); };

			break;
		case "treenode-expand":
			ls.opened.push(obj.target.id());
			break;
	}

	localStorage.setItem(this._localStorageKey, JSON.stringify(ls));
}

JAK.Tree.Persist.prototype._load = function() {
	var ls = this._getBaseObject();

	for (var i = 0; i < ls.opened.length; i++) {
		var node = this._node.getNode(ls.opened[i]);

		if (node) { node.expand(true); };
	}

	if (ls.selected) {
		var selectedNode = this._node.getNode(ls.selected);

		if (selectedNode) { selectedNode.select(true); };
	};
}
