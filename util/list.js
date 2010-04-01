/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Spojity seznam
 * @version 2.0
 * @author jelc, zara
 */ 
 
/**
 * @class konstruktor seznamu
 * @group jak-utils
 */     
JAK.List = JAK.ClassMaker.makeClass({
	NAME: "JAK.List",
	VERSION: "2.0"
});

/** 
 * @param {array} any <strong>volitelne</strong> pole ze ktereho se seznam vytvori
 */
JAK.List.prototype.$constructor = function(){
	/** @field {array | null} vstupni data, jsou-li zadana */
	this.inputData = (arguments[0]) && (arguments[0] instanceof Array) ? arguments[0] : null;
	/** @field {object} vlastni seznam */
	this.items = new Object();
	/** @field {object} odkaz na prvni polozku seznamu */
	this.firstItem = null;
	/** @field {object} odkaz na posledni polozku seznamu */
	this.lastItem = null;

	if((this.inputData != null) && (this.inputData.length)){
		this.fillFromArray(this.inputData);
	}
};

/**
 * @method destruktor
 */  
JAK.List.prototype.$destructor = function(){
	this.items = null;
	delete(this.items);
	for (var p in this) { this[p] = null; }
};

/**
 * @method vytvori seznam ze zadaneho pole
 * @param {array} field vstupni pole
 */  
JAK.List.prototype.fillFromArray = function(field){
	for(var i = 0; i < field.length; i++){
		this.insertItem(field[i]);
	}
};
/**
 * @method vrati seznam jako pole jeho polozek
 * @returns {array}
 */  
JAK.List.prototype.getArray = function(){
	var out = new Array();
	var item = this.firstItem;
	if(!item) {
		return [];
	}	
	do {
		var ln = out.length;
		out[ln] = item.content;
	} while(item = item.nextItem)
	return out;
};
/**
 * @method vraci delku seznamu (pocet polozek)
 * @returns {int} pocet polozek
 */  
JAK.List.prototype.getLength = function(){
	var cnt = 0;
	var item = this.firstItem;
	if(!item) {
		return 0;
	}
	do {
		cnt++;
	} while(item = item.nextItem);
	return cnt;
};
/**
 * @method vytvori polozku seznamu, ale neumisti ji do seznamu
 * @param {any} param data, ktera ma polozka obsahovat (budou ulozena ve vlastnosti 'content' polozky)
 * @returns {object} polozka seznamu
 */   
JAK.List.prototype.createItem = function(param){
	var item = new this._itemPattern(param);
	item._ids = this._setIds();
	return item;
};
/**
 * @method vytvfori a vlozi polozku na konec seznamu
 * @param {any} itemValue data, ktera ma polozka obsahovat (budou ulozena ve vlastnosti 'content' polozky)
 * @returns {object} pridana polozka jiz jako soucast seznamu (bude zaroven lastItem)
 */   
JAK.List.prototype.insertItem = function(itemValue){
	var item = this.createItem(itemValue);
	return this.appendItem(item);	
};

/**
 * @private
 * @group jak-utils
 * @class konstruktor polozky seznamu
 * @param {any} itemValue data, ktera ma polozka obsahovat (budou ulozena ve vlastnosti 'content' polozky)
 */   
JAK.List.prototype._itemPattern = function(data){
	/** @field {object} predchozi polozka */
	this.previousItem = null;
	/** @field {object} nasledujici polozka */
	this.nextItem = null;
	/** @field {any}  vlastni obsah polozky */
	this.content = data;
	/**
	 * @private
	 * @field {string} unikatni ID polozky
	 */	 	 	
	this._ids = null;
	/** @field {string} definice typu objektu */
	this.type = 'listItem';
};

/**
 * @method prida vytvorenou polozku na konec seznamu, pokud je soucasti seznamu premisti ji
 * @param {object} polozka seznamu
 * @returns {object} pridavana polozka seznamu
 * @throws {error} 'List.appendItem: param ins\'t listItem' argument neni polozka seznamu
 */   
JAK.List.prototype.appendItem = function(param){
	if(!this._isItem(param)){
		throw new Error('List.appendItem: param ins\'t listItem');
	}
	var item = this._checkItem(param);
	this.items[item._ids] = item;
	if(!this.firstItem){
		this.firstItem = this.items[item._ids];
		this.lastItem = this.items[item._ids];
	} else {
		this.items[item._ids].previousItem = this.lastItem;
		this.items[item._ids].previousItem.nextItem = this.items[item._ids];
		this.lastItem = this.items[item._ids];	
	}
	return this.lastItem;	
};
/**
 * @method odstrani polozku seznamu a vrati odstranenou polozku
 * @param {object} polozka seznamu
 * @returns {object} odstranena polozka seznamu
 * throws {error} 'List.removeItem: param ins\'t listItem' nejadna se o polozku seznamu
 * throws {error}  "List.removeItem: item isn't from this list" polozka neni z tohoto seznamu
 */   
JAK.List.prototype.removeItem = function(param){
	if(!this._isItem(param)){
		throw new Error('List.removeItem: param ins\'t listItem');
	}
	if(typeof(this.items[param._ids]) == 'undefined'){
		throw new Error("List.removeItem: item isn't from this list");		
	}
	if(param == this.lastItem){
		this.lastItem = param.previousItem ? param.previousItem : null;
		if(this.lastItem){
			this.lastItem.nextItem = null
		}
		if(param == this.firstItem){
			this.firstItem = null;
		}
	} else if(param == this.firstItem){
		this.firstItem = param.nextItem ? param.nextItem : null;
		this.firstItem.previousItem = null;
	} else {
		param.previousItem.nextItem = param.nextItem;
		param.nextItem.previousItem = param.previousItem;
	}
	var output = this._clone(param);
	this._delete(param);
	return output;
};

/**
 * @method vlozi polozku seznamu <em>newItem</em> pred <em>refItem</em>
 * @param {object} newItem vkladana polozka seznamu
 * @param {object} refItem referencni polozka seznamu, pred, kterou vlozime newitem
 * @return {object} vkladana polozka seznamu
 * @throws {error} 'List.insertBefore: newItem ins\'t listItem' nevkladame polozku seznamu
 * @throws {error} 'List.insertBefore: refItem ins\'t listItem' refItem neni polozka seznamu
 * @throws {error} "List.insertBefore: refItem isn't from this list" refItem neni polozka tohoto seznamu
 */     
JAK.List.prototype.insertBefore = function(newItem,refItem){
	if(!this._isItem(newItem)){
		throw new Error('List.insertBefore: newItem ins\'t listItem');
	}
	if(!this._isItem(refItem)){
		throw new Error('List.insertBefore: refItem ins\'t listItem');
	}	
	if(newItem == refItem){
		return newItem;
	} else if(typeof(this.items[refItem._ids]) == 'undefined') {
		throw new Error("List.insertBefore: refItem isn't from this list");
	}
	var item = this._checkItem(newItem);
	item.previousItem = refItem.previousItem;
	item.nextItem = refItem;
	this.items[item._ids] = item;
	if(refItem != this.firstItem){
		this.items[item._ids].previousItem.nextItem = this.items[item._ids];
	} else {
		this.firstItem = this.items[item._ids];
	}
	refItem.previousItem = this.items[item._ids];
	return this.items[item._ids];
};

/**
 * @method vlozi do seznamu polozku newItem, misto polozky refItem a tuto odstrani ze seznamu
 * @param {object} newItem vkladana polozka seznamu
 * @param {object} refItem referencni polozka seznamu kterou chceme zamenit za newItem
 * @returns {object} odstranovana polozka seznamu
 * @throws {error} 'List.replaceItem: newItem ins\'t listItem' nevkladame polozku seznamu
 * @throws {error} 'List.replaceItem: refItem ins\'t listItem' refItem neni polozka seznamu
 * @throws {error} "List.replaceItem: refItem isn't from this list" refItem neni polozka tohoto seznamu
 */    
JAK.List.prototype.replaceItem = function(newItem,refItem){
	if(!this._isItem(newItem)){
		throw new Error('List.replaceItem: newItem ins\'t listItem');
	}
	if(!this._isItem(refItem)){
		throw new Error('List.replaceItem: refItem ins\'t listItem');
	}
	if(newItem == refItem){
		return newItem;
	} else if (typeof(this.items[refItem._ids]) == 'undefined'){
		throw new Error("List.replaceItem: item isn't from this list");
	} else {
		var item = this._checkItem(newItem);
		item.previousItem = refItem.previousItem;
		item.nextItem = refItem.nextItem;
		this.items[refItem._ids] = item;
		return refItem;	
	}
};
/**
 * @private
 * @method testuje zda je argument polozkou seznamu, tedy typu 'listItem'
 * @param {any} param testovana promena
 * @returns {boolean} true v pripade uspechu, jinak false 
 */   
JAK.List.prototype._isItem = function(param){
	if ((typeof param.type != 'undefined') && (param.type == 'listItem')){
		return true;
	} else {
		return false;
	}
};
/**
 * @private
 * @method pokud je argument polozkou seznamu odstrani ji a vrati, jinak ji pouze vrati
 * @param {object}  polozka seznamu
 * @returns {object} svuj argument 
 */  
JAK.List.prototype._checkItem = function(param){
	if(typeof(this.items[param._ids]) != 'undefined'){
		return this.removeItem(param);	
	} else {
		return param;
	}		
};

/**
 * @private
 * @method vytvori kopii polozky, ale bez odkazu na predchozi a nasledujici polozku
 * @param {object} param kopirovana polozka
 * @returns kopiie polozky
 */    
JAK.List.prototype._clone = function(param){
	var temp = new Object();
	for(var i in param){
		if((i != 'previousItem') && (i != 'nextItem')){
			temp[i] = param[i];
		}
	}
	temp.previousItem = null;
	temp.nextItem = null;
	temp._ids = null;
	return temp;
};
/**
 * @privata
 * @method smaze polozku seznamu (neodstrani reference sousedicich polozek!!!)
 * @param {object} param mazana polozka 
 */  
JAK.List.prototype._delete = function(param){
	var removedIds = param._ids;
	for(var i in param){
		param[i] = null;
		delete(param[i]);
	}
	this.items[removedIds] = null;
	delete(this.items[removedIds]);
	delete(param);
};
/**
 * @private
 * @method vytvari unikarni ID pro polozky, zde je aby trida nezavisela na SZN
 * @returns {id} unikatni ID
 */   
JAK.List.prototype._setIds = function(){
	var flag = new Date();
	this._cnt = this._cnt < 10000000 ? this._cnt : 0;
	var ids = 'm' + flag.getTime().toString(16) +  'm' + this._cnt.toString(16);
	this._cnt++;
	return ids;
};
