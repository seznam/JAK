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
 * @overview Vytváření a zachytávání vlastních uživatelských událostí, správa
 * globálních zpráv
 * @version 1.5
 * @author jelc, zara
 */
 
/**
 * @class třída pro práci s uživatelsky definovanými událostmi a správou 
 * globálních zpráv.
 * @group jak
 */
 JAK.Signals = JAK.ClassMaker.makeClass({
	NAME: "Signals",
	VERSION: "1.5",
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
	 * @field {object} zásobník zpráv pro asyncroní processy apod...
 	 */
	this.messageFolder = {};
	/**
	 * @field {object} asociativní pole, do kterého se vkládají vzniklé události a
	 * odkud se zpracovávají	 
	 */
	this.myEventFolder = {};
	
	/**
	 * @field {object} zásobník posluchačů událostí
	 */
	this._myHandleFolder = {};
	
	/**
	 * @field {object} pomocný IDčkový index pro rychlé odebírání
	 */
	this._myIdFolder = {};
	
	/**
	 * @field {object} proměná, která určuje, zda je definováno nějaké veřejné API
	 * pro události	 
	 */	
	this.apiHandler = null;
};

JAK.Signals.prototype.$destructor = function(){
	// nothing now
};

JAK.Signals.prototype.setApiHandler = function(handler) {
	this.apiHandler = handler;
}

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
 * Odstranění naslouchání události. Lze též zadat jen ID navěšené události (jako jediný parametr).
 * @method 
 * @param {object} owner objekt/třída  ktera naslouchala, a v jehož oboru platnosti se zpracování události provádělo
 * @param {string} type	typ události, kterou jsme zachytávali
 * @param {string} functionName funkce/metoda posluchače, která danou událost zpracovávala
 * @param {object} sender objekt, jehož událost jsme poslouchali
 * @returns {int} 0 v případě úspěchu, 1 v případě neúspěchu
 */
JAK.Signals.prototype.removeListener = function(owner, type, funcOrString, sender) {
	var id = null;
	
	if (arguments.length == 1) { /* odstraneni pomoci ID */
		id = arguments[0];
	} else { /* odstraneni pomoci vsech parametru */
		var typeFolder = this._myHandleFolder[type];
		for (var p in typeFolder) {
			var item = typeFolder[p];
			if (
				(item.eFunction == funcOrString) && 
				(item.eOwner == owner) &&
				(item.eSender == sender)
			) { id = p; }
		}
	}

	if (!id) { return 1; }

	var typeFolder = this._myIdFolder[id];
	delete typeFolder[id];
	delete this._myIdFolder[id];
	return 0;
};

/**
 * vytváří událost, ukládá ji do zásobníku události a předává ji ke zpracování
 * @method 
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {int} timestamp čas vzniku události 
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost 
 */   
JAK.Signals.prototype.makeEvent = function(type,trg,accessType,timestamp,data){
	var ids = JAK.idGenerator();
	this.myEventFolder['e-' + ids] = new JAK.Signals.NewEvent(type,trg,accessType,timestamp,ids, data);
	this.myEventHandler(this.myEventFolder['e-' + ids]);
};

/**
 * @class konstruktor vnitřní události
 * @group jak
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {int} timestamp čas vzniku události 
 * @param {string} ids unikatní ID 
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost 
 */   
JAK.Signals.NewEvent = function(type,trg,access,time,ids,data){
	/** @field {string} typ události*/
	this.type = type;
	/** @field {object}  objekt, který událost vyvolal*/
	this.target = trg;
	/** @field {string}  specifikace přístupových prav [public|private]*/
	this.accessType = access;
	/** @field {int} timestamp */
	this.timeStamp = time;
	/** 
	 * @private	
	 * @field {string} unikatní ID
	 */
	this._id = ids;
	/** @field {object} data specifická pro danou událost (definuje je původce události) */	 	
	this.data =  (data && typeof data == 'object') ? data : null;
};


/**
 * zpracuje událost - spustí metodu, která byla zaragistrována jako posluchač  
 * a je-li definované API a událost je veřejná předá ji API handleru
 * definovaného API nakonec zavolá zrušení události
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
	
	/* je-li definovano api  a je-li udalost api pristupna 
	 * predam mu udalost
	 */
	if((myEvent.accessType == 'public') 
	&& (this.apiHandler != null) 
	&& (myEvent._owner != 'api')){
		this.apiHandler._apiEventHandler(myEvent);
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
JAK.Signals.prototype.destroyEvent = function(ids){
	this.myEventFolder['e-' + ids] = null;
	delete(this.myEventFolder['e-' + ids]);
};
JAK.signals = new JAK.Signals();
