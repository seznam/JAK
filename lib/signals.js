/**
 * @overview Rozhraní určené k práci s uživatelskými událostmi a "globálními" 
 * zprávami, které zjednodušuje práci s objektem, který se o uživatelsky 
 * definované události stará
 * @name SZN.Signals
 * @version 1.0
 * @author jelc, zara
 */   

/**
 * @class třída pro dědění rozhraní "Signals", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností  
 *  rozhrani pro praci s uzivatelsky definovanyymi udalostmi a zpravami
 * vyžaduje referenci na instanci třídy SZN.sigInterface, všechny následující metody
 * jsou určeny k použití pouze jako zděděné vlastnosti rozhraní,
 * @see <strong>SZN.sigInterface</strong> 
 */  
SZN.Signals = SZN.ClassMaker.makeClass({
	NAME: "Signals",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * slouží k nalezení rozhraní u rodičovských tříd, hledá v nadřazených třídách třídu,
 * ktera ma nastavenou vlastnost TOP_LEVEL a v ni očekává instanci třídy SZN.SigInterface s
 * nazvem "interfaceName"
 * @method   
 * @param {string}	interfaceName  název instance třídy SZN.SigInterface v daném objektu 
 * @returns {object} referenci na instanci třídy SZN.SigInterface
 * @throws {error} 	SetInterface:Interface not found  
 */
SZN.Signals.prototype.setInterface = function(interfaceName){
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
 * @throws {error} pokud neexistuje odkaz na instanci SZN.SigInterface vyvolá chybu 'Interface not defined'
 */
SZN.Signals.prototype.addListener = function(myListener,type,handleFunction){
	if(typeof(this.sigInterface) == 'object'){
		this.sigInterface.addListener(myListener,type,handleFunction);
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
 * @throws {error} pokud neexistuje odkaz na instanci SZN.SigInterface vyvolá chybu 'Interface not defined'
 */
SZN.Signals.prototype.removeListener = function(myListener,type,handleFunction){
	if(typeof(this.sigInterface) == 'object'){
		this.sigInterface.removeListener(myListener,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * vytváří novou událost, kterou zachytáva instance třídy SZN.sigInterface
 * @method 
 * @param {string} type název vyvolané události
 * @param {object} trg reference na objekt, ktery událost vyvolal
 * @param {string} accessType určuje zda bude událost viditelná i ve veřejném rozhraní
 *					  nebo pouze vnitrnim objektum [private | public]
 * @throws {error} pokud neexistuje odkaz na instanci SZN.SigInterface vyvolá chybu 'Interface not defined'  
 */
SZN.Signals.prototype.makeSigEvent = function(type,trg,accessType){
	if(typeof(this.sigInterface) == 'object'){
		var time = new Date().getTime();
		this.sigInterface.makeEvent(type,trg,accessType,time);
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
SZN.Signals.prototype.setSysMessage = function(msgName,msgValue){
	this.sigInterface.setMessage(msgName,msgValue);
};
/**
 * čte zprávu se jménem <em>msgName</em>
 * @method 
 * @param {string} msgName název zprávy
 * @return {any} obsah zprávy
 */ 
SZN.Signals.prototype.getSysMessage = function(msgName){
	return this.sigInterface.getMessage(msgName);
};
