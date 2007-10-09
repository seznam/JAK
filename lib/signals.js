/**
 * @overview Rozhrani uzivatelsky definovanymi udalostmi a zpravami pro asynchroni
 * procesy 
 * @version 1.0
 * @author : jelc 
 */   

/**
 * @class rozhrani pro praci s uzivatelsky definovanyymi udalostmi a zpravami
 * vyzaduje referenci na instanci tridy SZN.sigInterface, vsechny nasledujici metody
 * jsou urceny k pouziti pouze jako zdedene vlastnosti rozhrani, instance tridy
 * se nepouzivaji  
 * @see <strong>SZN.sigInterface</strong> 
 */  
SZN.Signals = function(){};

SZN.Signals.version = '1.0';
SZN.Signals.Name = 'Signals';

/**
 *  @method slouzi k nalezeni rozhrani u rodicovskych trid, hleda v nadrazenych tridach tridu,
 *  ktera ma nastavenou vlastnost TOP_LEVEL a v ni ocekava instanci tridy SZN.sigInterface s
 *  nazvem "interfaceName"  
 * @param {string}	interfaceName  nazev instance rozhrani v danem objektu 
 * @returns {object} referenci na instanci tridy SZN.sigInterface
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
 * @method slouzi k registraci zachytavani udalosti v rozhrani
 * @param {object} myListener objekt v jehoz oboru platnosti se bude zachycena udalost zpracovavat
 * @param {string} type nazev udalosti kterou chceme zachytit
 * @param {string} handleFunction nazev metody objektu 'myListener', ktera bude zpracovavat udalost
 * @param {string} [noDelay] je-li parametr zadan a vyhodnocen jako true, provede se registrace poluchace bez zpozdeni 
 * @throws {error} pokud neexistuje rozhrani vyvola chybu 'Interface not defined'
 */
SZN.Signals.prototype.addListener = function(myListener,type,handleFunction,noDelay){
	if(typeof(this.sigInterface) == 'object'){
		if(!noDelay){
			this.sigInterface.addListener(myListener,type,handleFunction);
		} else {
			this.sigInterface.addNoDelayListener(myListener,type,handleFunction);
		}
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * @method slouzi k zruseni zachytavani udalosti 
 * @param {object} myListener objekt v jehoz oboru platnosti se bude zachycena udalost zpracovavala
 * @param {string} type nazev udalosti kterou jsme zachytavali
 * @param {string} handleFunction nazev metody objektu 'myListener', ktera udalost zpracovavala
 * @throws {error} pokud neexistuje rozhrani vyvola chybu 'Interface not defined'
 */
SZN.Signals.prototype.removeListener = function(myListener,type,handleFunction){
	if(typeof(this.sigInterface) == 'object'){
		this.sigInterface.removeListener(myListener,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * @method vytvari novou udalost, kterou zachytava instance tridy SZN.sigInterface
 * @param {string} type nazev vyvolane udalosti
 * @param {object} trg reference na objekt, ktery udalost vyvolal
 * @param {string} accessType urcuje zda bude udalost viditelna i ve verejnem rozhrani
 *					  nebo pouze vnitrnim objektum [private | public]
 * @param {number} timestamp cas vzniku udalosti (v milisekundach)
 * @throws {error} pokud neexistuje rozhrani vyvola chybu 'Interface not defined'   
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
 * @method nastavuje zpravu se jmanem <em>msgName</em> na hodnotu <em>msgValue</em>
 * @param {string} msgName nazev zpravy
 * @param {any} msgValue obsah zpravy
 */   
SZN.Signals.prototype.setSysMessage = function(msgName,msgValue){
	this.sigInterface.setMessage(msgName,msgValue);
};
/**
 * @method cte zpravu se jmenem <em>msgName</em>
 * @param {string} msgName nazev zpravy
 * @return {any} obsah zpravy
 */ 
SZN.Signals.prototype.getSysMessage = function(msgName){
	return this.sigInterface.getMessage(msgName);
};
