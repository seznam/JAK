/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Vytváření a zachytávání vlastních uživatelských událostí
 * @version 2.1
 * @author jelc, zara
 */
 
/**
 * @class Třída pro práci s uživatelsky definovanými událostmi
 * @group jak
 */
JAK.Signals = JAK.ClassMaker.makeClass({
	NAME: "JAK.Signals",
	VERSION: "2.1"
});
 
JAK.Signals.prototype.$constructor = function() {
	/**
	 * @field {object} zásobník posluchačů událostí
	 */
	this._myHandleFolder = {};
	
	/**
	 * @field {object} pomocný IDčkový index pro rychlé odebírání - pro ID obsahuje pole typových zásobníků
	 */
	this._myIdFolder = {};
};

/**
 * registrace posluchače uživatelské události, pokud je již na stejný druh 
 * události zaregistrována shodná metoda shodného objektu nic se neprovede,
 * @param {object} owner objekt/třída,  která naslouchá, a v jehož oboru platnosti se zpracovaní události provede
 * @param {string} type	typ události, kterou chceme zachytit; možno zadat víc názvů naráz oddělených mezerami 
 * @param {string} funcOrString funkce/metoda posluchače, která má danou událost zpracovat
 * @param {object} sender objekt, jehož událost chceme poslouchat. Pokud není zadáno (nebo false), odesilatele nerozlišujeme
 * @returns {string || null} id události / null
 */
JAK.Signals.prototype.addListener = function(owner, type, funcOrString, sender){
	var newId = JAK.idGenerator(); /* identifikátor handlované události */
	var typeFolders = [];

	var data = {
		eOwner		: owner,
		eFunction	: funcOrString,
		eSender		: sender
	};
	
	var types = type.split(" ");
	for (var i=0;i<types.length;i++) {
		var t = types[i];
		
		if (!(t in this._myHandleFolder)) { /* zasobnik pro dany typ udalosti neexistuje musim ho vytvorit */
			this._myHandleFolder[t] = {};
		} 
		
		var typeFolder = this._myHandleFolder[t]; /* sem ukladam zaznam - vsichni poslouchajici na dany signal */
		
		var ok = true; /* test duplicitniho zaveseni */
		for (var id in typeFolder) { 
			var item = typeFolder[id];
			if (
				(item.eFunction == funcOrString) && 
				(item.eOwner == owner) &&
				(item.eSender == sender)
			) {
				ok = false;
			}
		}
		if (!ok) { continue; }

		/* konecne si to můžu zaregistrovat */
		typeFolder[newId] = data;
		typeFolders.push(typeFolder);
	}
	
	if (typeFolders.length) { /* jeste pridam do ID zasobniku */
		this._myIdFolder[newId] = typeFolders;
		return newId;
	} else {
		return null;
	}
};


/**
 * Odstranění naslouchání události.
 * @param {string} id ID události
 */
JAK.Signals.prototype.removeListener = function(id) {
	var typeFolders = this._myIdFolder[id];
	if (!typeFolders) { console.error("Cannot remove non-existent signal ID '"+id+"'"); }
	
	while (typeFolders.length) {
		var typeFolder = typeFolders.pop();
		delete typeFolder[id];
	}

	delete this._myIdFolder[id];
};

/**
 * provede odvěšení signálů podle jejich <em>id</em> uložených v poli
 * @param {array} array pole ID signálu jak je vrací metoda <em>addListener</em>
 */  
JAK.Signals.prototype.removeListeners = function(array) {
	while (array.length) {
		this.removeListener(array.shift());
	}
};

/**
 * vytváří událost, ukládá ji do zásobníku události a předává ji ke zpracování
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost 
 */   
JAK.Signals.prototype.makeEvent = function(type, trg, data) {
	var event = {
		type: type,
		target: trg,
		timeStamp: new Date().getTime(),
		data: (data && typeof data == 'object') ? data : null
	}
	this._myEventHandler(event);
};

/**
 * zpracuje událost - spustí metodu, která byla zaragistrována jako posluchač  
 * @param {object} myEvent zpracovávaná událost
 */    
JAK.Signals.prototype._myEventHandler = function(myEvent) {
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
