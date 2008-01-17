/**
 * @overview Rozhraní určené k práci s uživatelskými událostmi a "globálními" 
 * zprávami, které zjednodušuje práci s objektem, který se o uživatelsky 
 * definované události stará
 * @name SZN.SigInterface
 * @version 1.0
 * @author jelc, zara
 */   

/**
 * @class třída pro dědění rozhraní "SigInterface", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností.
 * Rozhraní pro práci s uživatelsky definovanými událostmi a zprávami
 * vyžaduje referenci na instanci třídy SZN.signals, všechny následující metody
 * jsou určeny k použití pouze jako zděděné vlastnosti rozhraní,
 * @see <strong>SZN.signals</strong> 
 */  
SZN.SigInterface = SZN.ClassMaker.makeClass({
	NAME: "SigInterface",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * slouží k nalezení rozhraní u rodičovských tříd, hledá v nadřazených třídách třídu,
 * ktera ma nastavenou vlastnost TOP_LEVEL a v ni očekává instanci třídy SZN.Signals s
 * nazvem "interfaceName"
 * @method   
 * @param {string}	interfaceName  název instance třídy SZN.Signals v daném objektu 
 * @returns {object} referenci na instanci třídy SZN.Signals
 * @throws {error} 	SetInterface:Interface not found  
 */
SZN.SigInterface.prototype.setInterface = function(interfaceName){
	if(typeof(this[interfaceName]) != 'object'){
		var owner = this._owner;
		while(typeof(owner[interfaceName])== 'undefined'){
			if(typeof owner.TOP_LEVEL != 'undefined'){
				throw new Error('SetInterface:Interface not found');
			} else {
				owner = owner._owner;
			}
		}
		return owner[interfaceName];
	} 
};

/**
 * slouží k registraci zachytávaní události
 * @method  
 * @param {object} myListener objekt v jehož oboru platnosti se bude zachycená udaálost zpracovávat
 * @param {string} type název události, kterou chceme zachytit
 * @param {string} handleFunction název metody objektu 'myListener', která bude zpracovávat událost
 * @throws {error} pokud neexistuje odkaz na instanci SZN.Signals vyvolá chybu 'Interface not defined'
 */
SZN.SigInterface.prototype.addListener = function(myListener,type,handleFunction){
	if(typeof(this.signals) == 'object'){
		this.signals.addListener(myListener,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * slouží k zrušení zachytáváni události
 * @method  
 * @param {object} myListener objekt v jehož oboru platnosti se  zachycená událost zpracovávala
 * @param {string} type název události, kterou jsme zachytávali
 * @param {string} handleFunction název metody objektu 'myListener', která udalost zpracovávala
 * @throws {error} pokud neexistuje odkaz na instanci SZN.Signals vyvolá chybu 'Interface not defined'
 */
SZN.SigInterface.prototype.removeListener = function(myListener,type,handleFunction){
	if(typeof(this.signals) == 'object'){
		this.signals.removeListener(myListener,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * vytváří novou událost, kterou zachytáva instance třídy SZN.signals
 * @method 
 * @param {string} type název vyvolané události
 * @param {object} trg reference na objekt, ktery událost vyvolal
 * @param {string} accessType určuje zda bude událost viditelná i ve veřejném rozhraní
 *					  nebo pouze vnitrnim objektum [private | public]
 * @throws {error} pokud neexistuje odkaz na instanci SZN.Signals vyvolá chybu 'Interface not defined'  
 */
SZN.SigInterface.prototype.makeSigEvent = function(type,trg,accessType){
	if(typeof(this.signals) == 'object'){
		var time = new Date().getTime();
		this.signals.makeEvent(type,trg,accessType,time);
	} else {
		throw new Error('Interface not defined');
	}
};
/**
 * nastavuje zprávu se jménem <em>msgName</em> na hodnotu <em>msgValue</em>
 * @method 
 * @param {string} msgName název zprávy
 * @param {any} msgValue obsah zprávy
 */   
SZN.SigInterface.prototype.setSysMessage = function(msgName,msgValue){
	this.signals.setMessage(msgName,msgValue);
};
/**
 * čte zprávu se jménem <em>msgName</em>
 * @method 
 * @param {string} msgName název zprávy
 * @return {any} obsah zprávy
 */ 
SZN.SigInterface.prototype.getSysMessage = function(msgName){
	return this.signals.getMessage(msgName);
};
