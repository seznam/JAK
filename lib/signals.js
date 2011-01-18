/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Vytváření a zachytávání vlastních uživatelských událostí, správa
 * globálních zpráv
 * @version 2.0
 * @author jelc, zara
 */
 
/**
 * @class třída pro práci s uživatelsky definovanými událostmi a správou 
 * globálních zpráv.
 * @group jak
 */
 JAK.Signals = JAK.ClassMaker.makeClass({
	NAME: "Signals",
	VERSION: "2.0",
	CLASS: "class"
});
 
/**
 * @param {object} owner objekt vlastnící instanci třídy
 * @param {string} name název instance
 */
JAK.Signals.prototype.$constructor = function(owner,name){
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
	 * @field {object} zásobník zpráv pro asynchroní processy apod...
 	 */
	this.messageFolder = {};

	/**
	 * @field {object} zásobník posluchačů událostí
	 */
	this._myHandleFolder = {};
	
	/**
	 * @field {object} pomocný IDčkový index pro rychlé odebírání
	 */
	this._myIdFolder = {};
};

JAK.Signals.prototype.$destructor = function(){
	// nothing now
};

/**
 * vkládání "globálních" zpráv
 * @method 
 * @param {string} msgName název zprávy 
 * @param {any} msgValue hodnota zprávy 
 */
JAK.Signals.prototype.setMessage = function(msgName,msgValue){
	this.messageFolder[msgName] = msgValue;
};

/**
 * metoda pro získání hodnoty konkrétní "globální" zprávy
 * @param {string} msgName název zprávy
 * @returns {any} hodnotu uložená zprávy
 */
JAK.Signals.prototype.getMessage = function(msgName){
	return this.messageFolder[msgName];
};

/**
 * registrace posluchače uživatelské události, pokud je již na stejný druh 
 * události zaregistrována shodná metoda shodného objektu nic se neprovede,
 * @method  
 * @param {object} owner objekt/třída,  která naslouchá, a v jehož oboru platnosti se zpracovaní události provede
 * @param {string} type	typ události, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchače, která má danou událost zpracovat
 * @param {object} sender objekt, jehož událost chceme poslouchat. Pokud není zadáno (nebo false), odesilatele nerozlišujeme
 * @returns {id} id události / null
 */
JAK.Signals.prototype.addListener = function(owner, type, funcOrString, sender){
	/* zasobnik pro dany typ udalosti neexistuje musim ho vytvorit */
	if (!(type in this._myHandleFolder)) {
		this._myHandleFolder[type] = {};
	} 
	
	/* sem ukladam zaznam */
	var typeFolder = this._myHandleFolder[type];

	/* na tuto udalost je jiz predana funkce zavesena tak nic nedelam */
	for (var id in typeFolder){
		var item = typeFolder[id];
		if (
			(item.eFunction == funcOrString) && 
			(item.eOwner == owner) &&
			(item.eSender == sender)
		) {
			return null;
		}
	}

	/* identifikátor handlované události */
	var id = JAK.idGenerator();
	
	/* konecne si to můžu zaregistrovat */
	typeFolder[id] = {
		eOwner		: owner,
		eFunction	: funcOrString,
		eSender		: sender
	};
	
	/* jeste pridam do ID zasobniku */
	this._myIdFolder[id] = typeFolder;
	
	return id;
};


/**
 * Odstranění naslouchání události.
 * @param {id} id ID události
 */
JAK.Signals.prototype.removeListener = function(id) {
	var typeFolder = this._myIdFolder[id];
	if (!typeFolder) { throw new Error("Cannot remove non-existent signal ID '"+id+"'"); }

	delete typeFolder[id];
	delete this._myIdFolder[id];
};

/**
 * provede odvěšení signálů podle jejich <em>id</em> uložených v poli
 * @param {array} array pole ID signálu jak je vrací metoda <em>addListener</em>
 */  
JAK.Signals.prototype.removeListeners = function(array) {
	while(array.length) {
		this.removeListener(array.shift());
	}
};

/**
 * vytváří událost, ukládá ji do zásobníku události a předává ji ke zpracování
 * @method 
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost 
 */   
JAK.Signals.prototype.makeEvent = function(type, trg, data){
	var event = new JAK.Signals.NewEvent(type, trg, data);
	this.myEventHandler(event);
};

/**
 * @class konstruktor vnitřní události
 * @group jak
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} id unikatní ID 
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost 
 */   
JAK.Signals.NewEvent = function(type, trg, data){
	/** @field {string} typ události*/
	this.type = type;
	/** @field {object}  objekt, který událost vyvolal*/
	this.target = trg;
	/** @field {int} timestamp */
	this.timeStamp = new Date().getTime();
	/** @field {object} data specifická pro danou událost (definuje je původce události) */	 	
	this.data =  (data && typeof data == 'object') ? data : null;
};

/**
 * zpracuje událost - spustí metodu, která byla zaragistrována jako posluchač  
 * @method 
 * @param {object} myEvent zpracovávaná událost
 */    
JAK.Signals.prototype.myEventHandler = function(myEvent){
	var functionCache = [];

	for (var type in this._myHandleFolder){
		if (type == myEvent.type || type == "*") { /* shoda nazvu udalosti */
			for (var p in this._myHandleFolder[type]) {
				var item = this._myHandleFolder[type][p];
				if (!item.eSender || item.eSender == myEvent.target) {
					functionCache.push(item);
				}
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
};

/**
 * Výchozí instance
 */
JAK.signals = new JAK.Signals();
