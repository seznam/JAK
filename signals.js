SZN.Signals = function(){};
SZN.Signals.version = '1.0';
SZN.Signals.Name = 'Signals';

/**
 *  metoda slouzici k nalezeni rozhrani u rodicovskych trid
 *	argumenty:
 *  	interfaceName  - nazev instance rozhrani v danem objektu (string)
 *  	topLevelObject - hlavni trida ve ktere je definovano rozhrani
 *  vraci:
 *  	referenci na rozhrani
 *  vyjimky:
 *  	pokud neni rozhrani definovano vyvola chybu 'Interface not found'    
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
 * metoda slouzici k registraci zachytavani udalosti v rozhrani
 *	argumenty:
 *		myListener		- objekt ktery bude udalost zpracovavat (Object)
 * 		type			- typ (nazev udalosti) kterou chceme v rozhrani zachytit
 * 						  (string) 
 *		handleFunction 	- nazev metody objektu 'myListener', ktery udalost bude
 *						  zpracovavat (string)
 *		vraci:
 *			NIC
 *		vyjimky  		  
 *   		pokud neexistuje rozhrani vyvola chybu 'Interface not defined'
 */
SZN.Signals.prototype.addListener = function(myListener,type,handleFunction){
	if(typeof(this.sigInterface) == 'object'){
		this.sigInterface.addListener(myListener,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * metoda slouzici k zruseni registrace zachytavani udalosti v rozhrani
 *	argumenty:
 *		myListener		- objekt ktery udalost zpracovaval (Object)
 * 		type			- typ (nazev udalosti) kterou chceme v rozhrani prestat
 * 						  zahytavat (string) 
 *		handleFunction 	- nazev metody objektu 'myListener', ktera udalost 
 *						  zpracovavala (string)
 *		vraci:
 *			NIC
 *		vyjimky  		  
 *   		pokud neexistuje rozhrani vyvola chybu 'Interface not defined'
 */
SZN.Signals.prototype.removeListener = function(myListener,type,handleFunction){
	if(typeof(this.sigInterface) == 'object'){
		this.sigInterface.removeListener(myListener,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
}

/**
 * motoda, ktera vytvari novou udalost, kterou zachytava rozhrani
 *	argumenty:
 *		type		- typ (nazev nove udalosti)
 *		trg			- reference na objekt, ktery udalost vyvolal (Object)
 *		accessType 	- urcuje zda bude udalost viditelna i ve verejnem rozhrani
 *					  nebo pouze vnitrnim objektum (string - 'private'|'public') 
 *		timestamp	- cas vzniku udalosti (number) 
 *   vraci:
 *   	NIC - zatim
 *   vyjimky:
 *   	 pokud neexistuje rozhrani vyvola chybu 'Interface not defined'   
 */
SZN.Signals.prototype.makeSigEvent = function(type,trg,accessType){
	if(typeof(this.sigInterface) == 'object'){
		var time = new Date().getTime();
		this.sigInterface.makeEvent(type,trg,accessType,time);
	} else {
		throw new Error('Interface not defined');
	}
};

SZN.Signals.prototype.setSysMessage = function(msgName,msgValue){
	this.sigInterface.setMessage(msgName,msgValue);
};

SZN.Signals.prototype.getSysMessage = function(msgName){
	return this.sigInterface.getMessage(msgName);
};
