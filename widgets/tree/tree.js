/**
 * @namespace Namespace pro všechny třídy stromu.
 * @name JAK.Tree
 */
JAK.Tree = JAK.ClassMaker.makeStatic({
 	NAME: "JAK.Tree",
	VERSION: "1.0"
});

JAK.Tree.ALERT_ERRORS = false;

/**
 * @class Třída pro vytváření a manipuaci s rozbalovacím stromem.
 * @name JAK.Tree.Node
 * @param {object} data Vstupní data uzlu.
 * @param {object} parent Odkaz na instanci rodiče. Pokud není považuje se uzel za ROOT.
 * @example 
 * //Příklad inicializace stromku:
 * var data = {
 *		title: "root",
 *		id: 'test',
 * 		className: 'uzel',
 * 		visualizer: 'Lines'
 * }
 * var tree = new JAK.Tree.Node(root,data);
 * var container = JAK.gEl("container");
 */
JAK.Tree.Node = JAK.ClassMaker.makeClass({
 	NAME: "JAK.Tree.Node",
	VERSION: "1.0",
	CLASS: "class",
	IMPLEMENT: [JAK.ISignals, JAK.IDecorable]
});


/**
 * @constructor
 * @param {JAK.Tree.Node} parent
 * @param {object} data
 */
JAK.Tree.Node.prototype.$constructor = function(parent, data){
	this._parentNode = parent || null;

	this.expanded = false;

	//z parametru data rozumime temto vlastnostem:

	//id html elementu
	if(data.id){
		this._id = data.id;
	} else {
		this._id = JAK.idGenerator();
	}
	//trida html elementu
	this._className = data.className || this._id;

	//textovy popisek uzlu
	this._title = data.title;

	//ve stromu muze byt jeden uzel selected, pak se treba muze jinak renderovat, ovladano pres metodu select
	this._selected = false;

	//visualizer se bud preda jako instance, nebo se vytvori pomoci staticke metody a pak je predavan string s nazvem, pokud neni nalezen, vytvori se JAK.Tree.Visualizer.Lines
	this._visualizer = data.visualizer instanceof Object ? data.visualizer : JAK.Tree.Visualizer.getInstance(data.visualizer);

	//data si ulozim, protoze nemusim rozumet vsemu
	this._data = data;

	//pole deti {JAK.Tree.Node}
	this._childNodes = [];
	//odkaz na html element (vetsinou UL), do ktereho se pripinaji deti, plni visualizator
	this._content = null;
	//odkaz na html element (vetsinou LI), reprezentujici tento uzel, plni visualizator
	this._container = null;
	//visualizator si sem uklada pro rychly pristup odkazy na dalsi html prvky reprezentujici uzel
	this._dom = {};
	//cache eventu navesenych na danou html reprezentaci
	this._ec = [];
}

/**
 * destruktor
 */
JAK.Tree.Node.prototype.$destructor = function(){
	//zruseni listeneru
	this._ec.forEach(JAK.Events.removeListener, JAK.Events);

	this._parentNode.content.removeChild(this.content);

	for (var i in this.dom) {
		this.dom[i] = null;
	}
}

JAK.Tree.Node.prototype.getContent = function() {
	return this._content;
}

JAK.Tree.Node.prototype.setContent = function(c) {
	this._content = c;
}

JAK.Tree.Node.prototype.getContainer = function() {
	return this._container;
}

JAK.Tree.Node.prototype.setContainer = function(c) {
	this._container = c;
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
	if(this.instanceOf(JAK.Tree.Leaf))var type = "Leaf";
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

JAK.Tree.Node.prototype.getData = function() {
	return this._data;
}


JAK.Tree.Node.prototype.visualize = function(visualizer) {
	if (visualizer) {
		this.visualizer() = visualizer;
	}

	/* reknu detem aby se vizualizovaly */
	this.visualizer().build(this);
	var childNodes = this.childNodes();
	for (var i = 0; i <childNodes.length; i++) {
		var domNode = childNodes[i].visualize();
		var c = this.getContent();
		c.appendChild(domNode);
	}
	return this.getContainer();
}


/**
 * "Přepočítání" vzhledu elementu.
 */
JAK.Tree.Node.prototype._visualize = function(){
	if (this.getContainer()) {
		this.visualizer().update(this);
	}
}


/**
 * přidá dítě do stromu
 * @param {JAK.Tree.Node} uzel stromu
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
	if(this.id() == id) return this;
	if(!(this.instanceOf(JAK.Tree.Leaf))){
		var childNodes = this.childNodes();
		for(var i = 0; i < childNodes.length; i++){
			var n = childNodes[i].getNode(id);
			if(n) return n;
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
 * @param {Bool} expanded Pokud je true uzel se rozbalí, jinak se sbalí.
 * @param {Number} [depth] Hloubka do jaké se rodiče rozbalí (-1 až k rootu)
 * @param {Number} [sibblingDepth] Rozbalí se i potomci rozbalených rodičů. (-1 všichni potomci)
 * @method
 */
JAK.Tree.Node.prototype.expandParents = function(expanded,depth,sibblingDepth){
	var p = this.parentNode();
	while(p!=null&&depth!=0){
		p.expand(!!expanded,sibblingDepth||0);
		p = p.parentNode();
		depth--;
	}
}

// branch
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
 */
JAK.Tree.Node.prototype.expand = function(){
	this.expanded = true;
	this._visualize();
	this.makeEvent('treenode-expand');
}

/**
 * Sbalí uzel.
 * @method
 */
JAK.Tree.Node.prototype.collapse = function(){
	this.expanded = false;
	this._visualize();
	this.makeEvent('treenode-collapse');
}

JAK.Tree.Node.prototype.nextSibling = function() {
	if (this.parentNode() && this.parentNode().childNodes()) {
		var childNodes = this.parentNode().childNodes();
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i]._self() == this._self() && childNodes[i+1]) {
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
			if (childNodes[i]._self() == this._self() && childNodes[i-1]) {
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

JAK.Tree.Node.prototype.getDom = function() {
	return this._dom;
}

JAK.Tree.Node.prototype.addAttachedEvent = function(eventId) {
	this._ec.push(eventId);
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

JAK.Tree.Node.prototype.title = function(str) {
	if (str) {
		this._title = str;
	}
	return this._title;
}

JAK.Tree.Node.prototype.id = function(id) {
	if (id) {
		this._id = id;
	}
	return this._id;
}

JAK.Tree.Node.prototype.className = function(cn) {
	if (cn) {
		this._className = cn;
	}
	return this._className;
}

/**
 * pri dekoratorech nezjistime zvnejsku instanceof elementu zda je leaf nebo node
 * proto zavadime tuto metodu, ktera to porovnani vykona a vrati vysledek.
 * @param {Function} className  
 * @return bool  
 */ 
JAK.Tree.Node.prototype.instanceOf = function(className) {
	return this instanceof className;
}

/**
 * metoda vraci sama sebe, dulezite pro to pokud je objekt dekorovan, aby slo zjistit pres instanceof zda jde o list nebo node
 * @return JAK.Tree.Node nebo JAK.Tree.Leaf
 * @private 
 */
JAK.Tree.Node.prototype._self = function () {
	return this;
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
 */
JAK.Tree.Node.prototype.select = function() {
	var root = this.getRootNode();
	root.recurse("unselect", -1);

	this._selected = true;
	this._visualize();
	this.makeEvent('treenode-selected');
}

/**
 * odznaci node jako vybrany
 * @public
 */
JAK.Tree.Node.prototype.unselect = function() {
	if (this._selected) {
		this._selected = false;
		this._visualize();
		this.makeEvent('treenode-unselected');
	}
}

/**
 * metoda volana pri kliknuti na expanzni cudlik
 * @param e
 * @param elm
 */
JAK.Tree.Node.prototype._expandCollapseClick = function(e, elm) {
	if (this.expanded) {
		this.collapse();
	} else {
		this.expand();
	}
}

/**
 * metoda volana pri kliknuti na textovy nazev uzlu
 * @param e
 * @param elm
 */
JAK.Tree.Node.prototype._nameClick = function(e, elm) {
	this.makeEvent('treenode-nameClick');
	this.select();
}



/**
 * @class List stromu.
 * @extends JAK.Tree.Node
 * @name JAK.Tree.Leaf
 */
JAK.Tree.Leaf = JAK.ClassMaker.makeClass({
 	NAME: "JAK.Tree.Leaf",
	VERSION: "1.0",
	CLASS: "class",
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
	// vytvoreni requestu
	node.request = new JAK.HTTPRequest(false,node,"_requestHandler");
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

	// odeslani requestu
	this.request.send(url,false,false);
}

JAK.Tree.Node.Feature.AjaxExpand.prototype._requestHandler = function(data){
	// zpracovani JSONu pomoci zdedene metody
	var dat = this._JSON(data);
	// pridame uzlu vytouzene potomky
	if(dat) {
		//vybuildeni deti do stromove struktury
		var treeBuilder = new JAK.Tree.Builder(false);
		 treeBuilder.buildChildren(this, dat.childNodes);
		//vyrenderovani deti a pripnuti jejich obsahu do rodice
		var cn = this.childNodes();
		for (var i =0; i < cn.length; i++ ){
			var domelm = cn[i].visualize();
			this.getContent().appendChild(domelm);
		}
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
