/**
 * @overview Vytváření a zachytávání vlastních uživatelských událostí, správa
 * globálních zpráv
 * @version 1.0
 * @author jelc, zara
 */
 SZN.Signals = SZN.ClassMaker.makeClass({
	NAME: "Signals",
	VERSION: "1.0",
	CLASS: "class"
});
 
 
/**
 * @class třída pro práci s uživatelsky definovanými událostmi a správou 
 * globálních zpráv,
 * @name SZN.Signals
 * @param {object} owner objekt vlastnící instanci třídy
 * @param {string} name název instance
 */
SZN.Signals.prototype.$constructor = function(owner,name){
	/** 
	 * @private
	 * @field {object}  vlastník instance
	 */
	this._owner = owner;
	/** 
	 * @private
	 * @field {string} název instance
	 */	
	this._name = name;

	/** 
	 * @field {object} zásobník zpráv pro asyncroní processy apod...
 	 */
	this.messageFolder = new Object();
	/**
	 * @field {object} asociativní pole, do kterého se vkládají vzniklé události a
	 * odkud se zpracovávají	 
	 */
	this.myEventFolder = new Object();
	/**
	 * @field {object} zásobník posluchačů událostí
	 */
	this.myHandleFolder = new Object();
	/**
	 * @field {boolean} proměná, která určuje, zda je definováno nějaké veřejné API
	 * pro události	 
	 */	
	this.apiDefined = true;
};

SZN.Signals.prototype.$destructor = function(){
	// nothing now
};

/**
 * vkládání "globálních" zpráv
 * @method 
 * @param {string} msgName název zprávy 
 * @param {any} msgValue hodnota zprávy 
 */
SZN.Signals.prototype.setMessage = function(msgName,msgValue){
	this.messageFolder[msgName] = msgValue;
};

/**
 * metoda pro získání hodnoty konkrétní "globální" zprávy
 * @param {string} msgName název zprávy
 * @returns {any} hodnotu uložená zprávy
 */
SZN.Signals.prototype.getMessage = function(msgName){
	return this.messageFolder[msgName];
};

/**
 * registrace posluchače uživatelské události, pokud je již na stejný druh 
 * události zaregistrována shodná metoda shodného objektu nic se neprovede,
 * @method  
 * @param {object} owner	objekt/třída,  která naslouchá, a v jehož oboru platnosti se zpracování události provede
 * @param {string} type	typ události, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchače, která ma danou událost zpracovat
 * @returns {number} 1 v případě neúspěchu, 0 v pripade úspěchu 
 */
SZN.Signals.prototype.addListener = function(owner,type,funcOrString){
	this._addListener(owner,type,funcOrString);	
};

/**
 * vlastni registrace posluchače uživatelské události
 * @private
 * @method  
 * @param {object} owner	objekt/třída,  která naslouchá, a v jehož oboru platnosti se zpracovaní události provede
 * @param {string} type	typ události, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchače, která má danou událost zpracovat
 * @returns {number} 1 v případě neúspěchu, 0 v pripade úspěchu 
 */
SZN.Signals.prototype._addListener = function(owner,type,funcOrString){
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
	
	/* identifikátor handlované události */
	var ids = SZN.idGenerator();
	//this.idsFlag++;
	
	/* konecne si to můžu zaregistrovat */
	this.myHandleFolder[type][ids] =	{
		eOwner		: owner,
		eFunction	: funcOrString
	};
	return 0;
};

/**
 * odstranění naslouchání události
 * @method 
 * @param {object} owner	objekt/třída  ktera naslouchala, a v jehož oboru platnosti se zpracování události provádělo
 * @param {string} type	typ události, kterou jsme zachytávali
 * @param {string} functionName funkce/metoda posluchače, která danou událost zpracovávala
 * @returns {number} 0 v případě úspěchu, 1 v případě neúspěchu
 */
SZN.Signals.prototype.removeListener = function(owner,type,funcOrString){
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
 * vytváří událost, ukládá ji do zásobníku události a předává ji ke zpracování
 * @method 
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {number} timestamp čas vzniku události 
 */   
SZN.Signals.prototype.makeEvent = function(type,trg,accessType,timestamp){
	var ids = SZN.idGenerator();
	this.myEventFolder['e-' + ids] = new this.NewEvent(type,trg,accessType,timestamp,ids);
	this.myEventHandler(this.myEventFolder['e-' + ids]);
};


/**
 * @class konstruktor vnitřní události
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {number} timestamp čas vzniku události 
 * @param {string} ids unikatní ID 
 */   
SZN.Signals.prototype.NewEvent = function(type,trg,access,time,ids){
	/** @field {string} typ události*/
	this.type = type;
	/** @field {object}  objekt, který událost vyvolal*/
	this.target = trg;
	/** @field {string}  specifikace přístupových prav [public|private]*/
	this.accessType = access;
	/** @field {number} timestamp */
	this.timeStamp = time;
	/** 
	 * @private	
	 * @field {string} unikatní ID
	 */
	this._id = ids;
};


/**
 * zpracuje událost - spustí metodu, která byla zaragistrována jako posluchač  
 * a je-li definované API a událost je veřejná předá ji API handleru
 * definovaného API nakonec zavolá zrušení události
 * @method 
 * @param {object} myEvent zpracovávaná událost
 */    
SZN.Signals.prototype.myEventHandler = function(myEvent){
	var functionCache = [];

	for(i in this.myHandleFolder){
		if((i == myEvent.type)){
			for(j in this.myHandleFolder[i]){
				functionCache.push(this.myHandleFolder[i][j]);
			}
		}
	}
	
	for (i=0;i<functionCache.length;i++) {
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
 * destruktor události, odstraní událost definovanou 
 * v zásobniku a smaže ji
 * @method 
 * @param {string} ids identifikátor události v zásobníku
 */     
SZN.Signals.prototype.destroyEvent = function(ids){
	this.myEventFolder['e-' + ids] = null;
	delete(this.myEventFolder['e-' + ids]);
};

