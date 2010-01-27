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
 * @overview Rozhraní určené k práci s uživatelskými událostmi a "globálními" 
 * zprávami, které zjednodušuje práci s objektem, který se o uživatelsky 
 * definované události stará
 * @version 1.2
 * @author jelc, zara
 */   

/**
 * @class třída pro dědění rozhraní "SigInterface", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností.
 * Rozhraní pro práci s uživatelsky definovanými událostmi a zprávami
 * vyžaduje referenci na instanci třídy JAK.signals, všechny následující metody
 * jsou určeny k použití pouze jako zděděné vlastnosti rozhraní,
 * @group jak
 * @see JAK.Signals
 */  
JAK.SigInterface = JAK.ClassMaker.makeClass({
	NAME: "SigInterface",
	VERSION: "1.3",
	CLASS: "class"
});

/**
 * slouží k nalezení rozhraní u rodičovských tříd, hledá v nadřazených třídách třídu,
 * ktera ma nastavenou vlastnost TOP_LEVEL a v ni očekává instanci třídy JAK.Signals s
 * nazvem "interfaceName"
 * @method   
 * @param {string}	interfaceName  název instance třídy JAK.Signals v daném objektu 
 * @returns {object} referenci na instanci třídy JAK.Signals
 * @throws {error} 	SetInterface:Interface not found  
 */
JAK.SigInterface.prototype.setInterface = function(interfaceName){
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
 * slouží k registraci zachytávaní události nad objektem, který implementuje toto rozhraní
 * @method
 * @param {string} type název události, kterou chceme zachytit
 * @param {string} handleFunction název metody objektu 'myListener', která bude zpracovávat událost
 * @param {object} sender objekt, jehož událost chceme poslouchat. Pokud není zadáno (nebo false), odesilatele nerozlišujeme
 * @returns {int} 1 v případě neúspěchu, 0 v pripade úspěchu  
 */
JAK.SigInterface.prototype.addListener = function(type, handleFunction, sender){
	return this.getInterface().addListener(this, type, handleFunction, sender);
};

/**
 * Slouží k zrušení zachytáváni události objektem, který implementuje toto rozhraní. 
 * @param {id} ID události, kterou jsme zachytávali
 */
JAK.SigInterface.prototype.removeListener = function(id) {
	return this.getInterface().removeListener(id);
};

/**
 * vytváří novou událost, kterou zachytáva instance třídy JAK.Signals
 * @method 
 * @param {string} type název vyvolané události
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost  
 *					  nebo pouze vnitrnim objektum [private | public]
 * @throws {error} pokud neexistuje odkaz na instanci JAK.Signals vyvolá chybu 'Interface not defined'  
 */
JAK.SigInterface.prototype.makeEvent = function(type, data){
	this.getInterface().makeEvent(type, this, data);
};
/**
 * nastavuje zprávu se jménem <em>msgName</em> na hodnotu <em>msgValue</em>
 * @method 
 * @param {string} msgName název zprávy
 * @param {any} msgValue obsah zprávy
 */   
JAK.SigInterface.prototype.setSysMessage = function(msgName,msgValue){
	this.getInterface().setMessage(msgName,msgValue);
};
/**
 * čte zprávu se jménem <em>msgName</em>
 * @method 
 * @param {string} msgName název zprávy
 * @return {any} obsah zprávy
 */ 
JAK.SigInterface.prototype.getSysMessage = function(msgName){
	return this.getInterface().getMessage(msgName);
};

JAK.SigInterface.prototype.getInterface = function() {
	return (typeof(this.signals) == "object" ? this.signals : JAK.signals);
}
