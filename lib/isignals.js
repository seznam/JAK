/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Rozhraní určené k práci s uživatelskými událostmi a "globálními" 
 * zprávami, které zjednodušuje práci s objektem, který se o uživatelsky 
 * definované události stará
 * @version 2.1
 * @author jelc, zara
 */   

/**
 * @class Rozhraní pro práci s uživatelsky definovanými událostmi a zprávami
 * vyžaduje referenci na instanci třídy JAK.signals, všechny následující metody
 * jsou určeny k použití pouze jako zděděné vlastnosti rozhraní,
 * @group jak
 * @see JAK.Signals
 */  
JAK.ISignals = JAK.ClassMaker.makeInterface({
	NAME: "JAK.ISignals",
	VERSION: "2.1"
});

/**
 * slouží k nalezení rozhraní u rodičovských tříd, hledá v nadřazených třídách třídu,
 * ktera ma nastavenou vlastnost TOP_LEVEL a v ni očekává instanci třídy JAK.Signals s
 * nazvem "interfaceName"
 * @param {string}	interfaceName  název instance třídy JAK.Signals v daném objektu 
 * @returns {object} referenci na instanci třídy JAK.Signals
 * @throws {error} 	SetInterface:Interface not found  
 */
JAK.ISignals.prototype.setInterface = function(interfaceName) {
	if (typeof(this[interfaceName]) == 'object') { return this[interfaceName]; }

	var owner = this._owner;
	while(typeof(owner[interfaceName])== 'undefined'){
		if(typeof owner.TOP_LEVEL != 'undefined'){
			throw new Error('SetInterface:Interface not found');
		} else {
			owner = owner._owner;
		}
	}
	return owner[interfaceName];
};

/**
 * slouží k registraci zachytávaní události nad objektem, který implementuje toto rozhraní
 * @param {string} type název události, kterou chceme zachytit
 * @param {string} handleFunction název metody objektu 'myListener', která bude zpracovávat událost
 * @param {object} sender objekt, jehož událost chceme poslouchat. Pokud není zadáno (nebo false), odesilatele nerozlišujeme
 * @see JAK.Signals#addListener
 */
JAK.ISignals.prototype.addListener = function(type, handleFunction, sender) {
	return this.getInterface().addListener(this, type, handleFunction, sender);
};

/**
 * Slouží k zrušení zachytáváni události objektem, který implementuje toto rozhraní. 
 * @param {string} id ID události, kterou jsme zachytávali
 */
JAK.ISignals.prototype.removeListener = function(id) {
	return this.getInterface().removeListener(id);
};

/**
 * Provede odvěšení signálů podle jejich <em>id</em> uložených v poli
 * @param {array} array pole ID signálu jak je vrací metoda <em>addListener</em>
 */  
JAK.ISignals.prototype.removeListeners = function(array) {
	this.getInterface().removeListeners(array);
}

/**
 * vytváří novou událost, kterou zachytáva instance třídy JAK.Signals
 * @param {string} type název vyvolané události
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost  
 *					  nebo pouze vnitrnim objektum [private | public]
 * @throws {error} pokud neexistuje odkaz na instanci JAK.Signals vyvolá chybu 'Interface not defined'  
 */
JAK.ISignals.prototype.makeEvent = function(type, data) {
	this.getInterface().makeEvent(type, this, data);
};

JAK.ISignals.prototype.getInterface = function() {
	return (typeof(this.signals) == "object" ? this.signals : JAK.signals);
}
