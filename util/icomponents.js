/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
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
 * @version 3.0
 * @author jelc, wendigo, zara
 */ 
    
/**
 * @class Rozhraní "IComponents", 
 * @group jak-utils
 */
JAK.IComponents = JAK.ClassMaker.makeInterface({
	NAME: "JAK.IComponents",
	VERSION: "3.0"
});

/**
 * zjišťuje zda má daná třída definované komponenty
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
JAK.IComponents.prototype.hasComponents = function() {
	return !!((this.components instanceof Array) && this.components.length);
};

/**
 * přidá všechny komponenty uvedené v poli <em>componets</em> dané třídy
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
JAK.IComponents.prototype.addAllComponents = function(){
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
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název pod kterým se má komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 */   
JAK.IComponents.prototype.addNewComponent = function(component){
	if(!this.hasComponents()){
		this.components = new Array();
	}
	this.components.push(component);
	this._addComponent(component);
};

/**
 * přidává jednotlivé komponenty, pokud komponenta nemá definouvanou vlastnost "name", vytvoří ji z názvu konstruktoru
 * pokud má již třída vlostnost shodného jména, bude tato vlastnost přepsána 
 * @private
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název, pod kterým se ma komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 *
 */    
JAK.IComponents.prototype._addComponent = function(component) {
	/* konfiguracni objekt musi mit vzdy part */
	if (typeof(component.part) == "undefined") { throw new Error("Invalid component named '"+component.name+"'"); }
	
	var ctor = component.part; /* konstruktor komponenty */
	var inst = null; /* instance komponenty */
	
	if (typeof(ctor) == "object") { /* komponenta je definovana jako instance */
		inst = ctor;
		component.part = inst.constructor;
	}

	if (typeof(component.name) == "undefined") { /* nema jmeno - vymyslime ho z konstruktoru */
		component.name = ctor.NAME.substring(0,1).toLowerCase();
		component.name += ctor.NAME.substring(1);
	}
	
	if (!inst) { /* definovana konstruktorem - vyrobime instanci */
		inst = new ctor(this, component.name, component.setting);
	}
	
	this[component.name] = inst;
};

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
JAK.IComponents.prototype.registredMethod = function(owner) {
	var fields = [this, this.constructor];
	/* registrace verejnych metod */
	for(var i = 0; i < fields.length; i++) {
		var obj = fields[i];
		for (var j in obj) {
			if (typeof(obj[j]) == 'undefined') { continue; }
			var method = obj[j];
			if (method === null) { continue; } /* to je tu kvuli startsim gecko prohlizecum */
			if (typeof(method.access) == "undefined") { continue; }
			if (method.access.indexOf('public') != 0) { continue; }

			var prefix = (obj == this ? this._name : this.constructor.NAME);
			var name = this._createMethodName(method, prefix, j);
			if (typeof(owner[name]) != 'undefined') { 
				debugger;
				throw new Error('registredMethod: method "' + name + '" already exist!') 
			}
			owner[name] = method.bind(obj);
		}
	}
};

/**
 * odregistrace metod, z objektu owner, ktere byly vytvoreny volanim registredMethod
 * @param {object} owner
 */
JAK.IComponents.prototype.unregistredMethod = function(owner) {
	var fields = [this, this.constructor];
	/* odregistrace verejnych metod */
	for(var i = 0; i < fields.length; i++) {
		var obj = fields[i];
		for (var j in obj) {
			if (typeof(obj[j]) == 'undefined') { continue; }
			var method = obj[j];
			if (method === null) { continue; } /* to je tu kvuli startsim gecko prohlizecum */
			if (typeof(method.access) == "undefined") { continue; }
			if (method.access.indexOf('public') != 0) { continue; }

			var prefix = (obj == this ? this._name : this.constructor.NAME);
			var name = this._createMethodName(method, prefix, j);
			if (typeof(owner[name]) == 'undefined') { continue; }
			delete(owner[name]);
		}
	}
}

/**
 * metoda pouzivana registredMethod a unregistredMethod pro vytvoreni jmena metody
 * @param {string} prefix
 * @param {string} methodName
 * @returns {string}
 */
JAK.IComponents.prototype._createMethodName = function(method, prefix, methodName) {
	var nameFirstChar = methodName.substring(0,1).toUpperCase();
	var nameNext = methodName.substring(1);
	var mods = method.access.replace(/[ ]{2,}/gi,' ').split(' ');

	if (mods.length > 1) {
		return mods[1];
	} else {
		return prefix + nameFirstChar + nameNext;
	}
}

/**
 * slouží k nalezení hlavniho objektu, který vytváří danou část programu
 * a má definovanou vlastnost TOP_LEVEL
 * @method  
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud není nalezen hlavní objekt
 */     
JAK.IComponents.prototype.getMain = function(){
	var obj = this;
	while (typeof obj.TOP_LEVEL == 'undefined') {
		if (typeof obj._owner == 'undefined') {
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
JAK.IComponents.prototype.callChildDestructor = function(){
	this.inDestruction = true;
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length; i++){
		var cName = this.components[i].name;
		if(this[cName] == null) {
			continue;
		}
		if((typeof this[cName].constructor.NAME != 'undefined') && (typeof this[cName].inDestruction != 'boolean')){
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
JAK.IComponents.prototype.removeComponent = function(component, withDestruction){

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
