/**
 * @overview Objekt vnitrniho rozhrani definuje vlastnosti a metody nutne pro spravu 
 * internich udalosti je volan zdedenymi metodami u trid ktere maji implementovano rozhrani
 * @version 1.0
 * @author jelc, zara
 */
 SZN.SigInterface = SZN.ClassMaker.makeClass({
	NAME: "SigInterface",
	VERSION: "1.0",
	CLASS: "class"
});
 
 
/**
 * @class trida pro praci s uzivatelsky definovanymi udalostmi a zasilanim zprav,
 * pouziva se prostrednictvim dedenych vlastnosti z rozhrani SZN.Signals 
 * @name SZN.SigInterface
 * @param {object} owner objekt vlastnici tridu
 * @param {string} name nazev instance
 */
SZN.SigInterface.prototype.$constructor = function(owner,name){
	/** 
	 * @private
	 * @field {object}  vlastnik instance
	 */
	this._owner = owner;
	/** 
	 * @private
	 * @field {string} nazev instance
	 */	
	this._name = name;

	/** 
	 * @field {object} zasobnik zprav pro asyncroni processy apod...
 	 */
	this.messageFolder = new Object();
	/**
	 * @field {object} asociativni pole do ktereho se vkladaji vznikle udalosti a
	 * odkud se zpracovavvji	 
	 */
	this.myEventFolder = new Object();
	/**
	 * @field {object} zasobnik posluchacu udalosti
	 */
	this.myHandleFolder = new Object();
	/**
	 * @field {boolean} promena, ktera urcuje, zda je definovano nejake verejne API
	 * pro udalosti	 
	 */	
	this.apiDefined = true;
};

SZN.SigInterface.prototype.destructor = function(){
	// nothing now
};

/**
 * @method vkladani zprav, pouziva se prostrednictvim dedeneho rozhrani Signal
 * @param {string} msgName nazev zpravy 
 * @param {any} msgValue hodnota zpravy 
 */
SZN.SigInterface.prototype.setMessage = function(msgName,msgValue){
	this.messageFolder[msgName] = msgValue;
};

/**
 * metoda pro ziskani hodnoty konkretniho volani ulozeneho v zasobniku
 * @param {string} msgName nazev zpravy
 * @returns {any} hodnotu ulozeneho zpravy
 */
SZN.SigInterface.prototype.getMessage = function(msgName){
	return this.messageFolder[msgName];
};

/**
 * @method volani registrace posluchace uzivatelske udalosti, pokud je jiz na stejny druh 
 *  udalosti zaregistrovana shodna metoda shodneho objektu nic se neprovede, vola se zpozdenim
 *  metidu <em>_addListener</em> 
 * @param {object} owner	objekt/trida  ktera nasloucha, v jehoz oboru platnosti se zpracovani udalosti provede
 * @param {string} type	typ udalosti, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchace ktera ma danou udalost zpracovat
 * @returns {number} 1 v pripade neuspechu, 0 v pripade uspechu 
 */
SZN.SigInterface.prototype.addListener = function(owner,type,funcOrString){
	this._addTimoutFunc(owner,type,funcOrString);
	window.setTimeout(this.tmpHandled,1);	
};

/**
 * @method volani registrace posluchace uzivatelske udalosti, pokud je jiz na stejny druh 
 *  udalosti zaregistrovana shodna metoda shodneho objektu nic se neprovede, vola se <b>bez zpozdeni</b>
 *  metodu <em>_addListener</em> 
 * @param {object} owner	objekt/trida  ktera nasloucha, v jehoz oboru platnosti se zpracovani udalosti provede
 * @param {string} type	typ udalosti, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchace ktera ma danou udalost zpracovat
 * @returns {number} 1 v pripade neuspechu, 0 v pripade uspechu 
 */      
SZN.SigInterface.prototype.addNoDelayListener = function(owner,type,funcOrString){
	this._addListener(owner,type,funcOrString);
};


/**
 * @private
 * @method vlastni registrace posluchace uzivatelske udalosti, pokud je jiz na stejny druh 
 *  udalosti zaregistrovana shodna metoda shodneho objektu nic se neprovede
 * @param {object} owner	objekt/trida  ktera nasloucha, v jehoz oboru platnosti se zpracovani udalosti provede
 * @param {string} type	typ udalosti, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchace ktera ma danou udalost zpracovat
 * @returns {number} 1 v pripade neuspechu, 0 v pripade uspechu 
 */
SZN.SigInterface.prototype._addListener = function(owner,type,funcOrString){
	/* zasobnik pro dany typ udalosti neexistuje musim ho vytvorit */
	if(typeof(this.myHandleFolder[type]) != 'object'){
		this.myHandleFolder[type] = new Object();
	} 
	
	
	/* na tuto udalost je jiz predana funkce zavesena tak nic nedelam */
	for(var i in this.myHandleFolder[type]){
		if((this.myHandleFolder[type][i].eFunction == funcOrString) && 
		(this.myHandleFolder[type][i].eOwner == owner)){
			return 1;
		}
	}
	
	/* identifikator handlovane udalosti */
	var ids = SZN.idGenerator();
	//this.idsFlag++;
	
	/* konecne si to muzu zaregistrovat */
	this.myHandleFolder[type][ids] =	{
		eOwner		: owner,
		eFunction	: funcOrString
	};
	return 0;
};

/**
 * @method odstraneni naslouchani udalosti
 * argumenty:
 * @param {object} owner	objekt/trida  ktera naslouchala, v jehoz oboru platnosti se zpracovani udalosti provadelo
 * @param {string} type	typ udalosti, kterou jsme zachytavali
 * @param {string} functionName funkce/metoda posluchace ktera danou udalost zpracovavala
 * @returns {number} 0 v pripade uspechu, 1 v pripade neuspechu
 */
SZN.SigInterface.prototype.removeListener = function(owner,type,funcOrString){
	var removed = 1;
	for(var i in this.myHandleFolder[type]){
		if((this.myHandleFolder[type][i].eFunction == funcOrString) && 
		(this.myHandleFolder[type][i].eOwner == owner)){
			this.myHandleFolder[type][i] = null;
			delete(this.myHandleFolder[type][i]);
			removed = 0;
		}		
	}
	return removed;
};

/**
 * @method vytvarime udalost, uklada ji do zasobniku udalosti a predava ji ke zpracovani
 * @param {string} type nazev nove udalosti
 * @param {object} trg reference na objekt, ktery udalost vyvolal
 * @param {string} accessType urcuje zda bude udalost viditelna i ve verejnem rozhrani nebo pouze vnitrnim objektum [public | private]
 * @param {number} timestampcas vzniku udalosti 
 */   
SZN.SigInterface.prototype.makeEvent = function(type,trg,accessType,timestamp){
	var ids = SZN.idGenerator();
	this.myEventFolder['e-' + ids] = new this.NewEvent(type,trg,accessType,timestamp,ids);
	this.myEventHandler(this.myEventFolder['e-' + ids]);
};


/**
 * @class konstruktor vnitrni udalosti
 * @param {string} type nazev nove udalosti
 * @param {object} trg reference na objekt, ktery udalost vyvolal
 * @param {string} accessType urcuje zda bude udalost viditelna i ve verejnem rozhrani nebo pouze vnitrnim objektum [public | private]
 * @param {number} timestampcas vzniku udalosti 
 * @param {string} ids unikatni ID 
 */   
SZN.SigInterface.prototype.NewEvent = function(type,trg,access,time,ids){
	/** @field {string} typ udalosti*/
	this.type = type;
	/** @field {object}  objekt, ktery udalost vyvolal*/
	this.target = trg;
	/** @field {string}  specifikace pristupovych prav [public|private]*/
	this.accessType = access;
	/** @field {number} timestamp */
	this.timeStamp = time;
	/** 
	 * @private	
	 * @field {string} unikatni ID
	 */
	this._id = ids;
};


/**
 * method zpracuje udalost - spusti metodu, ktera byla zaragistrovana jako posluchac 
 * a je-li definovane API a udalost je verejna prada ji API handleru
 * definovano api predava mu udalost, je-li verejna, nakonec zavola zruseni udalosti
 * @param {object} myEvent zpracovavana udalost
 */    
SZN.SigInterface.prototype.myEventHandler = function(myEvent){
	var functionCache = [];

	for(var i in this.myHandleFolder){
		if((i == myEvent.type)){
			for(j in this.myHandleFolder[i]){
				functionCache.push(this.myHandleFolder[i][j]);
			}
		}
	}
	
	for (var i=0;i<functionCache.length;i++) {
		var item = functionCache[i];
		var owner = item.eOwner;
		var fnc = item.eFunction;
		if(typeof fnc == 'string'){
			owner[fnc](myEvent);
		} else if(typeof fnc == 'function'){
			fnc(myEvent);
		}
	}
	
	/* je-li definovano api  a je-li udalost api pristupna 
	 * predam mu udalost
	 */
	if((myEvent.accessType == 'public') 
	&& (this.apiDefined) 
	&& (myEvent._owner != 'api')){
		this._owner.apiHandler._apiEventHandler(myEvent);
	}	
	
	/* zrusim udalost */
	this.destroyEvent(myEvent._id);
};

/**
 * @method destruktor udalosti, odstrani udalost definovanou pomoci 'timestamp'
 * v zasobniku a smaze ji
 * @param {string} ids identifikator udalosti v zasobniku
 */     
SZN.SigInterface.prototype.destroyEvent = function(ids){
	this.myEventFolder['e-' + ids] = null;
	delete(this.myEventFolder['e-' + ids]);
};
/**
 * @private
 * @method sluzi k vytvoreni volani metody instance tridy se zpozdenim ve spravnem oboru platnosti,
 * zde je uvedeno aby trida nebyla zavisla na SZN.Events<br>
 * zde slouzi vyhradne jeko hack pro IE, ktere ma problemy pri soucasne praci s polem 
 *  eventFolder pri pridavani a odebirani posluchacu, pri pouziti tridy to jizz neni treba resit
 */  
SZN.SigInterface.prototype._addTimoutFunc = function(){
	var self = this;
	var args = new Array();
	for(var i = 0; i < arguments.length;i++){
		args[i] = arguments[i] 	
	}
	this['tmpHandled'] = function(){return self._addListener.apply(self,args)};
};
