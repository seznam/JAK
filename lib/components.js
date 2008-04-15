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
 * @overview <em>Rozhraní</em> určené pro vytváření hierarchie objektů na základě "komponent",
 * Pokud bude mít naše aplikace podobnou strukturu jako ukázkový graf (jednotlivé větve jsou instance tříd),
 * napomáhá automatizaci při jejím vytváření a rušení, včetně rušení jen jednotlivých větví, případně při
 * dynamickém doplňování destruktoru.  
 *   
 * <pre>
 * MAIN
 *  |__ child_1
 *  |__ child_2
 *  	|__child_2.1
 *  	|__child_2.2    
 * </pre>  
 *  
 * @version 1.2
 * @author jelc, wendigo
 */ 
    
/**
 * @class Třída pro dědění rozhraní "Components", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností.  
 * 
 */
SZN.Components = SZN.ClassMaker.makeClass({
	NAME: "Components",
	VERSION: "1.2",
	CLASS: "class"
});

/**
 * zjišťuje zda má daná třída definované komponenty
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.hasComponents = function(){
	if((this.components instanceof Array) && this.components.length){
		return true;
	} else { 
		return false;
	}
};

/**
 * přidá všechny komponenty uvedené v poli <em>componets</em> dané třídy
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.addAllComponents = function(){
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length;i++){
		this._addComponent(this.components[i]);
	}
	return true;
};


/**
 * přidá novou komponentu za běhu programu
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název pod kterým se má komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 */   
SZN.Components.prototype.addNewComponent = function(component){
	if(!this.hasComponents()){
		this.components = new Array();
	}
	this.components.push(component);
	this._addComponent(component);
};

/* pridava jednotlive komponenty z pole */
/**
 * přidává jednotlivé komponenty, pokud komponenta nemá definouvanou vlastnost "name", vytvoří ji z názvu konstruktoru
 * pokud má již třída vlostnost shodného jména, bude tato vlastnost přepsána 
 * @private
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název, pod kterým se ma komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 *
 */    
SZN.Components.prototype._addComponent = function(component){
	if(typeof component.part != 'undefined'){
		if(typeof component.name == 'undefined'){
			component.name = component.part.NAME.substring(0,1).toLowerCase();
			component.name += component.part.NAME.substring(1);
		} 
		if(typeof component.setting != 'undefined'){
			this[component.name] = new component.part(this,component.name,component.setting);
		} else {
			this[component.name] = new component.part(this,component.name);
		}
	}
};

/* obsahuje registraci 'public' komponent v instanci tridy definovane
*  argumentem owner
*/
/**
 * vytváří volání vlastních metod z objektu, ktery je definován argumentem owner
 * tak že čte vlastnost <em>'access'</em> svých metod, vlastost acces je string jehož
 * první částí je specifikátor přístupu (poviný) s hodnotou 'public' a za ním následuje mezerou
 * oddělený název pod jakým se má volání vytvořit, není-li uveden použije se název vytvořený
 * ze jména objektu a metody
 * @method      
 * @param {object} owner reference na objekt, ve kterém se volání vytvoří
 * @throws {error} 'registredComponent: component "' + components_name + '" already exist!'
 * pokud <em>owner</em> již takto definovanou vlastnost má 
 */    
SZN.Components.prototype.registredMethod = function(owner){
	var field = [this,this.sConstructor];
	/* registrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				var name = this._createMethodName(obj, j);
				
				if(typeof owner[name] == 'undefined'){
					owner[name] = (obj == this.sConstructor) ? this.sConstructor[j] : SZN.bind(this,this[j]);
				} else {
					throw new Error('registredMethod: method "' + name + '" already exist!')
				}
			}
		}
	}
};

/**
 * odregistrace metod, z objektu owner, ktere byly vytvoreny volanim registredMethod
 * @param {object} owner
 */
SZN.Components.prototype.unregistredMethod = function(owner) {
	var field = [this,this.sConstructor];
	/* odregistrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				//projedu vsechny metody tohoto objektu a odregistruju je z rodice
				var name = this._createMethodName(obj, j);

				if(typeof owner[name] != 'undefined'){
					delete(owner[name]);
				}
			}
		}
	}
}

/**
 * metoda pouzivana registredMethod a unregistredMethod pro vytvoreni jmena metody
 * @param {object} obj
 * @param {string} methodName
 * @return {string}
 */
SZN.Components.prototype._createMethodName = function(obj, methodName) {
	var nameFirstChar = methodName.substring(0,1).toUpperCase();
	var nameNext = methodName.substring(1);
	var mods = obj[methodName].access.replace(/[ ]{2,}/gi,' ').split(' ');

	if(mods.length > 1){
		var name = mods[1];
	} else {
		var namePrefix = (obj == this.sConstructor) ? obj.NAME : this._name;
		var name = namePrefix + nameFirstChar + nameNext;
	}
	return name;
}

/* vracim hlavni tridu */
/**
 * slouží k nalezení hlavniho objektu, který vytváří danou část programu
 * a má definovanou vlastnost TOP_LEVEL
 * @method  
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud není nalezen hlavní objekt
 */     
SZN.Components.prototype.getMain = function(){
	var obj = this;
	while(typeof obj.TOP_LEVEL == 'undefined'){
		if(typeof obj._owner == 'undefined'){
			throw new Error('can\'t find TOP LEVEL Class');
		} else {
			obj = obj._owner;
		}
	}
	return obj;
};

/**
 * slouží k postupnému volání destruktorů všech komponent, daného objektu
 * @method 
 */
SZN.Components.prototype.callChildDestructor = function(){
	this.inDestruction = true;
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length; i++){
		var cName = this.components[i].name;
		if(this[cName] == null) {
			continue;
		}
		if((typeof this[cName].CLASS != 'undefined') && (typeof this[cName].inDestruction != 'boolean')){
			var name = '$destructor';
			if((typeof this[cName][name] != 'undefined')
			&&(typeof this[cName][name] == 'function')){
				this[cName][name]();
			}
			this[cName] = null;
		} 
	}	
};

/**
 * odebere komponentu, ktera je zadana nazvem, nebo objektem
 * @param {object} component
 * @param {boolean} withDestruction - zda ma zavolat destruktor komponenty 
 * @method 
 */
SZN.Components.prototype.removeComponent =function(component, withDestruction){

	for (var i =0; i < this.components.length; i++) {
		var c = this.components[i];
		if (component == c.name || component == this[c.name]  ) {
			if (withDestruction && (typeof this[c.name].$destructor == 'function')) {
				this[c.name].$destructor();
			}
			this[c.name] = null;
			c = null;

			this.components.splice(i,1);
			break;
		}
	}
}